import { Game } from '../core/game.js';
import { Client, Player } from '../models/Client.js';
import { MessageType, GameMode, AiDifficulty } from '../shared/constants.js';
import { PlayerInput, ServerMessage } from '../shared/types.js';
import { Match } from './Tournament.js';
import { gameManager } from '../models/gameManager.js';

export abstract class AbstractGameSession {
	mode: GameMode;
	id: string;
	clients: Client[] = [];
	players: Player[] = [];
	player_capacity: number = 2;
	client_capacity: number = 1;
	full: boolean = false;
	running: boolean = false;
	ai_difficulty?: AiDifficulty;
	readyClients: Set<string> = new Set(); // Keep track of clients that finish loading

    constructor(mode: GameMode, game_id: string) {
		this.id = game_id
        this.mode = mode
		if (this.mode == GameMode.TWO_PLAYER_REMOTE) {
			this.client_capacity = 2
		}
	}

	broadcast(message: ServerMessage, clients?: Client[]): void {
		const targets = clients ?? this.clients;
		let deleted_clients: (Client)[] = [];
		for (const client of targets) {
			try {
				client.websocket.send(JSON.stringify(message));
			}
			catch { 
				deleted_clients.push(client);
			}
		}
		for (const client of deleted_clients) {
			this.remove_client(client);
		}
	}

	set_ai_difficulty(difficulty: AiDifficulty) {
		this.ai_difficulty = difficulty;
	}

	add_client(client: Client) {
		if (this.clients.length >= this.client_capacity) return ;

		this.clients.push(client);
		if (this.clients.length === this.client_capacity) {
			this.full = true;
		}
}

	remove_client(client: Client) {
		const index = this.clients.indexOf(client);
		if (index !== -1) {
			this.clients.splice(index, 1);
			// this.readyClients.delete(client.id); // WILL CHANGE AFTER
			this.full = false;
		}
		if (this.clients.length === 0) {
			this.stop();
		}
	}
	
	add_player(player: Player) {
		if (this.players.length < this.player_capacity) {
			this.players.push(player);
		}
	}

	add_CPUs() {
		for (let i = 1; this.players.length < this.player_capacity; i++) {
			this.players.push(new Player(`CPU_${i}`, "CPU", undefined, this.ai_difficulty));
		}

		// if (this.mode === GameMode.TWO_PLAYER_REMOTE) {
		// 	this.mode = GameMode.SINGLE_PLAYER
		// }

		this.client_capacity = this.clients.length;
    }

	remove_player(player: Player) {
		const index = this.players.indexOf(player);
		if (index !== -1) {
			this.players.splice(index, 1);
			this.full = false;
		}
		if (this.players.length === 0) {
			this.stop();
		}
	}

	allClientsReady(match?: Match): boolean {
		return (this.readyClients.size === this.clients.length && this.clients.length > 0);
	}

	async waitForPlayersReady(match?: Match) {
		if (this.allClientsReady()) return ;

		await new Promise(resolve => {
			gameManager.once(`all-ready-${this.id}`, resolve);
		});
	}

	setClientReady(client_id: string, match?: Match): void {
		this.readyClients.add(client_id);
		console.log(`Client ${client_id} marked as ready.}`);
		
		if (this.allClientsReady()) {
			gameManager.emit(`all-ready-${this.id}`);
			console.log(`GameSession ${this.id}: all clients ready.`);
		}
	}

	resume(client_id?: string): boolean {
		const game = this.findGame(client_id);
		if (!this.running || !game || !game.running) {
			console.log(`Game ${this.id} is not running, cannot resume`);
			return false;
		}
		if (!game.paused) {
			console.log(`Game ${this.id} is not paused`);
			return false;
		}

		game.resume();
		return true;
	}

	pause(client_id?: string): boolean {
		const game = this.findGame(client_id);
		if (!this.running || !game || !game.running) {
			console.log(`Game ${this.id} is not running, cannot pause`);
			return false;
		}
		if (game.paused) {
			console.log(`Game ${this.id} is already paused`);
			return false;
		}

		game.pause();
		return true;
	}

	enqueue(input: PlayerInput, client_id?: string): void  {
		const game = this.findGame(client_id);
		game?.enqueue(input);
	}

	abstract start(): Promise<void>; 
	abstract stop(client_id?: string): void;
	// abstract pause(client_id?: string): boolean;
	// abstract resume(client_id?: string): boolean;
	
	// abstract enqueue(input: PlayerInput, client_id?: string): void;
	abstract handlePlayerQuit(quitter_id: string): void;
	abstract canClientControlGame(client: Client): boolean;
	abstract findGame(client_id?: string): Game | undefined;
}

export class OneOffGame extends AbstractGameSession{
	game!: Game;

	constructor (mode: GameMode, game_id: string) {
		super(mode, game_id)
	}

	async start(): Promise<void> {
		if (this.running) return;
		this.running = true;
		
		this.add_CPUs(); // add any CPU's if necessary
		await this.waitForPlayersReady();
		
		this.game = new Game(this.players, this.broadcast.bind(this))
		await this.game.run();
		this.stop();
	}

	stop(): void {
		if (!this.running || !this.game) return;
		
		if (this.game.running){
			this.game.stop(this.id);
		}
		this.running = false;
		this.broadcast({ 
			type: MessageType.SESSION_ENDED,
			...(this.game.winner.name && { winner: this.game.winner.name })
		});
	}
	
	// pause(): boolean {
	// 	if (!this.running || !this.game) {
	// 		console.log(`Game ${this.id} is not running, cannot pause`);
	// 		return false;
	// 	}
	// 	if (this.game.paused) {
	// 		console.log(`Game ${this.id} is already paused`);
	// 		return false;
	// 	}

	// 	this.game.pause();
	// 	return true;
	// }

	// resume(): boolean {
	// 	if (!this.running || !this.game) {
	// 		console.log(`Game ${this.id} is not running, cannot resume`);
	// 		return false;
	// 	}
	// 	if (!this.game.paused) {
	// 		console.log(`Game ${this.id} is not paused`);
	// 		return false;
	// 	}

	// 	this.game.resume();
	// 	return true;
	// }

	// enqueue(input: PlayerInput): void  {
	// 	this.game?.enqueue(input);
	// }
	
	handlePlayerQuit(quitter_id: string): void {
		if (this.game && this.mode == GameMode.TWO_PLAYER_REMOTE) {
			this.game.setOtherPlayerWinner(quitter_id);
		}
		this.stop();
	}

	canClientControlGame(client: Client) {
		return (this.clients.includes(client))
	}

	findGame() {
		return (this.game);
	}
}
