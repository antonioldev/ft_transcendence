import { AbstractGameSession } from './GameSession.js'
import { Game } from '../core/game.js';
import { Client, Player } from '../models/Client.js';
import { GameMode, MessageType } from '../shared/constants.js';
import { PlayerInput } from '../shared/types.js';
import { addPlayer2, registerNewGame } from '../data/validation.js';
import { gameManager } from '../models/gameManager.js';

// TODO: make sure tournament count is always 4,8,16,32...

export class Match {
	id: string = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	round: number;
	players: Player[] = [];
	clients: Client[] = [];
	readyClients: Set<string> = new Set(); // New, keep track of clients that finish loading
	game!: Game;
	winner?: Player;

	left?: Match;
	right?: Match;
	next?: Match;

	constructor (round: number) {
		this.round = round;
	}

	add_player(player: Player) {
		if (!player) return ;

		if (!this.players.includes(player)) {
			this.players.push(player);
		}
		if (player.client && !this.clients.includes(player.client)) {
			this.clients.push(player.client);
		}
	}
}

abstract class AbstractTournament extends AbstractGameSession{
	client_match_map?: Map<string, Match>;	// Maps client id to match, used for easy insertion from client input
	rounds: Map<number, Match[]> = new Map();	// Maps rounds to match[], used for easy traversal to run games
	num_rounds: number;

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
		if (!round_one) {
			console.error(`Tournament ${this.id}: Error matching players`); 
			return ; 
		}

		for (let i = 0, j = 0; j < this.player_capacity; i++, j+=2) {
			let player_left = this.players[j];
			let player_right = this.players[j + 1];
			const match = round_one[i];

			match.add_player(player_left);
			match.add_player(player_right);

			if (player_left && player_left.client && player_right && player_right.client) {
				this.client_match_map?.set(player_left.client.id, match);
				this.client_match_map?.set(player_right.client.id, match);
			}
		}
	}

	async start(): Promise<void> {
		if (this.running || this.players.length != this.player_capacity) return ;
		this.running = true;

		this.add_CPUs();
		this._match_players();
		
		for (let current_round = 1; current_round <= this.num_rounds; current_round++) {
			const matches = this.rounds.get(current_round);
			if (!matches) return ; // maybe throw err
			
			await this.run(matches);
		}
	}

	// pause(client_id?: string | undefined): boolean {
	// 	const match = this.findMatch(client_id);
	// 	if (!match) return false ;

	// 	if (!match || !match.game || !match.game.running) {
	// 		console.log(`Game ${match.id} is not running, cannot pause`);
	// 		return false;
	// 	}

	// 	if (match.game.paused) {
	// 		console.log(`Game ${match.id} is already paused`);
	// 		return false;
	// 	}

	// 	match.game.pause();
	// 	return true;
	// }

	// resume(client_id?: string | undefined): boolean {
	// 	const match = this.findMatch(client_id);
	// 	if (!match) return false ;

	// 	if (!match ||!match.game || !match.game.running) {
	// 		console.log(`Game ${this.id} is not running, cannot resume`);
	// 		return false;
	// 	}
	// 	if (!match.game.paused) {
	// 		console.log(`Game ${this.id} is not paused`);
	// 		return false;
	// 	}

	// 	match.game.resume();
	// 	return true;
	// }

	// enqueue(input: PlayerInput, client_id?: string): void  {
	// 	const match = this.findMatch(client_id);
	// 	if (!match) return ;

	// 	match?.game?.enqueue(input);
	// }

	canClientControlGame(client: Client) {
		const match = this.findMatch();
		if (!match || !match.clients.includes(client)) {
			return false;
		}
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
	current_match?: Match; // used for the server to access the current active match
	readyClients: Set<string> = new Set(); // Keep track of clients that finish loading

	constructor(mode: GameMode, game_id: string, capacity: number) {
		super(mode, game_id, capacity);
	}

	// runs each game in a round one by one and awaits each game before starting the next
	async run(matches: Match[]): Promise<void> {
		await this.waitForPlayersReady();
		for (const match of matches) {
			if (!this.running) return ;
			
			this.current_match = match;
			match.game = new Game(match.players, this.broadcast.bind(this));
			match.winner = await match.game.run();
			match.next?.add_player(match.winner);
		}
	
		if (matches.length === 1) /* if final match */ {
			this.broadcast({ 
				type: MessageType.SESSION_ENDED,
				winner: matches[0].winner?.name,
			});
		}
	}

	stop() {
		if (!this.running) return ;

		this.running = false;
		this.current_match?.game?.stop();
		this.broadcast({ type: MessageType.SESSION_ENDED });
	}

	handlePlayerQuit(): void {
		this.stop();
	};

	findMatch(): Match | undefined {
		return (this.current_match);
	}

	findGame() {
		return (this.current_match?.game);
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
			if (!this.running) return ;

			console.log(`Match id in the tournament: ${match.id}, for P1:${match.players[0].name}, P2: ${match.players[1].name}`);
			registerNewGame(match.id, match.players[0].name, 1);
			addPlayer2(match.id, match.players[1].name);
			// match.game = new Game(match.players, (message) => this.broadcast(message, match.clients), match.id);

			match.game = new Game(match.players, (message) => this.broadcast(message, match.clients));
			let winner_promise: Promise<Player> = match.game.run();
			winner_promises.push(winner_promise);
		}
		const winners = await Promise.all(winner_promises);

		// promote winners once all promises are resolved
		for (let i = 0; i < winners.length; i++) {
			const match = matches[i];
			const winner: Player = winners[i];
			match.next?.add_player(winner);
			if (winner && winner.client && winner.client.id && match.next) {
				this.client_match_map.set(winner?.client?.id, match.next);
			}
		}
	}

	stop() {
		if (!this.running) return ;
		this.running = false;
		
		for (const match of this.client_match_map.values()) {
			match.game.stop(this.id);
		}
		
		this.broadcast({ type: MessageType.SESSION_ENDED });
	}

	allClientsReady(match: Match): boolean {
		return (match.readyClients.size === match.clients.length && match.clients.length > 0);
	}

	async waitForPlayersReady(match: Match) {
		if (this.allClientsReady(match)) return ;

		await new Promise(resolve => {
			gameManager.once(`all-ready-${match.id}`, resolve);
		});
	}

	setClientReady(client_id: string): void {
		const match = this.findMatch(client_id);
		if (!match) return ;

		match.readyClients.add(client_id);
		console.log(`Client ${client_id} marked as ready.}`);
		
		if (this.allClientsReady(match)) {
			gameManager.emit(`all-ready-${match.id}`);
			console.log(`Tournament ${this.id}: Match ${match.id}: all clients ready.`);
		}
	}

	findMatch(client_id?: string): Match | undefined {
		if (!client_id) return ;
		return (this.client_match_map.get(client_id));
	}

	findGame(client_id?: string) {
		if (!client_id) return ;
		return (this.client_match_map.get(client_id)?.game);
	}
}
