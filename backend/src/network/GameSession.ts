import { Game } from '../core/game.js';
import { GAME_CONFIG, LEFT_PADDLE, RIGHT_PADDLE} from '../shared/gameConfig.js';
import { Client, Player } from '../models/Client.js';
import { MessageType, GameMode } from '../shared/constants.js';
import { PlayerInput, ServerMessage } from '../shared/types.js';

export class GameSession {
	mode: GameMode;
	id: string;
	clients: Client[] = [];
	players: Player[] = [];
	player_capacity: number = 2;
	client_capacity: number = 1;
	game?: Game;
	full: boolean = false;
	running: boolean = false;
	private paused: boolean = false;
	private readyClients: Set<string> = new Set(); //New, keep track of clients that finish loading

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
			this.readyClients.delete(client.id); // Added
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

	add_CPU() {
		while (this.players.length < this.player_capacity) {
			this.players.push(new Player(this.players[RIGHT_PADDLE].id, "CPU"));
		}
		this.client_capacity === this.clients.length;
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

	setClientReady(client: Client): void { //New function, add client in the readyClient list
		this.readyClients.add(client.id);
		console.log(`Client ${client.id} marked as ready. Ready clients: ${this.readyClients.size}/${this.clients.length}`);
	}

	async start() {
		if (this.running) return;

		this.running = true;
		this.game = new Game(this.players, this.broadcast.bind(this))
		
		await this.game.run();
		this.stop();
	}

	pauseGame(client: Client): boolean {
		if (this.paused) {
			console.log(`Game ${this.id} is already paused`);
			return false;
		}
		if (!this.running || !this.game) {
			console.log(`Game ${this.id} is not running, cannot pause`);
			return false;
		}
		try {
			this.game.pause();
			this.paused = true;
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
		if (!this.running || !this.game) {
			console.log(`Game ${this.id} is not running, cannot resume`);
			return false;
		}
		try {
			this.game.resume();
			this.paused = false;

			this.broadcast({type: MessageType.RESUMED});
			
			console.log(`Game ${this.id} resumed by client ${client.id}`);
			return true;
		} catch (error) {
			console.error(`Error pausing game ${this.id}:`, error);
			return false;
		}
	}

	stop() {
        // this.broadcast({ type: MessageType.GAME_ENDED });
		if (this.game) {
			this.game.stop();
		}
		this.running = false;
		this.paused = false;
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

	// wrapper needed as is polymorphised for Tournament
	enqueue(input: PlayerInput): void  {
		if (this.game) {
			this.game.enqueue(input);
		}
	}

	allClientsReady(): boolean {
		return this.readyClients.size === this.clients.length && this.clients.length > 0;
	}
}
