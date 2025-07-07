import { Ball } from './Ball.js';
import { Player, AIBot } from './Paddle.js';
import { Clock } from './utils';
import { LEFT_PADDLE, RIGHT_PADDLE } from '../shared/gameConfig.js';
import { PlayerInput, GameStateData } from '../shared/types.js';


// IMPORTANT: the queue is currently just a list, there is no async queue object in TS
// we can test with this and see but likely we will have to create our own async queue class

abstract class Game {
	id: string;
	clock: Clock;
	queue: PlayerInput[] = [];
	running: boolean;
	players!: (Player | AIBot)[];
	ball!: Ball;
	protected _broadcast: (state: GameStateData) => Promise<void>;

	constructor(id: string, broadcast_callback: (state: GameStateData) => Promise<void>) {
		this.id = id;
		this.clock = new Clock();
		this.running = true;
		this._broadcast = broadcast_callback;
	}

    // --- protected methods ---

	protected abstract _handle_input(dt: number): void;

	protected _init_ball() {
		this.ball = new Ball(this.players, this._update_score);
	}

	protected _update_score(side: number): void {
		this.players[side].score += 1;
	}

	protected _update_state(dt: number): void {
		this.players[LEFT_PADDLE].cacheRect();
		this.players[RIGHT_PADDLE].cacheRect();
		this._handle_input(dt);
		this.ball.update(dt);
	}

	protected _state_changed(): boolean {
		return (
		this.players[LEFT_PADDLE].rect.x != this.players[LEFT_PADDLE].oldRect.x ||
		this.players[RIGHT_PADDLE].rect.x != this.players[RIGHT_PADDLE].oldRect.x ||
		this.ball.rect.x != this.ball.oldRect.x ||
		this.ball.rect.y != this.ball.oldRect.y) //TODO this will always be true because the ball moves all the time
	}

	protected _process_queue(dt: number): void {
		while (this.queue.length > 0) {
			const input = this.queue.shift();
			if (input) {
				this.players[input.side].move(dt, input.dx);
			}
		}
	}

    // --- public methods ---

	enqueue(input: PlayerInput): void {
		this.queue.push(input)
	}

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

	async run(): Promise<void> {
		while (this.running) {
			const dt = await this.clock.tick(60)
			this._update_state(dt)

			if (this._state_changed()) {
				let state = this.get_state()
				await this._broadcast(state)
			}
		}
	}
}

export class SinglePlayer extends Game {
	players: [Player, AIBot]

	constructor(id: string, broadcast_callback: (state: GameStateData) => Promise<void>) {
		super(id, broadcast_callback);
		this.players = [new Player(LEFT_PADDLE), null as any];
		this._init_ball();
		this.players[RIGHT_PADDLE] = new AIBot(RIGHT_PADDLE, this.ball);
	}
	protected _handle_input(dt: number) {
		this._process_queue(dt);
		this.players[RIGHT_PADDLE].update(dt);
	}
}

export class TwoPlayer extends Game {
	players: [Player, Player]

	constructor(id: string, broadcast_callback: (state: GameStateData) => Promise<void>) {
		super(id, broadcast_callback)
		this.players = [new Player(LEFT_PADDLE), new Player(RIGHT_PADDLE)]
		this._init_ball();
	}

	protected _handle_input(dt: number) {
		this._process_queue(dt);
	}
}