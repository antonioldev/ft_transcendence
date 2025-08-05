import { Logger } from '../utils/LogManager.js';
import { GameMode, ViewMode, AppState, AiDifficulty } from '../shared/constants.js';
import { uiManager } from '../ui/UIManager.js';
import { authManager } from './AuthManager.js';
import { getCurrentTranslation } from '../translations/translations.js';
import { dashboardManager } from './DashboardManager.js';
import { webSocketClient } from './WebSocketClient.js';
import { appStateManager } from './AppStateManager.js';
import { EL, requireElementById} from '../ui/elements.js';
import { GameConfigFactory } from '../engine/GameConfig.js';


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
    private currentAiDifficultyIndex: AiDifficulty = AiDifficulty.EASY;

    static getInstance(): MenuFlowManager {
        if (!MenuFlowManager.instance)
            MenuFlowManager.instance = new MenuFlowManager();
        return MenuFlowManager.instance;
    }

    static initialize(): void {
        const menuFlowManager = MenuFlowManager.getInstance();
        menuFlowManager.setupEventListeners();
    }

    // ========================================
    // EVENT LISTENERS SETUP
    // ========================================

    private setupEventListeners(): void {
        // View mode navigation controls
        const viewModeBack = requireElementById(EL.BUTTONS.VIEW_MODE_BACK);
        const viewModeForward = requireElementById(EL.BUTTONS.VIEW_MODE_FORWARD);
        const backBtn = requireElementById(EL.BUTTONS.DASHBOARD_BACK);
        const soloDifficultyBack = requireElementById(EL.BUTTONS.SOLO_DIFFICULTY_BACK);
        const soloDifficultyForward = requireElementById(EL.BUTTONS.SOLO_DIFFICULTY_FORWARD);

        viewModeBack.addEventListener('click', () => this.previousViewMode());
        viewModeForward.addEventListener('click', () => this.nextViewMode());
        backBtn.addEventListener('click', () => { appStateManager.navigateTo(AppState.MAIN_MENU);});
        soloDifficultyBack.addEventListener('click', () => this.previousAIDifficulty());
        soloDifficultyForward.addEventListener('click', () => this.nextAIDifficulty());

        uiManager.updateAIDifficultyDisplay(this.currentAiDifficultyIndex);

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

        const backButton = requireElementById(EL.BUTTONS.MODE_BACK);
        backButton.addEventListener('click', () => this.handleModeBackButton());
    }
    
    private handleModeBackButton(): void {
        this.selectedGameMode = null;
        appStateManager.navigateTo(AppState.MAIN_MENU);;
    }

    // ========================================
    // GAME MODE HANDLERS
    // ========================================

    private setupGameModeHandler(gameMode: GameMode, form: string, config: {
                requiresAuth: boolean; requiresSetup: boolean; availableOfflineOnly: boolean; errorMessage?: string;}) {
        const button = requireElementById(gameMode);

        button.addEventListener('click', async () => {
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
                appStateManager.navigateTo(AppState.PLAYER_SETUP);
                uiManager.showSetupForm(form);
                uiManager.clearForm([ EL.PLAYER_SETUP.PLAYER1_NAME, EL.PLAYER_SETUP.PLAYER1_NAME_LOCAL,
                    EL.PLAYER_SETUP.PLAYER2_NAME_LOCAL, EL.PLAYER_SETUP.PLAYER1_NAME_TOURNAMENT,
                    EL.PLAYER_SETUP.PLAYER2_NAME_TOURNAMENT, EL.PLAYER_SETUP.PLAYER3_NAME_TOURNAMENT,
                    EL.PLAYER_SETUP.PLAYER4_NAME_TOURNAMENT]);
            } else
                await appStateManager.startGameWithMode(this.selectedViewMode, this.selectedGameMode, this.currentAiDifficultyIndex);

        });
    }

    // ========================================
    // PLAYER SETUP MANAGEMENT
    // ========================================

    private setupPlayerSetupListeners(): void {
        const setupBack = requireElementById(EL.BUTTONS.SETUP_BACK);
        const startGame = requireElementById(EL.BUTTONS.START_GAME);

        setupBack.addEventListener('click', () => {
            this.selectedGameMode = null;
            appStateManager.navigateTo(AppState.GAME_MODE);
        });

        startGame.addEventListener('click', async () => {
            if (this.selectedGameMode === null) return;

            if (!GameConfigFactory.validatePlayerSetup(this.selectedGameMode)) {
                const t = getCurrentTranslation();
                alert(t.pleaseFilllAllFields);
                return;
            }
            await appStateManager.startGameWithMode(this.selectedViewMode, this.selectedGameMode, this.currentAiDifficultyIndex);
        });
    }

    private showDashboard(): void {
        Logger.debug('Dashboard button element', 'MenuFlowManager', EL.BUTTONS.DASHBOARD);
        const dashboardBtn = requireElementById(EL.BUTTONS.DASHBOARD);
        Logger.debug('Attaching dashboard click handler', 'MenuFlowManager');
        dashboardBtn?.addEventListener('click', () => {
            Logger.debug('Dashboard clicked', 'MenuFlowManager');
            if (!authManager.isUserAuthenticated()) {
                Logger.warn('authManager is not authenticated, returning', 'MenuFlowManager');
                return;
            }
            const user = authManager.getCurrentUser();
            if (!user) {
                Logger.warn('user is null, returning', 'MenuFlowManager');
                return;
            }
            dashboardManager.clear();
            // Request new stats from backend
            Logger.debug('clearing the dashboard', 'MenuFlowManager');
            webSocketClient.requestUserStats(user.username);
            Logger.debug('request user data was called', 'MenuFlowManager');
            webSocketClient.requestUserGameHistory(user.username);
            Logger.debug('request user game history was called', 'MenuFlowManager');
            // Show dashboard panel
            Logger.info('Navigating to dashboard...', 'MenuFlowManager');
            appStateManager.navigateTo(AppState.STATS_DASHBOARD);
        });
    }

    // ========================================
    // AI DIFFICULTY MANAGEMENT
    // ========================================

    private previousAIDifficulty(): void {
        this.currentAiDifficultyIndex = (this.currentAiDifficultyIndex - 1 + 4) % 4;
        uiManager.updateAIDifficultyDisplay(this.currentAiDifficultyIndex);
    }

    private nextAIDifficulty(): void {
        this.currentAiDifficultyIndex = (this.currentAiDifficultyIndex + 1) % 4;
        uiManager.updateAIDifficultyDisplay(this.currentAiDifficultyIndex);
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
        this.currentViewModeIndex = (this.currentViewModeIndex - 1 + 2) % viewModes.length;
        this.selectedViewMode = viewModes[this.currentViewModeIndex].mode;
        uiManager.updateViewModeDisplay(viewModes[this.currentViewModeIndex].name);
    }

    private nextViewMode(): void {
        const viewModes = this.getViewModes();
        this.currentViewModeIndex = (this.currentViewModeIndex + 1) % viewModes.length;
        this.selectedViewMode = viewModes[this.currentViewModeIndex].mode;
        uiManager.updateViewModeDisplay(viewModes[this.currentViewModeIndex].name);
    }
}

export const menuFlowManager = MenuFlowManager.getInstance();