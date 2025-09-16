import { Rect } from './utils.js';
import { Ball } from './Ball.js'
import { GAME_CONFIG, getBallStartPosition, getPlayerLeftPosition, 
         getPlayerRightPosition, LEFT_PADDLE, RIGHT_PADDLE, getPlayerBoundaries } from '../shared/gameConfig.js';


export class Paddle {
	side: number;
	score: number = 0;
	rect: Rect;
	oldRect: Rect;
	speed: number = GAME_CONFIG.paddleSpeed;
	is_inverted: boolean = false;

	constructor(side: number) {
		this.side = side;

		const position = side === LEFT_PADDLE ? getPlayerLeftPosition() : getPlayerRightPosition();
		this.rect = new Rect(
			position.x,
			position.z,
			GAME_CONFIG.paddleWidth,
			GAME_CONFIG.paddleDepth
		);
		this.oldRect = this.rect.instance();
	}

	move(dt: number, dx: number): void {
		const deltaSeconds = dt / 1000; 		// convert milliseconds to seconds
		let _deltaMove = this.speed * deltaSeconds * dx;
		if (this.is_inverted) {
			_deltaMove *= -1;
		}
		if (this.rect.x + _deltaMove > getPlayerBoundaries(this.rect.width).left &&
			this.rect.x + _deltaMove < getPlayerBoundaries(this.rect.width).right) {
			this.rect.x += _deltaMove;
		}
	}

	cacheRect() {
		this.oldRect.copy(this.rect);
	}
}

export class CPUBot extends Paddle {
	private _view_timer = 0;
	private _target_x   = getBallStartPosition().x;
	private _boundaries = getPlayerBoundaries(GAME_CONFIG.paddleWidth);
	private _powerup = 0;
	private _waitScoreChange = false;
	private _snapBot = 0;
	private _snapOpp = 0;

	constructor(
		side: number,
		public ball: Ball,
		public noiseFactor: number = 1.5, // 0=impossible, 1.5=hard, 2=medium, 3=easy
		public speed: number = GAME_CONFIG.paddleSpeed,
		public direction: number = 0,
		private _trigger?: (side: number, slot: number) => void,
	) {
		super(side);
	}

	private _center_x(): number {
		return (this._boundaries.left + this._boundaries.right) / 2;
	}

	private _ballMovingTowards(): boolean {
		return this.side ? this.ball.direction[1] > 0 : this.ball.direction[1] < 0;
	}

	protected _predict_intercept_x(): number {
		const r   = GAME_CONFIG.ballRadius;

		// current ball state
		const x0  = this.ball.rect.centerx;
		const z0  = this.ball.rect.centerz;
		const vx  = this.ball.direction[0] * this.ball.speed;
		const vz  = this.ball.direction[1] * this.ball.speed;

		// where ball centre meets paddle front
		const zFront = this.side                    // side 1 = bottom paddle
			? this.rect.top    - r                  // paddle faces up-screen
			: this.rect.bottom + r;                 // paddle faces down-screen

		// time until impact
		const t = (zFront - z0) / vz;
		if (t < 0 || !isFinite(t)) return this._center_x();  // centre pad if ball moving away

		// side-wall reflections
		const minX = GAME_CONFIG.wallBounds.minX + r;
		const maxX = GAME_CONFIG.wallBounds.maxX - r;
		const W    = maxX - minX;

		// calculate next z intercept
		const travel   = x0 - minX + vx * t;
		const wrapped  = ((travel % (2 * W)) + 2 * W) % (2 * W);
		const target_x = wrapped < W ? wrapped : 2 * W - wrapped;
		return target_x + minX;
	}

	update(dt: number): void {
		// set bot difficulty using noise in intercept prediction
		
		// refresh once per second
		this._view_timer += dt;
		if (this._view_timer >= 1000.0) {
			if (this._ballMovingTowards()) {
				const rally = this.ball.current_rally;
				const opp = this.side ? 0 : 1;
				const botScore = this.score;
				const oppScore = (this.ball as any)?.paddles?.[opp]?.score ?? 0;
				console.log(`botScore + oppScore: ${botScore} + ${oppScore} !== ${this._snapBot} + ${this._snapOpp}`);

				if (this._waitScoreChange && (botScore + oppScore !== this._snapBot + this._snapOpp)) {
					this._waitScoreChange = false;
				}

				const zFront = this.side ? this.rect.top : this.rect.bottom;
				const dz = Math.abs(this.ball.rect.centerz - zFront);

				if (this._powerup < GAME_CONFIG.slot_count - 1 && !this._waitScoreChange && this.score < oppScore && dz <= GAME_CONFIG.paddleDepth * 15) {
					this._trigger?.(this.side, this._powerup);
					this._waitScoreChange = true;
					this._snapBot = botScore;
					this._snapOpp = oppScore;
					this._powerup++;
				}

				if (this._powerup === GAME_CONFIG.slot_count - 1 && dz <= GAME_CONFIG.paddleDepth * 15) {
					const decider = (botScore + rally > GAME_CONFIG.scoreToWin) || (oppScore + rally >= GAME_CONFIG.scoreToWin);
					if (decider) {
						console.log(`DECIDER!`);
						this._trigger?.(this.side, this._powerup);
						this._powerup++;
					}
				}
			}

			const noise = (Math.random() - 0.5) * GAME_CONFIG.paddleWidth * this.noiseFactor;
			this._target_x = this._ballMovingTowards()
				? this._predict_intercept_x() + noise
				: this._center_x();
			this._view_timer = 0.0;
		}

		if (Math.abs(this.rect.centerx - this._target_x) < 0.2) return;  // tighter dead-zone

		const dx = this.rect.centerx < this._target_x ? 1 : -1;
		this.move(dt, dx);
	}
}

// const zFront = this.side ? this.rect.top : this.rect.bottom;
// const dz = Math.abs(this.ball.rect.centerz - zFront);
// if (this.score < oppScore && dz <= GAME_CONFIG.paddleDepth * 3) {