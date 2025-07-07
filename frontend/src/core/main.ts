import { updateLanguageDisplay, previousLanguage, nextLanguage } from '../ui/translations.js';
import { uiManager } from '../ui/UIManager.js';
import { init2D, init3D } from '../engine/GameEngine.js';
import { GameState, ViewMode } from '../shared/constants.js';
import { gameStateManager} from './GameState.js';

let selectedViewMode: ViewMode | null = null;
let selectedGameMode: string | null = null;

function loadPage() {
    uiManager.initializeStyles();
    updateLanguageDisplay();
    setupEventListeners();

    uiManager.showScreen('main-menu');
}

function setupEventListeners() {
    document.addEventListener('keydown', handleEscKey);
    document.addEventListener('keydown', handleYesNoKey);

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
        selectedGameMode = 'solo';
        uiManager.showScreen('player-setup-overlay');
        uiManager.showSetupForm('solo');
    });

    localMode?.addEventListener('click', () => {
        selectedGameMode = 'local';
        uiManager.showScreen('player-setup-overlay');
        uiManager.showSetupForm('local');
    });

    onlineMode?.addEventListener('click', () => {
        selectedGameMode = 'online';
        uiManager.showScreen('player-setup-overlay');
        uiManager.showSetupForm('online');
    });

    modeBack?.addEventListener('click', () => {
        selectedViewMode = null;
        uiManager.showScreen('main-menu');
    });

    // Player setup buttons
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

function startGameWithMode(viewMode: ViewMode, gameMode: string) {
    if (viewMode === ViewMode.MODE_2D) {
        uiManager.showScreen('game-2d');
        gameStateManager.setState(GameState.PLAYING_2D);
        // setTimeout(() => init2D(gameMode), 100);
        setTimeout(() => init2D(), 100); //TODO add gamemode to init
    } else {
        uiManager.showScreen('game-3d');
        gameStateManager.setState(GameState.PLAYING_3D);
        setTimeout(() => init3D(), 100);
    }
}

function handleEscKey(event: KeyboardEvent): void {
    if (event.key === 'Escape'){
        const currentState: GameState = gameStateManager.getCurrentState();
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

document.addEventListener('DOMContentLoaded', loadPage);

// document.addEventListener('keydown', handleEscKey);
// document.addEventListener('keydown', handleYesNoKey);

// const play2D = document.getElementById('play2D');
// const play3D = document.getElementById('play3D');
// const backBtn = document.getElementById('back');
// const forwardBtn = document.getElementById('forward');

// play2D?.addEventListener('click', async function(): Promise<void> {
//     showOverlay('game-2d');
//     gameStateManager.setState(GameState.PLAYING_2D);
//     setTimeout(() => init2D(), 100);
// });

// play3D?.addEventListener('click', async function(): Promise<void> {
//     showOverlay('game-3d');
//     gameStateManager.setState(GameState.PLAYING_3D);
//     setTimeout(() => init3D(), 100);
// });

// backBtn?.addEventListener('click', previousLanguage);
// forwardBtn?.addEventListener('click', nextLanguage);

