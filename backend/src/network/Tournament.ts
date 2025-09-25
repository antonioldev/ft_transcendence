import { AbstractGameSession } from './GameSession.js'
import { Game } from '../game/Game.js';
import { Client, Player, CPU } from './Client.js';
import { GameMode, MessageType, Direction } from '../shared/constants.js';
import { addPlayer2, registerNewGame } from '../data/validation.js';
import { LEFT, RIGHT } from '../shared/gameConfig.js';
import { generateGameId } from '../data/database.js';

export class Match {
	id: string = generateGameId();
	round: number;
	players: (Player | CPU)[] = [];
	clients: Set<Client> = new Set();
	game!: Game;
	
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
			console.log(`Player ${player.name} added to match ${this.id}`)
			this.players.push(player);
		}
		if (player instanceof Player) {
			console.log(`Client ${player.client.id} added to match ${this.id}`)
			this.clients.add(player.client);
		}

	}
}

abstract class AbstractTournament extends AbstractGameSession{
	client_match_map?: Map<string, Match>;	// Maps client id to match, used for easy insertion from client input
	rounds: Map<number, Match[]> = new Map();	// Maps rounds to match[], used for easy traversal to run games
	num_rounds: number;
	current_round: number = 1;
	tournamentWinner?: Player | CPU;

	constructor(mode: GameMode, capacity: number) {
		super(mode);
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
		}
	}

	private broadcastRoundSchedule(roundIndex: number): void {
		const matches = this.rounds.get(roundIndex);
		if (!matches || matches.length === 0) return;

		matches.forEach((match, i) => {
			this.broadcast({
				type: MessageType.MATCH_ASSIGNMENT,
				round_total: this.num_rounds,
				round_index: roundIndex,
				match_index: i,
				match_total: matches.length,
				left:  match.players[LEFT]?.name ?? "TBD",
				right: match.players[RIGHT]?.name ?? "TBD",
			});
		});
	}
				
	async start(): Promise<void> {
		if (this.running) return ;
		this.running = true;

		this.add_CPUs();
		this._match_players();
		for (this.current_round = 1; this.current_round <= this.num_rounds; this.current_round++) {
			// if (!this.running) {
			// 	console.warn(`Tournament ${this.id} ended prematurely on round ${this.current_round}`);
			// 	return ;
			// }
			await this.waitForPlayersReady();
			this.broadcastRoundSchedule(this.current_round); // TODO added here so we get update info from server
			
			const matches = this.rounds.get(this.current_round);
			if (!matches) return ; // maybe throw err
			await this.run(matches);
		}
		console.error(`Game ${this.id} ended naturally`);
	}

	abstract run(matches: Match[]): Promise<void>;
	abstract findMatch(client_id?: string): Match | undefined;
}

export class TournamentLocal extends AbstractTournament {
	current_match?: Match; // used for the server to access the current active match
	readyClients: Set<string> = new Set(); // Keep track of clients that finish loading

	constructor(mode: GameMode, capacity: number) {
		super(mode, capacity);
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
			await match.game.run();
			if (match.game?.winner) {
				this.assign_winner(match);
			}
			index++;
		}
	}

	assign_winner(match: Match) {
		if (!match.game.winner) return ;
		if (!match.next) {
			this.stop(); 
			return ;
		}
		match.next.add_player(match.game.winner);
		this.readyClients.clear();
	}

	canClientControlGame(client: Client) {
		if (!this.current_match) return false;
		return (this.current_match.clients.has(client));
	}

	stop() {
		if (!this.running) return ;

		this.running = false;
		this.current_match?.game?.stop();
		this.broadcast({
			type: MessageType.SESSION_ENDED,
			...(this.current_match?.game?.winner?.name && { winner: this.current_match?.game?.winner?.name }),
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
	client_match_map: Map<string, Match> = new Map();	// Maps client id to the match they are in
	spectators: Set<Client> = new Set();	// List of defeated players watching the rest of the games
	active_matches: Match[] = [];			// list of all active matches in a round

	constructor(mode: GameMode, capacity: number) {
		super(mode, capacity);
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
			if (!this.running) {
				this.broadcast({
					type: MessageType.TOURNAMENT_LOBBY,
					lobby: this.players.map(player => player.name)
				});
			}
		}
		if (this.players.length === 0) {
			this.stop();
		}
	}

	// run each match in parallel and await [] of winner promises
	async run(matches: Match[]): Promise<void> {
		this.active_matches = []; // just to be safe
		let round_winners: Promise<Player | CPU>[] = [];

		this.assign_clients(matches);
		let index = 0;
		for (const match of matches) {
			if (!this.running) {
				console.warn(`Tournament ${this.id}: round ${this.current_round} ended prematurely`);
				return ;
			}

			this.register_database(match);
			match.index = index;
			match.game = new Game(match.id, match.players, (message) => this.broadcast(message, match.clients));
			this.active_matches.push(match);
			
			let winner_promise: Promise<Player | CPU> = match.game.run();
			winner_promise.then((winner) => this.assign_winner(match, winner));
			round_winners.push(winner_promise);
			index++;
		}
		await Promise.all(round_winners);
	}

	assign_winner(match: Match, winner: Player | CPU) {
		if (match.players[LEFT] instanceof Player && match.players[RIGHT] instanceof Player) {
			match.game.save_to_db();
		}
		if (!match.next) {
			this.tournamentWinner = match.game?.winner;
			this.stop();
			return ;
		}
		match.next.add_player(winner);

		this.broadcast({
			type: MessageType.MATCH_RESULT,
			winner: winner?.name,
			round_index: match.round,
			match_index: match.index,
		});

		// update readyClients to wait for the winner before starting next round
		if (winner instanceof Player) {
			this.readyClients.delete(winner.client.id);
		}

		// remove match from active_matches[]
		const index = this.active_matches.indexOf(match);
		if (index !== -1) this.active_matches.splice(index, 1);
		
		// add clients as spectators to an active match
		for (const client of match.clients) {
			this.assign_spectator(client, this.active_matches[0]);
		}
	}

	assign_spectator(client: Client, match?: Match) {
		this.spectators.add(client);
		if (!match) return ;
		
		this.client_match_map.set(client.id, match);
		match.clients.add(client);
		match.game?.send_side_assignment(new Set([client]));
	}

	assign_clients(matches: Match[]) {
		// add clients who are still playing to their match
		for (const match of matches) {
			for (const player of [match.players[LEFT], match.players[RIGHT]]) {
				if (player instanceof Player) {
					this.client_match_map.set(player.client.id, match);
					this.spectators.delete(player.client);
				}
			}
		}
		// add all defeated players to the first match in a round
		for (const client of this.spectators) {
			this.assign_spectator(client, matches[0]);
		}
	}

	register_database(match: Match) {
		console.log(`Match id in the tournament: ${match.id}, for P1:${match.players[LEFT].name}, P2: ${match.players[RIGHT].name}`);
		registerNewGame(match.id, match.players[LEFT].name, 1);
		addPlayer2(match.id, match.players[RIGHT].name);
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
		
		for (const match of this.active_matches) {
			match.game?.stop();
		}
		this.broadcast({
			type: MessageType.SESSION_ENDED,
			...(this.tournamentWinner?.name && { winner: this.tournamentWinner?.name }),
		});
	}

	toggle_spectator_game(client: Client, direction: Direction) {
		if (this.active_matches.length <= 1) return ;

		const old_match = this.client_match_map.get(client.id);
		if (!old_match) {
			console.error(`Client ${client.id} is not in any game`);
			return ;
		}
		const old_index = this.active_matches.indexOf(old_match);
		if (old_index === -1) return ; 

		let new_index: number = old_index + direction;
		if (new_index < 0) new_index = this.active_matches.length - 1;
		else if (new_index > this.active_matches.length - 1) new_index = 0;
		
		old_match.clients.delete(client);
		this.assign_spectator(client, this.active_matches[new_index]);
	}

	// The opposing player wins their current match and the tournament continues
	handlePlayerQuit(quitter: Client): void {
		const match = this.findMatch(quitter.id);
		if (!match) {
			console.error(`Cannot quit: "${quitter.username}" not in any match`);
			return ;
		}
		match.game?.setOtherPlayerWinner(quitter);
		match.game?.stop();
		this.client_match_map.delete(quitter.id);
		this.spectators.delete(quitter);
	}

	findMatch(client_id: string): Match | undefined {
		return (this.client_match_map.get(client_id));
	}

	findGame(client_id: string): Game | undefined {
		return (this.findMatch(client_id)?.game);
	}
}
