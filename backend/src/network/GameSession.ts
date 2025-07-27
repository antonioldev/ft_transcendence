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
			this.game = new Game(this.players, this.broadcast.bind(this))
			const winner: Player = await this.game.run();
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
		// guarantees that the index of players[] aligns with player.side
		players[LEFT_PADDLE].side = LEFT_PADDLE;
		players[RIGHT_PADDLE].side = RIGHT_PADDLE;

		for (const player of this.players) {
			if (player.client !== null) { // if not AIBot
				this.broadcast({
					type: MessageType.SIDE_ASSIGNMENT,
					name: player.name,
					side: player.side
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
}

class Match {
	//id: string; // will need to use this so that clients know which game they are sending input to
	players: Player[];
	winner!: Player;
	game!: Game;

	constructor (players: Player[]) {
		this.players = players;
	}
}

export class Tournament extends GameSession {
	remaining_players!: Player[]; // stores all players still in the tournameent
	current_round: Match[] = [];
 
	constructor(mode: GameMode, game_id: string, capacity: number) {
		super(mode, game_id);
		this.player_capacity = capacity;
	}

	private _assign_match_order(): void {
		for (const player of this.players) {
			this.remaining_players.push({ ...player})
		}
		// TODO: randomize start order;
	}

	private _create_matches() {
		while (this.remaining_players.length > 0) {
			const player_left: (Player | undefined) = this.remaining_players.shift();
			const player_right: (Player | undefined) = this.remaining_players.shift();

			// necessary check as .shift() can return 'undefined' if array is empty
			if (player_left === undefined || player_right === undefined) {
				throw new Error("Not enough players"); // need to think of a cleaner way to handle this
			}

			let match = new Match([player_left, player_right])
			this.current_round.push(match);
		}
	}

	// runs all games in a round in parallel and awaits until all are finished
	private async _run_all() {
		let winner_promises: Promise<Player>[] = [];

		for (const match of this.current_round) {
			this.assign_sides(match.players);
			
			match.game = new Game(match.players, this.broadcast.bind(this));
			const winner: Promise<Player> = match.game.run();
			winner_promises.push(winner);
		}
		this.remaining_players = await Promise.all(winner_promises);
	}

	// runs each game in a round one by one and awaits each game before starting the next
	private async _run_one_by_one() {
		for (const match of this.current_round) {
			this.assign_sides(match.players);
			match.game = new Game(match.players, this.broadcast.bind(this));
			const winner: Player = await match.game.run();
			this.remaining_players.push(winner);
		}
	}

	// Run all games in parallel and await them all to finish before starting the next round
	private async _start_round() {
		if (this.mode == GameMode.TOURNAMENT_LOCAL) {
			this._run_one_by_one();
		}
		else { // this.mode == GameMode.TOURNAMENT_REMOTE
			this._run_all();
		}
	}

	async start() {
		if (!this.running) {
			this.running = true;
			this._assign_match_order();

			while (this.remaining_players.length > 1) {
				this._create_matches();
				this._start_round();
			}
			// TODO: display final winner screen
		}
	}
}