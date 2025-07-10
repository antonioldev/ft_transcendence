import { uiManager } from '../ui/UIManager.js';
import { gameController2D, gameController3D } from '../engine/GameController.js';
import { GameState } from '../shared/constants.js';

/**
 * Manages the state of the game, including transitions between states
 * and lifecycle actions such as pausing, resuming, and exiting the game.
 */
class GameStateManager {
    private currentState: GameState = GameState.MENU;
    private previousState: GameState = GameState.MENU;

    // ===== STATE GETTERS =====

    /**
     * Retrieves the current state of the game.
     * @returns {GameState} The current game state.
     */
    getCurrentState(): GameState {
        return this.currentState;
    }

    /**
     * Retrieves the previous state of the game.
     * @returns {GameState} The previous game state.
     */
    getPreviousState(): GameState {
        return this.previousState;
    }

    /**
     * Updates the game state to a new state.
     * @param {GameState} newState - The new state to transition to.
     */
    setState(newState: GameState): void {
        this.previousState = this.currentState;
        this.currentState = newState;
    }

    // ===== STATE CHECKS =====

    /**
     * Checks if the game is currently in a playing state (2D or 3D).
     * @returns {boolean} True if the game is in a playing state, false otherwise.
     */
    isInGame(): boolean {
        return this.currentState === GameState.PLAYING_2D || 
               this.currentState === GameState.PLAYING_3D;
    }

    /**
     * Checks if the game is currently paused (2D or 3D).
     * @returns {boolean} True if the game is paused, false otherwise.
     */
    isPaused(): boolean {
        return this.currentState === GameState.PAUSED_2D || 
               this.currentState === GameState.PAUSED_3D;
    }

    /**
     * Checks if the game is currently in the menu state.
     * @returns {boolean} True if the game is in the menu state, false otherwise.
     */
    isInMenu(): boolean {
        return this.currentState === GameState.MENU;
    }

    // ===== LIFECYCLE ACTIONS =====

    /**
     * Pauses the current game and updates the state accordingly.
     */
    pauseCurrentGame(): void {
        if (this.currentState === GameState.PLAYING_2D) {
            this.setState(GameState.PAUSED_2D);
            uiManager.showPauseDialog('pause-dialog-2d');
            gameController2D.pause();
        } else if (this.currentState === GameState.PLAYING_3D) {
            this.setState(GameState.PAUSED_3D);
            uiManager.showPauseDialog('pause-dialog-3d');
            gameController3D.pause();
        }
    }

    /**
     * Resumes the game from a paused state and updates the state accordingly.
     */
    resumeGame(): void {
        if (this.currentState === GameState.PAUSED_2D) {
            this.setState(GameState.PLAYING_2D);
            uiManager.hidePauseDialog('pause-dialog-2d');
            gameController2D.resume();
        } else if (this.currentState === GameState.PAUSED_3D) {
            this.setState(GameState.PLAYING_3D);
            uiManager.hidePauseDialog('pause-dialog-3d');
            gameController3D.resume();
        }
    }

    /**
     * Exits the current game and transitions back to the main menu.
     */
    exitToMenu(): void {
        if (this.currentState === GameState.PAUSED_2D) {
            gameController2D.dispose();
            uiManager.hidePauseDialog('pause-dialog-2d');
        } else if (this.currentState === GameState.PAUSED_3D) {
            gameController3D.dispose();
            uiManager.hidePauseDialog('pause-dialog-3d');
        }

        this.setState(GameState.MENU);
        uiManager.showScreen('main-menu');
    }

    /**
     * Starts a new 2D game and updates the state accordingly.
     */
    startGame2D(): void {
        this.setState(GameState.PLAYING_2D);
    }

    /**
     * Starts a new 3D game and updates the state accordingly.
     */
    startGame3D(): void {
        this.setState(GameState.PLAYING_3D);
    }
}

export const gameStateManager = new GameStateManager();