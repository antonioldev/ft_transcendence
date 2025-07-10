import { Rect } from './utils.js';
import { Ball } from './Ball.js'
import { GAME_CONFIG, getBallStartPosition, getPlayerLeftPosition, 
         getPlayerRightPosition, LEFT_PADDLE, RIGHT_PADDLE, getPlayerBoundaries } from '../shared/gameConfig.js';

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


export class AIBot extends Paddle {
	speed: number = GAME_CONFIG.playerSpeed;
	direction: number = 0;
	protected _view_timer: number = 0; 
	protected _target_x = getBallStartPosition().x; 
	private boundaries = getPlayerBoundaries();
	ball: Ball;
	
	constructor(side: number, ball: Ball) {
		super(side);
		this.ball = ball;
	}
	
	protected _predict_intercept_x(): number {
		let r: number     = GAME_CONFIG.ballRadius;
		const shift_z     = GAME_CONFIG.fieldHeight / 2;
		const shift_x     = GAME_CONFIG.fieldWidth / 2;
        let x0: number    = this.ball.rect.centerx;
        let z0: number    = this.ball.rect.centery - r;          		
        let vx: number    = this.ball.direction[0] * this.ball.speed;
        let vz: number    = this.ball.direction[1] * this.ball.speed;
        let W_adj: number = GAME_CONFIG.fieldWidth - 2 * r;

		let z_ai: number;
		let z_opp: number;
		let t: number;

		if (vz == 0) {
            return GAME_CONFIG.fieldWidth / 2;
		}

		z_ai  = this.side ? GAME_CONFIG.fieldHeight - GAME_CONFIG.playerHeight - r : GAME_CONFIG.playerHeight + r;
		z_opp = this.side ? (GAME_CONFIG.playerHeight + r) : GAME_CONFIG.fieldHeight - (GAME_CONFIG.playerHeight + r);
		
        if (vz > 0) {                                  	// ball moving towards bot
            t = Math.abs((z_ai - z0 - shift_z) / vz);  
		}         
        else {
            let dz_to_opp = Math.abs(z_opp - z0 - shift_z);         
            let dz_back   = Math.abs(z_ai - z_opp);       
            t = (dz_to_opp + dz_back) / Math.abs(vz);
		}
        
		// calculate next z intercept
		const total_x   = x0 + W_adj/2 + vx * t;
		const wrapped_x = ((total_x % (2 * W_adj)) + 2 * W_adj) % (2 * W_adj);
		const target_x  = wrapped_x < W_adj ? wrapped_x : 2 * W_adj - wrapped_x;
		return target_x - W_adj/2 + r;
	}

	update(dt: number): void {
		this._view_timer += dt;
		if (this._view_timer >= 1000.0) {
			this._target_x = this._predict_intercept_x();
			this._view_timer = 0.0;
		}
		if (Math.abs(this.rect.centerx - this._target_x) < 2) {
			return;
		}
		const dx = this.rect.centerx < this._target_x ? 1 : -1;
		if (dx === -1 && this.rect.centerx > this.boundaries.left)
			this.move(dt, dx);
		else if (dx === 1 && this.rect.centerx < this.boundaries.right)
			this.move(dt, dx);
	}
}