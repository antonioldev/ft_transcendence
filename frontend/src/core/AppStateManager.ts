import { uiManager } from '../ui/UIManager.js';
import { GameState, ViewMode, AppState, GameMode } from '../shared/constants.js';
import { authManager } from './AuthManager.js';
import { historyManager } from './HistoryManager.js';
import { Game } from '../engine/Game.js';
import { webSocketClient } from './WebSocketClient.js';
import { EL } from '../ui/elements.js';
import { GameConfigFactory } from '../engine/GameConfig.js';
import { PlayerInfo } from '../shared/types.js';
import { Logger } from './LogManager.js'

/**
 * AppStateManager is responsible for managing the application's game state and transitions
 * between different phases of the game lifecycle (starting, pausing, resuming, exiting).
 * It coordinates UI updates, navigation, and delegates actions to other managers such as
 * authentication, history, and networking. This class does not implement game logic itself,
 * but acts as the central controller for state changes and lifecycle events.
 */
class AppStateManager {
    private currentState: GameState | null = null;
    private isExiting: boolean = false;

    // ========================================
    // APP LIFECYCLE
    // ========================================

    async startGameWithMode(viewMode: ViewMode, gameMode: GameMode): Promise<void> {
        try {
            Logger.info(`Starting game: ${gameMode} in ${ViewMode[viewMode]} mode`, 'AppStateManager');

            // Prepare UI for game
            uiManager.showAuthButtons();
            historyManager.navigateTo(AppState.GAME_3D, false);
            this.setGameState(viewMode);

            let players: PlayerInfo[];
            if (authManager.isUserAuthenticated())
                players = GameConfigFactory.getAuthenticatedPlayer();
            else
                players = GameConfigFactory.getPlayersFromUI(gameMode);

            const config = GameConfigFactory.createConfig(viewMode, gameMode, players);

            // Load the game and wait for server
            const game = new Game(config);
            await game.connect();
            await game.initialize();
            // game.start();

            Logger.info('Game initialize successfully', 'AppStateManager');
        } catch (error) {
            Logger.error('Error initializing game', 'AppStateManager', error);
            this.handleGameStartError();
        }
    }

    private handleGameStartError(): void {
        // Return to main menu on error
        historyManager.navigateTo(AppState.MAIN_MENU);
        this.resetToMenu();
    }

    async exitToMenu(): Promise<void> {
        if (this.isExiting) return;

        this.isExiting = true;
        Logger.info('Exiting to menu...', 'AppStateManager');
        try {
            uiManager.setElementVisibility('pause-dialog-3d', false);
            webSocketClient.sendQuitGame();
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
        return this.currentState === GameState.PLAYING && !this.isExiting;
    }
    
    isPaused(): boolean {
        return this.currentState === GameState.PAUSED && !this.isExiting;
    }
}

export const appStateManager = new AppStateManager();