import { Game } from '../core/game.js';
import { GAME_CONFIG, LEFT_PADDLE, RIGHT_PADDLE} from '../shared/gameConfig.js';
import { Client, Player } from '../models/Client.js';
import { MessageType, GameMode } from '../shared/constants.js';
import { GameStateData, ServerMessage } from '../shared/types.js';

export class GameSession {
	mode: GameMode;
	id: string;
	capacity!: number;
	clients: (Client)[] = [];
	game: Game;
	full: boolean = false;
	running: boolean = false;
	private paused: boolean = false;
	private requestedBy: Client | null = null; // do we need this?
	private readyClients: Set<string> = new Set(); //New, keep track of clients that finish loading

    constructor(mode: GameMode, game_id: string) {
		this.id = game_id
        this.mode = mode
        this.game = new Game(mode, this.broadcast.bind(this))
	}

	broadcast(message: ServerMessage): void {
		let deleted_clients: (Client)[] = [];
		for (const client of this.clients) {
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

	add_client(client: Client) {
		if (!this.full) {
			this.clients.push(client);
			if (this.mode === GameMode.TWO_PLAYER_REMOTE) {
				if (this.clients.length === 2) this.full = true;
			}
			else if (this.mode === GameMode.TOURNAMENT_REMOTE) {
				if (this.clients.length === this.capacity) this.full = true;
			}
			else {
				this.full = true;
			}
		}
	}

	remove_client(client: Client) {
		const index = this.clients.indexOf(client);
		if (index !== -1) {
			this.clients.splice(index, 1);
			this.readyClients.delete(client.id); //Added
			this.full = false;
		}
		if (this.clients.length === 0) {
			this.stop();
		}
	}

	setClientReady(client: Client): void { //New function, add client in the readyClient list
		this.readyClients.add(client.id);
		console.log(`Client ${client.id} marked as ready. Ready clients: ${this.readyClients.size}/${this.clients.length}`);
	}

	async sendAllReady(): Promise<void> { //New function, send to clients message to start + countdown
		for (let countdown = GAME_CONFIG.startDelay; countdown >= 0; countdown--) {
			const message: ServerMessage = {
				type: MessageType.ALL_READY,
				countdown: countdown
			};
			
			console.log(`Sending countdown: ${countdown}`);
			this.broadcast(message);
			
			// Wait 1 second before next countdown (except for the last one)
			if (countdown > 0) {
				await new Promise(resolve => setTimeout(resolve, 1000));
			}
		}
		
		console.log(`Starting game ${this.id} after countdown`);
		await this.start();
	}

	async start() {
		this.assign_sides();
		if (!this.running) {
			this.running = true;
			this.game.running = true;
			await this.game.run();
		}
	}

	pauseGame(client: Client): boolean {
		if (this.paused) {
			console.log(`Game ${this.id} is already paused`);
			return false;
		}
		if (!this.running) {
			console.log(`Game ${this.id} is not running, cannot pause`);
			return false;
		}
		try {
			this.game.pause();
			this.paused = true;
			this.requestedBy = client;

			this.broadcast({type: MessageType.PAUSED});
			
			console.log(`Game ${this.id} paused by client ${client.id}`);
			return true;
		} catch (error) {
			console.error(`Error pausing game ${this.id}:`, error);
			return false;
		}
	}

	resumeGame(client: Client): boolean {
		if (!this.paused) {
			console.log(`Game ${this.id} is not paused`);
			return false;
		}
		if (!this.running) {
			console.log(`Game ${this.id} is not running, cannot resume`);
			return false;
		}
		try {
			this.game.resume();
			this.paused = false;
			this.requestedBy = null;

			this.broadcast({type: MessageType.RESUMED});
			
			console.log(`Game ${this.id} resumed by client ${client.id}`);
			return true;
		} catch (error) {
			console.error(`Error pausing game ${this.id}:`, error);
			return false;
		}
	}

	endGame(client: Client): void {
		try {
			console.log(`Game ${this.id} ended by client ${client.id}`);
			this.stop();
			this.broadcast({type: MessageType.GAME_ENDED});
		} catch (error) {
			console.error(`Error ending game ${this.id}:`, error);
		}
	}

	stop() {
		this.running = false;
		this.game.running = false;
		this.paused = false;
		this.requestedBy = null;
	}

	assign_sides() {
		if (this.mode === GameMode.TWO_PLAYER_REMOTE) {
			this.clients[0].websocket.send(JSON.stringify({
				type: MessageType.SIDE_ASSIGNMENT,
				side: LEFT_PADDLE
			}));
			this.clients[1].websocket.send(JSON.stringify({
				type: MessageType.SIDE_ASSIGNMENT,
				side: RIGHT_PADDLE
			}));
		}
	}

	canClientControlGame(client: Client) {
		if (!this.clients.includes(client))
			return false;

		// TODO need to add more check
		return true;
	}

	isPaused(): boolean {
		return this.paused;
	}

	allClientsReady(): boolean {
		return this.readyClients.size === this.clients.length && this.clients.length > 0;
	}
}
