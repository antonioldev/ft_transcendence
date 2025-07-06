import { updateLanguageDisplay, previousLanguage, nextLanguage } from '../ui/translations.js';
import { applyButtonStyles, applyLanguageStyles, applyTitleStyles, applyOverlayStyles, applyPauseDialogStyles, showOverlay, showPauseDialog } from '../ui/styles.js';
import { init2D, init3D } from '../engine/GameEngine.js';
import { GameState } from './constants.js';
import { gameStateManager} from './GameState.js';

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

document.addEventListener('keydown', handleEscKey);
document.addEventListener('keydown', handleYesNoKey);

const play2D = document.getElementById('play2D');
const play3D = document.getElementById('play3D');
const backBtn = document.getElementById('back');
const forwardBtn = document.getElementById('forward');

play2D?.addEventListener('click', async function(): Promise<void> {
    showOverlay('game-2d');
    gameStateManager.setState(GameState.PLAYING_2D);
    setTimeout(() => init2D(), 100);
});

play3D?.addEventListener('click', async function(): Promise<void> {
    showOverlay('game-3d');
    gameStateManager.setState(GameState.PLAYING_3D);
    setTimeout(() => init3D(), 100);
});

backBtn?.addEventListener('click', previousLanguage);
forwardBtn?.addEventListener('click', nextLanguage);

