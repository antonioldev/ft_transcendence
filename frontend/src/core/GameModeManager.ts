import { GameMode, ViewMode, AuthState } from '../shared/constants.js';
import { uiManager } from '../ui/UIManager.js';
import { authManager } from './AuthManager.js';
import { getCurrentTranslation } from '../translations/translations.js';
import { startGameWithMode } from './GameStarter.js';

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
        uiManager.showScreen('game-mode-overlay');
        gameModeManager.updateViewModeDisplay();
        gameModeManager.updateButtonStates();
    }

    private updateButtonStates(): void {
        const t = getCurrentTranslation();
        const authState = authManager.getAuthState();
        
        // Get all buttons
        const soloMode = document.getElementById('solo-mode') as HTMLButtonElement;
        const localMode = document.getElementById('local-mode') as HTMLButtonElement;
        const onlineMode = document.getElementById('online-mode') as HTMLButtonElement;
        const tournamentMode = document.getElementById('tournament-mode') as HTMLButtonElement;
        const tournamentOnlineMode = document.getElementById('tournament-online-mode') as HTMLButtonElement;
    
        if (authState === AuthState.LOGGED_IN) {
            // Enable online modes
            this.enableButton(onlineMode);
            this.enableButton(tournamentOnlineMode);
            
            // Disable local modes
            this.disableButton(localMode, t.availableOnlyOffline);
            this.disableButton(tournamentMode, t.availableOnlyOffline);
        } else if (authState === AuthState.OFFLINE) {
            // Enable local modes
            this.enableButton(localMode);
            this.enableButton(tournamentMode);
            
            // Disable online modes
            this.disableButton(onlineMode, t.loginRequired);
            this.disableButton(tournamentOnlineMode, t.loginRequired);
        }
        
        // Solo is always enabled
        this.enableButton(soloMode);
    }
    
    private enableButton(button: HTMLButtonElement | null): void {
        if (!button) return;
        
        button.disabled = false;
        button.classList.remove('disabled');
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
        button.title = '';
    }
    
    private disableButton(button: HTMLButtonElement | null, reason: string): void {
        if (!button) return;
        
        button.disabled = true;
        button.classList.add('disabled');
        button.style.opacity = '0.5';
        button.style.cursor = 'not-allowed';
        button.title = reason; // Show reason on hover
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
            this.selectedGameMode = GameMode.SINGLE_PLAYER;
            uiManager.showScreen('player-setup-overlay');
            uiManager.showSetupForm('solo');
        });

        localMode?.addEventListener('click', () => {
            this.selectedGameMode = GameMode.TWO_PLAYER_LOCAL;
            uiManager.showScreen('player-setup-overlay');
            uiManager.showSetupForm('local');
        });

        onlineMode?.addEventListener('click', () => {
            this.selectedGameMode = GameMode.TWO_PLAYER_REMOTE;
            uiManager.showScreen('player-setup-overlay');
            uiManager.showSetupForm('online');
        });

        tournamentMode?.addEventListener('click', () => {
            this.selectedGameMode = GameMode.TOURNAMENT_LOCAL || GameMode.TWO_PLAYER_LOCAL;
            uiManager.showScreen('player-setup-overlay');
            uiManager.showSetupForm('local');
        });

        tournamentOnlineMode?.addEventListener('click', () => {
            this.selectedGameMode = GameMode.TOURNAMENT_REMOTE;
            uiManager.showScreen('player-setup-overlay');
            uiManager.showSetupForm('online');
        });

        modeBack?.addEventListener('click', () => {
            this.selectedGameMode = null;
            uiManager.showScreen('main-menu');
        });

        // Player setup listeners
        this.setupPlayerSetupListeners();
    }

    private setupPlayerSetupListeners(): void {
        const setupBack = document.getElementById('setup-back');
        const startGame = document.getElementById('start-game');

        setupBack?.addEventListener('click', () => {
            this.selectedGameMode = null;
            uiManager.showScreen('game-mode-overlay');
        });

        startGame?.addEventListener('click', () => {
            if (this.selectedGameMode === null) return;

            // Validate player names
            if (!uiManager.validatePlayerSetup(this.selectedGameMode)) {
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

    // Public getters for external access
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