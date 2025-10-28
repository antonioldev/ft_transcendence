import { Direction } from '../../shared/constants.js';
import { PlayerSide } from '../utils.js';


export enum GameEventType {
	// Game State Events
	PAUSE_TOGGLE = 'pause_toggle',
	RESUME_REQUEST = 'resume_request',
	EXIT_TO_MENU = 'exit_to_menu',
	
	// Spectator Events
	SPECTATOR_CHOICE = 'spectator_choice',
	SWITCH_GAME = 'switch_game',
	TOGGLE_MATCH_TREE = 'toggle_match_tree',
	
	// Gameplay Events
	POWERUP_REQUEST = 'powerup_request',
}

// ==================== EVENT TYPES ====================

export type GameEvent = 
	// Game State Events
	| { type: GameEventType.PAUSE_TOGGLE }
	| { type: GameEventType.RESUME_REQUEST }
	| { type: GameEventType.EXIT_TO_MENU }
	
	// Spectator Events
	| { type: GameEventType.SPECTATOR_CHOICE; choice: boolean }
	| { type: GameEventType.SWITCH_GAME; direction: Direction }
	| { type: GameEventType.TOGGLE_MATCH_TREE }
	
	// Gameplay Events
	| { type: GameEventType.POWERUP_REQUEST; side: PlayerSide; slot: number };

type EventHandler = (event: GameEvent) => void;

// ==================== EVENT EMITTER ====================

export class GameEventEmitter {
	private listeners: Map<GameEventType, EventHandler[]> = new Map();

	emit(event: GameEvent): void {
		const handlers = this.listeners.get(event.type);
		if (handlers) {
			handlers.forEach(handler => {
				try {
					handler(event);
				} catch (error) {
					console.error(`Error in event handler for ${event.type}:`, error);
				}
			});
		}
	}

	on(eventType: GameEventType, handler: EventHandler): void {
		if (!this.listeners.has(eventType)) {
			this.listeners.set(eventType, []);
		}
		this.listeners.get(eventType)!.push(handler);
	}

	off(eventType: GameEventType, handler: EventHandler): void {
		const handlers = this.listeners.get(eventType);
		if (handlers) {
			const index = handlers.indexOf(handler);
			if (index > -1) {
				handlers.splice(index, 1);
			}
		}
	}

	removeAllListeners(eventType?: GameEventType): void {
		if (eventType) {
			this.listeners.delete(eventType);
		} else {
			this.listeners.clear();
		}
	}

	hasListeners(eventType: GameEventType): boolean {
		const handlers = this.listeners.get(eventType);
		return handlers !== undefined && handlers.length > 0;
	}

	listenerCount(eventType: GameEventType): number {
		const handlers = this.listeners.get(eventType);
		return handlers ? handlers.length : 0;
	}

	dispose(): void {
		this.listeners.clear();
	}
}