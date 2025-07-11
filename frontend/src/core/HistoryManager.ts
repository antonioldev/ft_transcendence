// HistoryManager.ts - Single route with browser back/forward support
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
        historyManager.handleInitialLoad();
    }

    private setupEventListeners(): void {
        // Listen for browser back/forward button clicks
        window.addEventListener('popstate', (event) => {
            const state = event.state?.screen || 'main-menu';
            console.log(`🔙 Browser navigation to: ${state}`);
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
            // Add to browser history (same URL, different state)
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
        console.log(`📱 Navigating to state: ${state}`);

        // Import managers dynamically to avoid circular dependencies
        import('../ui/UIManager.js').then(({ uiManager }) => {
            import('../core/AuthManager.js').then(({ authManager }) => {
                import('../core/GameModeManager.js').then(({ GameModeManager }) => {
                    
                    switch (state) {
                        case 'main-menu':
                            this.showMainMenu(uiManager, authManager);
                            break;
                            
                        case 'login':
                            this.showLogin(uiManager);
                            break;
                            
                        case 'register':
                            this.showRegister(uiManager);
                            break;
                            
                        case 'game-mode':
                            this.showGameMode(uiManager);
                            break;
                            
                        case 'player-setup':
                            this.showPlayerSetup(uiManager);
                            break;
                            
                        case 'game-2d':
                            this.showGame2D(uiManager);
                            break;
                            
                        case 'game-3d':
                            this.showGame3D(uiManager);
                            break;
                            
                        default:
                            // Unknown state, go to main menu
                            console.warn(`Unknown state: ${state}, redirecting to main menu`);
                            this.pushState('main-menu');
                            break;
                    }
                });
            });
        });
    }

    // State handlers
    private showMainMenu(uiManager: any, authManager: any): void {
        uiManager.hideAllModals();
        uiManager.showScreen('main-menu');
        authManager.checkAuthState(); // Ensure auth UI is correct
    }

    private showLogin(uiManager: any): void {
        uiManager.showScreen('main-menu'); // Keep main menu visible
        uiManager.showModal('login-modal');
    }

    private showRegister(uiManager: any): void {
        uiManager.showScreen('main-menu'); // Keep main menu visible  
        uiManager.showModal('register-modal');
    }

    private showGameMode(uiManager: any): void {
        uiManager.hideAllModals();
        uiManager.showScreen('game-mode-overlay');
        
        // Update game mode display
        import('../core/GameModeManager.js').then(({ GameModeManager }) => {
            const manager = GameModeManager.getInstance();
            manager.refreshButtonStates();
        });
    }

    private showPlayerSetup(uiManager: any): void {
        uiManager.hideAllModals();
        uiManager.showScreen('player-setup-overlay');
    }

    private showGame2D(uiManager: any): void {
        uiManager.hideAllModals();
        uiManager.hideUserInfo();
        uiManager.showScreen('game-2d');
        
        import('../core/GameStateManager.js').then(({ gameStateManager }) => {
            import('../shared/constants.js').then(({ GameState }) => {
                gameStateManager.setState(GameState.PLAYING_2D);
            });
        });
    }

    private showGame3D(uiManager: any): void {
        uiManager.hideAllModals();
        uiManager.hideUserInfo();
        uiManager.showScreen('game-3d');
        
        import('../core/GameStateManager.js').then(({ gameStateManager }) => {
            import('../shared/constants.js').then(({ GameState }) => {
                gameStateManager.setState(GameState.PLAYING_3D);
            });
        });
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