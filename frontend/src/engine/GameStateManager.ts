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

	isPausedLocal(): boolean {
		return this.currentState === GameState.PAUSED_LOCAL;
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

	// Add a method to check if game can be paused (during countdown, winner screens, etc.)
	canShowPauseMenu(): boolean {
		return this.currentState === GameState.PLAYING || 
			this.currentState === GameState.PAUSED ||
			this.currentState === GameState.MATCH_ENDED ||
			this.currentState === GameState.PAUSED_LOCAL;
	}

	// State setters
	set(newState: GameState): void {
		this.currentState = newState;
	}
}