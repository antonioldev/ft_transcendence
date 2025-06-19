import { updateLanguageDisplay, previousLanguage, nextLanguage } from './translations.js';
import { applyButtonStyles, applyLanguageStyles, applyTitleStyles, applyOverlayStyles, showOverlay, hideOverlay } from './styles.js';
import { initBabylon3D, disposeBabylon3D } from './babylon3d.js';


console.log("Typescript is working!")

function loadPage() {
    applyTitleStyles();
    applyButtonStyles();
    applyLanguageStyles();
    applyOverlayStyles();
    updateLanguageDisplay();

}

function handleEscKey(event: KeyboardEvent): void {
    if (event.key === 'Escape'){
        disposeBabylon3D();
        hideOverlay('game-2d');
        hideOverlay('game-3d');
    }
}

document.addEventListener('DOMContentLoaded', loadPage);

document.addEventListener('keydown', handleEscKey);

const play2D = document.getElementById('play2D');
const play3D = document.getElementById('play3D');
const backBtn = document.getElementById('back');
const forwardBtn = document.getElementById('forward');

play2D?.addEventListener('click', function()
{
    console.log("Play2D clicked");
    showOverlay('game-2d');
});

play3D?.addEventListener('click', async function(): Promise<void> {
    console.log("Opening Immersive Mode");
    showOverlay('game-3d');
    
    // Wait a moment for overlay to show, then start Babylon
    setTimeout(async () => {
        await initBabylon3D();
    }, 100);
});

backBtn?.addEventListener('click', previousLanguage);
forwardBtn?.addEventListener('click', nextLanguage);