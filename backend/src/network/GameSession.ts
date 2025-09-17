import { Game } from '../game/Game.js';
import { Client, Player } from './Client.js';
import { MessageType, GameMode, AiDifficulty } from '../shared/constants.js';
import { PlayerInput, ServerMessage } from '../shared/types.js';
import { Match } from './Tournament.js';
import { gameManager } from './GameManager.js';

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
				client?.websocket.send(JSON.stringify(message));
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
		console.warn(`AI difficulty set to ${difficulty} for game ${this.id}`);
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
			this.readyClients.delete(client.id); // WILL CHANGE AFTER
			this.full = false;
		}
		if (this.clients.length === 0) {
			this.stop();
		}
	}
	
	add_player(player: Player) {
		if (this.players.length < this.player_capacity) {
			console.log(`Player ${player.name} added to game ${this.id}`);
			this.players.push(player);
		}
	}

	add_CPUs() {
		for (let i = 1; this.players.length < this.player_capacity; i++) {
			this.add_player(new Player(`CPU_${i}`, "CPU", undefined, this.ai_difficulty));
		}

		if (this.mode === GameMode.TWO_PLAYER_REMOTE) {
			this.mode = GameMode.SINGLE_PLAYER
		}

		this.client_capacity = this.clients.length;
    }

	remove_player(player: Player) {
		const index = this.players.indexOf(player);
		if (index !== -1) {
			console.log(`Player ${player.name} removed from game ${this.id}`);
			this.players.splice(index, 1);
			this.full = false;
		}
		if (this.players.length === 0) {
			this.stop();
		}
	}

	allClientsReady(): boolean {
		console.log("num ready clients: " + this.readyClients.size);
		console.log("num clients: " + this.clients.length);
		return (this.readyClients.size === this.clients.length && this.clients.length > 0);
	}

	async waitForPlayersReady() {
		if (this.allClientsReady()) return ;

		await new Promise(resolve => {
			gameManager.once(`all-ready-${this.id}`, resolve);
		});
	}

	setClientReady(client_id: string): void {
		this.readyClients.add(client_id);
		console.log(`Client ${client_id} marked as ready.}`);
		
		if (this.allClientsReady()) {
			gameManager.emit(`all-ready-${this.id}`);
			console.log(`GameSession ${this.id}: all clients ready.`);
		}
	}

	resume(client_id?: string): void {
		const game = this.findGame(client_id);
		if (!this.running || !game || !game.running) {
			console.log(`Game ${this.id} is not running, cannot resume`);
			return ;
		}
		if (!game.paused) {
			console.log(`Game ${this.id} is not paused`);
			return ;
		}

		console.log(`Game ${this.id} resumed by client ${client_id}`);
		game.resume();
	}

	pause(client_id?: string): void {
		const game = this.findGame(client_id);
		if (!this.running || !game || !game.running) {
			console.log(`Game ${this.id} is not running, cannot pause`);
			return ;
		}
		if (game.paused) {
			console.log(`Game ${this.id} is already paused`);
			return ;
		}

		console.log(`Game ${this.id} paused by client ${client_id}`);
		game.pause();
	}

	enqueue(input: PlayerInput, client_id?: string): void  {
		const game = this.findGame(client_id);
		game?.enqueue(input);
	}

	abstract start(): Promise<void>; 
	abstract stop(client_id?: string): void;
	
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
	}

	stop(): void {
		if (!this.running || !this.game) return;
		
		this.running = false;
		this.game.stop(this.id);
		
		this.broadcast({ 
			type: MessageType.SESSION_ENDED,
			...(this.game.winner?.name && { winner: this.game.winner.name })
		});
	}
	
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