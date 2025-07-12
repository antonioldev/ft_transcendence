import { uiManager } from '../ui/UIManager.js';
import { authManager } from './AuthManager.js';
import { gameModeManager } from './GameModeManager.js';

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
        historyManager.pushState('main-menu');
        // historyManager.handleInitialLoad();
    }

    private setupEventListeners(): void {
        // Listen for browser back/forward button clicks
        window.addEventListener('popstate', (event) => {
            const state = event.state?.screen || 'main-menu';
            console.log(`Browser BACK navigation to: ${state}`);
            this.navigateToState(state, false); // false = don't push to history
        });

        // Prevent page reload on form submissions
        document.addEventListener('submit', (event) => {
            event.preventDefault();
        });
    }

    private handleInitialLoad(): void {
        // On first page load, initialize with main menu
        this.pushState('main-menu');
    }

    /**
     * Navigate to a new state and add it to browser history
     * @param state - The app state to navigate to
     * @param addToHistory - Whether to add this to browser history (default: true)
     */
    pushState(state: string, addToHistory: boolean = true): void {
        if (addToHistory) {
            history.pushState({ screen: state }, '', window.location.href);
        }
        
        this.currentState = state;
        this.navigateToState(state, false);
    }

    /**
     * Handle the actual navigation to different app states
     * @param state - The state to navigate to
     * @param addToHistory - Whether to add to history (used internally)
     */
    private navigateToState(state: string, addToHistory: boolean = true): void {
        console.log(`Navigating to state: ${state}`);
        
        switch (state) {
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
                this.pushState('main-menu');
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
            // uiManager.hideAllModals();
        }
        
        if (options.hideUserInfo) {
            uiManager.hideUserInfo();
        }
        
        if (options.modal) {
            uiManager.showScreen('main-menu');
            uiManager.showOverlays(options.modal);
        } else {
            uiManager.showScreen(screenId);
        }
        
        if (options.checkAuth) {
            authManager.checkAuthState();
        }
        
        if (options.refreshGameMode) {
            gameModeManager.refreshButtonStates();
        }
    }

    // Public methods for other managers to use
    getCurrentState(): string {
        return this.currentState;
    }

    // Go to main menu (used by logout, game exit, etc.)
    goToMainMenu(): void {
        this.pushState('main-menu');
    }

    // Go to game mode selection (used by PLAY button)
    goToGameMode(): void {
        this.pushState('game-mode');
    }

    // Go to login modal (used by login button)
    goToLogin(): void {
        this.pushState('login');
    }

    // Go to register modal (used by register button)  
    goToRegister(): void {
        this.pushState('register');
    }

    // Go to player setup (used by game mode selection)
    goToPlayerSetup(): void {
        this.pushState('player-setup');
    }

    // Go to game (used by start game button)
    goToGame2D(): void {
        this.pushState('game-2d');
    }

    goToGame3D(): void {
        this.pushState('game-3d');
    }

    // Close modal and return to previous state
    closeModal(): void {
        // For modals, we want to go back to main menu
        this.pushState('main-menu');
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