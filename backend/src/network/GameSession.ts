import { Game } from '../game/Game.js';
import { Client, Player, CPU } from './Client.js';
import { MessageType, GameMode, AiDifficulty, GameSessionState } from '../shared/constants.js';
import { PlayerInput, ServerMessage } from '../shared/types.js';
import { gameManager } from './GameManager.js';
import { GAME_CONFIG } from '../shared/gameConfig.js';
import { generateGameId } from '../data/database.js';
import { LEFT, RIGHT } from '../shared/gameConfig.js';
import { eventManager } from './utils.js';

export abstract class AbstractGameSession {
	mode: GameMode;
	id: string = generateGameId();
	clients: Set<Client> = new Set();
	players: Set<Player | CPU> = new Set();
	state: GameSessionState = GameSessionState.INIT;

	player_capacity: number = 2;
	client_capacity: number = 1;
	full: boolean = false;
	ai_difficulty: AiDifficulty = AiDifficulty.MEDIUM;
	readyClients: Set<string> = new Set(); // Keep track of clients that finish loading

    constructor(mode: GameMode) {
        this.mode = mode
		if (this.mode == GameMode.TWO_PLAYER_REMOTE) {
			this.client_capacity = 2
		}
	}

	broadcast(message: ServerMessage, clients?: Set<Client>): void {
		const targets = clients ?? this.clients;
		let deleted_clients: (Client)[] = [];
		for (const client of targets) {
			try {
				client?.websocket.send(JSON.stringify(message));
			}
			catch {
				deleted_clients.push(client);
			}
		}
		for (const client of deleted_clients) {
			this.remove_client(client);
		}
	}

	set_ai_difficulty(difficulty: AiDifficulty) {
		console.warn(`AI difficulty set to ${difficulty} for game ${this.id}`);
		this.ai_difficulty = difficulty;
	}

	add_client(client: Client) {
		if (this.clients.size >= this.client_capacity) return ;

		this.clients.add(client);
		if (this.clients.size === this.client_capacity) {
			this.full = true;
		}
	}
	
	add_player(player: Player | CPU) {
		if (this.players.size < this.player_capacity) {
			console.log(`Player ${player.name} added to game ${this.id}`);
			this.players.add(player);
		}
	}

	remove_client(client: Client): void {
		if (!this.clients.has(client)) return ;

		this.clients.delete(client);
		this.readyClients.delete(client.id);
		
		if (this.clients.size === 0) {
			this.stop();
		}
	}

	get_cpu_name(): string {
		const unavailable_names: string[] = [...this.players].map(player => player.name);
		let name: string;

		do {
			const index = Math.floor(Math.random() * (GAME_CONFIG.cpu_names.length - 1));
			name = GAME_CONFIG.cpu_names[index];
		}
		while (unavailable_names.includes(name));
		return name + " (CPU)";
	}

	add_CPUs() {
		for (let i = 1; this.players.size < this.player_capacity; i++) {
			this.add_player(new CPU(`CPU_${i}`, this.get_cpu_name(), this.ai_difficulty));
		}

		// if (this.mode === GameMode.TWO_PLAYER_REMOTE) {
		// 	this.mode = GameMode.SINGLE_PLAYER
		// }

		this.client_capacity = this.clients.size;
    }

	allClientsReady(): boolean {
		return (this.readyClients.size === this.clients.size && this.clients.size > 0);
	}

	async waitForClientsReady() {
		if (this.allClientsReady()) {
			console.log(`All clients ready: ready size: ${this.readyClients.size}`)
			return ;
		}
		await new Promise(resolve => {
			eventManager.once(`all-ready-${this.id}`, resolve);
		});
		console.log(`Event triggered ALL READY`);
	}

	setClientReady(client_id: string): void {
		this.readyClients.add(client_id);
		console.log(`Client ${client_id} marked as ready.}`);
		
		if (this.allClientsReady()) {
			eventManager.emit(`all-ready-${this.id}`);
			console.log(`GameSession ${this.id}: all clients ready signal emitted`);
		}
	}

	resume(client_id?: string): void {
		const game = this.getGame(client_id);
		if (!game) {
			console.log(`Game ${this.id} is not running, cannot resume`);
			return ;
		}
		if (!game.is_paused()) {
			console.log(`Game ${this.id} is not paused`);
			return ;
		}

		console.log(`Game ${this.id} resumed by client ${client_id}`);
		game.resume();
	}

	pause(client_id?: string): void {
		const game = this.getGame(client_id);
		if (!game || !game.is_running()) {
			console.log(`Game ${this.id} is not running, cannot pause`);
			return ;
		}
		if (game.is_paused()) {
			console.log(`Game ${this.id} is already paused`);
			return ;
		}

		console.log(`Game ${this.id} paused by client ${client_id}`);
		game.pause();
	}

	enqueue(input: PlayerInput, client_id?: string): void  {
		const game = this.getGame(client_id);
		game?.enqueue(input);
	}

	is_running(): boolean {
		return (this.state === GameSessionState.RUNNING);
	}

	in_lobby(): Boolean {
		return (this.state === GameSessionState.LOBBY);
	}

	is_ended(): Boolean {
		return (this.state === GameSessionState.ENDED);
	}

	abstract start(): Promise<void>; 
	abstract stop(client_id?: string): void;
	
	abstract handlePlayerQuit(quitter: Client): void;
	abstract canClientControlGame(client: Client): boolean;
	abstract getGame(client_id?: string): Game | undefined;
}

export class OneOffGame extends AbstractGameSession{
	game!: Game;

	constructor (mode: GameMode) {
		super(mode)
	}

	async start(): Promise<void> {
		if (this.is_running()) return;
		this.state = GameSessionState.RUNNING;
		
		await this.waitForClientsReady();
		const players = [...this.players];

		this.game = new Game(this.id, players, this.broadcast.bind(this));
		await this.game.run();
		
		if (this.mode === GameMode.TWO_PLAYER_REMOTE) {
			this.game.save_to_db();
		}
	}

	stop(): void {
		if (!this.is_running() || !this.game) return;
		
		this.state = GameSessionState.ENDED;
		this.game.stop();
		
		this.broadcast({ 
			type: MessageType.SESSION_ENDED,
			...(this.game.winner?.name && { winner: this.game.winner.name })
		});
	}
	
	handlePlayerQuit(quitter: Client): void {
		if (this.mode == GameMode.TWO_PLAYER_REMOTE && this.game && this.game.is_running()) {
			this.game.setOtherPlayerWinner(quitter);
		}
		this.stop();
	}

	canClientControlGame(client: Client) {
		return (this.clients.has(client))
	}

	getGame() {
		return (this.game);
	}
}