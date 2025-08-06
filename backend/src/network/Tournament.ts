import { GameSession } from './GameSession.js'
import { Game } from '../core/game.js';
import { Client, Player } from '../models/Client.js';
import { GameMode } from '../shared/constants.js';
import { PlayerInput } from '../shared/types.js';
import { LEFT_PADDLE, RIGHT_PADDLE } from '../shared/gameConfig.js';

class Match {
	id: string = crypto.randomUUID();
	round: number;
	players: Player[] = [];
	clients: Client[] = [];
	game!: Game;

	left!: Match;
	right!: Match;
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
		if (this.mode === GameMode.TOURNAMENT_REMOTE) {
			this.client_capacity = capacity;
		}
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
		this.match_map.set(current_match.id, current_match);
		this.rounds.get(current_match.round)?.push(current_match);

		if (current_match.round === 1) return ;

		current_match.left = new Match(current_match.round - 1);
		current_match.right = new Match(current_match.round - 1)
		
		current_match.left.next = current_match;
		current_match.right.next = current_match;

		this._create_match_tree(current_match.left);
		this._create_match_tree(current_match.right);
	}

	// assigns players to the matches in round_1
	private _match_players(): void {
		// TODO: randomize start order ??

		const round_one = this.rounds.get(1);
		if (!round_one) return ; // maybe throw err

		for (let i = 0, j = 0; j != this.player_capacity; i++, j+=2) {
			round_one[i].add_player(this.players[j]);
			round_one[i].add_player(this.players[j + 1]);
		}
	}

	// runs all matches in a given round in parallel
	private async _run_all(matches: Match[]) {
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

	// runs each game in a round one by one and awaits each game before starting the next
	private async _run_one_by_one(matches: Match[]) {
		for (const match of matches) {
			match.game = new Game(match.players, this.broadcast.bind(this));
			const winner = await match.game.run();
			match.next?.add_player(winner);
		}
	}
	
	enqueue(input: PlayerInput, match_id?: string): void  {
		if (match_id) {
			this.match_map.get(match_id)?.game.enqueue(input);
		}
	}

	// If someone quits a remote tournament, the opposing player wins
	override handlePlayerQuit(client: Client, match_id?: string): void {
		if (match_id && this.game && this.mode == GameMode.TOURNAMENT_REMOTE) {
			const match: Match | undefined = this.match_map.get(match_id);
			if (!match) return ;

			const winner = (match.players[LEFT_PADDLE].client === client) ? match.players[RIGHT_PADDLE] : match.players[LEFT_PADDLE];
			this.game.set_winner(winner);
		}
	}

	async start() {
		if (this.running || this.players.length != this.player_capacity) return ;

		this.running = true;
		this._match_players();
		
		for (let round = 1; round <= this.num_rounds; round++) {
			const matches = this.rounds.get(round);
			if (!matches) return ; // maybe throw err
	
			if (this.mode == GameMode.TOURNAMENT_LOCAL) {
				await this._run_one_by_one(matches);
			}
			else /* TOURNAMENT_REMOTE */ {
				await this._run_all(matches);
			}
		}
		// TODO: display final winner screen
	}
}
