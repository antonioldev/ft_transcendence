import { Game } from '../core/game.js';
import { LEFT_PADDLE, RIGHT_PADDLE} from '../shared/gameConfig.js';
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
	private requestedBy: Client | null = null; // do we need this?

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

	assign_sides(players: Player[], match_index?: number) {
		// guarantees that the index of players[] aligns with player.side
		players[LEFT_PADDLE].side = LEFT_PADDLE;
		players[RIGHT_PADDLE].side = RIGHT_PADDLE;

		for (const player of this.players) {
			if (player.client !== null) { // if not AIBot
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
}

class Match {
	id: string = crypto.randomUUID();
	round: number;
	players: Player[] = [];
	clients: Client[] = [];
	game!: Game;

	left!: Match;
	right!: Match;
	next: Match | null = null;

	constructor (round: number) {
		this.round = round;
	}

	add_player(player: Player) {
		if (!this.players.includes(player)) {
			this.players.push(player);
		}
		if (player.client !== null && !this.clients.includes(player.client)) {
			this.clients.push(player.client);
		}
	}
}

export class Tournament extends GameSession {
	match_map: Map<string, Match> = new Map();	// Maps id to match, used for easy insertion from client input
	rounds: Map<number, Match[]> = new Map();	// Maps rounds to match[], used for easy traversal to run games
	num_rounds: number;

	constructor(mode: GameMode, game_id: string, capacity: number) {
		super(mode, game_id);
		this.player_capacity = capacity;
		this.num_rounds = this.get_num_rounds(this.player_capacity);
		for (let i = 1; i <= this.num_rounds; i++) {
			this.rounds.set(i, []);
		}
	}

	enqueue(input: PlayerInput, match_id?: string): void  {
		if (!match_id) return ;
		this.match_map.get(match_id)?.game.enqueue(input);
	}

	// calculates the number of rounds from the number of players in the tournament
	get_num_rounds(num_players: number) {
		let round_count = 0;
		while (num_players > 1) {
			num_players /= 2;
			round_count += 1;
		}
		return (round_count);
	}

	// assigns players to the matches in round_1
	private _match_players(): void {
		// TODO: randomize start order ??

		const round_one = this.rounds.get(1);
		if (!round_one) return ; // maybe throw err

		for (let i = 0, j = 0; j != this.player_capacity; i++, j+=2) {
			round_one[i].add_player(this.players[j]);
			round_one[i].add_player(this.players[j+1]);
		}
	}

	// creates the tournament tree structure and assigns each match to the rounds map
	private _create_match_tree(current_match: Match, round: number) {
		this.match_map.set(current_match.id, current_match);
		this.rounds.get(current_match.round)?.push(current_match);

		if (round === 1) return ;

		current_match.left = new Match(round);
		current_match.right = new Match(round)
		
		current_match.left.next = current_match;
		current_match.right.next = current_match;

		this._create_match_tree(current_match.left, round - 1);
		this._create_match_tree(current_match.right, round - 1);
	}

	// runs all matches in a given round in parallel
	private async _run_all(matches: Match[]) {
		let winner_promises: Promise<Player>[] = [];

		// run each match in parallel and await [] of match promises
		for (const match of matches) {
			this.assign_sides(match.players);
			match.game = new Game(match.players, (message) => this.broadcast(message, match.clients));
			let winner_promise: Promise<Player> = match.game.run();
			winner_promises.push(winner_promise);
		}
		const winners = await Promise.all(winner_promises);

		// promote winners once all promises are resolved
		for (let i = 0; i < winners.length; i++) {
			const match = matches[i];
			const winner = winners[i];
			match.next?.add_player(winner);
		}
	}

	// runs each game in a round one by one and awaits each game before starting the next
	private async _run_one_by_one(matches: Match[]) {
		for (const match of matches) {
			this.assign_sides(match.players);
			match.game = new Game(match.players, this.broadcast.bind(this));
			const winner = await match.game.run();
			match.next?.add_player(winner);
		}
	}

	// runs each game in a round
	private async _start_round(round: number) {
		const matches = this.rounds.get(round);
		if (matches === undefined) return ; // maybe throw err

		if (this.mode == GameMode.TOURNAMENT_LOCAL) {
			await this._run_one_by_one(matches);
		}
		else { // this.mode == GameMode.TOURNAMENT_REMOTE
			await this._run_all(matches);
		}
	}

	
	async start() {
		if (this.running) return ;

		this.running = true;
		let final = new Match(this.num_rounds)
		this._create_match_tree(final, this.num_rounds);
		this._match_players();
		
		let current_round = 1;
		while (current_round <= this.num_rounds) {
			await this._start_round(current_round);
			current_round++;
		}

		// TODO: display final winner screen
	}
}