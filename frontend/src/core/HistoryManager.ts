import { uiManager } from '../ui/UIManager.js';
import { authManager } from './AuthManager.js';
import { menuFlowManager } from './MenuFlowManager.js';
import { AppState } from '../shared/constants.js';

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
    private currentState: string = 'main-menu';

    static getInstance(): HistoryManager {
        if (!HistoryManager.instance) {
            HistoryManager.instance = new HistoryManager();
        }
        return HistoryManager.instance;
    }

    static initialize(): void {
        const historyManager = HistoryManager.getInstance();
        historyManager.setupEventListeners();
        historyManager.navigateTo('main-menu');
    }

    private setupEventListeners(): void {
        // Listen for browser back/forward button clicks
        window.addEventListener('popstate', (event) => {
            const state = event.state?.screen || 'main-menu';
            console.log(`Browser BACK navigation to: ${state}`);
            this.navigateTo(state, false); // false = don't push to history
        });

        // Prevent page reload on form submissions
        document.addEventListener('submit', (event) => {
            event.preventDefault();
        });
    }

    // Handle the navigation to different app states and add it to browser history
    private navigateTo(state: string, addToHistory: boolean = true): void {
        if (addToHistory)
            history.pushState({ screen: state }, '', window.location.href);
        this.currentState = state;
        console.log(`Navigating to state: ${state}`);
        
        switch (state) { // TODO remove hard coded, use ENUM // TODO if using enum, we can try to remove the single functions below
            case 'main-menu':
                this.showScreen('main-menu', { hideOverlayss: true, checkAuth: true });
                break;
            case 'login':
                this.showScreen('main-menu', { modal: 'login-modal' });
                break;
            case 'register':
                this.showScreen('main-menu', { modal: 'register-modal' });
                break;
            case 'game-mode':
                this.showScreen('game-mode-overlay', { hideOverlayss: true, refreshGameMode: true });
                break;
            case 'player-setup':
                this.showScreen('player-setup-overlay', { hideOverlayss: true });
                break;
            case 'game-2d':
                this.showScreen('game-2d', { hideOverlayss: true, hideUserInfo: true });
                break;
            case 'game-3d':
                this.showScreen('game-3d', { hideOverlayss: true, hideUserInfo: true });
                break;
            default:
                console.warn(`Unknown state: ${state}, redirecting to main menu`);
                this.navigateTo('main-menu');
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
        
        if (options.hideOverlayss) {
            uiManager.hideOverlays('login-modal');
            uiManager.hideOverlays('register-modal');
        }
        
        if (options.hideUserInfo)
            uiManager.hideUserInfo();
        
        if (options.modal) {
            uiManager.showScreen('main-menu');
            uiManager.showOverlays(options.modal);
        } else {
            uiManager.showScreen(screenId);
        }
        
        if (options.checkAuth)
            authManager.checkAuthState();
        
        if (options.refreshGameMode)
            menuFlowManager.refreshButtonStates();
    }

    // Public methods for other managers to use
    getCurrentState(): string {
        return this.currentState;
    }

    // Go to main menu (used by logout, game exit, etc.)
    goToMainMenu(): void {
        this.navigateTo('main-menu');
    }

    // Go to game mode selection (used by PLAY button)
    goToGameMode(): void {
        this.navigateTo('game-mode');
    }

    // Go to login modal (used by login button)
    goToLogin(): void {
        this.navigateTo('login');
    }

    // Go to register modal (used by register button)  
    goToRegister(): void {
        this.navigateTo('register');
    }

    // Go to player setup (used by game mode selection)
    goToPlayerSetup(): void {
        this.navigateTo('player-setup');
    }

    // Go to game (used by start game button)
    goToGame2D(): void { // TODO check with teammate, false so doesn't save it
        this.navigateTo('game-2d', false);
    }

    goToGame3D(): void {  // TODO check with teammate, false so doesn't save it
        this.navigateTo('game-3d', false);
    }

    // Close modal and return to previous state
    closeModal(): void {
        // For modals, we want to go back to main menu
        this.navigateTo('main-menu');
    }

    // Browser back button simulation (for testing)
    goBack(): void {
        window.history.back();
    }

    // Browser forward button simulation (for testing)
    goForward(): void {
        window.history.forward();
    }
}

// Export singleton instance
export const historyManager = HistoryManager.getInstance();