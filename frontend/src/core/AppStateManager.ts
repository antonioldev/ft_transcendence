import { uiManager } from '../ui/UIManager.js';
import { ViewMode, AppState, GameMode } from '../shared/constants.js';
import { authManager } from './AuthManager.js';
import { Game } from '../engine/Game.js';
import { webSocketClient } from './WebSocketClient.js';
import { EL } from '../ui/elements.js';
import { Logger } from '../utils/LogManager.js'

/**
 * Central controller for application state and navigation.
 * Manages transitions between game phases, coordinates UI updates,
 * and delegates actions to authentication, history, and networking managers.
 * Does not implement game logic; focuses on lifecycle and state management.
 */
export class AppStateManager {
    currentAppState: AppState = AppState.MAIN_MENU;
    private static instance: AppStateManager;
    
    static getInstance(): AppStateManager {
        if (!AppStateManager.instance)
            AppStateManager.instance = new AppStateManager();

        return AppStateManager.instance;
    }
    
    static initialize(): void {
        const appStateManager = AppStateManager.getInstance();
        appStateManager.setupEventListeners();
        appStateManager.navigateTo(AppState.MAIN_MENU);
    }

    private setupEventListeners(): void {
        // Listen for browser back/forward button clicks
        window.addEventListener('popstate', (event) => {
            const g = Game.getCurrentInstance();
            if (g && g.isInGame()) {
                g.pause();
                return;
            } else if (g && g.isPaused()) {
                g.requestExitToMenu();
                return;
            }

            const state = event.state?.screen || AppState.MAIN_MENU;
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
                Logger.error(`Unknown state: ${state}, redirecting to main menu`, 'HistoryManager');
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

    async startGameWithMode(viewMode: ViewMode, gameMode: GameMode, aiDifficulty: number): Promise<void> {
        try {
            uiManager.showAuthButtons();
            this.navigateTo(AppState.GAME_3D, false);
            await Game.create(viewMode, gameMode, aiDifficulty);

        } catch (error) {
            Logger.error('Error starting game', 'AppStateManager', error);
            this.navigateTo(AppState.MAIN_MENU); // Go back to menu on error
        }
    }
}

export const appStateManager = AppStateManager.getInstance();