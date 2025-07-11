import { updateLanguageDisplay, previousLanguage, nextLanguage, getCurrentTranslation } from '../translations/translations.js';
import { uiManager } from '../ui/UIManager.js';
import { init2D, init3D } from '../engine/GameController.js';
import { GameState, GameMode, ViewMode, AuthState } from '../shared/constants.js';
import { gameStateManager } from './GameStateManager.js';

// Authentication and game state
let authState: AuthState = AuthState.LOGGED_OUT;
let currentUser: {username: string; email?: string} | null = null;

let selectedViewMode: ViewMode = ViewMode.MODE_2D;
let selectedGameMode: GameMode | null = null;

// View mode options for the selection
function getViewModes() {
    const t = getCurrentTranslation();
    return [
        { mode: ViewMode.MODE_2D, name: t.classicMode },
        { mode: ViewMode.MODE_3D, name: t.immersiveMode }
    ];
}
let currentViewModeIndex = 0;

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
    setupAuthenticationListeners();
    setupGameModeListeners();
    setupPlayerSetupListeners();
    setupKeyboardListeners();
    setupLanguageListeners();
}

function setupAuthenticationListeners(){
    const registerBtn = document.getElementById('register-btn');
    const loginBtn = document.getElementById('login-btn');
    const googleLoginBtn = document.getElementById('google-login-btn');
    const offlineBtn = document.getElementById('offline-btn');

    registerBtn?.addEventListener('click', () => {
        uiManager.showScreen('register-screen');
    });

    loginBtn?.addEventListener('click', () => {
        uiManager.showScreen('login-screen');
    });

    googleLoginBtn?.addEventListener('click', () => {
        handleGoogleLogin();
    });

    offlineBtn?.addEventListener('click', () => {
        handleOfflineMode();
    });

    // Register form listeners
    const registerSubmit = document.getElementById('register-submit');
    const registerBack = document.getElementById('register-back');

    registerSubmit?.addEventListener('click', (e) => {
        e.preventDefault();
        handleRegisterSubmit();
    });
    
    registerBack?.addEventListener('click', () => {
        uiManager.showScreen('main-menu');
    });

    // Login form listeners
    const loginSubmit = document.getElementById('login-submit');
    const loginBack = document.getElementById('login-back');

    loginSubmit?.addEventListener('click', (e) => {
        e.preventDefault();
        handleLoginSubmit();
    });
    
    loginBack?.addEventListener('click', () => {
        uiManager.showScreen('main-menu');
    });
}

function setupGameModeListeners(){
    const viewModeBack = document.getElementById('view-mode-back');
    const viewModeForward = document.getElementById('view-mode-forward');

    viewModeBack?.addEventListener('click', previousViewMode);
    viewModeForward?.addEventListener('click', nextViewMode);

    // Game mode buttons
    const soloMode = document.getElementById('solo-mode');
    const localMode = document.getElementById('local-mode');
    const onlineMode = document.getElementById('online-mode');
    const tournamentMode = document.getElementById('tournament-mode');
    const tournamentOnlineMode = document.getElementById('tournament-online-mode');
    const modeBack = document.getElementById('mode-back');

    soloMode?.addEventListener('click', () => {
        // Solo is always available
        selectedGameMode = GameMode.SINGLE_PLAYER;
        uiManager.showScreen('player-setup-overlay');
        uiManager.showSetupForm('solo');
    });

    localMode?.addEventListener('click', () => {
        // Local mode only available in offline
        if (authState !== AuthState.OFFLINE) {
            alert('Local multiplayer is only available in offline mode!');
            return;
        }
        selectedGameMode = GameMode.TWO_PLAYER_LOCAL;
        uiManager.showScreen('player-setup-overlay');
        uiManager.showSetupForm('local');
    });

    onlineMode?.addEventListener('click', () => {
        // Online mode only available when logged in
        if (authState !== AuthState.LOGGED_IN) {
            alert('Please login or register to play online!');
            return;
        }
        selectedGameMode = GameMode.TWO_PLAYER_REMOTE;
        uiManager.showScreen('player-setup-overlay');
        uiManager.showSetupForm('online');
    });

    tournamentMode?.addEventListener('click', () => {
        // Local tournament only available in offline
        if (authState !== AuthState.OFFLINE) {
            alert('Local tournament is only available in offline mode!');
            return;
        }
        selectedGameMode = GameMode.TOURNAMENT_LOCAL; // You might need to add this enum value
        uiManager.showScreen('player-setup-overlay');
        uiManager.showSetupForm('local'); // or create a tournament setup form
    });

    tournamentOnlineMode?.addEventListener('click', () => {
        // Online tournament only available when logged in
        if (authState !== AuthState.LOGGED_IN) {
            alert('Please login or register to play online tournaments!');
            return;
        }
        selectedGameMode = GameMode.TOURNAMENT_REMOTE;
        uiManager.showScreen('player-setup-overlay');
        uiManager.showSetupForm('online');
    });

    modeBack?.addEventListener('click', () => {
        selectedGameMode = null;
        uiManager.showScreen('main-menu');
    });
}

function setupPlayerSetupListeners() {
    const setupBack = document.getElementById('setup-back');
    const startGame = document.getElementById('start-game');

    setupBack?.addEventListener('click', () => {
        selectedGameMode = null;
        uiManager.showScreen('game-mode-overlay');
    });

    startGame?.addEventListener('click', () => {
        if (selectedGameMode === null) return;

        // Validate player names
        if (!uiManager.validatePlayerSetup(selectedGameMode)) {
            return;
        }

        // Get player names
        const playerNames = uiManager.getPlayerNames(selectedGameMode);
        const viewModes = getViewModes();
        console.log('Starting game with players:', playerNames);
        console.log('View mode:', viewModes[currentViewModeIndex].name);
        console.log('Game mode:', selectedGameMode);
        console.log('Auth state:', authState);

        // Start the game
        startGameWithMode(selectedViewMode, selectedGameMode);
    });
}

function setupKeyboardListeners() {
    document.addEventListener('keydown', handleEscKey);
    document.addEventListener('keydown', handleYesNoKey);
}

function setupLanguageListeners() {
    const backBtn = document.getElementById('back');
    const forwardBtn = document.getElementById('forward');

    backBtn?.addEventListener('click', previousLanguage);
    forwardBtn?.addEventListener('click', nextLanguage);
}

function handleRegisterSubmit() {
    const username = (document.getElementById('register-username') as HTMLInputElement)?.value.trim();
    const email = (document.getElementById('register-email') as HTMLInputElement)?.value.trim();
    const password = (document.getElementById('register-password') as HTMLInputElement)?.value;
    const confirmPassword = (document.getElementById('register-confirm-password') as HTMLInputElement)?.value;

    // Basic validation
    if (!username || !email || !password || !confirmPassword) {
        alert('Please fill in all fields');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    // TODO: Implement actual registration logic with backend
    console.log('Register attempt:', { username, email });
    
    // For now, simulate successful registration
    currentUser = { username, email };
    authState = AuthState.LOGGED_IN;
    proceedToGameSelection();
}

function handleLoginSubmit() {
    const usernameOrEmail = (document.getElementById('login-username') as HTMLInputElement)?.value.trim();
    const password = (document.getElementById('login-password') as HTMLInputElement)?.value;

    // Basic validation
    if (!usernameOrEmail || !password) {
        alert('Please fill in all fields');
        return;
    }

    // TODO: Implement actual login logic with backend
    console.log('Login attempt:', { usernameOrEmail });
    
    // For now, simulate successful login
    currentUser = { username: usernameOrEmail };
    authState = AuthState.LOGGED_IN;
    proceedToGameSelection();
}

function handleGoogleLogin() {
    // TODO: Implement Google OAuth
    console.log('Google login clicked - to be implemented by KELLY');
    alert('Google login will be implemented by KELLY');
    
}

function handleOfflineMode() {
    authState = AuthState.OFFLINE;
    currentUser = null;
    console.log('Entering offline mode');
    proceedToGameSelection();
}

// View mode navigation (Classic/Immersive)
function previousViewMode() {
    const viewModes = getViewModes();
    currentViewModeIndex = (currentViewModeIndex - 1 + viewModes.length) % viewModes.length;
    selectedViewMode = viewModes[currentViewModeIndex].mode;
    updateViewModeDisplay();
}

function nextViewMode() {
    const viewModes = getViewModes();
    currentViewModeIndex = (currentViewModeIndex + 1) % viewModes.length;
    selectedViewMode = viewModes[currentViewModeIndex].mode;
    updateViewModeDisplay();
}

function updateViewModeDisplay() {
    const viewModes = getViewModes();
    const viewModeDisplay = document.getElementById('view-mode-display');
    if (viewModeDisplay) {
        viewModeDisplay.textContent = viewModes[currentViewModeIndex].name;
    }
}

// Navigation functions
function proceedToGameSelection() {
    uiManager.showScreen('game-mode-overlay');
    updateViewModeDisplay(); // Initialize the view mode display
}

// Game starting logic
function startGameWithMode(viewMode: ViewMode, gameMode: GameMode) {
    if (viewMode === ViewMode.MODE_2D) {
        uiManager.showScreen('game-2d');
        gameStateManager.setState(GameState.PLAYING_2D);
        setTimeout(() => init2D(gameMode), 100);
    } else {
        uiManager.showScreen('game-3d');
        gameStateManager.setState(GameState.PLAYING_3D);
        setTimeout(() => init3D(gameMode), 100);
    }
}

// Keyboard handlers
function handleEscKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
        if (gameStateManager.isInGame())
            gameStateManager.pauseCurrentGame();
        else if (gameStateManager.isPaused())
            gameStateManager.resumeGame();
    }
}

function handleYesNoKey(event: KeyboardEvent): void {
    if (gameStateManager.isPaused()) {
        if (event.key === 'Y' || event.key === 'y')
            gameStateManager.exitToMenu();
        else if (event.key === 'N' || event.key === 'n')
            gameStateManager.resumeGame();
    }
}

// Utility functions for external access
export function getCurrentUser() {
    return currentUser;
}

export function getAuthState() {
    return authState;
}

export function isUserAuthenticated() {
    return authState === AuthState.LOGGED_IN;
}

export function isInOfflineMode() {
    return authState === AuthState.OFFLINE;
}

export function logout() {
    authState = AuthState.LOGGED_OUT;
    currentUser = null;
    selectedGameMode = null;
    uiManager.showScreen('main-menu');
}

// Initialize the application
document.addEventListener('DOMContentLoaded', loadPage);