import { uiManager } from '../ui/UIManager.js';
import { gameController2D, gameController3D } from '../engine/GameController.js';
import { GameState, ViewMode } from '../shared/constants.js';
import { authManager } from './AuthManager.js';
import { historyManager } from './HistoryManager.js';

/**
 * Manages the state of the game, including transitions between states
 * and lifecycle actions such as pausing, resuming, and exiting the game.
 */
class GameStateManager {
    private currentState: GameState | null = null;
    private currentViewMode: ViewMode | null = null;

    // ===== STATE GETTERS =====

    /**
     * Retrieves the current state of the game.
     * @returns {GameState} The current game state.
     */
    getCurrentState(): GameState | null {
        return this.currentState;
    }

    getCurrentViewMode(): ViewMode | null {
        return this.currentViewMode;
    }

    isInGameOrPaused(): boolean {
        return this.currentState !== null;
    }

    // ===== STATE CHECKS =====

    isInGame(): boolean {
        return this.currentState === GameState.PLAYING;
    }

    isPaused(): boolean {
        return this.currentState === GameState.PAUSED;
    }

    // ===== LIFECYCLE ACTIONS =====

    startGame(viewMode: ViewMode): void {
        this.currentState = GameState.PLAYING;
        this.currentViewMode = viewMode;
    }

    pauseCurrentGame(): void {
        if (this.currentState !== GameState.PLAYING) return;

        this.currentState = GameState.PAUSED;
        
        if (this.currentViewMode === ViewMode.MODE_2D){
            uiManager.showPauseDialog('pause-dialog-2d');
            gameController2D.pause();
        } else if (this.currentViewMode === ViewMode.MODE_3D) {
            uiManager.showPauseDialog('pause-dialog-3d');
            gameController3D.pause();
        }
    }

    /**
     * Resumes the game from a paused state and updates the state accordingly.
     */
    resumeGame(): void {
        if (this.currentState !== GameState.PAUSED) return;

        this.currentState = GameState.PLAYING;
        
        if (this.currentViewMode === ViewMode.MODE_2D) {
            uiManager.hidePauseDialog('pause-dialog-2d');
            gameController2D.resume();
        } else if (this.currentViewMode === ViewMode.MODE_3D) {
            uiManager.hidePauseDialog('pause-dialog-3d');
            gameController3D.resume();
        }
    }

    /**
     * Exits the current game and transitions back to the main menu.
     */
    exitToMenu(): void {
        if (!this.isInGameOrPaused()) return;

        // Clean up game resources
        if (this.currentViewMode === ViewMode.MODE_2D) {
            gameController2D.dispose();
            uiManager.hidePauseDialog('pause-dialog-2d');
        } else if (this.currentViewMode === ViewMode.MODE_3D) {
            gameController3D.dispose();
            uiManager.hidePauseDialog('pause-dialog-3d');
        }

        // Reset game state
        this.currentState = null;
        this.currentViewMode = null;

        // Navigate back to menu (HistoryManager handles this)
        authManager.checkAuthState();
        historyManager.goToMainMenu();
    }
}

export const gameStateManager = new GameStateManager();