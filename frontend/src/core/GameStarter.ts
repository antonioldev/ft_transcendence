import { GameMode, ViewMode, GameState } from '../shared/constants.js';
import { uiManager } from '../ui/UIManager.js';
import { gameStateManager } from './GameStateManager.js';
import { init2D, init3D } from '../engine/GameController.js';
import { historyManager } from './HistoryManager.js';

export function startGameWithMode(viewMode: ViewMode, gameMode: GameMode): void {
    uiManager.hideUserInfo();
    
    if (viewMode === ViewMode.MODE_2D) {
        historyManager.goToGame2D();  // ← Use history manager
        gameStateManager.setState(GameState.PLAYING_2D);
        setTimeout(() => init2D(gameMode), 100);
    } else {
        historyManager.goToGame3D();  // ← Use history manager
        gameStateManager.setState(GameState.PLAYING_3D);
        setTimeout(() => init3D(gameMode), 100);
    }
}
