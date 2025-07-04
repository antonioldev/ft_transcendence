import { Rect } from './utils';

import { GAME_CONFIG, getBallStartPosition, getPlayerLeftPosition, 
         getPlayerRightPosition, LEFT_PADDLE, RIGHT_PADDLE } from './gameConfig.js';

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

	move(dt: number, dy: number): void {
		this.rect.cy += dy * this.speed * dt;
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
			this._target_y   = this._predict_intercept_y()
			this._view_timer = 0.0
		}
		if (Math.abs(this.rect.centery - this._target_y) < 5) {   // dead-zone, avoids shaking
			return ;
		}
		const dy = this.rect.centery < this._target_y ? 1: -1;
		this.move(dt, dy)
	}
}

export class Ball {
	rect: Rect;
	oldRect: Rect;
	direction: [number, number];
	speed = GAME_CONFIG.ballInitialSpeed;
	speedModifier = 0;
	players: (Player)[];
	startTime: number;
	updateScore: (scoringPlayer: number) => void;

	constructor(players: any[], updateScoreCallback: (side: number) => void) {
		const ballPos = getBallStartPosition();
		this.rect = new Rect(ballPos.x, ballPos.z, GAME_CONFIG.ballRadius * 2, GAME_CONFIG.ballRadius * 2);
		this.oldRect = this.rect.instance();
		this.players = players;
		this.updateScore = updateScoreCallback;
		this.startTime = performance.now();
		this.direction = this.randomDirection();
	}

	private randomDirection(): [number, number] {
		const x = Math.random() < 0.5 ? 1 : -1;
		const y = (Math.random() * 0.1 + 0.7) * (Math.random() < 0.5 ? -1 : 1);
		return [x, y];
	}

	move(dt: number): void {
		this.rect.cx += this.direction[0] * this.speed * dt * this.speedModifier;
		this.collision('horizontal');
		this.rect.cy += this.direction[1] * this.speed * dt * this.speedModifier;
		this.collision('vertical');
	}

	private collision(direction: 'horizontal' | 'vertical'): void {
		for (const paddle of this.players) {
			if (!this.rect.colliderect(paddle.rect)) continue;

			if (direction === 'horizontal') {
				if (this.rect.right >= paddle.rect.left && this.oldRect.right <= paddle.oldRect.left) {
					this.rect.right = paddle.rect.left;
					this.direction[0] *= -1;
			}
				else if (this.rect.left <= paddle.rect.right && this.oldRect.left >= paddle.oldRect.right) {
					this.rect.left = paddle.rect.right;
					this.direction[0] *= -1;
				}
			} 
			else {
				if (this.rect.bottom >= paddle.rect.top && this.oldRect.bottom <= paddle.oldRect.top) {
					this.rect.bottom = paddle.rect.top;
					this.direction[1] *= -1;
				} 	
				else if (this.rect.top <= paddle.rect.bottom && this.oldRect.top >= paddle.oldRect.bottom) {
					this.rect.top = paddle.rect.bottom;
					this.direction[1] *= -1;
				}
			}
		}
	}

	wallCollision(): void {
		if (this.rect.top <= GAME_CONFIG.wallBounds.minX) {
			this.rect.top = GAME_CONFIG.wallBounds.minX;
			this.direction[0] *= -1; // Note: using index 0 for X direction
		}
		if (this.rect.bottom >= GAME_CONFIG.wallBounds.maxX) {
			this.rect.bottom = GAME_CONFIG.wallBounds.maxX;
			this.direction[0] *= -1;
		}
		
		// Goal detection
		if (this.rect.right >= GAME_CONFIG.goalBounds.leftGoal || this.rect.left <= GAME_CONFIG.goalBounds.rightGoal) {
			const scorer = this.rect.cy < 0 ? RIGHT_PADDLE : LEFT_PADDLE;
			this.updateScore(scorer);
			this.reset();
		}
	}

	reset(): void {
		const ballPos = getBallStartPosition();
		this.rect.cx = ballPos.x;
		this.rect.cy = ballPos.z;
		this.direction = this.randomDirection();
		this.startTime = performance.now();
	}

	private delayTimer(): void {
		const elapsed = (performance.now() - this.startTime);
		this.speedModifier = elapsed >= GAME_CONFIG.startDelay ? 1 : 0;
	}

	update(dt: number): void {
		this.oldRect.copy(this.rect);
		this.delayTimer();
		this.move(dt);
		this.wallCollision();
	}
}