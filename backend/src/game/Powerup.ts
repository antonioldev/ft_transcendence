import { Ball } from './Ball.js';
import { Paddle} from './Paddle.js';
import { LEFT, RIGHT, GAME_CONFIG } from '../shared/gameConfig.js';
import { PowerupType, PowerupState} from '../shared/constants.js';
import { Powerup } from '../shared/types.js';
import { rotate } from './utils.js';

export class Slot {
	type: PowerupType;
	index: number;
	side: number;
	state: PowerupState = PowerupState.UNUSED;

	constructor(type: PowerupType, side: number, index: number) {
		this.type = type;
		this.side = side;
		this.index = index;
	}
}

export class PowerupManager {
	left_slots: Slot[] = [];
	right_slots: Slot[] = [];
	slots = [this.left_slots, this.right_slots];
	paddles: Paddle[];
	balls: Ball[];

	constructor(paddles: Paddle[], balls: Ball[]) {
		this.paddles = paddles;
		this.balls = balls;
		this._init_powerups();
	}

	_init_powerups() {
		// generates 3 random powerups in each player's slots
		const num_powerups = Object.keys(PowerupType).length / 2;
		for (let i = 0; i < GAME_CONFIG.slot_count; i++) {
			this.left_slots[i] = new Slot(Math.floor(Math.random() * num_powerups), LEFT, i);
			this.right_slots[i] = new Slot(Math.floor(Math.random() * num_powerups), RIGHT, i);
			// this.left_slots[i] = new Slot(PowerupType.POWERSHOT, LEFT, i
			// this.right_slots[i] = new Slot(PowerupType.POWERSHOT, RIGHT, i);
		}
	}

	get_state(side: number): Powerup[] {
		let state: Powerup[] = [];
		for (let i = 0; i < GAME_CONFIG.slot_count; i++) {
			state.push({
				type: this.slots[side][i].type,
				state: this.slots[side][i].state,
			})
		}
		return (state);
	}

	activate(slot: Slot) {
		if (slot.state === (PowerupState.ACTIVE || PowerupState.SPENT)) return ;
		
		const opponent_side: number = slot.side === LEFT ? RIGHT : LEFT;
		let timeout: number = GAME_CONFIG.powerupDuration;

		switch (slot.type) {
			case PowerupType.SLOW_OPPONENT:
				timeout = this.slow_down(opponent_side);
				break ;
			case PowerupType.SHRINK_OPPONENT:
				timeout = this.shrink(opponent_side);
				break ;
			case PowerupType.INVERT_OPPONENT:
				timeout = this.invert(opponent_side, true);
				break ;				
			case PowerupType.INCREASE_PADDLE_SPEED:
				timeout = this.speed_up(slot.side);
				break ;
			case PowerupType.GROW_PADDLE:
				timeout = this.grow(slot.side);
				break ;
			case PowerupType.FREEZE:
				timeout = this.set_freeze(true);
				break ;
			case PowerupType.POWERSHOT:
				timeout = this.powershot(slot.side);
				break ;
			case PowerupType.INVISIBLE_BALL:
				timeout = GAME_CONFIG.invisibilityTimeLimit; // implementation handled on front
				break ;
			case PowerupType.RESET_RALLY:
				timeout = this.reset_rally();
				break ;
			case PowerupType.DOUBLE_POINTS:
				timeout = this.set_double_points(true);
				break ;
			case PowerupType.TRIPLE_SHOT:
				timeout = this.triple_shot();
				break ;
			default:
				console.error(`Error: cannot activate unknown Powerup "${slot.type}`);
				return ;
		}
		slot.state = PowerupState.ACTIVE;
		setTimeout(() => this.deactivate(slot), timeout);
	}

	deactivate(slot: Slot) {
		if (slot.state === PowerupState.SPENT) return ;
		const opponent_side: number = slot.side === LEFT ? RIGHT : LEFT;

		switch (slot.type) {
			case PowerupType.SLOW_OPPONENT:
				this.paddles[opponent_side].speed = GAME_CONFIG.paddleSpeed;
				break ;
			case PowerupType.SHRINK_OPPONENT:
				this.paddles[opponent_side].rect.width = GAME_CONFIG.paddleWidth;
				break ;	
			case PowerupType.INVERT_OPPONENT:
				this.invert(opponent_side, false);
				break ;			
			case PowerupType.INCREASE_PADDLE_SPEED:
				this.paddles[slot.side].speed = GAME_CONFIG.paddleSpeed;
				break ;
			case PowerupType.GROW_PADDLE:
				this.paddles[slot.side].rect.width = GAME_CONFIG.paddleWidth;
				break ;
			case PowerupType.FREEZE:
				this.set_freeze(false);
				break ;
			case PowerupType.POWERSHOT:
				this.paddles[slot.side].powershot_activated = false;
				break ;
			case PowerupType.INVISIBLE_BALL:
				// handled on front
				break ;
			case PowerupType.RESET_RALLY:
				// nothing to handle
				break ;
			case PowerupType.DOUBLE_POINTS:
				this.set_double_points(false);
				break ;
			case PowerupType.TRIPLE_SHOT:
				// nothing to handle
				break ;
			default:
				console.error(`Error: cannot deactivate unknown Powerup "${slot.type}`);
				return ;
		}
		slot.state = PowerupState.SPENT;
	}

	find_active_powerup(type: PowerupType, side: number) {
		for (const slot of this.slots[side]) {
			if (slot.type === type && slot.state === PowerupState.ACTIVE) {
				return (slot);
			}
		}
		return (null);
	}

	// POWERUPS 
	slow_down(opponent_side: number): number {
		const opponent = this.paddles[opponent_side];
		
		if (opponent.speed === GAME_CONFIG.paddleSpeed) {
			opponent.speed = GAME_CONFIG.decreasedPaddleSpeed;
		}
		else if (opponent.speed === GAME_CONFIG.increasedPaddleSpeed) {
			const opponent_slot = this.find_active_powerup(PowerupType.INCREASE_PADDLE_SPEED, opponent_side);
			if (opponent_slot) {
				this.deactivate(opponent_slot);
			}
			return (0);
		}
		return (GAME_CONFIG.powerupDuration);
	}

	speed_up(side: number): number {
		const caller = this.paddles[side];
		const opponent_side = side === LEFT ? RIGHT : LEFT;
		
		if (caller.speed === GAME_CONFIG.paddleSpeed) {
			caller.speed = GAME_CONFIG.increasedPaddleSpeed;
		}
		else if (caller.speed === GAME_CONFIG.decreasedPaddleSpeed) { 
			const opponent_slot = this.find_active_powerup(PowerupType.SLOW_OPPONENT, opponent_side);
			if (opponent_slot) {
				this.deactivate(opponent_slot);
			}
			return (0);

		}
		return (GAME_CONFIG.powerupDuration);
	}

	grow(side: number): number {
		const caller = this.paddles[side];
		const opponent_side = side === LEFT ? RIGHT : LEFT;
		
		if (caller.rect.width === GAME_CONFIG.paddleWidth) {
			caller.rect.width = GAME_CONFIG.increasedPaddleWidth;
		}
		else if (caller.rect.width === GAME_CONFIG.decreasedPaddleWidth) {
			const opponent_slot = this.find_active_powerup(PowerupType.SHRINK_OPPONENT, opponent_side);
			if (opponent_slot) {
				this.deactivate(opponent_slot);
			}
			return (0);
		}
		return (GAME_CONFIG.powerupDuration);
	}

	shrink(opponent_side: number): number {
		const opponent = this.paddles[opponent_side];
		
		if (opponent.rect.width === GAME_CONFIG.paddleWidth) {
			opponent.rect.width = GAME_CONFIG.decreasedPaddleWidth;
		}
		else if (opponent.rect.width === GAME_CONFIG.increasedPaddleWidth) {
			const opponent_slot = this.find_active_powerup(PowerupType.GROW_PADDLE, opponent_side);
			if (opponent_slot) {
				this.deactivate(opponent_slot);
			}
			return (0);
		}
		return (GAME_CONFIG.powerupDuration);
	}

	invert(side: number, value: boolean): number {
		this.paddles[side].is_inverted = value;
		return (GAME_CONFIG.powerupDuration);
	}

	set_freeze(active: boolean): number {
		for (const ball of this.balls) {
			ball.isFrozen = active;
		}
		return (GAME_CONFIG.freezeDuration);
	}

	triple_shot(): number {
		if (this.balls.length === 3) return (0);

		const first_ball = this.balls[0].duplicate();
		rotate(first_ball.direction, Math.PI / 6);

		if (this.balls.length === 2) {
			this.balls.push( first_ball )
		}
		else if (this.balls.length === 1) {
			const second_ball = this.balls[0].duplicate();
			rotate(second_ball.direction, -(Math.PI / 6));
			this.balls.push( second_ball )
		}
		return (0);
	}

	powershot(side: number): number {
		this.paddles[side].powershot_activated = true;
		return (GAME_CONFIG.powershotTimeLimit); // fix timer for this
	}

	reset_rally() {
		this.balls[0].rally.current = 1;
		return (0);
	}

	set_double_points(active: boolean) {
		for (const ball of this.balls) {
			ball.double_points_active = active;
		}
		return (GAME_CONFIG.powerupDuration);
	}
}
