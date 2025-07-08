import { Rect } from './utils';
import { Ball } from './Ball'
import { GAME_CONFIG, getBallStartPosition, getPlayerLeftPosition, 
         getPlayerRightPosition, LEFT_PADDLE, RIGHT_PADDLE } from '../shared/gameConfig';

// Abstract class representing a paddle in the game.
export abstract class Paddle {
	side: number; // Indicates which side (left or right) the paddle belongs to.
	score: number = 0; // The score of the player or AI controlling the paddle.
	rect: Rect; // The current position and dimensions of the paddle.
	oldRect: Rect; // Cached position and dimensions of the paddle from the previous frame.
	abstract speed: number; // Speed of the paddle, defined in subclasses.

	constructor(side: number) {
		this.side = side;
		// Initialize the paddle's position based on its side.
		const position = side === LEFT_PADDLE ? getPlayerLeftPosition() : getPlayerRightPosition();
		this.rect = new Rect(
			position.x,
			position.z,
			GAME_CONFIG.playerWidth,
			GAME_CONFIG.playerDepth
		);
		this.oldRect = this.rect.instance();
	}

	// Moves the paddle horizontally based on the time delta and direction.
	move(dt: number, dx: number): void {
		const deltaSeconds = dt / 1000; // Convert milliseconds to seconds.
		this.rect.x += dx * this.speed * deltaSeconds;
	}

	// Caches the current position of the paddle for future reference.
	cacheRect() {
		this.oldRect.copy(this.rect);
	}
}

// Class representing a human-controlled player paddle.
export class Player extends Paddle {
	speed: number = GAME_CONFIG.playerSpeed; // Speed of the player paddle.

	constructor(side: number) {
		super(side);
	}
}

// Class representing an AI-controlled paddle.
export class AIBot extends Paddle {
	speed: number = GAME_CONFIG.playerSpeed; // Speed of the AI paddle.
	direction: number = 0; // Direction of movement for the AI paddle.
	protected _view_timer: number = 0; // Timer to control how often the AI updates its target.
	protected _target_y = getBallStartPosition().z; // Predicted Y-coordinate of the ball's intercept.
	ball: Ball; // Reference to the ball in the game.

	constructor(side: number, ball: Ball) {
		super(side);
		this.ball = ball;
	}

	// Predicts the Y-coordinate where the ball will intersect with the AI paddle.
	protected _predict_intercept_y(): number {
		let r: number     = GAME_CONFIG.ballRadius;
        let x0: number    = this.ball.rect.centerx;
        let y0: number    = this.ball.rect.centery - r;          // adj for ball size
        let vx: number    = this.ball.direction[0] * this.ball.speed;
        let vy: number    = this.ball.direction[1] * this.ball.speed;
        let H_adj: number = GAME_CONFIG.fieldHeight - 2 * r;               // adj for ball size

		let x_ai: number;
		let x_opp: number;
		let t: number;

		if (vx == 0) {
            return GAME_CONFIG.fieldHeight / 2;
		}

		x_ai  = this.side ? this.rect.left - r : this.rect.right + r;
		x_opp = this.side ? (GAME_CONFIG.playerWidth + r) : GAME_CONFIG.fieldWidth - (GAME_CONFIG.playerWidth + r);

        if (vx > 0) {                                  // ball moving towards bot
            t = Math.abs((x_ai - x0) / vx);  
		}         
        else {
            let dx_to_opp = Math.abs(x_opp - x0);         
            let dx_back   = Math.abs(x_ai - x_opp);       
            t = (dx_to_opp + dx_back) / Math.abs(vx);
		}
        // calculate next y intercept
        let total_y   = y0 + vy * t;
        let wrapped_y = total_y % (2 * H_adj);
		const target_y = wrapped_y < H_adj ? wrapped_y : 2 * H_adj - wrapped_y;
		return target_y + r;
	}

	// Updates the AI paddle's position based on the ball's predicted position.
	update(dt: number): void {
		this._view_timer += dt;
		if (this._view_timer >= 1.0) {
			this._target_y = this._predict_intercept_y(); // Update target position.
			this._view_timer = 0.0;
		}
		// If the paddle is close enough to the target, stop moving.
		if (Math.abs(this.rect.centerx - this._target_y) < 5) {
			return;
		}
		// Move the paddle towards the target position.
		const dx = this.rect.centerx < this._target_y ? 1 : -1;
		this.move(dt, dx);
	}
}