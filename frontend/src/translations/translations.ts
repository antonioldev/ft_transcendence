import { english } from './en-EN.js';
import { italian } from './it-IT.js';
import { french } from './fr-FR.js';
import { portuguese } from './pt-PT.js';
import type { Translation } from './Translation.js';

export let currentLang = 0;
export const langs: string[] = ['English', 'Italiano', 'Français', 'Brasileiro'];

const allTranslations = [english, italian, french, portuguese];

/**
 * Retrieves the current translation object based on the selected language.
 * @returns {Translation} The translation object for the current language.
 */
export function getCurrentTranslation(): Translation {
    return allTranslations[currentLang];
}

/**
 * Updates the text content of various elements in the UI to match the current language.
 */
export function updateLanguageDisplay(): void {
    const t = getCurrentTranslation();

    // Language selector
    const langDisplay = document.getElementById('language_select');
    if (langDisplay) langDisplay.textContent = langs[currentLang];

    // Main menu
    const mainTitle = document.getElementById('main-title');
    if (mainTitle) mainTitle.textContent = t.appTitle;

    const play2D = document.getElementById('play2D');
    if (play2D) play2D.textContent = t.classicMode;
    
    const play3D = document.getElementById('play3D');
    if (play3D) play3D.textContent = t.immersiveMode;
    
    // Game mode selection
    const modeTitle = document.getElementById('mode-title');
    if (modeTitle) modeTitle.textContent = t.selectGameMode;

    const soloBtn = document.getElementById('solo-mode');
    if (soloBtn) soloBtn.textContent = t.soloMode;

    const localBtn = document.getElementById('local-mode');
    if (localBtn) localBtn.textContent = t.localMode;

    const onlineBtn = document.getElementById('online-mode');
    if (onlineBtn) onlineBtn.textContent = t.onlineMode;

    const tournamentBtn = document.getElementById('tournament-mode');
    if (tournamentBtn) tournamentBtn.textContent = t.tournamentMode;

    const modeBack = document.getElementById('mode-back');
    if (modeBack) modeBack.textContent = t.back;

    // Player setup
    const setupTitle = document.getElementById('setup-title');
    if (setupTitle) setupTitle.textContent = t.playerSetup;

    const startBtn = document.getElementById('start-game');
    if (startBtn) startBtn.textContent = t.startGame;

    const setupBack = document.getElementById('setup-back');
    if (setupBack) setupBack.textContent = t.back;

    // Input labels and placeholders
    const soloLabel = document.querySelector('#solo-setup label');
    if (soloLabel) soloLabel.textContent = t.playerName;

    const soloInput = document.getElementById('player1-name') as HTMLInputElement;
    if (soloInput) soloInput.placeholder = t.enterName;

    const localLabel1 = document.querySelector('#local-setup label[for="player1-name-local"]');
    if (localLabel1) localLabel1.textContent = t.player1Name;

    const localInput1 = document.getElementById('player1-name-local') as HTMLInputElement;
    if (localInput1) localInput1.placeholder = t.enterPlayer1Name;

    const localLabel2 = document.querySelector('#local-setup label[for="player2-name-local"]');
    if (localLabel2) localLabel2.textContent = t.player2Name;

    const localInput2 = document.getElementById('player2-name-local') as HTMLInputElement;
    if (localInput2) localInput2.placeholder = t.enterPlayer2Name;

    const onlineLabel = document.querySelector('#online-setup label');
    if (onlineLabel) onlineLabel.textContent = t.playerName;

    const onlineInput = document.getElementById('player1-name-online') as HTMLInputElement;
    if (onlineInput) onlineInput.placeholder = t.enterName;

    const onlineInfo = document.querySelector('#online-setup .setup-info');
    if (onlineInfo) onlineInfo.textContent = t.onlineInfo;

    // Pause dialogs
    const pauseTitles = document.querySelectorAll('.pause-title');
    pauseTitles.forEach((title: Element) => {
        (title as HTMLElement).textContent = t.gamePaused;
    });

    const pauseTexts = document.querySelectorAll('.pause-text');
    pauseTexts.forEach((text: Element) => {
        (text as HTMLElement).textContent = t.exitGame;
    });

    const pauseControl2D = document.getElementById('pause-controls-2d');
    if (pauseControl2D) pauseControl2D.textContent = t.pauseControls;

    const pauseControl3D = document.getElementById('pause-controls-3d');
    if (pauseControl3D) pauseControl3D.textContent = t.pauseControls3D;
}

/**
 * Cycles to the next language in the list and updates the UI accordingly.
 */
export function nextLanguage(): void {
    currentLang = (currentLang + 1) % langs.length;
    updateLanguageDisplay();
}

/**
 * Cycles to the previous language in the list and updates the UI accordingly.
 */
export function previousLanguage(): void {
    currentLang = (currentLang - 1 + langs.length) % langs.length;
    updateLanguageDisplay();
}

/**
 * Retrieves an alert message for a specific player based on the current language.
 * @param {('player1' | 'player2')} type - The type of player ('player1' or 'player2').
 * @returns {string} The alert message for the specified player.
 */
export function getAlert(type: 'player1' | 'player2'): string {
    const t = getCurrentTranslation();
    return type === 'player1' ? t.alertPlayer1 : t.alertPlayer2;
}