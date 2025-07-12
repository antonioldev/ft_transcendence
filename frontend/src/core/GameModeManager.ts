import { GameMode, ViewMode, AuthState, ConnectionStatus } from '../shared/constants.js';
import { uiManager } from '../ui/UIManager.js';
import { authManager } from './AuthManager.js';
import { getCurrentTranslation } from '../translations/translations.js';
import { startGameWithMode } from './GameStarter.js';
import { historyManager } from './HistoryManager.js';
import { webSocketClient } from '../game/WebSocketClient.js';

export class GameModeManager {
    private static instance: GameModeManager;
    private selectedViewMode: ViewMode = ViewMode.MODE_2D;
    private selectedGameMode: GameMode | null = null;
    private currentViewModeIndex = 0;

    static getInstance(): GameModeManager {
        if (!GameModeManager.instance) {
            GameModeManager.instance = new GameModeManager();
        }
        return GameModeManager.instance;
    }

    static initialize(): void {
        const gameModeManager = GameModeManager.getInstance();
        gameModeManager.setupEventListeners();
    }

    static showGameModeSelection(): void {
        const gameModeManager = GameModeManager.getInstance();
        historyManager.goToGameMode();
        // uiManager.showScreen('game-mode-overlay');
        gameModeManager.updateViewModeDisplay();
        gameModeManager.updateButtonStates();
    }

    private updateButtonStates(): void {
        const t = getCurrentTranslation();
        const isLoggedIn = authManager.isUserAuthenticated();
        const isOnline = webSocketClient.getConnectionStatus() === ConnectionStatus.CONNECTED;
        
        uiManager.setButtonState('solo-mode', 'enabled');
        
        if (isLoggedIn && isOnline) {
            // Enable online modes
            uiManager.setButtonState('online-mode', 'enabled');
            uiManager.setButtonState('tournament-online-mode', 'enabled');
            
            // Disable local modes
            uiManager.setButtonState('local-mode', 'disabled', t.availableOnlyOffline);
            uiManager.setButtonState('tournament-mode', 'disabled', t.availableOnlyOffline);
        } else {
            // Enable local modes
            uiManager.setButtonState('local-mode', 'enabled');
            uiManager.setButtonState('tournament-mode', 'enabled');
            
            // Disable online modes with appropriate message
            if (!isOnline) {
                uiManager.setButtonState('online-mode', 'disabled', 'Connection required');
                uiManager.setButtonState('tournament-online-mode', 'disabled', 'Connection required');
            } else {
                uiManager.setButtonState('online-mode', 'disabled', t.loginRequired);
                uiManager.setButtonState('tournament-online-mode', 'disabled', t.loginRequired);
            }
        }
    }

    private setupEventListeners(): void {
        // View mode navigation
        const viewModeBack = document.getElementById('view-mode-back');
        const viewModeForward = document.getElementById('view-mode-forward');

        viewModeBack?.addEventListener('click', () => this.previousViewMode());
        viewModeForward?.addEventListener('click', () => this.nextViewMode());

        // Game mode buttons
        const soloMode = document.getElementById('solo-mode');
        const localMode = document.getElementById('local-mode');
        const onlineMode = document.getElementById('online-mode');
        const tournamentMode = document.getElementById('tournament-mode');
        const tournamentOnlineMode = document.getElementById('tournament-online-mode');
        const modeBack = document.getElementById('mode-back');

        soloMode?.addEventListener('click', () => {
            this.handleGameModeSelection(GameMode.SINGLE_PLAYER, 'solo');
        });

        localMode?.addEventListener('click', () => {
            this.handleGameModeSelection(GameMode.TWO_PLAYER_LOCAL, 'local');
        });

        onlineMode?.addEventListener('click', () => {
            // Check if user is logged in before allowing online mode
            if (authManager.isUserAuthenticated()) {
                this.handleGameModeSelection(GameMode.TWO_PLAYER_REMOTE, 'online');
            } else {
                // Show login modal if user tries to access online mode
                const t = getCurrentTranslation();
                alert(t.loginRequired);
                uiManager.showModal('login-modal');
            }
        });

        tournamentMode?.addEventListener('click', () => {
            this.handleGameModeSelection(GameMode.TOURNAMENT_LOCAL || GameMode.TWO_PLAYER_LOCAL, 'local');
        });

        tournamentOnlineMode?.addEventListener('click', () => {
            // Check if user is logged in before allowing online tournament
            if (authManager.isUserAuthenticated()) {
                this.handleGameModeSelection(GameMode.TOURNAMENT_REMOTE, 'online');
            } else {
                // Show login modal if user tries to access online tournament
                const t = getCurrentTranslation();
                alert(t.loginRequired);
                uiManager.showModal('login-modal');
            }
        });

        modeBack?.addEventListener('click', () => {
            this.selectedGameMode = null;
            // uiManager.showScreen('main-menu');
            historyManager.goToMainMenu()
        });

        // Player setup listeners
        this.setupPlayerSetupListeners();
    }

    // NEW: Unified game mode selection handler
    private handleGameModeSelection(gameMode: GameMode, setupFormType: string): void {
        this.selectedGameMode = gameMode;
        historyManager.goToPlayerSetup()
        // uiManager.showScreen('player-setup-overlay');
        uiManager.showSetupForm(setupFormType);
        
        // Pre-fill player name if user is logged in
        this.prefillPlayerNames();
    }

    // NEW: Pre-fill player names for logged in users
    private prefillPlayerNames(): void {
        const currentUser = authManager.getCurrentUser();
        if (!currentUser) return;

        // Pre-fill single player name fields with logged in username
        const soloInput = document.getElementById('player1-name') as HTMLInputElement;
        const onlineInput = document.getElementById('player1-name-online') as HTMLInputElement;
        
        if (soloInput && !soloInput.value) {
            soloInput.value = currentUser.username;
        }
        
        if (onlineInput && !onlineInput.value) {
            onlineInput.value = currentUser.username;
        }
    }

    private setupPlayerSetupListeners(): void {
        const setupBack = document.getElementById('setup-back');
        const startGame = document.getElementById('start-game');

        setupBack?.addEventListener('click', () => {
            this.selectedGameMode = null;
            historyManager.goToGameMode();
            // uiManager.showScreen('game-mode-overlay');
        });

        startGame?.addEventListener('click', () => {
            if (this.selectedGameMode === null) return;

            // Validate player names
            if (!uiManager.validatePlayerSetup(this.selectedGameMode)) {
                const t = getCurrentTranslation();
                alert(t.pleaseFilllAllFields);
                return;
            }

            // Get player names
            const playerNames = uiManager.getPlayerNames(this.selectedGameMode);
            const viewModes = this.getViewModes();
            
            console.log('Starting game with players:', playerNames);
            console.log('View mode:', viewModes[this.currentViewModeIndex].name);
            console.log('Game mode:', this.selectedGameMode);
            console.log('Auth state:', authManager.getAuthState());

            // Start the game
            startGameWithMode(this.selectedViewMode, this.selectedGameMode);
        });
    }

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

// Export singleton instance
export const gameModeManager = GameModeManager.getInstance();