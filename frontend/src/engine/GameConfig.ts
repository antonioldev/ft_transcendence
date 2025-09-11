import { ViewMode, GameMode } from '../shared/constants.js';
import { PlayerInfo, InputConfig } from '../shared/types.js';
import { GAME_CONFIG } from '../shared/gameConfig.js';
import { EL } from '../ui/elements.js';
import { authManager } from '../core/AuthManager.js';

// Complete configuration for starting a game
export interface GameConfig {
	canvasId: string;
	viewMode: ViewMode;
	gameMode: GameMode;
	isLocalMultiplayer: boolean;
	isTournament:boolean;
	players: PlayerInfo[];
	controls: InputConfig;
}

// Class for creating a complete game configuration
export class GameConfigFactory {
	static createConfig(
		viewMode: ViewMode, 
		gameMode: GameMode, 
		players: PlayerInfo[]
	): GameConfig {
		const isLocalMultiplayer = ( gameMode === GameMode.TWO_PLAYER_LOCAL ||  gameMode === GameMode.TOURNAMENT_LOCAL );
		const isTournament = ( gameMode === GameMode.TOURNAMENT_REMOTE ||  gameMode === GameMode.TOURNAMENT_LOCAL );
		return {
			canvasId: EL.GAME.CANVAS_3D,
			viewMode,
			gameMode,
			isLocalMultiplayer,
			isTournament,
			players,
			controls: viewMode === ViewMode.MODE_2D ? GAME_CONFIG.input2D : GAME_CONFIG.input3D
		};
	}

	// Extracts player information from UI based on game mode
	static getPlayersFromUI(gameMode: GameMode): PlayerInfo[] {
		const getInputValue = (id: string): string => {
			const input = document.getElementById(id) as HTMLInputElement;
			return input?.value.trim() || "";
		};

		switch (gameMode) {
			case GameMode.SINGLE_PLAYER: {
				const name = getInputValue(EL.PLAYER_SETUP.PLAYER1_NAME);
				return [{ id: name, name: name, isGuest: true }];
			}
			
			case GameMode.TWO_PLAYER_LOCAL: {
				const name1 = getInputValue(EL.PLAYER_SETUP.PLAYER1_NAME_LOCAL);
				const name2 = getInputValue(EL.PLAYER_SETUP.PLAYER2_NAME_LOCAL);
				return [
					{ id: name1, name: name1, isGuest: true },
					{ id: name2, name: name2, isGuest: true }
				];
			}

			case GameMode.TOURNAMENT_LOCAL: {
				const name1 = getInputValue(EL.PLAYER_SETUP.PLAYER1_NAME_TOURNAMENT);
				const name2 = getInputValue(EL.PLAYER_SETUP.PLAYER2_NAME_TOURNAMENT);
				const name3 = getInputValue(EL.PLAYER_SETUP.PLAYER3_NAME_TOURNAMENT);
				const name4 = getInputValue(EL.PLAYER_SETUP.PLAYER4_NAME_TOURNAMENT);
				return [
					{ id: name1, name: name1, isGuest: true },
					{ id: name2, name: name2, isGuest: true },
					{ id: name3, name: name3, isGuest: true },
					{ id: name4, name: name4, isGuest: true }
				];
			}

			default: {
				return [{ id: 'Player 1', name: 'Player 1', isGuest: true }];
			}
		}
	}

	static validatePlayerSetup(gameMode: GameMode): boolean {
		try {
			const players = this.getPlayersFromUI(gameMode);

			// Check that we have the right number of players with valid names
			if (!players[0]?.name.trim()) return false;

			if (gameMode === GameMode.TWO_PLAYER_LOCAL && !players[1]?.name.trim()) return false;

			if (gameMode === GameMode.TOURNAMENT_LOCAL) {
				if (players.length < 4) return false;
				return players.every(player => player.name.trim());
			}
			return true;
		} catch {
			return false;
		}
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
			: this.getPlayersFromUI(gameMode);

		return this.createConfig(viewMode, gameMode, players);
	}

}