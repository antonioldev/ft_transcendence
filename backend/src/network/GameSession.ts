import { Game } from '../game/Game.js';
import { Client, Player, CPU } from './Client.js';
import { MessageType, GameMode, AiDifficulty } from '../shared/constants.js';
import { PlayerInput, ServerMessage } from '../shared/types.js';
import { gameManager } from './GameManager.js';
import { GAME_CONFIG } from '../shared/gameConfig.js';
import { generateGameId } from '../data/database.js';

export abstract class AbstractGameSession {
	mode: GameMode;
	id: string = generateGameId();
	clients: Set<Client> = new Set();
	players: Set<Player | CPU> = new Set();

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

	remove_client(client: Client) {
		if (!this.clients.has(client)) return ;

		this.clients.delete(client);
		// this.readyClients.delete(client.id);
		this.full = false;

		if (this.clients.size === 0) {
			this.stop();
		}
	}
	
	add_player(player: Player | CPU) {
		if (this.players.size < this.player_capacity) {
			console.log(`Player ${player.name} added to game ${this.id}`);
			this.players.add(player);
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
		if (this.allClientsReady()) return ;
		await new Promise(resolve => {
			gameManager.once(`all-ready-${this.id}`, resolve);
		});
	}

	setClientReady(client_id: string): void {
		this.readyClients.add(client_id);
		console.log(`Client ${client_id} marked as ready.}`);
		
		if (this.allClientsReady()) {
			gameManager.emit(`all-ready-${this.id}`);
			console.log(`GameSession ${this.id}: all clients ready.`);
		}
	}

	resume(client_id?: string): void {
		const game = this.findGame(client_id);
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
		const game = this.findGame(client_id);
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
		const game = this.findGame(client_id);
		game?.enqueue(input);
	}

	abstract start(): Promise<void>; 
	abstract stop(client_id?: string): void;
	
	abstract handlePlayerQuit(quitter: Client): void;
	abstract canClientControlGame(client: Client): boolean;
	abstract findGame(client_id?: string): Game | undefined;
	abstract is_running(): boolean;
}

export class OneOffGame extends AbstractGameSession{
	running: boolean = false;
	game!: Game;

	constructor (mode: GameMode) {
		super(mode)
	}

	async start(): Promise<void> {
		if (this.running) return;
		this.running = true;
		
		await this.waitForClientsReady();
		this.game = new Game(this.id, [...this.players], this.broadcast.bind(this))
		await this.game.run();
		if (this.mode === GameMode.TWO_PLAYER_REMOTE) {
			this.game.save_to_db();
		}
	}

	stop(): void {
		if (!this.running || !this.game) return;
		
		this.running = false;
		this.game.stop();
		
		this.broadcast({ 
			type: MessageType.SESSION_ENDED,
			...(this.game.winner?.name && { winner: this.game.winner.name })
		});
	}
	
	handlePlayerQuit(quitter: Client): void {
		if (this.game && this.mode == GameMode.TWO_PLAYER_REMOTE) {
			this.game.setOtherPlayerWinner(quitter);
		}
		this.stop();
	}

	canClientControlGame(client: Client) {
		return (this.clients.has(client))
	}

	findGame() {
		return (this.game);
	}

	is_running(): boolean {
		return (this.running);
	}
}