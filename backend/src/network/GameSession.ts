import { Game } from '../core/game.js';
import { Client, Player } from '../models/Client.js';
import { MessageType, GameMode } from '../shared/constants.js';
import { PlayerInput, ServerMessage } from '../shared/types.js';

export abstract class AbstractGameSession {
	mode: GameMode;
	id: string;
	clients: Client[] = [];
	players: Player[] = [];
	player_capacity: number = 2;
	client_capacity: number = 1;
	full: boolean = false;
	running: boolean = false;
	ai_difficulty?: number; // temp hardcoded to be set to Impossible 

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

	set_ai_difficulty(difficulty: number | undefined) {
		this.ai_difficulty = difficulty;
		// if we want to change the ai diffiulty mid game we can add to this function and update the bot in the game
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

		if (this.mode === GameMode.TWO_PLAYER_REMOTE) {
			this.mode = GameMode.SINGLE_PLAYER
		}

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

	abstract waitingForPlayersReady(match_id?: string): void;
	abstract start(): Promise<void>; 
	abstract stop(match_id?: string): void;
	abstract pause(match_id?: string): boolean;
	abstract resume(match_id?: string): boolean;

	abstract enqueue(input: PlayerInput): void;
	abstract setClientReady(client: Client, match_id?: string): void;
	abstract allClientsReady(match_id?: string): boolean;
	abstract handlePlayerQuit(quitter_id: string, match_id?: string): void;
	abstract canClientControlGame(client: Client, match_id?: string): boolean;
}

export class GameSession extends AbstractGameSession{
	game!: Game;
	readyClients: Set<string> = new Set(); // New, keep track of clients that finish loading

	constructor (mode: GameMode, game_id: string) {
		super(mode, game_id)
	}

	async start(): Promise<void> {
		if (this.running) return;
		this.running = true;
		
        this.add_CPUs(); // add any CPU's if necessary
		await this.waitingForPlayersReady();
		
		this.game = new Game(this.players, this.broadcast.bind(this))
		await this.game.run();
		this.stop();
	}

	stop() {
		if (!this.game || !this.game.running) return false;

		this.game.stop(this.id);
		this.running = false;
		this.broadcast({ type: MessageType.SESSION_ENDED });
	}

	
	pause(): boolean {
		if (!this.running || !this.game) {
			console.log(`Game ${this.id} is not running, cannot pause`);
			return false;
		}
		if (this.game.paused) {
			console.log(`Game ${this.id} is already paused`);
			return false;
		}

		this.game.pause();
		return true;
	}

	resume(): boolean {
		if (!this.running || !this.game) {
			console.log(`Game ${this.id} is not running, cannot resume`);
			return false;
		}
		if (!this.game.paused) {
			console.log(`Game ${this.id} is not paused`);
			return false;
		}

		this.game.resume();
		return true;
	}

	enqueue(input: PlayerInput): void  {
		this.game?.enqueue(input);
	}

	setClientReady(client: Client): void { // New function, add client in the readyClient list
		this.readyClients.add(client.id);
		console.log(`Client ${client.id} marked as ready. Ready clients: ${this.readyClients.size}/${this.clients.length}`);
	}

	allClientsReady(): boolean {
		console.log(`All clients ready in game ${this.id}, sending ALL_READY`);
		return (this.readyClients.size === this.clients.length && this.clients.length > 0);
	}

	async waitingForPlayersReady() {
		while (!this.allClientsReady()) {
			return new Promise(resolve => setTimeout(resolve, 1000));
		}
	}
	
	handlePlayerQuit(quitter_id: string): void {
		if (this.game && this.mode == GameMode.TWO_PLAYER_REMOTE) {
			this.game.setOtherPlayerWinner(quitter_id);
		}
		this.stop();
	}

	canClientControlGame(client: Client) {
		if (!this.clients.includes(client))
			return false;

		// TODO need to add more check
		return true;
	}

}
