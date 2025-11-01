import { authManager } from '../core/AuthManager.js';
import { GameMode } from '../shared/constants.js';
import { PlayerInfo } from '../shared/types.js';
import { EL } from '../ui/elements.js';
import { ViewMode } from '../utils/constants.js';
import { GameSetting } from '../utils/types.js';

// Complete configuration for starting a game
export interface GameConfig {
	canvasId: string;
	viewMode: ViewMode;
	scene3D: string;
	gameMode: GameMode;
	isLocalMultiplayer: boolean;
	isRemoteMultiplayer: boolean;
	isTournament: boolean;
	musicEnabled: boolean;
	soundEffectsEnabled: boolean;
	players: PlayerInfo[];
}

// Class for creating a complete game configuration
export class GameInitializer {
	private static playerNames: string[] = [];

	static createConfig(
		settings: GameSetting,
		players: PlayerInfo[]
	): GameConfig {
		const gameMode = settings.gameMode!;
		const viewMode = settings.viewMode;
		const scene3D = settings.scene3D;
		const musicEnabled = settings.musicEnabled;
		const soundEffectsEnabled = settings.soundEffectsEnabled;
		const isLocalMultiplayer = (gameMode === GameMode.TWO_PLAYER_LOCAL || gameMode === GameMode.TOURNAMENT_LOCAL);
		const isTournament = (gameMode === GameMode.TOURNAMENT_REMOTE || gameMode === GameMode.TOURNAMENT_LOCAL);
		const isRemoteMultiplayer = (gameMode === GameMode.TOURNAMENT_REMOTE || gameMode === GameMode.TWO_PLAYER_REMOTE);
		return {
			canvasId: EL.GAME.CANVAS_3D,
			viewMode,
			scene3D,
			gameMode,
			isLocalMultiplayer,
			isRemoteMultiplayer,
			isTournament,
			musicEnabled,
			soundEffectsEnabled,
			players
		};
	}

	// Set player names for the current game session
	static setPlayers(playerNames: string[]): void {
		this.playerNames = playerNames;
	}

	// Convert stored player names to PlayerInfo objects
	static getPlayers(): PlayerInfo[] {
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

	static createWithAuthCheck(settings: GameSetting): GameConfig {
		const players = authManager.isUserAuthenticated()
			? this.getAuthenticatedPlayer()
			: this.getPlayers();

		return this.createConfig(settings, players);
	}
}