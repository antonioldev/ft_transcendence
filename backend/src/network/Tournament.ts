import { AbstractGameSession } from './GameSession.js'
import { Game } from '../game/Game.js';
import { Client, Player, CPU } from './Client.js';
import { GameMode, MessageType } from '../shared/constants.js';
import { addPlayer2, registerNewGame } from '../data/validation.js';
import { matchesGlob } from 'path';

export class Match {
	id: string = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	round: number;
	players: (Player | CPU)[] = [];
	clients: Client[] = [];
	readyClients: Set<string> = new Set(); // New, keep track of clients that finish loading
	game!: Game;
	winner?: Player | CPU;
	is_final: Boolean = false;
	index!: number;

	left?: Match;
	right?: Match;
	next?: Match;

	constructor (round: number) {
		this.round = round;
	}

	add_player(player: Player | CPU) {
		if (!player) return ;

		if (!this.players.includes(player)) {
			this.players.push(player);
		}
		if (!(player instanceof CPU) && !this.clients.includes(player.client)) {
			this.clients.push(player.client);
		}
	}
}

abstract class AbstractTournament extends AbstractGameSession{
	client_match_map?: Map<string, Match>;	// Maps client id to match, used for easy insertion from client input
	rounds: Map<number, Match[]> = new Map();	// Maps rounds to match[], used for easy traversal to run games
	num_rounds: number;
	tournamentWinner?: Player | CPU;

	constructor(mode: GameMode, game_id: string, capacity: number) {
		super(mode, game_id);
		this.player_capacity = capacity;
		this.num_rounds = this._get_num_rounds(this.player_capacity);
		this._create_rounds_map();

		let final = new Match(this.num_rounds);
		final.is_final = true;
		this._create_match_tree(final);
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

	private _randomize_players() {
		for (let i = this.players.length - 1; i > 0; i--) { 
			const j = Math.floor(Math.random() * (i + 1)); 
			[this.players[i], this.players[j]] = [this.players[j], this.players[i]]; 
		} 
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
		this._randomize_players();

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

			for (const player of [player_left, player_right]) {
				if (player && !(player instanceof CPU)) {
					console.log(`Client ${player.client.username} added to match ${match.id}`)
					this.client_match_map?.set(player.client.id, match);
				}
			}
		}
	}

	private broadcastRoundSchedule(roundIndex: number): void {
		const matches = this.rounds.get(roundIndex);
		if (!matches || matches.length === 0) return;

		matches.forEach((m, i) => {
			this.broadcast({
				type: MessageType.MATCH_ASSIGNMENT,
				round_index: roundIndex,
				match_index: i,
				match_total: matches.length,
				left:  m.players[0]?.name ?? "TBD",
				right: m.players[1]?.name ?? "TBD",
			});
		});
	}
				
	async start(): Promise<void> {
		if (this.running) return ;
		this.running = true;

		this.add_CPUs();
		this._match_players();
		this.broadcastRoundSchedule(1);

		for (let current_round = 1; current_round <= this.num_rounds; current_round++) {
			const matches = this.rounds.get(current_round);
			if (!matches) return ; // maybe throw err
			await this.waitForPlayersReady();
			await this.run(matches);
		}
	}

	canClientControlGame(client: Client) {
		const match = this.findMatch(client.id);
		if (!match) {
			console.error("Match not found");
			return false;
		}
		if	(!match.clients.includes(client)) {
			console.error("Client not in match.clients");
			return false;
		}
		return true;
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
		let index = 0;
		for (const match of matches) {
			if (!this.running) return ;
			this.current_match = match;
			
			await this.waitForPlayersReady();
			match.index = index;
			match.game = new Game(match.id, match.players, this.broadcast.bind(this));
			match.winner = await match.game.run();
			if (match.winner) {
				this.assign_winner(match, match.winner);
			}
			index++;
		}
	}

	assign_winner(match: Match, winner: Player | CPU) {
		match.next?.add_player(winner);
		if (match.is_final) {
			this.stop();
		}
		else {
			this.broadcast({
				type: MessageType.MATCH_WINNER,
				winner: winner?.name,
				round_index: match.round,
				match_index: match.index,
			}, match.clients);
		}
		this.readyClients.clear();
	}

	stop() {
		if (!this.running) return ;

		this.running = false;
		this.current_match?.game?.stop();
		this.broadcast({
			type: MessageType.SESSION_ENDED,
			...(this.current_match?.winner?.name && { winner: this.current_match?.winner?.name }),
		});
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

	add_player(player: Player) {
		if (this.players.length < this.player_capacity) {
			this.players.push(player);
			this.broadcast({
				type: MessageType.TOURNAMENT_LOBBY,
				lobby: this.players.map(player => player.name)
			});
		}
	}

	remove_player(player: Player) {
		const index = this.players.indexOf(player);
		if (index !== -1) {
			this.players.splice(index, 1);
			this.full = false;
			this.broadcast({
				type: MessageType.TOURNAMENT_LOBBY,
				lobby: this.players.map(player => player.name)
			});
		}
		if (this.players.length === 0) {
			this.stop();
		}
	}

	// runs all matches in a given round in parallel
	async run(matches: Match[]): Promise<void> {
		let round_winners: Promise<Player | CPU>[] = [];

		// run each match in parallel and await [] of match promises
		let index = 0;
		for (const match of matches) {
			if (!this.running) return ;

			this.register_database(match);
			match.index = index;
			match.game = new Game(match.id, match.players, (message) => this.broadcast(message, match.clients));

			let winner_promise: Promise<Player | CPU> = match.game.run();
			winner_promise.then((winner) => this.assign_winner(match, winner));
			round_winners.push(winner_promise);
			index++;
		}
		await Promise.all(round_winners);
	}

	assign_winner(match: Match, winner: Player | CPU) {
		match.next?.add_player(winner);
		if (winner && !(winner instanceof CPU) && match.next) {
			this.client_match_map?.set(winner.client?.id, match.next);
		}
		if (match.is_final) {
			this.tournamentWinner = match.winner;
			this.stop();
		}
		else {
			this.broadcast({
				type: MessageType.MATCH_WINNER,
				winner: winner?.name,
				round_index: match.round,
				match_index: match.index,
			}, match.clients);
		}
		if (!(winner instanceof CPU)) {
			this.readyClients.delete(winner.client?.id);
		}
	}

	register_database(match: Match) {
		console.log(`Match id in the tournament: ${match.id}, for P1:${match.players[0].name}, P2: ${match.players[1].name}`);
		registerNewGame(match.id, match.players[0].name, 1);
		addPlayer2(match.id, match.players[1].name);
	}

	stop() {
		if (!this.running) return ;
		this.running = false;
		
		for (const match of this.client_match_map.values()) {
			match.game.stop();
		}
		this.broadcast({
			type: MessageType.SESSION_ENDED,
			...(this.tournamentWinner?.name && { winner: this.tournamentWinner?.name }),
		});
	}

	// The opposing player wins their current match and the tournament continues
	handlePlayerQuit(quitter: Client): void {
		const match: Match | undefined = this.findMatch(quitter.id);
		if (!match) {
			console.error(`Cannot quit: "${quitter.username}" not in any match`);
			return ;
		}
		match.game.setOtherPlayerWinner(quitter);
		match.game.save_game_to_db();
		match.game.stop();
	}

	findMatch(client_id?: string): Match | undefined {
		if (!client_id) return ;
		return (this.client_match_map.get(client_id));
	}

	findGame(client_id?: string): Game | undefined {
		return (this.findMatch(client_id)?.game);
	}
}
