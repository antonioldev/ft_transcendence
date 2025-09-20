import { GameState } from '../shared/constants.js';

export class GameStateManager {
	private currentState: GameState = GameState.CONNECTING;

	constructor() {
		// this.players = resetPlayersState();
	}

	isPlaying(): boolean {
		return this.currentState === GameState.PLAYING;
	}

	isPaused(): boolean {
		return this.currentState === GameState.PAUSED;
	}

	isMatchEnded(): boolean {
		return this.currentState === GameState.MATCH_ENDED;
	}
	
	isExiting(): boolean {
		return this.currentState === GameState.EXITING;
	}

	isInGame(): boolean {
		return this.currentState === GameState.PLAYING || this.currentState === GameState.MATCH_ENDED;
	}

	// State setters
	set(newState: GameState): void {
		this.currentState = newState;
	}
}