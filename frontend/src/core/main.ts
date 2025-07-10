import { updateLanguageDisplay, previousLanguage, nextLanguage } from '../translations/translations.js';
import { uiManager } from '../ui/UIManager.js';
import { init2D, init3D } from '../engine/GameController.js';  // ✅ Updated import path
import { GameState, GameMode, ViewMode } from '../shared/constants.js';
import { gameStateManager } from './GameStateManager.js';

let selectedViewMode: ViewMode | null = null;
let selectedGameMode: GameMode | null = null;

// Main entry point for the application. Handles initialization and event setup.
function loadPage() {
    // Initialize UI styles and language display, then set up event listeners.
    uiManager.initializeStyles();
    updateLanguageDisplay();
    setupEventListeners();

    // Display the main menu screen.
    uiManager.showScreen('main-menu');
}

// Sets up all necessary event listeners for the application.
function setupEventListeners() {
    // Handle keyboard events for Escape and Yes/No keys.
    document.addEventListener('keydown', handleEscKey);
    document.addEventListener('keydown', handleYesNoKey);

    // Event listeners for game mode and language navigation buttons.
    const play2D = document.getElementById('play2D');
    const play3D = document.getElementById('play3D');
    const backBtn = document.getElementById('back');
    const forwardBtn = document.getElementById('forward');

    play2D?.addEventListener('click', () => {
        selectedViewMode = ViewMode.MODE_2D;
        uiManager.showScreen('game-mode-overlay');
    });

    play3D?.addEventListener('click', () => {
        selectedViewMode = ViewMode.MODE_3D;
        uiManager.showScreen('game-mode-overlay');
    });

    backBtn?.addEventListener('click', previousLanguage);
    forwardBtn?.addEventListener('click', nextLanguage);

    // Game mode selection buttons
    const soloMode = document.getElementById('solo-mode');
    const localMode = document.getElementById('local-mode');
    const onlineMode = document.getElementById('online-mode');
    const modeBack = document.getElementById('mode-back');

    soloMode?.addEventListener('click', () => {
        selectedGameMode = GameMode.SINGLE_PLAYER;
        uiManager.showScreen('player-setup-overlay');
        uiManager.showSetupForm('solo');
    });

    localMode?.addEventListener('click', () => {
        selectedGameMode = GameMode.TWO_PLAYER_LOCAL;
        uiManager.showScreen('player-setup-overlay');
        uiManager.showSetupForm('local');
    });

    onlineMode?.addEventListener('click', () => {
        selectedGameMode = GameMode.TWO_PLAYER_REMOTE;
        uiManager.showScreen('player-setup-overlay');
        uiManager.showSetupForm('online');
    });

    modeBack?.addEventListener('click', () => {
        selectedViewMode = null;
        uiManager.showScreen('main-menu');
    });

    // Player setup buttons.
    const setupBack = document.getElementById('setup-back');
    const startGame = document.getElementById('start-game');

    setupBack?.addEventListener('click', () => {
        selectedGameMode = null;
        uiManager.showScreen('game-mode-overlay');
    });

    startGame?.addEventListener('click', () => {
        if (selectedViewMode === null || selectedGameMode === null) return;

        // Validate player names
        if (!uiManager.validatePlayerSetup(selectedGameMode)) {
            return;
        }

        // Get player names for future use
        const playerNames = uiManager.getPlayerNames(selectedGameMode);
        console.log('Starting game with players:', playerNames);

        // Start the game
        startGameWithMode(selectedViewMode, selectedGameMode);
    });
}

// Starts the game with the selected view mode and game mode.
function startGameWithMode(viewMode: ViewMode, gameMode: GameMode) {
    if (viewMode === ViewMode.MODE_2D) {
        // Initialize and start the 2D game.
        uiManager.showScreen('game-2d');
        gameStateManager.setState(GameState.PLAYING_2D);
        setTimeout(() => init2D(gameMode), 100);
    } else {
        // Initialize and start the 3D game.
        uiManager.showScreen('game-3d');
        gameStateManager.setState(GameState.PLAYING_3D);
        setTimeout(() => init3D(gameMode), 100);
    }
}

// Handles the Escape key press to pause or resume the game.
function handleEscKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
        const currentState: GameState = gameStateManager.getCurrentState();
        if (gameStateManager.isInGame())
            gameStateManager.pauseCurrentGame();
        else if (gameStateManager.isPaused())
            gameStateManager.resumeGame();
    }
}

// Handles Yes/No key presses during a paused game to exit or resume.
function handleYesNoKey(event: KeyboardEvent): void {
    if (gameStateManager.isPaused()) {
        if (event.key === 'Y' || event.key === 'y')
            gameStateManager.exitToMenu();
        else if (event.key === 'N' || event.key === 'n')
            gameStateManager.resumeGame();
    }
}

// Load the page once the DOM content is fully loaded.
document.addEventListener('DOMContentLoaded', loadPage);