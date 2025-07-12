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

    // ========================================
    // STATE GETTERS
    // ========================================
    /**
     * Retrieves the current state of the game.
     * @returns The current game state or null if no game is active.
     */
    getCurrentState(): GameState | null {
        return this.currentState;
    }

    /**
     * Gets the current view mode (2D or 3D).
     * @returns The current view mode or null if no game is active.
     */
    getCurrentViewMode(): ViewMode | null {
        return this.currentViewMode;
    }

    // ========================================
    // STATE CHECKS
    // ========================================
    /**
     * Checks if a game is currently active (playing or paused).
     * @returns True if game is active, false otherwise.
     */
    isInGameOrPaused(): boolean {
        return this.currentState !== null;
    }

    /**
     * Checks if the game is currently in playing state.
     * @returns True if game is playing, false otherwise.
     */
    isInGame(): boolean {
        return this.currentState === GameState.PLAYING;
    }

    /**
     * Checks if the game is currently paused.
     * @returns True if game is paused, false otherwise.
     */
    isPaused(): boolean {
        return this.currentState === GameState.PAUSED;
    }

    // ========================================
    // GAME LIFECYCLE
    // ========================================
    /**
     * Starts a new game in the specified view mode.
     * @param viewMode - The view mode to start the game in (2D or 3D).
     */
    startGame(viewMode: ViewMode): void {
        this.currentState = GameState.PLAYING;
        this.currentViewMode = viewMode;
    }

    /**
     * Pauses the current game and shows the pause dialog.
     */
    pauseCurrentGame(): void {
        if (this.currentState !== GameState.PLAYING) return;

        this.currentState = GameState.PAUSED;
        
        if (this.currentViewMode === ViewMode.MODE_2D){
            uiManager.showPauseOverlays('pause-dialog-2d');
            gameController2D.pause();
        } else if (this.currentViewMode === ViewMode.MODE_3D) {
            uiManager.showPauseOverlays('pause-dialog-3d');
            gameController3D.pause();
        }
    }

    /**
     * Resumes the game from a paused state and hides the pause dialog.
     */
    resumeGame(): void {
        if (this.currentState !== GameState.PAUSED) return;

        this.currentState = GameState.PLAYING;
        
        if (this.currentViewMode === ViewMode.MODE_2D) {
            uiManager.hidePauseOverlays('pause-dialog-2d');
            gameController2D.resume();
        } else if (this.currentViewMode === ViewMode.MODE_3D) {
            uiManager.hidePauseOverlays('pause-dialog-3d');
            gameController3D.resume();
        }
    }

    /**
     * Exits the current game, cleans up resources, and returns to main menu.
     */
    exitToMenu(): void {
        // if (!this.isInGameOrPaused()) return;
console.log('🎮 Disposing game QQQ');
        // Clean up game resources based on current view mode
        if (this.currentViewMode === ViewMode.MODE_2D) {
            gameController2D.dispose();console.log('🎮 Disposing game 2DDDD');
            uiManager.hidePauseOverlays('pause-dialog-2d');
        } else if (this.currentViewMode === ViewMode.MODE_3D) {
            gameController3D.dispose();console.log('🎮 Disposing game 3DDDD');
            uiManager.hidePauseOverlays('pause-dialog-3d');
        }

        // Reset game state to inactive
        this.currentState = null;
        this.currentViewMode = null;

        // Return to main menu and restore auth state
        authManager.checkAuthState();
        historyManager.goToMainMenu();
    }
}

export const gameStateManager = new GameStateManager();