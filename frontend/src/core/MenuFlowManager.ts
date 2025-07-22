import { GameMode, ViewMode, ConnectionStatus, AppState } from '../shared/constants.js';
import { uiManager } from '../ui/UIManager.js';
import { authManager } from './AuthManager.js';
import { getCurrentTranslation } from '../translations/translations.js';
import { historyManager } from './HistoryManager.js';
import { dashboardManager } from './DashboardManager.js';
import { webSocketClient } from './WebSocketClient.js';
import { appStateManager } from './AppStateManager.js';
import { GameConfigFactory } from '../engine/GameConfig.js';
import { clearForm } from './utils.js';
import { EL, getElementById} from '../ui/elements.js';


/**
 * Manages the selection and initialization of game modes and view modes for the application.
 * 
 * Implements the singleton pattern to ensure a single instance throughout the app.
 * Handles UI state, event listeners, and game starting logic.
 */
export class MenuFlowManager {
    private static instance: MenuFlowManager;
    private selectedViewMode: ViewMode = ViewMode.MODE_2D;
    private selectedGameMode: GameMode | null = null;
    private currentViewModeIndex = 0;

    static getInstance(): MenuFlowManager {
        if (!MenuFlowManager.instance)
            MenuFlowManager.instance = new MenuFlowManager();
        return MenuFlowManager.instance;
    }

    static initialize(): void {
        const menuFlowManager = MenuFlowManager.getInstance();
        menuFlowManager.setupEventListeners();
    }

    static showGameModeSelection(): void {
        const menuFlowManager = MenuFlowManager.getInstance();
        historyManager.navigateTo(AppState.GAME_MODE);
        menuFlowManager.updateViewModeDisplay();
        menuFlowManager.updateButtonStates();
    }

    // ========================================
    // GAME STARTING
    // ========================================

    private async startGameWithMode(viewMode: ViewMode, gameMode: GameMode): Promise<void> {
        try {
            console.log(`Starting game: ${gameMode} in ${ViewMode[viewMode]} mode`);
            await this.initializeGameSession(viewMode, gameMode);         
            console.log('Game started successfully');
            
        } catch (error) {
            console.error('Error starting game:', error);
            this.handleGameStartError();
        }
    }

    private async initializeGameSession(viewMode: ViewMode, gameMode: GameMode): Promise<void> {
        uiManager.showAuthButtons();                                    // Hide user info during game
        historyManager.navigateTo(AppState.GAME_3D, false);             // Navigate to appropriate game screen
        appStateManager.setGameState(viewMode);                         // Update game state manager
        const players = GameConfigFactory.getPlayersFromUI(gameMode);   // Get players from UI
        const config = GameConfigFactory.createConfig(viewMode, gameMode, players); // Create game configuration
        await appStateManager.startGame(config);
    }

    private handleGameStartError(): void {
        // Return to main menu on error
        historyManager.navigateTo(AppState.MAIN_MENU);;
        appStateManager.resetToMenu();    
    }

    // ========================================
    // UI STATE MANAGEMENT
    // ========================================
    
    updateButtonStates(): void {
        const t = getCurrentTranslation();
        const isLoggedIn = authManager.isUserAuthenticated();
        const isOnline = webSocketClient.isConnected();
        
        if (isOnline) {
    uiManager.setButtonState([EL.GAME_MODES.SOLO], 'enabled');

        if (isLoggedIn) {
            uiManager.setButtonState(
                [EL.GAME_MODES.ONLINE, EL.GAME_MODES.TOURNAMENT_ONLINE],
                'enabled'
            );
            uiManager.setButtonState(
                [EL.GAME_MODES.LOCAL, EL.GAME_MODES.TOURNAMENT],
                'disabled',
                t.availableOnlyOffline
            );
        } else {
            uiManager.setButtonState(
                [EL.GAME_MODES.LOCAL, EL.GAME_MODES.TOURNAMENT],
                'enabled'
            );
            uiManager.setButtonState(
                [EL.GAME_MODES.ONLINE, EL.GAME_MODES.TOURNAMENT_ONLINE],
                'disabled',
                t.loginRequired
            );
        }
}
    }

    // ========================================
    // EVENT LISTENERS SETUP
    // ========================================
    
    private setupEventListeners(): void {
        // View mode navigation controls
        const viewModeBack = getElementById(EL.BUTTONS.VIEW_MODE_BACK);
        const viewModeForward = getElementById(EL.BUTTONS.VIEW_MODE_FORWARD);
        const backBtn = getElementById(EL.BUTTONS.DASHBOARD_BACK);
        viewModeBack?.addEventListener('click', () => this.previousViewMode());
        viewModeForward?.addEventListener('click', () => this.nextViewMode());
        backBtn?.addEventListener('click', () => { historyManager.navigateTo(AppState.MAIN_MENU);});
    
        // Game mode selection buttons
        this.setupGameModeButtons();
        this.setupPlayerSetupListeners();
        this.showDashboard();

    }

    private setupGameModeButtons(): void {
        this.setupGameModeHandler(GameMode.SINGLE_PLAYER, 'solo', {
            requiresAuth: false,
            requiresSetup: true,
            availableOfflineOnly: false
        });

        this.setupGameModeHandler(GameMode.TWO_PLAYER_LOCAL, 'two-players', {
            requiresAuth: false,
            requiresSetup: true,
            availableOfflineOnly: true,
            errorMessage: 'Local mode not available for logged-in users'
        });
        
        this.setupGameModeHandler(GameMode.TWO_PLAYER_REMOTE, 'two-players', {
            requiresAuth: true,
            requiresSetup: false,
            availableOfflineOnly: false
        });
        
        this.setupGameModeHandler(GameMode.TOURNAMENT_LOCAL, 'tournament', {
            requiresAuth: false,
            requiresSetup: true,
            availableOfflineOnly: true,
            errorMessage: 'Local tournament not available for logged-in users'
        });
        
        this.setupGameModeHandler(GameMode.TOURNAMENT_REMOTE, 'tournament', {
            requiresAuth: true,
            requiresSetup: false,
            availableOfflineOnly: false
        });

        const backButton = getElementById(EL.BUTTONS.MODE_BACK);
        backButton?.addEventListener('click', () => this.handleModeBackButton());
    }
    
    private handleModeBackButton(): void {
        this.selectedGameMode = null;
        historyManager.navigateTo(AppState.MAIN_MENU);;
    }

    // ========================================
    // GAME MODE HANDLERS
    // ========================================

    private setupGameModeHandler(gameMode: GameMode, form: string, config: {
                requiresAuth: boolean; requiresSetup: boolean; availableOfflineOnly: boolean; errorMessage?: string;}) {
        const button = getElementById(gameMode);

        button?.addEventListener('click', async () => {
            if (config.availableOfflineOnly && authManager.isUserAuthenticated()) {
                alert(config.errorMessage || 'This mode is not available for logged-in users.');
                return;
            }

            if (config.requiresAuth && !authManager.isUserAuthenticated()) {
                const t = getCurrentTranslation();
                alert(t.loginRequired);
                return;
            }

            this.selectedGameMode = gameMode;

            if (config.requiresSetup && !authManager.isUserAuthenticated()) {
                historyManager.navigateTo(AppState.PLAYER_SETUP);
                uiManager.showSetupForm(form);
                clearForm([ EL.PLAYER_SETUP.PLAYER1_NAME, EL.PLAYER_SETUP.PLAYER1_NAME_LOCAL,
                    EL.PLAYER_SETUP.PLAYER2_NAME_LOCAL, EL.PLAYER_SETUP.PLAYER1_NAME_TOURNAMENT,
                    EL.PLAYER_SETUP.PLAYER2_NAME_TOURNAMENT, EL.PLAYER_SETUP.PLAYER3_NAME_TOURNAMENT,
                    EL.PLAYER_SETUP.PLAYER4_NAME_TOURNAMENT]);
            } else
                await this.startGameWithMode(this.selectedViewMode, this.selectedGameMode);

        });
    }

    // ========================================
    // PLAYER SETUP MANAGEMENT
    // ========================================

    private setupPlayerSetupListeners(): void {
        const setupBack = getElementById(EL.BUTTONS.SETUP_BACK);
        const startGame = getElementById(EL.BUTTONS.START_GAME);

        setupBack?.addEventListener('click', () => {
            this.selectedGameMode = null;
            historyManager.navigateTo(AppState.GAME_MODE);
        });

        startGame?.addEventListener('click', async () => {
            if (this.selectedGameMode === null) return;

            if (!uiManager.validatePlayerSetup(this.selectedGameMode)) {
                const t = getCurrentTranslation();
                alert(t.pleaseFilllAllFields);
                return;
            }

            const playerNames = uiManager.getPlayerNames(this.selectedGameMode);
            console.log('Starting game with players:', playerNames);
            console.log('View mode:', this.getViewModes()[this.currentViewModeIndex].name);
            console.log('Game mode:', this.selectedGameMode);

            await this.startGameWithMode(this.selectedViewMode, this.selectedGameMode);
        });
    }

    private showDashboard(): void {
        console.log(EL.BUTTONS.DASHBOARD);
        const dashboardBtn = getElementById(EL.BUTTONS.DASHBOARD);
        if (!dashboardBtn) {
            console.error("Dashboard button not found when trying to attach listener");
        }
        console.log("Attaching dashboard click handler");
        dashboardBtn?.addEventListener('click', () => {
            console.log("Dashboard clicked");
            if (!authManager.isUserAuthenticated()) {
                console.log("authManager is not auth so returning");
                return;
            }
            const user = authManager.getCurrentUser();
            if (!user) {
                console.log("user is null so returning");
                return;
            }
            dashboardManager.clear();
            // Request new stats from backend
            console.log("clearing the dashboard");
            webSocketClient.requestUserStats(user.username);
            console.log("request user data was called");
            webSocketClient.requestUserGameHistory(user.username);
            console.log("request user game history was called");
            // Show dashboard panel
            console.log("Navigating to dashboard...");
            historyManager.navigateTo(AppState.STATS_DASHBOARD);
        });
    }


    // ========================================
    // VIEW MODE MANAGEMENT
    // ========================================
    
    private getViewModes() {
        const t = getCurrentTranslation();
        return [
            { mode: ViewMode.MODE_2D, name: t.classicMode },
            { mode: ViewMode.MODE_3D, name: t.immersiveMode }
        ];
    }

    private previousViewMode(): void {
        const viewModes = this.getViewModes();
        this.currentViewModeIndex = (this.currentViewModeIndex - 1 + viewModes.length) % viewModes.length;
        this.selectedViewMode = viewModes[this.currentViewModeIndex].mode;
        this.updateViewModeDisplay();
    }

    private nextViewMode(): void {
        const viewModes = this.getViewModes();
        this.currentViewModeIndex = (this.currentViewModeIndex + 1) % viewModes.length;
        this.selectedViewMode = viewModes[this.currentViewModeIndex].mode;
        this.updateViewModeDisplay();
    }

    private updateViewModeDisplay(): void {
        const viewModes = this.getViewModes();
        const viewModeDisplay = getElementById(EL.DISPLAY.VIEW_MODE_DISPLAY);
        if (viewModeDisplay) {
            viewModeDisplay.textContent = viewModes[this.currentViewModeIndex].name;
        }
    }
}

export const menuFlowManager = MenuFlowManager.getInstance();