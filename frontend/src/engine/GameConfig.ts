import { ViewMode, GameMode } from '../shared/constants.js';
import { PlayerInfo, InputConfig } from '../shared/types.js';
import { GAME_CONFIG } from '../shared/gameConfig.js';

/**
 * Complete configuration for starting a game
 */
export interface GameConfig {
    canvasId: string;
    viewMode: ViewMode;
    gameMode: GameMode;
    players: PlayerInfo[];
    controls: InputConfig;
}

/**
 * Factory for creating game configurations
 */
export class GameConfigFactory {
    /**
     * Creates a complete game configuration
     */
    static createConfig(
        viewMode: ViewMode, 
        gameMode: GameMode, 
        players: PlayerInfo[]
    ): GameConfig {
        return {
            canvasId: viewMode === ViewMode.MODE_2D ? 'game-canvas-2d' : 'game-canvas-3d',
            viewMode,
            gameMode,
            players,
            controls: viewMode === ViewMode.MODE_2D ? GAME_CONFIG.input2D : GAME_CONFIG.input3D
        };
    }

    /**
     * Extracts player information from UI based on game mode
     */
    static getPlayersFromUI(gameMode: GameMode): PlayerInfo[] {
        const getInputValue = (id: string, defaultName: string): string => {
            const input = document.getElementById(id) as HTMLInputElement;
            return input?.value.trim() || defaultName;
        };

        switch (gameMode) {
            case GameMode.SINGLE_PLAYER: {
                const name = getInputValue('player1-name', 'Player 1');
                return [{ id: name, name: name }];
            }
            
            case GameMode.TWO_PLAYER_LOCAL: {
                const name1 = getInputValue('player1-name-local', 'Player 1');
                const name2 = getInputValue('player2-name-local', 'Player 2');
                return [
                    { id: name1, name: name1 },
                    { id: name2, name: name2 }
                ];
            }

            case GameMode.TWO_PLAYER_REMOTE: {
                const name = getInputValue('player1-name-online', 'Player 1');
                return [{ id: name, name: name }];
            }

            case GameMode.TOURNAMENT_LOCAL: {
                const name1 = getInputValue('player1-name-local', 'Player 1');
                const name2 = getInputValue('player2-name-local', 'Player 2');
                return [
                    { id: name1, name: name1 },
                    { id: name2, name: name2 }
                ];
            }

            default: {
                console.warn('Unexpected game mode:', gameMode);
                return [{ id: 'Player 1', name: 'Player 1' }];
            }
        }
    }
}