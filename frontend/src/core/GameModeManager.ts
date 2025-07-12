import { GameMode, ViewMode, AuthState, ConnectionStatus } from '../shared/constants.js';
import { uiManager } from '../ui/UIManager.js';
import { authManager } from './AuthManager.js';
import { getCurrentTranslation } from '../translations/translations.js';
import { startGameWithMode } from './GameStarter.js';
import { historyManager } from './HistoryManager.js';
import { webSocketClient } from '../game/WebSocketClient.js';
import { clearInput } from './utils.js';

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
        
        if (isOnline)
        {
            uiManager.setButtonState('solo-mode', 'enabled');
            if (isLoggedIn) {
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
                // Disable online modes
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

        // Game mode buttons - UPDATED with direct logic
        const soloMode = document.getElementById('solo-mode');
        const localMode = document.getElementById('local-mode');
        const onlineMode = document.getElementById('online-mode');
        const tournamentMode = document.getElementById('tournament-mode');
        const tournamentOnlineMode = document.getElementById('tournament-online-mode');
        const modeBack = document.getElementById('mode-back');

        // ✅ SOLO MODE - direct logic
        soloMode?.addEventListener('click', () => {
            this.selectedGameMode = GameMode.SINGLE_PLAYER;
            
            if (authManager.isUserAuthenticated()) {
                console.log('Solo: logged in user, starting game directly');
                startGameWithMode(this.selectedViewMode, GameMode.SINGLE_PLAYER);
                return;
            }
            
            console.log('Solo: guest user, showing setup');
            historyManager.goToPlayerSetup();
            uiManager.showSetupForm('solo');
            this.clearPlayerNameFields();
        });

        // ✅ LOCAL MODE - direct logic
        localMode?.addEventListener('click', () => {
            if (authManager.isUserAuthenticated()) {
                // Shouldn't happen (button disabled), but just in case
                alert('Local mode not available for logged in users');
                return;
            }
            
            this.selectedGameMode = GameMode.TWO_PLAYER_LOCAL;
            console.log('Local: guest user, showing setup');
            historyManager.goToPlayerSetup();
            uiManager.showSetupForm('local');
            this.clearPlayerNameFields();
        });

        // ✅ ONLINE MODE - direct logic
        onlineMode?.addEventListener('click', () => {
            if (!authManager.isUserAuthenticated()) {
                const t = getCurrentTranslation();
                alert(t.loginRequired);
                return;
            }
            
            this.selectedGameMode = GameMode.TWO_PLAYER_REMOTE;
            console.log('Online: logged in user, starting game directly');
            startGameWithMode(this.selectedViewMode, GameMode.TWO_PLAYER_REMOTE);
        });

        // ✅ TOURNAMENT LOCAL - direct logic
        tournamentMode?.addEventListener('click', () => {
            if (authManager.isUserAuthenticated()) {
                // Shouldn't happen (button disabled), but just in case
                alert('Local tournament not available for logged in users');
                return;
            }
            
            this.selectedGameMode = GameMode.TOURNAMENT_LOCAL;
            console.log('Tournament Local: guest user, showing setup');
            historyManager.goToPlayerSetup();
            uiManager.showSetupForm('local'); // Uses same form as local 2P
            this.clearPlayerNameFields();
        });

        // ✅ TOURNAMENT ONLINE - direct logic
        tournamentOnlineMode?.addEventListener('click', () => {
            if (!authManager.isUserAuthenticated()) {
                const t = getCurrentTranslation();
                alert(t.loginRequired);
                return;
            }
            
            this.selectedGameMode = GameMode.TOURNAMENT_REMOTE;
            console.log('Tournament Online: logged in user, starting game directly');
            startGameWithMode(this.selectedViewMode, GameMode.TOURNAMENT_REMOTE);
        });

        modeBack?.addEventListener('click', () => {
            this.selectedGameMode = null;
            historyManager.goToMainMenu();
        });

        // Player setup listeners - KEEP UNCHANGED
        this.setupPlayerSetupListeners();
    }

    private clearPlayerNameFields(): void {
        clearInput('player1-name');           // Solo
        clearInput('player1-name-local');     // Local 2P
        clearInput('player2-name-local');     // Local 2P
    }

    // NEW: Unified game mode selection handler
    // private handleGameModeSelection(gameMode: GameMode, setupFormType: string): void {
    //     this.selectedGameMode = gameMode;
    //     historyManager.goToPlayerSetup()
    //     // uiManager.showScreen('player-setup-overlay');
    //     uiManager.showSetupForm(setupFormType);
        
    //     // Pre-fill player name if user is logged in
    //     this.prefillPlayerNames();
    // }

    // NEW: Pre-fill player names for logged in users
    // private prefillPlayerNames(): void {
    //     const currentUser = authManager.getCurrentUser();
    //     if (!currentUser) return;

    //     // Pre-fill single player name fields with logged in username
    //     const soloInput = document.getElementById('player1-name') as HTMLInputElement;
    //     const onlineInput = document.getElementById('player1-name-online') as HTMLInputElement;
        
    //     if (soloInput && !soloInput.value) {
    //         soloInput.value = currentUser.username;
    //     }
        
    //     if (onlineInput && !onlineInput.value) {
    //         onlineInput.value = currentUser.username;
    //     }
    // }

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