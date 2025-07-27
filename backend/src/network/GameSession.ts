import { Game } from '../core/game.js';
import { LEFT_PADDLE, RIGHT_PADDLE} from '../shared/gameConfig.js';
import { Client, Player } from '../models/Client.js';
import { MessageType, GameMode } from '../shared/constants.js';
import { GameStateData, ServerMessage } from '../shared/types.js';

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
	private requestedBy: Client | null = null; // do we need this?

    constructor(mode: GameMode, game_id: string) {
		this.id = game_id
        this.mode = mode
		if (this.mode == GameMode.TWO_PLAYER_REMOTE) {
			this.client_capacity = 2
		}
		// Tournament handled in separate class
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
		if (this.clients.length < this.client_capacity) {
			this.clients.push(client);
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

	async start() {
		if (!this.running) {
			this.assign_sides(this.players);
			this.running = true;
			this.game = new Game(this.players, this.mode, this.broadcast.bind(this))
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

	assign_sides(players: Player[]) {
		// guarantees that the index of players[] aligns with each player.side
		players[LEFT_PADDLE].side = LEFT_PADDLE;
		players[RIGHT_PADDLE].side = RIGHT_PADDLE;

		for (let i = 0; i < 2; i++) {
			const client = players[i].client;
			if (client !== null) { // if not AIBot
				this.broadcast(client.websocket.send(JSON.stringify({
					type: MessageType.SIDE_ASSIGNMENT,
					name: players[i].name,
					side: players[i].side
				})))
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
}

export class Tournament extends GameSession {
	capacity: number;
	active_players!: Player[]; // stores all players still in the tournameent
 
	constructor(mode: GameMode, game_id: string, capacity: number) {
		super(mode, game_id);
		this.capacity = capacity;
	}

	// just a simple setup for testing, later I will implement some sort of tree structure for matching players
	match_players(): Player[] {
		const player_left: (Player | undefined) = this.active_players.shift();
		const player_right: (Player | undefined) = this.active_players.shift();
		if (player_left === undefined || player_right === undefined) {
			throw new Error("Not enough players"); // temporary patch: need to think of a better way to handle this
		}
		return [player_left, player_right];
	}

	assign_match_order(): void {
		for (let i = 0; i < this.capacity; i++) {
			this.active_players.push({ ...this.players[i]})
		}
		// randomize start order;
		// shuffle(this.active_players);
	}

	async start() {
		if (!this.running) {
			this.running = true;
			this.assign_match_order();

			while (this.active_players.length > 1) {
				// removes the first two players from active_players and assigns them a paddle to play
				const current_players: Player[] = this.match_players();
				this.assign_sides(current_players);

				// display "ready up" screen
				// await players to "ready up"
				
				this.game = new Game(current_players, GameMode.TWO_PLAYER_LOCAL, this.broadcast.bind(this));
				this.game.running = true;

				// const winning_side: number = await this.game.run();
				// const winner = current_players[winning_side];
				
				// // pushes only the winner to the back of active_players, ready to play once the preceeding matches are complete
				// this.active_players.push(winner);
				// // broadcast winner and display temporary win screen
			}
			// display final winner
		}
	}
}