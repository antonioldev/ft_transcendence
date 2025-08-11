import { AbstractGameSession } from './GameSession.js'
import { Game } from '../core/game.js';
import { Client, Player } from '../models/Client.js';
import { GameMode, MessageType } from '../shared/constants.js';
import { PlayerInput } from '../shared/types.js';
import { gameManager } from '../models/gameManager.js';

export class Match {
	id: string = crypto.randomUUID();
	round: number;
	players: Player[] = [];
	clients: Client[] = [];
	readyClients: Set<string> = new Set(); // New, keep track of clients that finish loading
	client_match_map?: Map<string, Match>;
	game!: Game;

	left?: Match;
	right?: Match;
	next?: Match;

	constructor (round: number) {
		this.round = round;
	}

	add_player(player: Player) {
		if (!this.players.includes(player)) {
			this.players.push(player);
		}
		if (player.client && !this.clients.includes(player.client)) {
			this.clients.push(player.client);
			this.client_match_map?.set(player.client.id, this); // for remote tournament only
		}
	}

	allClientsReady(): boolean {
		return (this.readyClients.size === this.clients.length && this.clients.length > 0);
	}
}

abstract class AbstractTournament extends AbstractGameSession{
	client_match_map?: Map<string, Match>;	// Maps client id to match, used for easy insertion from client input
	rounds: Map<number, Match[]> = new Map();	// Maps rounds to match[], used for easy traversal to run games
	num_rounds: number;
	current_round: number = 1;

	constructor(mode: GameMode, game_id: string, capacity: number) {
		super(mode, game_id);
		this.player_capacity = capacity;
		this.num_rounds = this._get_num_rounds(this.player_capacity);
		this._create_rounds_map();
		this._create_match_tree(new Match(this.num_rounds));
	}

	private _create_rounds_map() {
		for (let i = 1; i <= this.num_rounds; i++) {
			this.rounds.set(i, []);
		}
	}

	// calculates the number of rounds from the number of players in the tournament
	private _get_num_rounds(num_players: number) {
		let round_count = 0;
		while (num_players > 1) {
			num_players /= 2;
			round_count += 1;
		}
		return (round_count);
	}

	// creates the tournament tree structure and assigns each match to the rounds map
	private _create_match_tree(current_match: Match) {
		this.rounds.get(current_match.round)?.push(current_match);
		current_match.client_match_map = this.client_match_map;

		if (current_match.round === 1) return ;

		current_match.left = new Match(current_match.round - 1);
		current_match.right = new Match(current_match.round - 1)
		
		current_match.left.next = current_match;
		current_match.right.next = current_match;

		this._create_match_tree(current_match.left);
		this._create_match_tree(current_match.right);
	}

	// assigns players to the matches in round_1
	_match_players(): void {
		// TODO: randomize start order ??

		const round_one = this.rounds.get(1);
		if (!round_one) return ; // maybe throw err

		for (let i = 0, j = 0; j < this.player_capacity; i++, j+=2) {
			round_one[i].add_player(this.players[j]);
			round_one[i].add_player(this.players[j + 1]);
		}
	}

	async start(): Promise<void> {
		if (this.running || this.players.length != this.player_capacity) return ;

		this.running = true;
		this._match_players();
		
		for (this.current_round = 1; this.current_round <= this.num_rounds; this.current_round++) {
			const matches = this.rounds.get(this.current_round);
			if (!matches) return ; // maybe throw err
			
			await this.run(matches);
		}
	}


	pause(client_id: string | undefined): boolean {
		const match = this.findMatch(client_id);
		if (!match) return false ;

		if (!match || !match.game || !match.game.running) {
			console.log(`Game ${match?.id} is not running, cannot pause`);
			return false;
		}

		if (match.game.paused) {
			console.log(`Game ${match.id} is already paused`);
			return false;
		}

		match.game.pause();
		return true;
	}

	resume(client_id: string | undefined): boolean {
		const match = this.findMatch(client_id);
		if (!match) return false ;

		if (!match ||!match.game || !match.game.running) {
			console.log(`Game ${this.id} is not running, cannot resume`);
			return false;
		}
		if (!match.game.paused) {
			console.log(`Game ${this.id} is not paused`);
			return false;
		}

		match.game.resume();
		return true;
	}

	enqueue(input: PlayerInput, client_id: string | undefined): void  {
		const match = this.findMatch(client_id);
		if (!match) return ;

		match?.game?.enqueue(input);
	}

	setClientReady(client_id: string): void {
		const match = this.findMatch(client_id);
		if (!match) return ;

		match.readyClients.add(client_id);
		console.log(`Client ${client_id} marked as ready.}`);
		
		if (match.allClientsReady()) {
			gameManager.emit(`all-ready-${match.id}`);
			console.log(`Tournament ${this.id}: Match ${match.id}: all clients ready.`);
		}
	}

	async waitForPlayersReady(match: Match) {
		if (match.allClientsReady()) return ;

		await new Promise(resolve => {
			gameManager.once(`all-ready-${match.id}`, resolve);
		});
	}

	canClientControlGame(client: Client) {
		const match = this.findMatch();
		if (!match || !match.clients.includes(client))
			return false;
		return true;
	}

	// The opposing player wins their current match and the tournament continues
	handlePlayerQuit(quitter_id: string, client_id?: string): void {
		const match: Match | undefined = this.findMatch(client_id);
		if (!match) return ;

		match.game.setOtherPlayerWinner(quitter_id);
		match.game.stop();
	}

	abstract run(matches: Match[]): Promise<void>;
	abstract findMatch(client_id?: string): Match | undefined;
}

export class TournamentLocal extends AbstractTournament {
	current_match?: Match;

	constructor(mode: GameMode, game_id: string, capacity: number) {
		super(mode, game_id, capacity);
	}

	// runs each game in a round one by one and awaits each game before starting the next
	async run(matches: Match[]): Promise<void> {
		let finalWinner: Player | undefined;
		
		for (const match of matches) {
			this.current_match = match;
			match.game = new Game(match.players, this.broadcast.bind(this));
			await this.waitForPlayersReady(match);
			const winner = await match.game.run();
			finalWinner = winner;
			match.next?.add_player(winner);
		}
	
		if (this.current_round === this.num_rounds) {
			this.broadcast({ 
				type: MessageType.SESSION_ENDED,
				...(finalWinner && { winner: finalWinner.name })
			});
		}
	}

	stop() {
		if (!this.running) return ;

		this.current_match?.game.stop();
		this.running = false;
		this.broadcast({ type: MessageType.SESSION_ENDED });
	}

	handlePlayerQuit(): void {
		// need to display message saying tournament ended with no winner 
		this.stop();
	};

	findMatch(): Match | undefined {
		return (this.current_match);
	}
}

export class TournamentRemote extends AbstractTournament {
	client_match_map: Map<string, Match> = new Map();	// Maps client id to match, used for easy insertion from client input
	constructor(mode: GameMode, game_id: string, capacity: number) {
		super(mode, game_id, capacity);
		this.client_capacity = capacity;
	}

	// runs all matches in a given round in parallel
	async run(matches: Match[]): Promise<void> {
		let winner_promises: Promise<Player>[] = [];

		// run each match in parallel and await [] of match promises
		for (const match of matches) {
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

	stop() {
		if (!this.running) return ;

		for (const match of this.client_match_map.values()) {
			match.game.stop(this.id);
		}

		this.running = false;
		this.broadcast({ type: MessageType.SESSION_ENDED });
	}

	findMatch(client_id?: string): Match | undefined {
		if (!client_id) return ;
		return (this.client_match_map.get(client_id));
	}
}
