import { GameMode, ViewMode, AuthState, ConnectionStatus } from '../shared/constants.js';
import { uiManager } from '../ui/UIManager.js';
import { authManager } from './AuthManager.js';
import { getCurrentTranslation } from '../translations/translations.js';
import { historyManager } from './HistoryManager.js';
import { webSocketClient } from '../game/WebSocketClient.js';
import { gameStateManager } from './GameStateManager.js';
import { init2D, init3D } from '../engine/GameController.js';
import { clearInput } from './utils.js';

/**
 * Manages game mode selection, view mode preferences, player setup workflow,
 * and coordinates the actual game starting process.
 * Handles the logic for enabling/disabling different game modes based on
 * authentication state and connection status.
 */
export class GameModeManager {
    private static instance: GameModeManager;
    private selectedViewMode: ViewMode = ViewMode.MODE_2D;
    private selectedGameMode: GameMode | null = null;
    private currentViewModeIndex = 0;

    // ========================================
    // SINGLETON PATTERN
    // ========================================
    /**
     * Gets the singleton instance of GameModeManager.
     * @returns The singleton instance.
     */
    static getInstance(): GameModeManager {
        if (!GameModeManager.instance) {
            GameModeManager.instance = new GameModeManager();
        }
        return GameModeManager.instance;
    }

    /**
     * Initializes the GameModeManager by setting up event listeners.
     */
    static initialize(): void {
        const gameModeManager = GameModeManager.getInstance();
        gameModeManager.setupEventListeners();
    }

    /**
     * Shows the game mode selection interface and updates UI state.
     */
    static showGameModeSelection(): void {
        const gameModeManager = GameModeManager.getInstance();
        historyManager.goToGameMode();
        gameModeManager.updateViewModeDisplay();
        gameModeManager.updateButtonStates();
    }

    // ========================================
    // GAME STARTING COORDINATION
    // ========================================
    /**
     * Starts a game with the specified view mode and game mode.
     * Coordinates UI updates, navigation, and engine initialization.
     * @param viewMode - The view mode (2D or 3D) to start the game in.
     * @param gameMode - The game mode to start.
     */
    private startGameWithMode(viewMode: ViewMode, gameMode: GameMode): void {
        console.log(`Starting game: ${GameMode[gameMode]} in ${ViewMode[viewMode]} mode`);
        
        // Hide user info during game
        uiManager.hideUserInfo();
        
        // Navigate to appropriate game screen and update state
        if (viewMode === ViewMode.MODE_2D) {
            historyManager.goToGame2D();
            gameStateManager.startGame(ViewMode.MODE_2D);
            // Small delay to ensure UI transition completes
            setTimeout(() => init2D(gameMode), 100);
        } else {
            historyManager.goToGame3D();
            gameStateManager.startGame(ViewMode.MODE_3D);
            setTimeout(() => init3D(gameMode), 100);
        }
    }

    // ========================================
    // UI STATE MANAGEMENT
    // ========================================
    /**
     * Updates the enabled/disabled state of game mode buttons based on
     * authentication status and connection state.
     */
    private updateButtonStates(): void {
        const t = getCurrentTranslation();
        const isLoggedIn = authManager.isUserAuthenticated();
        const isOnline = webSocketClient.getConnectionStatus() === ConnectionStatus.CONNECTED;
        
        if (isOnline)
        {
            // Solo mode is always available when online
            uiManager.setButtonState('solo-mode', 'enabled');
            
            if (isLoggedIn) {
                // Enable online modes for authenticated users
                uiManager.setButtonState('online-mode', 'enabled');
                uiManager.setButtonState('tournament-online-mode', 'enabled');
                // Disable local modes for logged-in users
                uiManager.setButtonState('local-mode', 'disabled', t.availableOnlyOffline);
                uiManager.setButtonState('tournament-mode', 'disabled', t.availableOnlyOffline);
            } else {
                // Enable local modes for guest users
                uiManager.setButtonState('local-mode', 'enabled');
                uiManager.setButtonState('tournament-mode', 'enabled');
                // Disable online modes for non-authenticated users
                uiManager.setButtonState('online-mode', 'disabled', t.loginRequired);
                uiManager.setButtonState('tournament-online-mode', 'disabled', t.loginRequired);
            }
        }
    }

    // ========================================
    // EVENT LISTENERS SETUP
    // ========================================
    /**
     * Sets up all event listeners for game mode selection and view mode controls.
     */
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

        // Setup individual game mode handlers
        this.setupSoloModeHandler(soloMode);
        this.setupLocalModeHandler(localMode);
        this.setupOnlineModeHandler(onlineMode);
        this.setupTournamentModeHandler(tournamentMode);
        this.setupTournamentOnlineModeHandler(tournamentOnlineMode);

        // Back button handler
        modeBack?.addEventListener('click', () => {
            this.selectedGameMode = null;
            historyManager.goToMainMenu();
        });

        // Setup player configuration listeners
        this.setupPlayerSetupListeners();
    }

    // ========================================
    // GAME MODE HANDLERS
    // ========================================
    /**
     * Sets up the solo mode button handler.
     * @param soloMode - The solo mode button element.
     */
    private setupSoloModeHandler(soloMode: HTMLElement | null): void {
        soloMode?.addEventListener('click', () => {
            this.selectedGameMode = GameMode.SINGLE_PLAYER;
            
            if (authManager.isUserAuthenticated()) {
                console.log('Solo: logged in user, starting game directly');
                this.startGameWithMode(this.selectedViewMode, GameMode.SINGLE_PLAYER);
                return;
            }
            
            console.log('Solo: guest user, showing setup');
            historyManager.goToPlayerSetup();
            uiManager.showSetupForm('solo');
            this.clearPlayerNameFields();
        });
    }

    /**
     * Sets up the local mode button handler for two-player local games.
     * @param localMode - The local mode button element.
     */
    private setupLocalModeHandler(localMode: HTMLElement | null): void {
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
    }

    /**
     * Sets up the online mode button handler for remote multiplayer games.
     * @param onlineMode - The online mode button element.
     */
    private setupOnlineModeHandler(onlineMode: HTMLElement | null): void {
        onlineMode?.addEventListener('click', () => {
            if (!authManager.isUserAuthenticated()) {
                const t = getCurrentTranslation();
                alert(t.loginRequired);
                return;
            }
            
            this.selectedGameMode = GameMode.TWO_PLAYER_REMOTE;
            console.log('Online: logged in user, starting game directly');
            this.startGameWithMode(this.selectedViewMode, GameMode.TWO_PLAYER_REMOTE);
        });
    }

    /**
     * Sets up the tournament mode button handler for local tournaments.
     * @param tournamentMode - The tournament mode button element.
     */
    private setupTournamentModeHandler(tournamentMode: HTMLElement | null): void {
        tournamentMode?.addEventListener('click', () => {
            if (authManager.isUserAuthenticated()) {
                // Shouldn't happen (button disabled), but just in case
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

    /**
     * Sets up the online tournament mode button handler.
     * @param tournamentOnlineMode - The online tournament mode button element.
     */
    private setupTournamentOnlineModeHandler(tournamentOnlineMode: HTMLElement | null): void {
        tournamentOnlineMode?.addEventListener('click', () => {
            if (!authManager.isUserAuthenticated()) {
                const t = getCurrentTranslation();
                alert(t.loginRequired);
                return;
            }
            
            this.selectedGameMode = GameMode.TOURNAMENT_REMOTE;
            console.log('Tournament Online: logged in user, starting game directly');
            this.startGameWithMode(this.selectedViewMode, GameMode.TOURNAMENT_REMOTE);
        });
    }

    // ========================================
    // PLAYER SETUP MANAGEMENT
    // ========================================
    /**
     * Clears all player name input fields.
     */
    private clearPlayerNameFields(): void {
        clearInput('player1-name');
        clearInput('player1-name-local');
        clearInput('player2-name-local');
    }

    /**
     * Sets up event listeners for the player setup form.
     */
    private setupPlayerSetupListeners(): void {
        const setupBack = document.getElementById('setup-back');
        const startGame = document.getElementById('start-game');

        // Back button from player setup
        setupBack?.addEventListener('click', () => {
            this.selectedGameMode = null;
            historyManager.goToGameMode();
        });

        // Start game button after player setup
        startGame?.addEventListener('click', () => {
            if (this.selectedGameMode === null) return;

            // Validate player names
            if (!uiManager.validatePlayerSetup(this.selectedGameMode)) {
                const t = getCurrentTranslation();
                alert(t.pleaseFilllAllFields);
                return;
            }

            // Get player names and start the game
            const playerNames = uiManager.getPlayerNames(this.selectedGameMode);
            const viewModes = this.getViewModes();
            
            console.log('Starting game with players:', playerNames);
            console.log('View mode:', viewModes[this.currentViewModeIndex].name);
            console.log('Game mode:', this.selectedGameMode);
            console.log('Auth state:', authManager.getAuthState());

            // Start the game with selected parameters
            this.startGameWithMode(this.selectedViewMode, this.selectedGameMode);
        });
    }

    // ========================================
    // VIEW MODE MANAGEMENT
    // ========================================
    /**
     * Gets the available view modes with their localized names.
     * @returns Array of view mode objects with mode and name properties.
     */
    private getViewModes() {
        const t = getCurrentTranslation();
        return [
            { mode: ViewMode.MODE_2D, name: t.classicMode },
            { mode: ViewMode.MODE_3D, name: t.immersiveMode }
        ];
    }

    /**
     * Switches to the previous view mode in the list.
     */
    private previousViewMode(): void {
        const viewModes = this.getViewModes();
        this.currentViewModeIndex = (this.currentViewModeIndex - 1 + viewModes.length) % viewModes.length;
        this.selectedViewMode = viewModes[this.currentViewModeIndex].mode;
        this.updateViewModeDisplay();
    }

    /**
     * Switches to the next view mode in the list.
     */
    private nextViewMode(): void {
        const viewModes = this.getViewModes();
        this.currentViewModeIndex = (this.currentViewModeIndex + 1) % viewModes.length;
        this.selectedViewMode = viewModes[this.currentViewModeIndex].mode;
        this.updateViewModeDisplay();
    }

    /**
     * Updates the view mode display text to show the current selection.
     */
    private updateViewModeDisplay(): void {
        const viewModes = this.getViewModes();
        const viewModeDisplay = document.getElementById('view-mode-display');
        if (viewModeDisplay) {
            viewModeDisplay.textContent = viewModes[this.currentViewModeIndex].name;
        }
    }

    /**
     * Refreshes the button states based on current authentication and connection status.
     */
    public refreshButtonStates(): void {
        this.updateButtonStates();
    }

    /**
     * Gets the currently selected game mode.
     * @returns The selected game mode or null if none selected.
     */
    getSelectedGameMode(): GameMode | null {
        return this.selectedGameMode;
    }

    /**
     * Gets the currently selected view mode.
     * @returns The selected view mode.
     */
    getSelectedViewMode(): ViewMode {
        return this.selectedViewMode;
    }

    /**
     * Resets the selected game mode to null.
     */
    resetGameMode(): void {
        this.selectedGameMode = null;
    }
}

// Export singleton instance
export const gameModeManager = GameModeManager.getInstance();