import { GameMode, ViewMode, GameState } from '../shared/constants.js';
import { uiManager } from '../ui/UIManager.js';
import { gameStateManager } from './GameStateManager.js';
import { init2D, init3D } from '../engine/GameController.js';

export function startGameWithMode(viewMode: ViewMode, gameMode: GameMode): void {

    uiManager.hideUserInfo();
    
    if (viewMode === ViewMode.MODE_2D) {
        uiManager.showScreen('game-2d');
        gameStateManager.setState(GameState.PLAYING_2D);
        setTimeout(() => init2D(gameMode), 100);
    } else {
        uiManager.showScreen('game-3d');
        gameStateManager.setState(GameState.PLAYING_3D);
        setTimeout(() => init3D(gameMode), 100);
    }
}