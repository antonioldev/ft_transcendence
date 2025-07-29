import { Ball } from './Ball.js';
import { Paddle, AIBot } from './Paddle.js';
import { Clock } from './utils.js';
import { GAME_CONFIG, LEFT_PADDLE, RIGHT_PADDLE } from '../shared/gameConfig.js';
import { GameMode, MessageType} from '../shared/constants.js';
import { PlayerInput, GameStateData, ServerMessage } from '../shared/types.js';
import { Client, Player } from '../models/Client.js'

// The Game class runs the core game logic for all game modes.
export class Game {
	// Clock instance to manage game loop timing
	clock: Clock;
	queue: PlayerInput[] = [];
	running: boolean = true;
	paused: boolean = false;
	players: Player[]
	winner!: Player;
	paddles: (Paddle | AIBot)[] = [new Paddle(LEFT_PADDLE), new Paddle(RIGHT_PADDLE)];
	ball!: Ball;
	// Callback function to broadcast the game state
	private _broadcast: (message: ServerMessage, clients?: Client[]) => void;

	constructor(players: Player[], broadcast_callback: (message: ServerMessage, clients?: Client[]) => void) {
		// Initialize game properties
		this.clock = new Clock();
		this._broadcast = broadcast_callback;
		this.players = players;
		this._init();
	}

	// Initialize the ball and players
	private _init() {
		this.ball = new Ball(this.paddles, this._update_score);
		
		if (!this.players[LEFT_PADDLE].client) { // if CPU
			this.paddles[LEFT_PADDLE] = new AIBot(LEFT_PADDLE, this.ball)
		}
		if (!this.players[RIGHT_PADDLE].client) {
			this.paddles[RIGHT_PADDLE] = new AIBot(RIGHT_PADDLE, this.ball)
		}
	}

	// Abstract method to handle input, implemented by derived classes
	private _handle_input(dt: number): void {
		this._process_queue(dt);
		if (this.paddles[RIGHT_PADDLE] instanceof AIBot) {
			this.paddles[RIGHT_PADDLE].update(dt);
		}
		if (this.paddles[LEFT_PADDLE] instanceof AIBot) {
			this.paddles[LEFT_PADDLE].update(dt);
		}
	}

	// Update the score for the specified side
	private _update_score(side: number, score: number): void {
		this.paddles[side].score += score;
		if (this.paddles[side].score >= GAME_CONFIG.winning_score) {
			this.running = false;
			this.winner = this.players[side];
		}
	}

	// Update the game state, including player and ball positions
	private _update_state(dt: number): void {
		// cache preceeding rect positions for collision calculations
		this.paddles[LEFT_PADDLE].cacheRect();
		this.paddles[RIGHT_PADDLE].cacheRect();
		this._handle_input(dt);
		this.ball.update(dt);
	}

	// Process the input queue and apply player movements
	private _process_queue(dt: number): void {
		while (this.queue.length > 0) {
			const input = this.queue.shift();
			if (input) {
				this.paddles[input.side].move(dt, input.dx);
			}
		}
	}

	// Add a new input to the queue
	enqueue(input: PlayerInput): void {
		if (!this.paused)
			this.queue.push(input);
	}

	// Retrieve the current game state as a data object
	get_state(): GameStateData {
		return {
			paddleLeft: {
				x:     this.paddles[LEFT_PADDLE].rect.centerx,
				score: this.paddles[LEFT_PADDLE].score,
			},
			paddleRight: {
				x:     this.paddles[RIGHT_PADDLE].rect.centerx,
				score: this.paddles[RIGHT_PADDLE].score,
			},
			ball: {
				x: this.ball.rect.centerx,
				z: this.ball.rect.centery,
			},
		}
	}

	// Main game loop that updates the state and broadcasts changes
	async run(): Promise<Player> {
		while (this.running) {
			const dt = await this.clock.tick(60);
			if (this.paused) continue ;

			this._update_state(dt);
			this._broadcast({
				type: MessageType.GAME_STATE,
				state: this.get_state()
			});
		}
		return (this.winner);
	}

	// Pause the game
	pause(): void {
		if(!this.paused) {
			this.paused = true;
			this.queue = []
		}
	}

	// Resume the game
	resume(): void {
		if (this.paused) {
			this.paused = false;
		}
	}

	// Returns if the game is currently paused
	isPaused(): boolean {
		return this.paused;
	}
}
