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
	game!: Game;
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
		if (this.clients.length < this.client_capacity) {
			this.clients.push(client);
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
	
	add_player(player: Player) {
		if (this.players.length < this.player_capacity) {
			this.players.push(player);

			// check for this.full is here assuming that players are assigned after clients
			if (this.clients.length === this.client_capacity && this.players.length === this.player_capacity) {
				this.full = true;
			}
		}
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
		if (!this.running) {
			this.assign_sides(this.players);
			this.running = true;
			this.game = new Game(this.players, this.broadcast.bind(this))
			/*const winner: Player = */ await this.game.run();
			// return (winner);
			// TODO: display win screen with winner 
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
	}

	assign_sides(players: Player[], match_index?: number) {
		// guarantees that the index of players[] aligns with player.side
		players[LEFT_PADDLE].side = LEFT_PADDLE;
		players[RIGHT_PADDLE].side = RIGHT_PADDLE;

		for (const player of this.players) {
			if (player.client) { // if not AIBot
				this.broadcast({
					type: MessageType.SIDE_ASSIGNMENT,
					name: player.name,
					side: player.side,
					...(match_index !== undefined && { match_index }) // optionally includes index
				})
			}
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

	// wrapper needed as is polymorphised for Tournament
	enqueue(input: PlayerInput): void  {
		this.game.enqueue(input);
	}

	allClientsReady(): boolean {
		return this.readyClients.size === this.clients.length && this.clients.length > 0;
	}
}
