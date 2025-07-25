import { uiManager } from '../ui/UIManager.js';
import { GameState, ViewMode, AppState, GameMode } from '../shared/constants.js';
import { authManager } from './AuthManager.js';
import { historyManager } from './HistoryManager.js';
import { Game } from '../engine/Game.js';
import { GameConfig } from '../engine/GameConfig.js';
import { webSocketClient } from './WebSocketClient.js';
import { EL } from '../ui/elements.js';
import { GameConfigFactory } from '../engine/GameConfig.js';
import { PlayerInfo } from '../shared/types.js';
import { Logger } from './LogManager.js'


/**
 * Manages the current game state, view mode, and transitions between game lifecycle phases.
 * This class does not directly implement game logic, but coordinates state and delegates
 * actions to other managers and controllers.
 */
class AppStateManager {
    private currentState: GameState | null = null;
    private isExiting: boolean = false;
    private currentGame: Game | null = null;
    private isStarting: boolean = false;

    // ========================================
    // GAME LIFECYCLE
    // ========================================
    
    async startGame(config: GameConfig): Promise<void> {
        if (this.isStarting) {
            Logger.warn('Game start already in progress', 'AppStateManager');
            return;
        }

        if (this.currentGame)
            await this.endGame();

        this.isStarting = true;

        try {
            Logger.info('Starting new game', 'AppStateManager');
            this.currentGame = new Game(config);
            await this.currentGame.connect();
            await this.currentGame?.initialize();
            this.currentGame?.start();
            Logger.info('Game started successfully', 'AppStateManager');
        } catch (error) {
            if (this.currentGame) {
                await this.currentGame.dispose();
                this.currentGame = null;
            }
            Logger.errorAndThrow('Error starting game', 'AppStateManager', error);
        } finally {
            this.isStarting = false;
        }
    }
    // async startGame(viewMode: ViewMode, gameMode: GameMode): Promise<void> {
    //     // Do everything in one method:
    //     uiManager.showAuthButtons();
    //     historyManager.navigateTo(AppState.GAME_3D, false);
    //     this.setGameState(viewMode);
        
    //     // Get players and create config
    //     let players: PlayerInfo[];
    //     if (authManager.isUserAuthenticated())
    //         players = GameConfigFactory.getAuthenticatedPlayer();
    //     else
    //         players = GameConfigFactory.getPlayersFromUI(gameMode);
        
    //     const config = GameConfigFactory.createConfig(viewMode, gameMode, players);
        
    //     // Start the actual game
    //     this.currentGame = new Game(config);
    //     await this.currentGame.connect();
    //     await this.currentGame.initialize();
    //     this.currentGame.start();
    // }

    async startGameWithMode(viewMode: ViewMode, gameMode: GameMode): Promise<void> {
        try {
            Logger.info(`Starting game: ${gameMode} in ${ViewMode[viewMode]} mode`, 'AppStateManager');
            await this.initializeGameSession(viewMode, gameMode);         
            Logger.info('Game started successfully', 'AppStateManager');
        } catch (error) {
            Logger.error('Error starting game', 'AppStateManager', error);
            this.handleGameStartError();
        }
    }

    private async initializeGameSession(viewMode: ViewMode, gameMode: GameMode): Promise<void> {
        uiManager.showAuthButtons();                                    // Hide user info during game
        historyManager.navigateTo(AppState.GAME_3D, false);             // Navigate to appropriate game screen
        this.setGameState(viewMode);                                    // Update game state manager
        
        let players: PlayerInfo[];
        if (authManager.isUserAuthenticated())
            players = GameConfigFactory.getAuthenticatedPlayer();
        else
            players = GameConfigFactory.getPlayersFromUI(gameMode);
        
        const config = GameConfigFactory.createConfig(viewMode, gameMode, players);
        await this.startGame(config);
    }

    private handleGameStartError(): void {
        // Return to main menu on error
        historyManager.navigateTo(AppState.MAIN_MENU);
        this.resetToMenu();    
    }

    async endGame(): Promise<void> {
        if (!this.currentGame)
            return;

        Logger.info('Ending current game', 'AppStateManager');
        try {
            this.currentGame.stop();
            await this.currentGame.dispose();
        } catch (error) {
            Logger.error('Error ending game', 'AppStateManager', error);
        } finally {
            this.currentGame = null;
        }
        Logger.info('Game ended successfully', 'AppStateManager');
    }

    async exitToMenu(): Promise<void> {
        if (!this.isInGame() && !this.isPaused()) return;
        if (this.isExiting) return;

        this.isExiting = true;
        Logger.info('Exiting to menu...', 'AppStateManager');
        try {
            uiManager.setElementVisibility('pause-dialog-3d', false);
            webSocketClient.sendQuitGame();
            await this.endGame();
            this.resetToMenu();
            Logger.info('Successfully exited to main menu', 'AppStateManager');
        } catch (error) {
            Logger.error('Error during game exit', 'AppStateManager', error);
            this.resetToMenu();
        }
    }

    resetToMenu(): void {
        this.currentState = null;
        this.isExiting = false;
        authManager.checkAuthState();
        historyManager.navigateTo(AppState.MAIN_MENU);;
    }

    setGameState(viewMode: ViewMode): void {
        this.currentState = GameState.PLAYING;
        this.isExiting = false;
        Logger.info(`Game started in ${ViewMode[viewMode]} mode`, 'AppStateManager');
    }

    // ========================================
    // PAUSE/RESUME HANDLING
    // ========================================
    onServerConfirmedPause(): void {
        this.currentState = GameState.PAUSED;
        uiManager.setElementVisibility(EL.GAME.PAUSE_DIALOG_3D, true);
        Logger.info('Game paused and UI updated', 'AppStateManager');
    }

    onServerConfirmedResume(): void {
        this.currentState = GameState.PLAYING;
        uiManager.setElementVisibility(EL.GAME.PAUSE_DIALOG_3D, false);
        Logger.info('Game resumed and UI updated', 'AppStateManager');
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