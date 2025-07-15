import { updateLanguageDisplay, previousLanguage, nextLanguage } from '../translations/translations.js';
import { uiManager } from '../ui/UIManager.js';
import { init2D, init3D } from '../engine/GameController.js';  // ✅ Updated import path
import { GameState, GameMode, ViewMode } from '../shared/constants.js';
import { gameStateManager } from './GameStateManager.js';

// Global Type Declaration for Google GSI Client
declare global {
    interface Window {
        google: typeof google.accounts;
        handleCredentialResponse: (response: { credential: string }) => void;
        GOOGLE_CLIENT_ID: string
    }
}

let selectedViewMode: ViewMode | null = null;
let selectedGameMode: GameMode | null = null;

const googleSignInContainer = document.getElementById('g_id_signin_container') as HTMLDivElement | null;
let googleScriptLoaded: boolean = false;

window.handleCredentialResponse = async (response: { credential: string }) => {
    console.log("Encoded JWT ID token: " + response.credential);

    try {
        const backendResponse = await fetch('http://localhost:3000/api/auth/google', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: response.credential }),
        });

        if (!backendResponse.ok) {
            const errorData = await backendResponse.json();
            throw new Error('Failed to authenticate with backend');
        }

        const { sessionToken } = await backendResponse.json();
        console.log("Backend authentication successful. Token:", sessionToken);
        // TODO: Armazene o 'sessionToken' para usar em futuras requisições autenticadas.
        // ex: sessionStorage.setItem('sessionToken', sessionToken);

    const player1NameOnlineInput = document.getElementById('player1-name-online') as HTMLInputElement | null;
    if (player1NameOnlineInput) {
        player1NameOnlineInput.value = "Google User Logged In!";
        player1NameOnlineInput.disabled = true; // Prevent editing after Google login
    }
    alert("Google Sign-In Successful! Check console for token.");
    } catch (error) {
        console.error("Login error: ", error);
        alert("Login error occured.");
}
};

function loadGoogleSignIn(): void {
    if (googleScriptLoaded) {
        console.log("Google GSI script already loaded.");
        renderGoogleSignInButton();
        return;
    }

    console.log("Loading Google GSI script...");
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
        googleScriptLoaded = true;
        console.log("Google GSI script loaded.");
        renderGoogleSignInButton();
    };
    document.head.appendChild(script);
}

function renderGoogleSignInButton(): void {
    const googleClientId = window.GOOGLE_CLIENT_ID;
    
    if (!googleClientId) {
        console.error("Google Client ID is not set.");
        return;
    }

    if (window.google && window.google.accounts && window.google.accounts.id && googleSignInContainer) {
        window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: window.handleCredentialResponse,
        });

        // Clear any existing content in the container before rendering
        googleSignInContainer.innerHTML = '';

        window.google.accounts.id.renderButton(
            googleSignInContainer,
            { size: "large", type: "standard", shape: "pill", theme: "filled_blue" }
        );
    } else {
        console.error("Google GSI client not ready or container not found.");
    }   
}

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
        loadGoogleSignIn();
    });

    localMode?.addEventListener('click', () => {
        selectedGameMode = GameMode.TWO_PLAYER_LOCAL;
        uiManager.showScreen('player-setup-overlay');
        uiManager.showSetupForm('local');
        if (googleSignInContainer) googleSignInContainer.innerHTML = '';
    });

    onlineMode?.addEventListener('click', () => {
        selectedGameMode = GameMode.TWO_PLAYER_REMOTE;
        uiManager.showScreen('player-setup-overlay');
        uiManager.showSetupForm('online');
        loadGoogleSignIn();
    });

    modeBack?.addEventListener('click', () => {
        selectedViewMode = null;
        uiManager.showScreen('main-menu');
        if (googleSignInContainer) googleSignInContainer.innerHTML = '';
    });

    // Player setup buttons.
    const setupBack = document.getElementById('setup-back');
    const startGame = document.getElementById('start-game');

    setupBack?.addEventListener('click', () => {
        selectedGameMode = null;
        uiManager.showScreen('game-mode-overlay');
        if (googleSignInContainer) googleSignInContainer.innerHTML = '';
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