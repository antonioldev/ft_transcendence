import { Ball } from './Ball.js';
import { Player, AIBot } from './Paddle.js';
import { Clock } from './utils.js';
import { LEFT_PADDLE, RIGHT_PADDLE } from '../shared/gameConfig.js';
import { GameMode } from '../shared/constants.js';
import { PlayerInput, GameStateData } from '../shared/types.js';

// The Game class serves as an abstract base class for managing the core game logic.
// It handles the game loop, state updates, input processing, and broadcasting game state.
export class Game {
	// Unique identifier for the game instance
	id: string;
	mode: GameMode;
	// Clock instance to manage game loop timing
	clock: Clock;
	// Queue to store player inputs
	queue: PlayerInput[] = [];
	// Flag to indicate if the game is running
	running: boolean;
	// Flag to indicate if the game is paused
	paused: boolean = false;
	// Array of players (can include AI bots)
	players!: (Player | AIBot)[];
	// Ball instance for the game
	ball!: Ball;
	// Callback function to broadcast the game state
	private _broadcast: (state: GameStateData) => Promise<void>;

	constructor(id: string, mode: GameMode, broadcast_callback: (state: GameStateData) => Promise<void>) {
		// Initialize game properties
		this.id = id;
		this.mode = mode;
		this.clock = new Clock(60);
		this.running = true;
		this._broadcast = broadcast_callback;
		this._init();
	}

	// Initialize the ball and players
	private _init() {
		this.players = [new Player(LEFT_PADDLE), null as any];
		this.ball = new Ball(this.players, this._update_score);
		console.log(this.mode);
		if (this.mode === GameMode.SINGLE_PLAYER) {
			this.players[RIGHT_PADDLE] = new AIBot(RIGHT_PADDLE, this.ball);
		}
		else {
			this.players[RIGHT_PADDLE] = new Player(RIGHT_PADDLE);
		}
	}

	// Abstract method to handle input, implemented by derived classes
	private _handle_input(dt: number): void {
		this._process_queue(dt);
		if (this.players[RIGHT_PADDLE] instanceof AIBot) {
			this.players[RIGHT_PADDLE].update(dt);
		}
	}

	// Update the score for the specified side
	private _update_score(side: number): void {
		this.players[side].score += 1;
	}

	// Update the game state, including player and ball positions
	private _update_state(dt: number): void {
		if (this.paused)
			return;
		this.players[LEFT_PADDLE].cacheRect();
		this.players[RIGHT_PADDLE].cacheRect();
		this._handle_input(dt);
		this.ball.update(dt);
	}

	// Check if the game state has changed (e.g., player or ball positions)
	private _state_changed(): boolean {
		if (this.paused)
			return false;
		return (
		this.players[LEFT_PADDLE].rect.x != this.players[LEFT_PADDLE].oldRect.x ||
		this.players[RIGHT_PADDLE].rect.x != this.players[RIGHT_PADDLE].oldRect.x ||
		this.ball.rect.x != this.ball.oldRect.x ||
		this.ball.rect.y != this.ball.oldRect.y) //TODO this will always be true because the ball moves all the time
	}

	// Process the input queue and apply player movements
	private _process_queue(dt: number): void {
		if (this.paused) {
			this.queue = [];
			return;
		}
		while (this.queue.length > 0) {
			const input = this.queue.shift();
			if (input) {
				this.players[input.side].move(dt, input.dx);
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
			"paddleLeft": {
				"x":     this.players[LEFT_PADDLE].rect.centerx,
				"score": this.players[LEFT_PADDLE].score,
			},
			"paddleRight": {
				"x":     this.players[RIGHT_PADDLE].rect.centerx,
				"score": this.players[RIGHT_PADDLE].score,
			},
			"ball": {
				"x": this.ball.rect.centerx,
				"z": this.ball.rect.centery,
			},
		}
	}

	// continuosly updates the game state and broadcasts to all clients
	run() {
		if (!this.running) return;
		const dt = this.clock.tick();
		
		if (!this.paused) {
			this._update_state(dt);
			if (this._state_changed()) {
				this._broadcast(this.get_state());
			}
		}
		setTimeout(this.run.bind(this), this.clock.getTimeout(dt));
	}

	// Pause the game
	pause(): void {
		if(!this.paused) {
			this.paused = true;
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
