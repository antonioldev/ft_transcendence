import { Ball } from './Ball.js';
import { Paddle} from './Paddle.js';
import { LEFT_PADDLE, RIGHT_PADDLE, GAME_CONFIG } from '../shared/gameConfig.js';
import { PowerupType, MessageType} from '../shared/constants.js';
import { Client } from '../models/Client.js'
import { ServerMessage } from '../shared/types.js';

export class Slot {
	type: PowerupType;
	index: number;
	side: number;
	is_active: boolean = false; // true when powerup is currently in use
	is_spent: boolean = false;	// true when a powerup has been used up

	constructor(type: PowerupType, side: number, index: number) {
		this.type = type;
		this.side = side;
		this.index = index;
	}
}

export class PowerupManager {
	left_slots: Slot[] = [];
	right_slots: Slot[] = [];
	players = [this.left_slots, this.right_slots];
	paddles: Paddle[];
	ball: Ball;
	private _broadcast: (message: ServerMessage, clients?: Client[]) => void;

	constructor(paddles: Paddle[], ball: Ball, broadcast_callback: (message: ServerMessage, clients?: Client[]) => void) {
		this.paddles = paddles;
		this.ball = ball;
		this._broadcast = broadcast_callback;
		this.init_powerups();
	}

	init_powerups() {
		// generates 3 random powerups in each player's slots
		const num_powerups = Object.keys(PowerupType).length / 2;
		for (let i = 0; i < GAME_CONFIG.slot_count; i++) {
			this.left_slots[i] = new Slot(Math.floor(Math.random() * num_powerups), LEFT_PADDLE, i);
			this.right_slots[i] = new Slot(Math.floor(Math.random() * num_powerups), RIGHT_PADDLE, i);
		}
	}

	activate(slot: Slot) {
		if (slot.is_active || slot.is_spent) return ;
		
		const opponent_side: number = slot.side === LEFT_PADDLE ? RIGHT_PADDLE : LEFT_PADDLE;
		let timeout: number  = GAME_CONFIG.powerupDuration;

		switch (slot.type) {
			case PowerupType.SLOW_OPPONENT:
				timeout = this.slow_down(opponent_side);
				break ;
			case PowerupType.SHRINK_OPPONENT:
				timeout = this.shrink(opponent_side);
				break ;
			case PowerupType.INVERT_OPPONENT:
				this.paddles[opponent_side].is_inverted = true;
				break ;				
			case PowerupType.INCREASE_PADDLE_SPEED:
				timeout = this.speed_up(slot.side);
				break ;
			case PowerupType.GROW_PADDLE:
				timeout = this.grow(slot.side);
				break ;
			case PowerupType.FREEZE:
				timeout = this.ball.pause();
				break ;
			default:
				console.error(`Error: cannot activate unknown Powerup "${slot.type}`);
				return ;
		}

		this._broadcast({
			type: MessageType.POWERUP_ACTIVATED,
			powerup: slot.type,
			side: slot.side,
			slot: slot.index,
		})

		slot.is_active = true;
		setTimeout(() => this.deactivate(slot), timeout);
	}

	deactivate(slot: Slot) {
		if (slot.is_spent) return ;
		const opponent_side: number = slot.side === LEFT_PADDLE ? RIGHT_PADDLE : LEFT_PADDLE;

		switch (slot.type) {
			case PowerupType.SLOW_OPPONENT:
				this.paddles[opponent_side].speed = GAME_CONFIG.paddleSpeed;
				break ;
			case PowerupType.SHRINK_OPPONENT:
				this.paddles[opponent_side].rect.width = GAME_CONFIG.paddleWidth;
				break ;	
			case PowerupType.INVERT_OPPONENT:
				this.paddles[opponent_side].is_inverted = false;
				break ;			
			case PowerupType.INCREASE_PADDLE_SPEED:
				this.paddles[slot.side].speed = GAME_CONFIG.paddleSpeed;
				break ;
			case PowerupType.GROW_PADDLE:
				this.paddles[slot.side].rect.width = GAME_CONFIG.paddleWidth;
				break ;
			case PowerupType.FREEZE:
				// reset handled internally by ball
				break ;
			default:
				console.error(`Error: cannot deactivate unknown Powerup "${slot.type}`);
				return ;
		}
		
		this._broadcast({
			type: MessageType.POWERUP_DEACTIVATED,
			powerup: slot.type,
			side: slot.side,
			slot: slot.index,
		})

		slot.is_active = false;
		slot.is_spent = true;
	}

	find_active_powerup(type: PowerupType, side: number) {
		for (const slot of this.players[side]) {
			if (slot.type === type && slot.is_active) {
				return (slot);
			}
		}
		return (null);
	}

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
		const opponent_side = side === LEFT_PADDLE ? RIGHT_PADDLE : LEFT_PADDLE;
		
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
		const opponent_side = side === LEFT_PADDLE ? RIGHT_PADDLE : LEFT_PADDLE;
		
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
}
