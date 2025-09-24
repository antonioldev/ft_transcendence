import { ClientState } from '../shared/constants.js';

export class GameStateManager {
	private currentState: ClientState = ClientState.CONNECTING;

	constructor() {
		// this.players = resetPlayersState();
	}

	isPlaying(): boolean {
		return this.currentState === ClientState.PLAYING;
	}

	isPaused(): boolean {
		return this.currentState === ClientState.PAUSED;
	}

	isPausedLocal(): boolean {
		return this.currentState === ClientState.PAUSED_LOCAL;
	}

	isMatchEnded(): boolean {
		return this.currentState === ClientState.MATCH_ENDED;
	}
	
	isExiting(): boolean {
		return this.currentState === ClientState.EXITING;
	}

	isInGame(): boolean {
		return this.currentState === ClientState.PLAYING || this.currentState === ClientState.MATCH_ENDED;
	}

	isSpectator(): boolean {
		return this.currentState === ClientState.SPECTATOR;
	}

	isSpectatorPaused(): boolean {
		return this.currentState === ClientState.SPECTATOR_PAUSED;
	}

	// Add a method to check if game can be paused (during countdown, winner screens, etc.)
	canShowPauseMenu(): boolean {
		return this.currentState === ClientState.PLAYING || 
			this.currentState === ClientState.PAUSED ||
			this.currentState === ClientState.MATCH_ENDED ||
			this.currentState === ClientState.PAUSED_LOCAL ||
			this.currentState === ClientState.SPECTATOR ||
			this.currentState === ClientState.SPECTATOR_PAUSED;
	}

	// State setters
	set(newState: ClientState): void {
		this.currentState = newState;
	}
}