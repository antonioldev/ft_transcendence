import { uiManager } from '../ui/UIManager.js';
import { GameState, ViewMode, AppState, GameMode } from '../shared/constants.js';
import { authManager } from './AuthManager.js';
// import { historyManager } from './HistoryManager.js';
import { Game } from '../engine/Game.js';
import { webSocketClient } from './WebSocketClient.js';
import { EL } from '../ui/elements.js';
import { GameConfigFactory } from '../engine/GameConfig.js';
import { PlayerInfo } from '../shared/types.js';
import { Logger } from '../utils/LogManager.js'
// import { memoryDetector } from './main.js';

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
    currentAppState: AppState = AppState.MAIN_MENU;

    // ========================================
    // APP LIFECYCLE
    // ========================================

    initialize(): void {
        this.setupEventListeners();
        this.navigateTo(AppState.MAIN_MENU);
    }

    private setupEventListeners(): void {
        // Listen for browser back/forward button clicks
        window.addEventListener('popstate', (event) => {
            if (this.isInGame()) {
                Game.pause();
                return;
            } else if (this.isPaused()) {
                this.requestExitToMenu();
                return;
            }

            const state = event.state?.screen || AppState.MAIN_MENU;
            Logger.info(`Browser BACK navigation to: ${state}`, 'AppStateManager');
            this.navigateTo(state, false); // false = don't push to history
        });

        // Prevent page reload on form submissions
        document.addEventListener('submit', (event) => {
            event.preventDefault();
        });
    }

    navigateTo(state: AppState, addToHistory: boolean = true): void {
        if (addToHistory)
            history.pushState({ screen: state }, '', window.location.href);
        this.currentAppState = state;
        Logger.info(`Navigating to state: ${state}`, 'HistoryManager');
        
        switch (state) {
            case AppState.MAIN_MENU:
                this.showScreen(EL.SCREENS.MAIN_MENU, { hideOverlayss: true, checkAuth: true });
                break;
            case AppState.LOGIN:
                this.showScreen(EL.SCREENS.MAIN_MENU, { modal: EL.SCREENS.LOGIN_MODAL });
                break;
            case AppState.REGISTER:
                this.showScreen(EL.SCREENS.MAIN_MENU, { modal: EL.SCREENS.REGISTER_MODAL });
                break;
            case AppState.GAME_MODE:
                this.showScreen(EL.SCREENS.GAME_MODE_OVERLAY, { hideOverlayss: true, refreshGameMode: true });
                break;
            case AppState.PLAYER_SETUP:
                this.showScreen(EL.SCREENS.PLAYER_SETUP_OVERLAY, { hideOverlayss: true });
                break;
            case AppState.GAME_3D:
                this.showScreen(EL.SCREENS.GAME_3D, { hideOverlayss: true, hideUserInfo: true });
                break;
            case AppState.STATS_DASHBOARD:
                this.showScreen(EL.SCREENS.STATS_DASHBOARD, { hideOverlayss: true });
                break;
            default:
                Logger.warn(`Unknown state: ${state}, redirecting to main menu`, 'HistoryManager');
                this.navigateTo(AppState.MAIN_MENU);
                break;
        }
    }

    private showScreen(screenId: string, options: any): void {
        if (options.hideOverlayss) {
            uiManager.setElementVisibility(EL.SCREENS.LOGIN_MODAL, false);
            uiManager.setElementVisibility(EL.SCREENS.REGISTER_MODAL, false);
        }
        
        if (options.hideUserInfo)
            uiManager.showAuthButtons();
        
        if (options.modal) {
            uiManager.showScreen(EL.SCREENS.MAIN_MENU);
            uiManager.setElementVisibility(options.modal, true);
        } else {
            uiManager.showScreen(screenId);
        }
        
        if (options.checkAuth)
            authManager.checkAuthState();
        
        if (options.refreshGameMode) {
            const isLoggedIn = authManager.isUserAuthenticated();
            const isOnline = webSocketClient.isConnected();
            uiManager.updateGameModeButtonStates(isLoggedIn, isOnline);
        }
    }

    async startGameWithMode(viewMode: ViewMode, gameMode: GameMode): Promise<void> {
        // memoryDetector.markGameStart(); //[ ]TODO 
        try {
            Logger.info(`Starting game: ${gameMode} in ${ViewMode[viewMode]} mode`, 'AppStateManager');

            // Prepare UI for game
            uiManager.showAuthButtons();
            this.navigateTo(AppState.GAME_3D, false);
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
        this.navigateTo(AppState.MAIN_MENU);
        this.resetToMenu();
    }

    async requestExitToMenu(): Promise<void> {
        if (this.isExiting) return;

        this.isExiting = true;
        Logger.info('Exiting to menu...', 'AppStateManager');
        try {
            webSocketClient.sendQuitGame();
            Logger.info('Request to end the game', 'AppStateManager');
        } catch (error) {
            Logger.error('Error during request exit', 'AppStateManager', error);
            this.resetToMenu();
        }
    }

    resetToMenu(): void {

        this.currentState = null;
        this.isExiting = false;
        uiManager.setElementVisibility('pause-dialog-3d', false);
        authManager.checkAuthState();
        this.navigateTo(AppState.MAIN_MENU);
        // memoryDetector.markGameEnd(); // [ ]
    }

    setGameState(viewMode: ViewMode): void {
        this.currentState = GameState.PLAYING;
        this.isExiting = false;
        Logger.info(`Game started in ${ViewMode[viewMode]} mode`, 'AppStateManager');
    }

    updateGamePauseStateTo(state: GameState): void {
        this.currentState = state;
        const showDialog = state === GameState.PAUSED;
        uiManager.setElementVisibility(EL.GAME.PAUSE_DIALOG_3D, showDialog);
        Logger.info(`Game ${showDialog ? 'paused' : 'resumed'} and UI updated`, 'AppStateManager');
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