import { AbstractGameSession } from './GameSession.js'
import { Game } from '../game/Game.js';
import { Client, Player, CPU } from './Client.js';
import { GameMode, MessageType, Direction } from '../shared/constants.js';
import { addPlayer2, registerNewGame } from '../data/validation.js';
import { LEFT_PADDLE, RIGHT_PADDLE } from '../shared/gameConfig.js';
import { spec } from 'node:test/reporters';

export class Match {
	id: string = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	round: number;
	players: (Player | CPU)[] = [];
	clients: Set<Client> = new Set();
	readyClients: Set<string> = new Set(); // New, keep track of clients that finish loading
	game!: Game;
	winner?: Player | CPU;
	loser?: Player | CPU;
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
		if (!(player instanceof CPU) && !this.clients.has(player.client)) {
			this.clients.add(player.client);
		}
	}

	assign_winner(winner: Player | CPU) {
		this.winner = winner;
		this.loser = this.players[LEFT_PADDLE] === winner ? this.players[RIGHT_PADDLE] : this.players[LEFT_PADDLE];
	}

	remove_spectator(client: Client) {
		this.clients.delete(client);
	}
}

abstract class AbstractTournament extends AbstractGameSession{
	client_match_map?: Map<string, Match>;	// Maps client id to match, used for easy insertion from client input
	rounds: Map<number, Match[]> = new Map();	// Maps rounds to match[], used for easy traversal to run games
	num_rounds: number;
	current_round: number = 1;
	tournamentWinner?: Player | CPU;

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

		matches.forEach((match, i) => {
			this.broadcast({
				type: MessageType.MATCH_ASSIGNMENT,
				round_index: roundIndex,
				match_index: i,
				match_total: matches.length,
				left:  match.players[LEFT_PADDLE]?.name ?? "TBD",
				right: match.players[RIGHT_PADDLE]?.name ?? "TBD",
			});
		});
	}
				
	async start(): Promise<void> {
		if (this.running) return ;
		this.running = true;

		this.add_CPUs();
		this._match_players();
		// await this.waitForPlayersReady(); // TODO eden I added this as the backend was sending the next message too early.
		// this.broadcastRoundSchedule(1);

		for (this.current_round = 1; this.current_round <= this.num_rounds; this.current_round++) {
			if (!this.running) return ;
			
			await this.waitForPlayersReady();
			this.broadcastRoundSchedule(this.current_round); // TODO added here so we get update info from server
			const matches = this.rounds.get(this.current_round);
			if (!matches) return ; // maybe throw err
			await this.run(matches);
		}
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
				this.assign_winner(match);
			}
			index++;
		}
	}

	assign_winner(match: Match) {
		if (!match.winner) return ;
		if (!match.next) {
			this.stop(); 
			return ;
		}
		match.next.add_player(match.winner);
		this.readyClients.clear();
		this.broadcast({
			type: MessageType.MATCH_WINNER,
			winner: match.winner.name,
			round_index: match.round,
			match_index: match.index,
		});
	}

	canClientControlGame(client: Client) {
		if (!this.current_match) return false;
		if	(!this.current_match.clients.has(client)) {
			console.error(`Client ${client.id} not in current match`);
			return false;
		}
		return true;
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
	// spectator_match_map: Map<string, Match> = new Map();	// Maps spectator id to match, used to toggle game viewed by spectator
	spectators: Set<Client> = new Set();	// List of defeated players watching the rest of the games

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

		// add all spectators to the first match in a round
		for (const spectator of this.spectators) {
			matches[0]?.clients.add(spectator);
		}

		// run each match in parallel and await [] of winner promises
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
		match.assign_winner(winner);
		if (match.players[LEFT_PADDLE] instanceof Player && match.players[RIGHT_PADDLE] instanceof Player) {
			match.game.save_to_db();
		}
		if (!match.next) {
			this.tournamentWinner = match.winner;
			this.stop();
			return ;
		}
		this.broadcast({
			type: MessageType.MATCH_WINNER,
			winner: winner?.name,
			round_index: match.round,
			match_index: match.index,
		}, match.clients);
		
		match.next.add_player(winner);
		if (winner instanceof Player) {
			this.client_match_map.set(winner.client.id, match.next);
			this.readyClients.delete(winner.client.id);
			this.add_spectator(winner.client);
		}
		if (match.loser instanceof Player) {
			this.client_match_map.delete(match.loser.client.id); // NEED TO TEST IF THIS BREAKS GAME TRANSITIONS
			this.add_spectator(match.loser.client);
		}
	}

	add_spectator(client: Client) {
		this.spectators.add(client);
		for (const match of this.rounds.get(this.current_round) ?? []) {
			if (match.game?.running) {
				match.clients.add(client);
			}
		}
	}

	remove_spectator(client: Client) {
		this.spectators.delete(client);
		for (const match of this.rounds.get(this.current_round) ?? []) {
			if (match.clients.has(client)) {
				match.remove_spectator(client);
				break ;
			}
		}
	}

	register_database(match: Match) {
		console.log(`Match id in the tournament: ${match.id}, for P1:${match.players[0].name}, P2: ${match.players[1].name}`);
		registerNewGame(match.id, match.players[0].name, 1);
		addPlayer2(match.id, match.players[1].name);
	}

	canClientControlGame(client: Client) {
		if (this.spectators.has(client)) {
			console.error(`Client ${client.id} is a spectator`);
			return false;
		}
		const match = this.findMatch(client.id);
		if (!match) {
			console.error(`Client ${client.id} not in any active match`);
			return false;
		}
		return true;
	}

	stop() {
		if (!this.running) return ;
		this.running = false;
		
		for (const match of this.client_match_map.values()) {
			match.game?.stop();
		}
		this.broadcast({
			type: MessageType.SESSION_ENDED,
			...(this.tournamentWinner?.name && { winner: this.tournamentWinner?.name }),
		});
	}

	toggle_spectator_game(client: Client, direction: Direction) {
		if (!this.spectators.has(client)) {
			console.error(`Client ${client.id} is not a spectator`);
			return ;
		}
		const matches = this.rounds.get(this.current_round);
		if (!matches) return ;

		let old_match;
		for (const match of matches) {
			if (match.clients.has(client)) {
				old_match = match;
				break ;
			}
		}
		if (!old_match) return ;
		
		let new_index: number = old_match.index + direction;
		if (new_index < 0) new_index = matches.length - 1;
		else if (new_index > matches.length) new_index = 0;
		
		old_match.remove_spectator(client);
		matches[new_index].clients.add(client);
	}

	// The opposing player wins their current match and the tournament continues
	handlePlayerQuit(quitter: Client): void {
		const match: Match | undefined = this.findMatch(quitter.id);
		if (!match) {
			console.error(`Cannot quit: "${quitter.username}" not in any match`);
			return ;
		}
		match.game?.setOtherPlayerWinner(quitter);
		match.game?.stop();
	}

	findMatch(client_id?: string): Match | undefined {
		if (!client_id) return ;
		return (this.client_match_map.get(client_id));
	}

	findGame(client_id?: string): Game | undefined {
		return (this.findMatch(client_id)?.game);
	}
}
