import { AbstractGameSession } from './GameSession.js'
import { Game } from '../core/game.js';
import { Client, Player } from '../models/Client.js';
import { GameMode, MessageType } from '../shared/constants.js';
import { PlayerInput } from '../shared/types.js';
import { addPlayer2, registerNewGame } from '../data/validation.js';


class Match {
	id: string = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	round: number;
	players: Player[] = [];
	clients: Client[] = [];
	readyClients: Set<string> = new Set(); // New, keep track of clients that finish loading
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
		}
	}
}

abstract class AbstractTournament extends AbstractGameSession{
	match_map: Map<string, Match> = new Map();	// Maps id to match, used for easy insertion from client input
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
	_match_players(): void {
		// TODO: randomize start order ??

		const round_one = this.rounds.get(1);
		if (!round_one) return ; // maybe throw err

		for (let i = 0, j = 0; j < this.player_capacity; i++, j+=2) {
			round_one[i].add_player(this.players[j]);
			round_one[i].add_player(this.players[j + 1]);
		}
	}
	
	abstract run(matches: Match[]): Promise<void>;

	async start(): Promise<void> {
		if (this.running || this.players.length != this.player_capacity) return ;

		this.running = true;
		this._match_players();
		
		for (this.current_round = 1; this.current_round <= this.num_rounds; this.current_round++) {
			const matches = this.rounds.get(this.current_round);
			if (!matches) return ; // maybe throw err
			
			await this.run(matches);
		}
		// TODO: display final winner screen
		// call db {updateTournamentWinner(player1_name: string)} to update final winner nb of tournament victory
	}

	stop() {
		if (!this.running) return ;

		for (const match of this.match_map.values()) {
			this.stopMatch(match.id);
		}

		this.running = false;
		this.broadcast({ type: MessageType.SESSION_ENDED });
	}

	stopMatch(match_id: string) {
		const match = this.match_map.get(match_id);
		if (!match || !match.game || !match.game.running) return ;

		match.game.stop(this.id);
	}

	pause(match_id: string): boolean {
		const match = this.match_map.get(match_id);
		if (!match) return false;

		if (!match.game || !match.game.running) {
			console.log(`Game ${match.id} is not running, cannot pause`);
			return false;
		}
		if (match.game.paused) {
			console.log(`Game ${match.id} is already paused`);
			return false;
		}

		match.game.pause();
		return true;
	}

	resume(match_id: string): boolean {
		const match = this.match_map.get(match_id);
		if (!match) return false;
		
		if (!match.game || !match.game.running) {
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

	enqueue(input: PlayerInput, match_id?: string): void  {
		console.log("match id = " + match_id);
		if (match_id) {
			this.match_map.get(match_id)?.game.enqueue(input);
		}
	}

	allClientsReady(match_id: string): boolean {
		const match = this.match_map.get(match_id);
		if (!match) return false;

		return (match.readyClients.size === match.clients.length && match.clients.length > 0);
	}

	setClientReady(client: Client, match_id: string): void { // New function, add client in the readyClient list
		const match = this.match_map.get(match_id);
		if (!match) return;

		match.readyClients.add(client.id);
		console.log(`Client ${client.id} marked as ready. Ready clients: ${match.readyClients.size}/${this.clients.length}`);
	}

	async waitingForPlayersReady(match_id: string) {
		while (!this.allClientsReady(match_id)) {
			return new Promise(resolve => setTimeout(resolve, 1000));
		}
	}

	canClientControlGame(client: Client, match_id: string) {
		const match = this.match_map.get(match_id);
		if (!match) return false;
		
		if (!this.clients.includes(client))
			return false;

		// TODO need to add more check
		return true;
	}
}

export class TournamentLocal extends AbstractTournament {
	constructor(mode: GameMode, game_id: string, capacity: number) {
		super(mode, game_id, capacity);
	}

	// runs each game in a round one by one and awaits each game before starting the next
	async run(matches: Match[]): Promise<void> {
		let finalWinner: Player | undefined;
		for (const match of matches) {
			match.game = new Game(match.players, this.broadcast.bind(this), match.id);
			await this.waitingForPlayersReady(match.id);
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

	handlePlayerQuit(): void {
		// need to display message saying tournament ended with no winner 
		this.stop();
	};
}

export class TournamentRemote extends AbstractTournament {
	constructor(mode: GameMode, game_id: string, capacity: number) {
		super(mode, game_id, capacity);
		this.client_capacity = capacity;
	}

	// runs all matches in a given round in parallel
	async run(matches: Match[]): Promise<void> {
		let winner_promises: Promise<Player>[] = [];

		// run each match in parallel and await [] of match promises
		for (const match of matches) {
			console.log(`Match id in the tournament: ${match.id}, for P1:${match.players[0].name}, P2: ${match.players[1].name}`);
			registerNewGame(match.id, match.players[0].name, 1);
			addPlayer2(match.id, match.players[1].name);
			match.game = new Game(match.players, (message) => this.broadcast(message, match.clients), match.id);
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

	// Tthe opposing player wins their current match and the tournament continues
	handlePlayerQuit(quitter_id: string, match_id?: string): void {
		if (match_id) {
			const match: Match | undefined = this.match_map.get(match_id);
			if (!match) return ;

			match.game.setOtherPlayerWinner(quitter_id);
			match.game.stop();
		}
	}
}
