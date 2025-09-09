import { Rect } from './utils.js';
import { Ball } from './Ball.js'
import { GAME_CONFIG, getBallStartPosition, getPlayerLeftPosition, 
         getPlayerRightPosition, LEFT_PADDLE, RIGHT_PADDLE, getPlayerBoundaries } from '../shared/gameConfig.js';
import { Powerup } from '../shared/constants.js';

export class Paddle {
	side: number;
	score: number = 0;
	rect: Rect;
	oldRect: Rect;
	speed: number = GAME_CONFIG.paddleSpeed;
	powerups: (Powerup | null)[] = [];
	active_powerups: Powerup[] = [];

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
		this.assign_random_powerups();
	}

	move(dt: number, dx: number): void {
		const deltaSeconds = dt / 1000; 		// convert milliseconds to seconds
		const _deltaMove = this.speed * deltaSeconds * dx;
		if (this.rect.x + _deltaMove > getPlayerBoundaries().left &&
			this.rect.x + _deltaMove < getPlayerBoundaries().right)
			this.rect.x += _deltaMove;
	}

	cacheRect() {
		this.oldRect.copy(this.rect);
	}

	assign_random_powerups() {
		for (let i = 0; i < 3; i++) {
			this.powerups[i] = Powerup.GROW_PADDLE;
		}
		// const num_powerups = Object.keys(Powerup).length / 2;
		// for (let i = 0; i < 3; i++) {
		// 	this.powerups[i] = Math.floor(Math.random() * num_powerups);
		// }
	}
}

export class CPUBot extends Paddle {
	private _view_timer = 0;
	private _target_x   = getBallStartPosition().x;
	private _boundaries = getPlayerBoundaries();

	constructor(
		side: number,
		public ball: Ball,
		public noiseFactor: number = 1.5, // 0=impossible, 1.5=hard, 2=medium, 3=easy
		public speed: number = GAME_CONFIG.paddleSpeed,
		public direction: number = 0,
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