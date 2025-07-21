import { Game } from '../core/game.js';
import { LEFT_PADDLE, RIGHT_PADDLE} from '../shared/gameConfig.js';
import { Client, Player } from '../models/Client.js';
import { MessageType, GameMode } from '../shared/constants.js';
import { GameStateData, ServerMessage } from '../shared/types.js';

// I found it a little unclear when/where to use async in TS, we can discuss this later!

export class GameSession {
	mode: GameMode;
	id: string;
	clients: (Client)[] = [];
	players: Player[] = []; 
	full: boolean = false;
	running: boolean = false;
	game!: Game;
	private paused: boolean = false;
	private requestedBy: Client | null = null;

    constructor(mode: GameMode, game_id: string) {
        this.mode = mode
		this.id = game_id
        this.game = new Game(game_id, mode, this.broadcastToClients.bind(this))
	}

	broadcastToClients(state: GameStateData) {
		const message = {
			type: MessageType.GAME_STATE,
			state: state
		};
		let deleted_clients: (Client)[] = [];
		for (const client of this.clients) {
			try {
				// await client.websocket.send(JSON.stringify({state}));
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

	private broadcastMessage(messageType: MessageType): void {
		const message: ServerMessage = {
			type: messageType
		};
		let deleted_clients: (Client)[] = [];
		for (const client of this.clients) {
			try {
				// await client.websocket.send(JSON.stringify({state}));
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
			if ((this.mode === GameMode.SINGLE_PLAYER || this.mode === GameMode.TWO_PLAYER_LOCAL) && this.clients.length === 1) {
				this.full = true;
			}
			else if (this.mode === GameMode.TWO_PLAYER_REMOTE && this.clients.length === 2) {
				this.full = true;
			}
			// tournament
		}
	}

	remove_client(client: Client) {
		const index = this.clients.indexOf(client);
		if (index !== -1) {
			this.clients.splice(index, 1);
			this.full = false;
		}
		if (this.clients.length === 0) {
			this.stop();
		}
	}

	start() {
		this.assign_sides();
		if (!this.running) {
			this.running = true;
			this.game.run();
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

			this.broadcastMessage(MessageType.PAUSED);
			
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

			this.broadcastMessage(MessageType.RESUMED);
			
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
			this.broadcastMessage(MessageType.GAME_ENDED);
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

	// TODO We might need to make this method async and await the send()
	assign_sides() {
		if (this.mode === GameMode.TWO_PLAYER_REMOTE) {
			this.clients[0].websocket.send(JSON.stringify({"side": LEFT_PADDLE}));
			this.clients[1].websocket.send(JSON.stringify({"side": RIGHT_PADDLE}));
		}
		// tournament 
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
}