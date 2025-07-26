import { Logger } from './LogManager.js';
import { uiManager } from '../ui/UIManager.js';
import { authManager } from './AuthManager.js';
import { appStateManager } from './AppStateManager.js';
import { webSocketClient } from './WebSocketClient.js';
import { AppState } from '../shared/constants.js';
import { EL} from '../ui/elements.js';
import { Game } from '../engine/Game.js';

/**
 * Singleton class responsible for managing application navigation state and browser history.
 * 
 * The `HistoryManager` provides a centralized way to control navigation between different
 * screens or overlays in a single-page application (SPA) context. It synchronizes the app's
 * state with the browser's history API, enabling support for back/forward navigation and
 * programmatic state transitions.
 */
export class HistoryManager {
    private static instance: HistoryManager;
    private currentState: AppState = AppState.MAIN_MENU;

    static getInstance(): HistoryManager {
        if (!HistoryManager.instance)
            HistoryManager.instance = new HistoryManager();
        return HistoryManager.instance;
    }

    static initialize(): void {
        const historyManager = HistoryManager.getInstance();
        historyManager.setupEventListeners();
        historyManager.navigateTo(AppState.MAIN_MENU);
    }

    private setupEventListeners(): void {
        // Listen for browser back/forward button clicks
        window.addEventListener('popstate', (event) => {
            if (appStateManager.isInGame()) {
                Game.pause();
                return;
            } else if (appStateManager.isPaused()) {
                appStateManager.requestExitToMenu();
                return;
            }

            const state = event.state?.screen || AppState.MAIN_MENU;
            Logger.info(`Browser BACK navigation to: ${state}`, 'HistoryManager');
            this.navigateTo(state, false); // false = don't push to history
        });

        // Prevent page reload on form submissions
        document.addEventListener('submit', (event) => {
            event.preventDefault();
        });
    }

    // Handle the navigation to different app states and add it to browser history
    navigateTo(state: AppState, addToHistory: boolean = true): void { // TODO check with teammate, false so doesn't save it
        if (addToHistory)
            history.pushState({ screen: state }, '', window.location.href);
        this.currentState = state;
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

    private showScreen(screenId: string, options: {
        hideOverlayss?: boolean;
        hideUserInfo?: boolean;
        modal?: string;
        checkAuth?: boolean;
        refreshGameMode?: boolean;
    } = {}): void {
        Logger.info(`Showing screen with ID: ${screenId}`, 'HistoryManager');

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
}

// Export singleton instance
export const historyManager = HistoryManager.getInstance();