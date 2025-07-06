import { SinglePlayer, TwoPlayer } from '../core/game';
import { LEFT_PADDLE, RIGHT_PADDLE} from '../core/gameConfig';
import { Client } from '../models/client';
import { GameState } from '../core/types';
import { MessageType, GameMode } from '../core/constants.js';

// IMPORTANT: some methods are no longer async and might need to be, we can see in testing
// I found it a little unclear when/where to use async in TS, we can discuss this later!

export class GameSession {
	mode: GameMode;
	id: string;
	clients: (Client)[] = [];
	full: boolean = false;
	running: boolean = false;
	game!: SinglePlayer | TwoPlayer;

    constructor(mode: GameMode, game_id: string) {
        this.mode = mode
		this.id = game_id
        this._create_game()
	}

    _create_game(): void {
		switch (this.mode) {
			case GameMode.SINGLE_PLAYER:
				// this.game = new SinglePlayer(this.id, this.broadcast_callback);
				this.game = new SinglePlayer(this.id, this.broadcastToClients.bind(this));
				break;
			case GameMode.TWO_PLAYER_LOCAL:
			case GameMode.TWO_PLAYER_REMOTE:
				// this.game = new TwoPlayer(this.id, this.broadcast_callback);
				this.game = new TwoPlayer(this.id, this.broadcastToClients.bind(this));
				break;
			default:
				throw new Error(`Invalid game mode: ${this.mode}`);
		}
	}

	// async broadcast_callback(state: GameState): Promise<void> {
	//  broadcast_callback = async (state: GameState): Promise<void> => {
	async broadcastToClients(state: GameState): Promise<void> {
		const message = {
			type: MessageType.GAME_STATE,
			state: state
		};
		let deleted_clients: (Client)[] = [];
		for (const client of this.clients) {
			try {
				// await client.websocket.send(JSON.stringify({state}));
				await client.websocket.send(JSON.stringify(message));
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

	async start() {
		this.assign_sides();
		if (!this.running) {
			this.running = true;
			await this.game.run();
		}
	}

	stop() {
		this.running = false;
		this.game.running = false;
	}

	// We might need to make this method async and await the send()
	assign_sides() {
		if (this.mode === GameMode.TWO_PLAYER_REMOTE) {
			this.clients[0].websocket.send(JSON.stringify({"side": LEFT_PADDLE}));
			this.clients[1].websocket.send(JSON.stringify({"side": RIGHT_PADDLE}));
		}
		// tournament 
	}
}