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

    const registerBtn = document.getElementById('register-btn');
    if (registerBtn) registerBtn.textContent = t.register;

    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) loginBtn.textContent = t.login;

    const googleLoginBtn = document.getElementById('google-login-btn');
    if (googleLoginBtn) googleLoginBtn.textContent = t.loginWithGoogle;

    const offlineBtn = document.getElementById('offline-btn');
    if (offlineBtn) offlineBtn.textContent = t.playOffline;

    // Register screen
    const registerTitle = document.getElementById('register-title');
    if (registerTitle) registerTitle.textContent = t.register;

    const registerUsernameLabel = document.querySelector('label[for="register-username"]');
    if (registerUsernameLabel) registerUsernameLabel.textContent = t.username;

    const registerUsernameInput = document.getElementById('register-username') as HTMLInputElement;
    if (registerUsernameInput) registerUsernameInput.placeholder = t.enterUsername;

    const registerEmailLabel = document.querySelector('label[for="register-email"]');
    if (registerEmailLabel) registerEmailLabel.textContent = t.email;

    const registerEmailInput = document.getElementById('register-email') as HTMLInputElement;
    if (registerEmailInput) registerEmailInput.placeholder = t.enterEmail;

    const registerPasswordLabel = document.querySelector('label[for="register-password"]');
    if (registerPasswordLabel) registerPasswordLabel.textContent = t.password;

    const registerPasswordInput = document.getElementById('register-password') as HTMLInputElement;
    if (registerPasswordInput) registerPasswordInput.placeholder = t.enterPassword;

    const registerConfirmPasswordLabel = document.querySelector('label[for="register-confirm-password"]');
    if (registerConfirmPasswordLabel) registerConfirmPasswordLabel.textContent = t.confirmPassword;

    const registerConfirmPasswordInput = document.getElementById('register-confirm-password') as HTMLInputElement;
    if (registerConfirmPasswordInput) registerConfirmPasswordInput.placeholder = t.confirmPasswordPlaceholder;

    const registerSubmit = document.getElementById('register-submit');
    if (registerSubmit) registerSubmit.textContent = t.createAccount;

    const registerBack = document.getElementById('register-back');
    if (registerBack) registerBack.textContent = t.back;

    // Login screen
    const loginTitle = document.getElementById('login-title');
    if (loginTitle) loginTitle.textContent = t.login;

    const loginUsernameLabel = document.querySelector('label[for="login-username"]');
    if (loginUsernameLabel) loginUsernameLabel.textContent = t.usernameOrEmail;

    const loginUsernameInput = document.getElementById('login-username') as HTMLInputElement;
    if (loginUsernameInput) loginUsernameInput.placeholder = t.enterUsernameOrEmail;

    const loginPasswordLabel = document.querySelector('label[for="login-password"]');
    if (loginPasswordLabel) loginPasswordLabel.textContent = t.password;

    const loginPasswordInput = document.getElementById('login-password') as HTMLInputElement;
    if (loginPasswordInput) loginPasswordInput.placeholder = t.enterPassword;

    const loginSubmit = document.getElementById('login-submit');
    if (loginSubmit) loginSubmit.textContent = t.login;

    const loginBack = document.getElementById('login-back');
    if (loginBack) loginBack.textContent = t.back;

    // Game mode selection
    const modeTitle = document.getElementById('mode-title');
    if (modeTitle) modeTitle.textContent = t.selectGameMode;

    const viewModeTitle = document.getElementById('view-mode-title');
    if (viewModeTitle) viewModeTitle.textContent = t.viewMode;

    const viewModeDisplay = document.getElementById('view-mode-display');
    if (viewModeDisplay) viewModeDisplay.textContent = t.classicMode; // or t.immersiveMode depending on state

    const soloBtn = document.getElementById('solo-mode');
    if (soloBtn) soloBtn.textContent = t.soloMode;

    const localBtn = document.getElementById('local-mode');
    if (localBtn) localBtn.textContent = t.localMode;

    const onlineBtn = document.getElementById('online-mode');
    if (onlineBtn) onlineBtn.textContent = t.onlineMode;

    const tournamentBtn = document.getElementById('tournament-mode');
    if (tournamentBtn) tournamentBtn.textContent = t.tournamentMode;

    const modeBack = document.getElementById('mode-back');
    if (modeBack) modeBack.textContent = t.backToMain;

    // Player setup overlay
    const setupTitle = document.getElementById('setup-title');
    if (setupTitle) setupTitle.textContent = t.playerSetup;

    const soloLabel = document.querySelector('#solo-setup label[for="player1-name"]');
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

    const onlineLabel = document.querySelector('#online-setup label[for="player1-name-online"]');
    if (onlineLabel) onlineLabel.textContent = t.playerName;

    const onlineInput = document.getElementById('player1-name-online') as HTMLInputElement;
    if (onlineInput) onlineInput.placeholder = t.enterName;

    const onlineInfo = document.querySelector('#online-setup .setup-info');
    if (onlineInfo) onlineInfo.textContent = t.onlineInfo;

    const startBtn = document.getElementById('start-game');
    if (startBtn) startBtn.textContent = t.startGame;

    const setupBack = document.getElementById('setup-back');
    if (setupBack) setupBack.textContent = t.back;

    // Pause dialogs (2D)
    const pauseTitle2d = document.getElementById('pause-title-2d');
    if (pauseTitle2d) pauseTitle2d.textContent = t.gamePaused;

    const pauseText2d = document.getElementById('pause-text-2d');
    if (pauseText2d) pauseText2d.textContent = t.exitGame;

    const pauseControl2d = document.getElementById('pause-controls-2d');
    if (pauseControl2d) pauseControl2d.textContent = t.pauseControls;

    // Pause dialogs (3D)
    const pauseTitle3d = document.getElementById('pause-title-3d');
    if (pauseTitle3d) pauseTitle3d.textContent = t.gamePaused;

    const pauseText3d = document.getElementById('pause-text-3d');
    if (pauseText3d) pauseText3d.textContent = t.exitGame;

    const pauseControl3d = document.getElementById('pause-controls-3d');
    if (pauseControl3d) pauseControl3d.textContent = t.pauseControls3D;
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