import { AbstractGameSession } from './GameSession.js'
import { Game } from '../game/Game.js';
import { Client, Player, CPU } from './Client.js';
import { GameMode, MessageType, Direction, TournamentState } from '../shared/constants.js';
import { addPlayer2, registerNewGame } from '../data/validation.js';
import { LEFT, RIGHT } from '../shared/gameConfig.js';
import { generateGameId } from '../data/database.js';
import { randomize } from './utils.js';

export class Match {
	id: string = generateGameId();
	round: number;
	players: (Player | CPU)[] = [];
	clients: Set<Client> = new Set();
	game!: Game;
	// spectators_allowed: Boolean = false;
	
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
	state: TournamentState = TournamentState.INIT;

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
	private _match_players(players: (Player | CPU)[]): void {
		randomize(players);

		const round_one = this.rounds.get(1);
		if (!round_one) {
			console.error(`Tournament ${this.id}: Error matching players`); 
			return ; 
		}

		for (let i = 0, j = 0; j < this.player_capacity; i++, j+=2) {
			let player_left = players[j];
			let player_right = players[j + 1];
			const match = round_one[i];

			match.add_player(player_left);
			match.add_player(player_right);

			if (!this.client_match_map) continue ;
			for (const player of [player_left, player_right]) {
				if (!(player instanceof CPU)) {
					this.client_match_map.set(player.client.id, match);
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
		if (this.is_running()) return ;
		this.state = TournamentState.RUNNING;

		this._match_players([...this.players]);
		
		for (this.current_round = 1; this.current_round <= this.num_rounds; this.current_round++) {
			if (!this.is_running()) {
				console.log(`Tournament ${this.id} ended prematurely on round ${this.current_round}`);
				return ;
			}
			
			await this.waitForClientsReady();
			this.broadcastRoundSchedule(this.current_round);
			
			const matches = this.rounds.get(this.current_round);
			if (!matches) return ; // maybe throw err
			await this.run(matches);
		}
		this.stop();
		console.log(`Game ${this.id} ended naturally`);
	}

	is_running(): boolean {
		return (this.state === TournamentState.RUNNING);
	}

	in_lobby(): Boolean {
		return (this.state === TournamentState.LOBBY);
	}

	is_ended(): Boolean {
		return (this.state === TournamentState.ENDED);
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
			if (!this.is_running()) return ;
			this.current_match = match;
			
			await this.waitForClientsReady();
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
			this.tournamentWinner = match.game?.winner;
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
		if (this.is_ended()) return ;

		this.state = TournamentState.ENDED;
		this.current_match?.game?.stop();
		this.broadcast({
			type: MessageType.SESSION_ENDED,
			...(this.tournamentWinner?.name && { winner: this.tournamentWinner?.name }),
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
	client_match_map: Map<string, Match> = new Map();	// Maps client id to the match they are in, CONTAINS ONLY ACTIVE PLAYERS
	active_matches: Match[] = [];			// list of all active matches in a round
	defeated_clients: Set<Client> = new Set();

	constructor(mode: GameMode, capacity: number) {
		super(mode, capacity);
		this.client_capacity = capacity;
	}

	add_player(player: Player) {
		if (this.players.size < this.player_capacity) {
			this.players.add(player);
			if (this.in_lobby()) {
				this.broadcast({
					type: MessageType.TOURNAMENT_LOBBY,
					lobby: [...this.players].map(player => player.name)
				});
			}
		}
	}

	remove_player(client: Client) {
		for (const player of this.players) {
			if (player instanceof Player && player.client === client) {
				this.players.delete(player);
				if (this.in_lobby()) {
					this.broadcast({
						type: MessageType.TOURNAMENT_LOBBY,
						lobby: [...this.players].map(player => player.name)
					});
				}
				return ;
			}
		}
	}

	// run each match in parallel and await [] of winner promises
	async run(matches: Match[]): Promise<void> {
		this.active_matches = []; // reset each round just to be safe
		let round_winners: Promise<Player | CPU>[] = [];

		let index = 0;
		for (const match of matches) {
			if (!this.is_running()) {
				console.warn(`Tournament ${this.id}: round ${this.current_round} ended prematurely`);
				return ;
			}

			match.index = index;
			match.game = new Game(match.id, match.players, (message) => this.broadcast(message, match.clients));

			if (match.players[LEFT] instanceof Player && match.players[RIGHT] instanceof Player) {
				registerNewGame(match.id, match.players[LEFT].client.username, 1);
				addPlayer2(match.id, match.players[RIGHT].client.username);
			}

			this.register_database(match);
			this.active_matches.push(match);
			
			let winner_promise: Promise<Player | CPU> = match.game.run();
			winner_promise.then((winner) => this.handle_match_end(match, winner));
			round_winners.push(winner_promise);
			index++;
		}

		for (const client of this.defeated_clients) {
			if (!client) continue ;
			this.assign_spectator(client);
		}
		await Promise.all(round_winners);
	}

	handle_match_end(match: Match, winner: Player | CPU) {
		if (match.players[LEFT] instanceof Player && match.players[RIGHT] instanceof Player) {
			match.game.save_to_db();
		}
		if (!match.next) {
			this.tournamentWinner = match.game?.winner;
			
			// save tournament winner to db

			// this.stop();
			return ;
		}
		match.next.add_player(winner);

		// update readyClients to wait for the winner ready signal before next round
		if (winner instanceof Player) {
			this.readyClients.delete(winner.client.id);
			this.client_match_map.set(winner.client.id, match.next);
			match.clients.delete(winner.client);
		}
		if (match.game.loser instanceof Player) {
			this.client_match_map.delete(match.game.loser.client.id);
			this.defeated_clients.add(match.game.loser.client);
			match.clients.delete(match.game?.loser.client);
		}

		// assign spectators to next available match
		for (const client of match.clients) {
			this.assign_spectator(client);
		}

		// remove match from active_matches[]
		const index = this.active_matches.indexOf(match);
		if (index !== -1) this.active_matches.splice(index, 1);

		this.broadcast({
			type: MessageType.MATCH_RESULT,
			winner: winner?.name,
			round_index: match.round,
			match_index: match.index,
		});
	}

	assign_spectator(client: Client, match?: Match) {
		const spectator_match = match ?? this.active_matches[0] ?? undefined;
		if (!spectator_match) {
			console.log("Cannot assign spectator: no active game");
		}
		spectator_match.clients.add(client);
		spectator_match.game?.send_side_assignment(new Set([client]));
	}

	toggle_spectator_game(client: Client, direction: Direction) {
		if (this.active_matches.length <= 1) return ;

		const old_match = this.find_spectator_match(client);
		if (!old_match) {
			console.error(`Client ${client.id} is not spectating any game`);
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

	find_spectator_match(client: Client): Match | undefined {
		for (const match of this.active_matches) {
			if (match.clients.has(client)) {
				return (match);
			}
		}
		return (undefined);
	}

	register_database(match: Match) {
		console.log(`Match id in the tournament: ${match.id}, for P1:${match.players[LEFT].name}, P2: ${match.players[RIGHT].name}`);
		registerNewGame(match.id, match.players[LEFT].name, 1);
		addPlayer2(match.id, match.players[RIGHT].name);
	}

	canClientControlGame(client: Client) {
		const match = this.findMatch(client.id);
		if (!match || !this.active_matches.includes(match)) {
			console.error(`Client ${client.id} not in any active match`);
			return false;
		}
		return true;
	}

	stop() {
		if (this.is_ended()) return ;
		this.state = TournamentState.ENDED
		
		for (const match of this.active_matches) {
			match.game?.stop();
		}
		this.broadcast({
			type: MessageType.SESSION_ENDED,
			...(this.tournamentWinner?.name && { winner: this.tournamentWinner?.name }),
		});
	}

	// The opposing player wins their current match and the tournament continues
	handlePlayerQuit(quitter: Client): void {
		this.remove_client(quitter);
		this.remove_player(quitter);
		if (this.is_running()) {
			const match = this.findMatch(quitter.id);
			if (!match) {
				console.error(`Cannot quit: "${quitter.username}" not in any match`);
				return ;
			}
			match.game?.setOtherPlayerWinner(quitter);
			match.game?.stop();
			this.client_match_map.delete(quitter.id);
			this.defeated_clients.delete(quitter);
		}
	}

	findMatch(client_id: string): Match | undefined {
		return (this.client_match_map.get(client_id));
	}

	findGame(client_id: string): Game | undefined {
		return (this.findMatch(client_id)?.game);
	}
}
