import { updateLanguageDisplay, previousLanguage, nextLanguage } from './translations.js';
import { applyButtonStyles, applyLanguageStyles, applyTitleStyles, applyOverlayStyles, applyPauseDialogStyles, showOverlay, showPauseDialog } from './styles.js';
import { initBabylon3D} from './game3d/babylon3d.js';
import { initBabylon2D } from './game2d/babylon2d.js';
import { gameStateManager, GameState } from './gameState.js';
import { exitToMenu, resumeGame, pauseCurrentGame } from './GameLifecycle.js';


console.log("Typescript is working!")

function loadPage() {
    applyTitleStyles();
    applyButtonStyles();
    applyLanguageStyles();
    applyOverlayStyles();
    applyPauseDialogStyles()
    updateLanguageDisplay();

}

function handleEscKey(event: KeyboardEvent): void {
    if (event.key === 'Escape'){
        const currentState: GameState = gameStateManager.getCurrentState();
        if (gameStateManager.isInGame())
            pauseCurrentGame();
        else if (gameStateManager.isPaused())
            resumeGame();
    }
}

function handleYesNoKey(event: KeyboardEvent): void {
    if (gameStateManager.isPaused()) {
        if (event.key === 'Y' || event.key === 'y')
            exitToMenu();
        else if (event.key === 'N' || event.key === 'n')
            resumeGame();
    }
}

document.addEventListener('DOMContentLoaded', loadPage);

document.addEventListener('keydown', handleEscKey);
document.addEventListener('keydown', handleYesNoKey);

const play2D = document.getElementById('play2D');
const play3D = document.getElementById('play3D');
const backBtn = document.getElementById('back');
const forwardBtn = document.getElementById('forward');

play2D?.addEventListener('click', async function(): Promise<void> {
    console.log("Play2D clicked");
    showOverlay('game-2d');
    gameStateManager.setState(GameState.PLAYING_2D);

    setTimeout(async () => {
        await initBabylon2D();
    }, 100);
});

play3D?.addEventListener('click', async function(): Promise<void> {
    console.log("Opening Immersive Mode");
    showOverlay('game-3d');
    gameStateManager.setState(GameState.PLAYING_3D);

    // Wait a moment for overlay to show, then start Babylon
    setTimeout(async () => {
        await initBabylon3D();
    }, 100);
});

backBtn?.addEventListener('click', previousLanguage);
forwardBtn?.addEventListener('click', nextLanguage);

