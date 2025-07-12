import { uiManager } from '../ui/UIManager.js';
import { gameController } from '../engine/GameController.js';
import { GameState, ViewMode } from '../shared/constants.js';
import { authManager } from './AuthManager.js';
import { historyManager } from './HistoryManager.js';


/**
 * Manages the current game state, view mode, and transitions between game lifecycle phases.
 * This class does not directly implement game logic, but coordinates state and delegates
 * actions to other managers and controllers.
 */
class AppStateManager {
    private currentState: GameState | null = null;
    private currentViewMode: ViewMode | null = null;
    private isExiting: boolean = false;

    // ========================================
    // STATE GETTERS
    // ========================================
    
    getCurrentState(): GameState | null {
        return this.currentState;
    }

    getCurrentViewMode(): ViewMode | null {
        return this.currentViewMode;
    }

    // ========================================
    // STATE CHECKS
    // ========================================
    
    isInGameOrPaused(): boolean {
        return this.currentState !== null && !this.isExiting;
    }

    isInGame(): boolean {
        return this.currentState === GameState.PLAYING && !this.isExiting;
    }

    isPaused(): boolean {
        return this.currentState === GameState.PAUSED && !this.isExiting;
    }

    // ========================================
    // GAME LIFECYCLE - SIMPLIFIED! 🎉
    // ========================================
    
    /**
     * Start a new game - just track state, GameController handles the rest
     */
    startGame(viewMode: ViewMode): void {
        this.currentState = GameState.PLAYING;
        this.currentViewMode = viewMode;
        this.isExiting = false;
        
        console.log(`AppStateManager: Game started in ${ViewMode[viewMode]} mode`);
    }

    /**
     * Pause current game - delegate to GameController
     */
    pauseCurrentGame(): void {
        if (this.currentState !== GameState.PLAYING || this.isExiting) return;

        this.currentState = GameState.PAUSED;
        
        // Show appropriate pause dialog
        if (this.currentViewMode === ViewMode.MODE_2D) {
            uiManager.showPauseOverlays('pause-dialog-2d');
        } else if (this.currentViewMode === ViewMode.MODE_3D) {
            uiManager.showPauseOverlays('pause-dialog-3d');
        }

        // Delegate to GameController
        gameController.pauseGame();
        
        console.log('AppStateManager: Game paused');
    }

    /**
     * Resume game - delegate to GameController
     */
    resumeGame(): void {
        if (this.currentState !== GameState.PAUSED || this.isExiting) return;

        this.currentState = GameState.PLAYING;
        
        // Hide pause dialogs
        if (this.currentViewMode === ViewMode.MODE_2D) {
            uiManager.hidePauseOverlays('pause-dialog-2d');
        } else if (this.currentViewMode === ViewMode.MODE_3D) {
            uiManager.hidePauseOverlays('pause-dialog-3d');
        }

        // Delegate to GameController
        gameController.resumeGame();
        
        console.log('AppStateManager: Game resumed');
    }

    /**
     * Exit to menu
     */
    async exitToMenu(): Promise<void> {
        if (!this.isInGameOrPaused() || this.isExiting) return;

        this.isExiting = true;

        try {
            console.log('AppStateManager: Exiting to menu...');

            // Hide pause dialogs immediately
            if (this.currentViewMode === ViewMode.MODE_2D) {
                uiManager.hidePauseOverlays('pause-dialog-2d');
            } else if (this.currentViewMode === ViewMode.MODE_3D) {
                uiManager.hidePauseOverlays('pause-dialog-3d');
            }

            // SINGLE CALL - GameController handles all cleanups
            await gameController.endGame();

            // Reset our state
            this.resetToMenu();
            
            console.log('AppStateManager: Successfully exited to main menu');

        } catch (error) {
            console.error('AppStateManager: Error during game exit:', error);
            
            // Reset state even if there's an error
            this.resetToMenu();
        }
    }

    /**
     * Reset to menu state
     */
    resetToMenu(): void {
        this.currentState = null;
        this.currentViewMode = null;
        this.isExiting = false;

        // Return to main menu and restore auth state
        authManager.checkAuthState();
        historyManager.goToMainMenu();
    }

    // ========================================
    // ERROR HANDLING
    // ========================================
    
    /**
     * Handle game errors by returning to menu
     */
    handleGameError(error: any): void {
        console.error('AppStateManager: Game error occurred:', error);
        
        // Force exit to menu
        this.isExiting = false; // Reset flag to allow exit
        this.exitToMenu();
    }

    // ========================================
    // UTILITY
    // ========================================
    
    /**
     * Get current game info for debugging
     */
    getGameInfo(): any {
        return {
            state: this.currentState ? GameState[this.currentState] : 'None',
            viewMode: this.currentViewMode ? ViewMode[this.currentViewMode] : 'None',
            isExiting: this.isExiting,
            hasActiveGame: gameController.hasActiveGame(),
            isGameRunning: gameController.isGameRunning(),
            isGamePaused: gameController.isGamePaused()
        };
    }
}

export const appStateManager = new AppStateManager();