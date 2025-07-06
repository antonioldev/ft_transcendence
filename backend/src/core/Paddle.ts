import { Rect } from './utils.js';
import { Ball } from './Ball.js'
import { GAME_CONFIG, getBallStartPosition, getPlayerLeftPosition, 
         getPlayerRightPosition, LEFT_PADDLE, RIGHT_PADDLE } from '../shared/gameConfig.js';

export abstract class Paddle {
	side: number;
	score: number = 0;
	rect: Rect;
	oldRect: Rect;
	abstract speed: number;

	constructor(side: number) {
		this.side = side;
		const position = side === LEFT_PADDLE ? getPlayerLeftPosition() : getPlayerRightPosition();
		this.rect = new Rect(
			position.x,
			position.z,
			GAME_CONFIG.playerWidth,
			GAME_CONFIG.playerDepth
		);
		this.oldRect = this.rect.instance();
	}

	move(dt: number, dx: number): void {
		const deltaSeconds = dt / 1000;
		this.rect.x += dx * this.speed * deltaSeconds;
	}

	cacheRect() {
		this.oldRect.copy(this.rect);
	}
}

export class Player extends Paddle {
	speed: number = GAME_CONFIG.playerSpeed;

	constructor(side: number) {
		super(side);
	}
}

export class AIBot extends Paddle {
	speed: number = GAME_CONFIG.playerSpeed;
	direction: number = 0;
	protected _view_timer: number = 0;
	protected _target_y = getBallStartPosition().z;
	ball: Ball;
	
	constructor(side: number, ball: Ball) {
		super(side);
		this.ball = ball;
	}

	protected _predict_intercept_y(): number {
		let r: number     = GAME_CONFIG.ballRadius
        let x0: number    = this.ball.rect.centerx
        let y0: number    = this.ball.rect.centery - r          // adj for ball size
        let vx: number    = this.ball.direction[0] * this.ball.speed
        let vy: number    = this.ball.direction[1] * this.ball.speed
        let H_adj: number = GAME_CONFIG.fieldHeight - 2 * r               // adj for ball size

		let x_ai: number;
		let x_opp: number;
		let t: number;

		if (vx == 0) {
            return GAME_CONFIG.fieldHeight / 2
		}

		x_ai  = this.side ? this.rect.left - r : this.rect.right + r;
		x_opp = this.side ? (GAME_CONFIG.playerWidth + r) : GAME_CONFIG.fieldWidth - (GAME_CONFIG.playerWidth + r);

        if (vx > 0) {                                  // ball moving towards bot
            t = Math.abs((x_ai - x0) / vx)  
		}         
        else {
            let dx_to_opp = Math.abs(x_opp - x0)         
            let dx_back   = Math.abs(x_ai - x_opp)       
            t = (dx_to_opp + dx_back) / Math.abs(vx)
		}
        // calculate next y intercept
        let total_y   = y0 + vy * t;
        let wrapped_y = total_y % (2 * H_adj);
		const target_y = wrapped_y < H_adj ? wrapped_y : 2 * H_adj - wrapped_y;
		return target_y + r;
	}

	update(dt: number): void {
		this._view_timer += dt;
		if (this._view_timer >= 1.0) {
			this._target_y = this._predict_intercept_y()
			this._view_timer = 0.0
		}
		if (Math.abs(this.rect.centerx - this._target_y) < 5) {
			return;
		}
		const dx = this.rect.centerx < this._target_y ? 1 : -1;
		this.move(dt, dx)
	}
}