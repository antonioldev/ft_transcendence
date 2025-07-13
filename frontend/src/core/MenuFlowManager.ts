import { GameMode, ViewMode, ConnectionStatus } from '../shared/constants.js';
import { uiManager } from '../ui/UIManager.js';
import { authManager } from './AuthManager.js';
import { getCurrentTranslation } from '../translations/translations.js';
import { historyManager } from './HistoryManager.js';
import { webSocketClient } from './WebSocketClient.js';
import { appStateManager } from './AppStateManager.js';
import { gameController } from '../engine/GameController.js';
import { GameConfigFactory } from '../engine/GameConfig.js';
import { clearInput } from './utils.js';

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

    // ========================================
    // SINGLETON PATTERN
    // ========================================
    static getInstance(): MenuFlowManager {
        if (!MenuFlowManager.instance) {
            MenuFlowManager.instance = new MenuFlowManager();
        }
        return MenuFlowManager.instance;
    }

    static initialize(): void {
        const menuFlowManager = MenuFlowManager.getInstance();
        menuFlowManager.setupEventListeners();
    }

    static showGameModeSelection(): void {
        const menuFlowManager = MenuFlowManager.getInstance();
        historyManager.goToGameMode();
        menuFlowManager.updateViewModeDisplay();
        menuFlowManager.updateButtonStates();
    }

    // ========================================
    // GAME STARTING
    // ========================================
    
    /**
     *  NEW: Simplified game starting using new architecture
     */
    private async startGameWithMode(viewMode: ViewMode, gameMode: GameMode): Promise<void> {
        try {
            console.log(`Starting game: ${GameMode[gameMode]} in ${ViewMode[viewMode]} mode`);
            
            // Hide user info during game
            uiManager.hideUserInfo();
            
            // Navigate to appropriate game screen
            if (viewMode === ViewMode.MODE_2D)
                historyManager.goToGame2D();
            else
                historyManager.goToGame3D();
            
            // Update game state manager
            appStateManager.startGame(viewMode);
            
            // Get players from UI
            const players = GameConfigFactory.getPlayersFromUI(gameMode);
            
            // Create game configuration
            const config = GameConfigFactory.createConfig(viewMode, gameMode, players);
            
            //  SINGLE CLEAN CALL - No more complex initialization chain!
            await gameController.startGame(config);
            
            console.log('Game started successfully with new architecture');
            
        } catch (error) {
            console.error('Error starting game:', error);
            
            // Return to main menu on error
            historyManager.goToMainMenu();
            appStateManager.resetToMenu();
        }
    }

    // ========================================
    // UI STATE MANAGEMENT
    // ========================================
    
    private updateButtonStates(): void {
        const t = getCurrentTranslation();
        const isLoggedIn = authManager.isUserAuthenticated();
        const isOnline = webSocketClient.getConnectionStatus() === ConnectionStatus.CONNECTED;
        
        if (isOnline) {
            uiManager.setButtonState('solo-mode', 'enabled');
            
            if (isLoggedIn) {
                uiManager.setButtonState('online-mode', 'enabled');
                uiManager.setButtonState('tournament-online-mode', 'enabled');
                uiManager.setButtonState('local-mode', 'disabled', t.availableOnlyOffline);
                uiManager.setButtonState('tournament-mode', 'disabled', t.availableOnlyOffline);
            } else {
                uiManager.setButtonState('local-mode', 'enabled');
                uiManager.setButtonState('tournament-mode', 'enabled');
                uiManager.setButtonState('online-mode', 'disabled', t.loginRequired);
                uiManager.setButtonState('tournament-online-mode', 'disabled', t.loginRequired);
            }
        }
    }

    // ========================================
    // EVENT LISTENERS SETUP
    // ========================================
    
    private setupEventListeners(): void {
        // View mode navigation controls
        const viewModeBack = document.getElementById('view-mode-back');
        const viewModeForward = document.getElementById('view-mode-forward');

        viewModeBack?.addEventListener('click', () => this.previousViewMode());
        viewModeForward?.addEventListener('click', () => this.nextViewMode());

        // Game mode selection buttons
        const soloMode = document.getElementById('solo-mode');
        const localMode = document.getElementById('local-mode');
        const onlineMode = document.getElementById('online-mode');
        const tournamentMode = document.getElementById('tournament-mode');
        const tournamentOnlineMode = document.getElementById('tournament-online-mode');
        const modeBack = document.getElementById('mode-back');

        this.setupSoloModeHandler(soloMode);
        this.setupLocalModeHandler(localMode);
        this.setupOnlineModeHandler(onlineMode);
        this.setupTournamentModeHandler(tournamentMode);
        this.setupTournamentOnlineModeHandler(tournamentOnlineMode);

        modeBack?.addEventListener('click', () => {
            this.selectedGameMode = null;
            historyManager.goToMainMenu();
        });

        this.setupPlayerSetupListeners();
    }

    // ========================================
    // GAME MODE HANDLERS
    // ========================================
    
    private setupSoloModeHandler(soloMode: HTMLElement | null): void {
        soloMode?.addEventListener('click', async () => {
            this.selectedGameMode = GameMode.SINGLE_PLAYER;
            
            if (authManager.isUserAuthenticated()) {
                console.log('Solo: logged in user, starting game directly');
                await this.startGameWithMode(this.selectedViewMode, GameMode.SINGLE_PLAYER);
                return;
            }
            
            console.log('Solo: guest user, showing setup');
            historyManager.goToPlayerSetup();
            uiManager.showSetupForm('solo');
            this.clearPlayerNameFields();
        });
    }

    private setupLocalModeHandler(localMode: HTMLElement | null): void {
        localMode?.addEventListener('click', () => {
            if (authManager.isUserAuthenticated()) {
                alert('Local mode not available for logged in users');
                return;
            }
            
            this.selectedGameMode = GameMode.TWO_PLAYER_LOCAL;
            console.log('Local: guest user, showing setup');
            historyManager.goToPlayerSetup();
            uiManager.showSetupForm('local');
            this.clearPlayerNameFields();
        });
    }

    private setupOnlineModeHandler(onlineMode: HTMLElement | null): void {
        onlineMode?.addEventListener('click', async () => {
            if (!authManager.isUserAuthenticated()) {
                const t = getCurrentTranslation();
                alert(t.loginRequired);
                return;
            }
            
            this.selectedGameMode = GameMode.TWO_PLAYER_REMOTE;
            console.log('Online: logged in user, starting game directly');
            await this.startGameWithMode(this.selectedViewMode, GameMode.TWO_PLAYER_REMOTE);
        });
    }

    private setupTournamentModeHandler(tournamentMode: HTMLElement | null): void {
        tournamentMode?.addEventListener('click', () => {
            if (authManager.isUserAuthenticated()) {
                alert('Local tournament not available for logged in users');
                return;
            }
            
            this.selectedGameMode = GameMode.TOURNAMENT_LOCAL;
            console.log('Tournament Local: guest user, showing setup');
            historyManager.goToPlayerSetup();
            uiManager.showSetupForm('local');
            this.clearPlayerNameFields();
        });
    }

    private setupTournamentOnlineModeHandler(tournamentOnlineMode: HTMLElement | null): void {
        tournamentOnlineMode?.addEventListener('click', async () => {
            if (!authManager.isUserAuthenticated()) {
                const t = getCurrentTranslation();
                alert(t.loginRequired);
                return;
            }
            
            this.selectedGameMode = GameMode.TOURNAMENT_REMOTE;
            console.log('Tournament Online: logged in user, starting game directly');
            await this.startGameWithMode(this.selectedViewMode, GameMode.TOURNAMENT_REMOTE);
        });
    }

    // ========================================
    // PLAYER SETUP MANAGEMENT
    // ========================================
    
    private clearPlayerNameFields(): void {
        clearInput('player1-name');
        clearInput('player1-name-local');
        clearInput('player2-name-local');
    }

    private setupPlayerSetupListeners(): void {
        const setupBack = document.getElementById('setup-back');
        const startGame = document.getElementById('start-game');

        setupBack?.addEventListener('click', () => {
            this.selectedGameMode = null;
            historyManager.goToGameMode();
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
        const viewModeDisplay = document.getElementById('view-mode-display');
        if (viewModeDisplay) {
            viewModeDisplay.textContent = viewModes[this.currentViewModeIndex].name;
        }
    }

    // ========================================
    // PUBLIC API
    // ========================================
    
    public refreshButtonStates(): void {
        this.updateButtonStates();
    }

    getSelectedGameMode(): GameMode | null {
        return this.selectedGameMode;
    }

    getSelectedViewMode(): ViewMode {
        return this.selectedViewMode;
    }

    resetGameMode(): void {
        this.selectedGameMode = null;
    }
}

export const menuFlowManager = MenuFlowManager.getInstance();