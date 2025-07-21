import { uiManager } from '../ui/UIManager.js';
import { GameState, ViewMode, AppState } from '../shared/constants.js';
import { authManager } from './AuthManager.js';
import { historyManager } from './HistoryManager.js';
import { Game } from '../engine/Game.js';
import { GameConfig } from '../engine/GameConfig.js';
import { webSocketClient } from './WebSocketClient.js';
import { EL, getElementById} from '../ui/elements.js';


/**
 * Manages the current game state, view mode, and transitions between game lifecycle phases.
 * This class does not directly implement game logic, but coordinates state and delegates
 * actions to other managers and controllers.
 */
class AppStateManager {
    private currentState: GameState | null = null;
    private currentViewMode: ViewMode | null = null;
    private isExiting: boolean = false;
    private currentGame: Game | null = null;
    private isStarting: boolean = false;

    // ========================================
    // GAME LIFECYCLE
    // ========================================
    
    async startGame(config: GameConfig): Promise<void> {
        if (this.isStarting) {
            console.warn('AppStateManager: Game start already in progress');
            return;
        }

        if (this.currentGame)
            await this.endGame();

        this.isStarting = true;

        try {
            console.log('AppStateManager: Starting new game');
            this.currentGame = new Game(config);
            await this.currentGame?.initialize();
            await this.currentGame.connect();
            this.currentGame?.start();
            console.log('AppStateManager: Game started successfully');
        } catch (error) {
            console.error('AppStateManager: Error starting game:', error);
            if (this.currentGame) {
                await this.currentGame.dispose();
                this.currentGame = null;
            }
            throw error;
        } finally {
            this.isStarting = false;
        }
    }

    async endGame(): Promise<void> {
        if (!this.currentGame) {
            return;
        }
    
        console.log('AppStateManager: Ending current game');
    
        try {
            this.currentGame.stop();
            await this.currentGame.dispose();
        } catch (error) {
            console.error('AppStateManager: Error ending game:', error);
        } finally {
            this.currentGame = null;
        }
    
        console.log('AppStateManager: Game ended successfully');
    }

    async exitToMenu(): Promise<void> {
        if (!this.isInGame() && !this.isPaused()) return;
        if (this.isExiting) return;

        this.isExiting = true;

        try {
            console.log('AppStateManager: Exiting to menu...');
            uiManager.setElementVisibility('pause-dialog-3d', false);
            webSocketClient.sendQuitGame();
            await this.endGame();
            this.resetToMenu();
            console.log('AppStateManager: Successfully exited to main menu');
        } catch (error) {
            console.error('AppStateManager: Error during game exit:', error);
            this.resetToMenu();
        }
    }

    resetToMenu(): void {
        this.currentState = null;
        this.currentViewMode = null;
        this.isExiting = false;
        authManager.checkAuthState();
        historyManager.navigateTo(AppState.MAIN_MENU);;
    }

    setGameState(viewMode: ViewMode): void {
        this.currentState = GameState.PLAYING;
        this.currentViewMode = viewMode;
        this.isExiting = false;
        console.log(`AppStateManager: Game started in ${ViewMode[viewMode]} mode`);
    }

    // ========================================
    // PAUSE/RESUME HANDLING
    // ========================================
    onServerConfirmedPause(): void {
        this.handleServerStateChange(GameState.PAUSED, true);
    }

    onServerConfirmedResume(): void {
        this.handleServerStateChange(GameState.PLAYING, false);
    }

    private handleServerStateChange(newState: GameState, showPauseOverlay: boolean): void {
        this.currentState = newState;
        uiManager.setElementVisibility(EL.GAME.PAUSE_DIALOG_3D, showPauseOverlay);
        console.log(`AppStateManager: Game ${newState === GameState.PAUSED ? 'paused' : 'resumed'} and UI updated`);
    }

    // ========================================
    // STATE CHECKS
    // ========================================
    isInGame(): boolean {
        return this.currentGame !== null && 
               this.currentState === GameState.PLAYING && 
               !this.isExiting;
    }
    
    isPaused(): boolean {
        return this.currentGame !== null && 
               this.currentState === GameState.PAUSED && 
               !this.isExiting;
    }

        getCurrentGame(): Game | null {
        return this.currentGame;
    }
}

export const appStateManager = new AppStateManager();