import { ViewMode, GameMode } from '../shared/constants.js';
import { PlayerInfo } from '../shared/types.js';
import { EL } from '../ui/elements.js';
import { authManager } from '../core/AuthManager.js';

// Complete configuration for starting a game
export interface GameConfig {
	canvasId: string;
	viewMode: ViewMode;
	gameMode: GameMode;
	isLocalMultiplayer: boolean;
	isRemoteMultiplayer: boolean;
	isTournament: boolean;
	players: PlayerInfo[];
}

// Class for creating a complete game configuration
export class GameConfigFactory {
	private static playerNames: string[] = [];

	static createConfig(
		viewMode: ViewMode, 
		gameMode: GameMode, 
		players: PlayerInfo[]
	): GameConfig {
		const isLocalMultiplayer = (gameMode === GameMode.TWO_PLAYER_LOCAL || gameMode === GameMode.TOURNAMENT_LOCAL);
		const isTournament = (gameMode === GameMode.TOURNAMENT_REMOTE || gameMode === GameMode.TOURNAMENT_LOCAL);
		const isRemoteMultiplayer = (gameMode === GameMode.TOURNAMENT_REMOTE || gameMode === GameMode.TWO_PLAYER_REMOTE);
		return {
			canvasId: EL.GAME.CANVAS_3D,
			viewMode,
			gameMode,
			isLocalMultiplayer,
			isRemoteMultiplayer,
			isTournament,
			players
		};
	}

	// Set player names for the current game session
	static setPlayers(playerNames: string[]): void {
		this.playerNames = playerNames;
	}

	// Convert stored player names to PlayerInfo objects
	static getPlayers(gameMode: GameMode): PlayerInfo[] {
		return this.playerNames.map(name => ({
			id: name,
			name: name,
			isGuest: true
		}));
	}

	static getAuthenticatedPlayer(): PlayerInfo[] {
		const currentUser = authManager.getCurrentUser();
		if (!currentUser) throw new Error('No authenticated user');

		return [{
			id: currentUser.username,
			name: currentUser.username,
			isGuest: false
		}];
	}

	static createWithAuthCheck(viewMode: ViewMode, gameMode: GameMode): GameConfig {
		const players = authManager.isUserAuthenticated()
			? this.getAuthenticatedPlayer()
			: this.getPlayers(gameMode);

		return this.createConfig(viewMode, gameMode, players);
	}

	static validatePlayerSetup(gameMode: GameMode): boolean {
		if (authManager.isUserAuthenticated())
			return true;

		// For offline modes, check we have the minimum required players
		const minPlayers = this.getMinPlayersRequired(gameMode);
		return this.playerNames.length >= minPlayers && 
			   this.playerNames.every(name => name.trim().length > 0);
	}

	private static getMinPlayersRequired(gameMode: GameMode): number {
		switch (gameMode) {
			case GameMode.SINGLE_PLAYER: return 1;
			case GameMode.TWO_PLAYER_LOCAL: return 2;
			case GameMode.TOURNAMENT_LOCAL: return 2; // Minimum 2 players for tournament
			default: return 1;
		}
	}
}