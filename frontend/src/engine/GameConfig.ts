import { ViewMode, GameMode } from '../shared/constants.js';
import { PlayerInfo, InputConfig } from '../shared/types.js';
import { GAME_CONFIG } from '../shared/gameConfig.js';
import { EL, requireElementById } from '../ui/elements.js';
import { authManager } from '../core/AuthManager.js';

// Complete configuration for starting a game
export interface GameConfig {
    canvasId: string;
    viewMode: ViewMode;
    gameMode: GameMode;
    players: PlayerInfo[];
    controls: InputConfig;
}

// Factory for creating game configurations
export class GameConfigFactory {
    // Creates a complete game configuration
    static createConfig(
        viewMode: ViewMode, 
        gameMode: GameMode, 
        players: PlayerInfo[]
    ): GameConfig {
        return {
            canvasId: EL.GAME.CANVAS_3D,
            viewMode,
            gameMode,
            players,
            controls: viewMode === ViewMode.MODE_2D ? GAME_CONFIG.input2D : GAME_CONFIG.input3D
        };
    }

    // Extracts player information from UI based on game mode
    static getPlayersFromUI(gameMode: GameMode): PlayerInfo[] {
        const getInputValue = (id: string, defaultName: string): string => {
            const input = document.getElementById(id) as HTMLInputElement;
            return input?.value.trim() || defaultName;
        };

        switch (gameMode) {
            case GameMode.SINGLE_PLAYER: {
                const name = getInputValue(EL.PLAYER_SETUP.PLAYER1_NAME, 'Player 1');
                return [{ id: name, name: name, isGuest: true }];
            }
            
            case GameMode.TWO_PLAYER_LOCAL: {
                const name1 = getInputValue(EL.PLAYER_SETUP.PLAYER1_NAME_LOCAL, 'Player 1');
                const name2 = getInputValue(EL.PLAYER_SETUP.PLAYER2_NAME_LOCAL, 'Player 2');
                return [
                    { id: name1, name: name1, isGuest: true },
                    { id: name2, name: name2, isGuest: true }
                ];
            }

            // case GameMode.TWO_PLAYER_REMOTE: {
            //     const name = getInputValue(EL.PLAYER_SETUP.PLAYER1_NAME_ONLINE, 'Player 1');
            //     return [{ id: name, name: name }];
            // } case GameMode.TOURNAMENT_REMOTE: 

            case GameMode.TOURNAMENT_LOCAL: {
                const name1 = getInputValue(EL.PLAYER_SETUP.PLAYER1_NAME_TOURNAMENT, 'Player 1');
                const name2 = getInputValue(EL.PLAYER_SETUP.PLAYER2_NAME_TOURNAMENT, 'Player 2');
                const name3 = getInputValue(EL.PLAYER_SETUP.PLAYER3_NAME_TOURNAMENT, 'Player 3');
                const name4 = getInputValue(EL.PLAYER_SETUP.PLAYER4_NAME_TOURNAMENT, 'Player 4');
                return [
                    { id: name1, name: name1, isGuest: true },
                    { id: name2, name: name2, isGuest: true },
                    { id: name3, name: name3, isGuest: true },
                    { id: name4, name: name4, isGuest: true }
                ];
            }

            default: {
                console.warn('Unexpected game mode:', gameMode);
                return [{ id: 'Player 1', name: 'Player 1', isGuest: true }];
            }
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
}