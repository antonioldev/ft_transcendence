import { english } from './en-EN.js';
import { italian } from './it-IT.js';
import { french } from './fr-FR.js';
import { portuguese } from './pt-PT.js';
import type { Translation } from './Translation.js';
import { EL, getElementById } from '../ui/elements.js';

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
    const langDisplay = getElementById(EL.DISPLAY.LANGUAGE_SELECT);
    if (langDisplay) langDisplay.textContent = langs[currentLang];

    // Main menu
    const mainTitle = getElementById(EL.DISPLAY.MAIN_TITLE);
    if (mainTitle) mainTitle.textContent = t.appTitle;

    const playBtn = getElementById(EL.BUTTONS.PLAY);
    if (playBtn) playBtn.textContent = t.play;

    // Auth buttons
    const registerBtn = getElementById(EL.BUTTONS.REGISTER);
    if (registerBtn) registerBtn.textContent = t.register;

    const loginBtn = getElementById(EL.BUTTONS.LOGIN);
    if (loginBtn) loginBtn.textContent = t.login;

    const logoutBtn = getElementById(EL.BUTTONS.LOGOUT);
    if (logoutBtn) logoutBtn.textContent = t.logout;

    // Login modal
    const loginUsernameLabel = document.querySelector('#login-modal label[for="login-username"]');
    if (loginUsernameLabel) loginUsernameLabel.textContent = t.usernameOrEmail;

    const loginUsernameInput = getElementById<HTMLInputElement>(EL.AUTH.LOGIN_USERNAME);
    if (loginUsernameInput) loginUsernameInput.placeholder = t.enterUsernameOrEmail;

    const loginPasswordLabel = document.querySelector('#login-modal label[for="login-password"]');
    if (loginPasswordLabel) loginPasswordLabel.textContent = t.password;

    const loginPasswordInput = getElementById<HTMLInputElement>(EL.AUTH.LOGIN_PASSWORD);
    if (loginPasswordInput) loginPasswordInput.placeholder = t.enterPassword;

    const loginSubmit = getElementById(EL.BUTTONS.LOGIN_SUBMIT);
    if (loginSubmit) loginSubmit.textContent = t.login;

    const googleLoginBtn = getElementById(EL.BUTTONS.GOOGLE_LOGIN);
    if (googleLoginBtn) googleLoginBtn.textContent = t.loginWithGoogle;

    const loginBack = getElementById(EL.BUTTONS.LOGIN_BACK);
    if (loginBack) loginBack.textContent = t.back;

    const showRegister = getElementById(EL.BUTTONS.SHOW_REGISTER);
    if (showRegister) showRegister.textContent = t.createAccount;

    // Update "Don't have an account?" text
    const loginFooter = document.querySelector('#login-modal .modal-footer .info-text');
    if (loginFooter) loginFooter.textContent = t.dontHaveAccount;

    // Register modal
    const registerUsernameLabel = document.querySelector('#register-modal label[for="register-username"]');
    if (registerUsernameLabel) registerUsernameLabel.textContent = t.username;

    const registerUsernameInput = getElementById<HTMLInputElement>(EL.AUTH.REGISTER_USERNAME);
    if (registerUsernameInput) registerUsernameInput.placeholder = t.enterUsername;

    const registerEmailLabel = document.querySelector('#register-modal label[for="register-email"]');
    if (registerEmailLabel) registerEmailLabel.textContent = t.email;

    const registerEmailInput = getElementById<HTMLInputElement>(EL.AUTH.REGISTER_EMAIL);
    if (registerEmailInput) registerEmailInput.placeholder = t.enterEmail;

    const registerPasswordLabel = document.querySelector('#register-modal label[for="register-password"]');
    if (registerPasswordLabel) registerPasswordLabel.textContent = t.password;

    const registerPasswordInput = getElementById<HTMLInputElement>(EL.AUTH.REGISTER_PASSWORD);
    if (registerPasswordInput) registerPasswordInput.placeholder = t.enterPassword;

    const registerConfirmPasswordLabel = document.querySelector('#register-modal label[for="register-confirm-password"]');
    if (registerConfirmPasswordLabel) registerConfirmPasswordLabel.textContent = t.confirmPassword;

    const registerConfirmPasswordInput = getElementById<HTMLInputElement>(EL.AUTH.REGISTER_CONFIRM_PASSWORD);
    if (registerConfirmPasswordInput) registerConfirmPasswordInput.placeholder = t.confirmPasswordPlaceholder;

    const registerSubmit = getElementById(EL.BUTTONS.REGISTER_SUBMIT);
    if (registerSubmit) registerSubmit.textContent = t.createAccount;

    const registerBack = getElementById(EL.BUTTONS.REGISTER_BACK);
    if (registerBack) registerBack.textContent = t.back;

    const showLogin = getElementById(EL.BUTTONS.SHOW_LOGIN);
    if (showLogin) showLogin.textContent = t.login;

    // Update "Already have an account?" text
    const registerFooter = document.querySelector('#register-modal .modal-footer .info-text');
    if (registerFooter) registerFooter.textContent = t.alreadyHaveAccount;

    // Game mode selection
    const modeTitle = getElementById(EL.DISPLAY.MODE_TITLE);
    if (modeTitle) modeTitle.textContent = t.selectGameMode;

    const viewModeDisplay = getElementById(EL.DISPLAY.VIEW_MODE_DISPLAY);
    if (viewModeDisplay) viewModeDisplay.textContent = t.classicMode; // or t.immersiveMode depending on state

    const soloBtn = getElementById(EL.GAME_MODES.SOLO);
    if (soloBtn) soloBtn.textContent = t.soloMode;

    const localBtn = getElementById(EL.GAME_MODES.LOCAL);
    if (localBtn) localBtn.textContent = t.localMode;

    const onlineBtn = getElementById(EL.GAME_MODES.ONLINE);
    if (onlineBtn) onlineBtn.textContent = t.onlineMode;

    const tournamentBtn = getElementById(EL.GAME_MODES.TOURNAMENT);
    if (tournamentBtn) tournamentBtn.textContent = t.tournamentMode;

    const modeBack = getElementById(EL.BUTTONS.MODE_BACK);
    if (modeBack) modeBack.textContent = t.backToMain;

    const tournamentOnlineBtn = getElementById(EL.GAME_MODES.TOURNAMENT_ONLINE);
    if (tournamentOnlineBtn) tournamentOnlineBtn.textContent = t.tournamentOnline;

    // Player setup overlay
    const setupTitle = getElementById(EL.DISPLAY.SETUP_TITLE);
    if (setupTitle) setupTitle.textContent = t.playerSetup;

    const soloLabel = document.querySelector('#solo-setup label[for="player1-name"]');
    if (soloLabel) soloLabel.textContent = t.playerName;

    const soloInput = getElementById<HTMLInputElement>(EL.PLAYER_SETUP.PLAYER1_NAME);
    if (soloInput) soloInput.placeholder = t.enterName;

    const localLabel1 = document.querySelector('#two-players-setup label[for="player1-name-local"]');
    if (localLabel1) localLabel1.textContent = t.player1Name;

    const localInput1 = getElementById<HTMLInputElement>(EL.PLAYER_SETUP.PLAYER1_NAME_LOCAL);
    if (localInput1) localInput1.placeholder = t.enterPlayer1Name;

    const localLabel2 = document.querySelector('#two-players-setup label[for="player2-name-local"]');
    if (localLabel2) localLabel2.textContent = t.player2Name;

    const localInput2 = getElementById<HTMLInputElement>(EL.PLAYER_SETUP.PLAYER2_NAME_LOCAL);
    if (localInput2) localInput2.placeholder = t.enterPlayer2Name;

    // Tournament labels
    const tournamentLabel1 = document.querySelector('#tournament-setup label[for="player1-name-tournament"]');
    if (tournamentLabel1) tournamentLabel1.textContent = t.player1Name;

    const tournamentInput1 = getElementById<HTMLInputElement>(EL.PLAYER_SETUP.PLAYER1_NAME_TOURNAMENT);
    if (tournamentInput1) tournamentInput1.placeholder = t.enterPlayer1Name;

    const tournamentLabel2 = document.querySelector('#tournament-setup label[for="player2-name-tournament"]');
    if (tournamentLabel2) tournamentLabel2.textContent = t.player2Name;

    const tournamentInput2 = getElementById<HTMLInputElement>(EL.PLAYER_SETUP.PLAYER2_NAME_TOURNAMENT);
    if (tournamentInput2) tournamentInput2.placeholder = t.enterPlayer2Name;

    const tournamentLabel3 = document.querySelector('#tournament-setup label[for="player3-name-tournament"]');
    if (tournamentLabel3) tournamentLabel3.textContent = "Player 3 Name:";

    const tournamentInput3 = getElementById<HTMLInputElement>(EL.PLAYER_SETUP.PLAYER3_NAME_TOURNAMENT);
    if (tournamentInput3) tournamentInput3.placeholder = "Enter Player 3 name";

    const tournamentLabel4 = document.querySelector('#tournament-setup label[for="player4-name-tournament"]');
    if (tournamentLabel4) tournamentLabel4.textContent = "Player 4 Name:";

    const tournamentInput4 = getElementById<HTMLInputElement>(EL.PLAYER_SETUP.PLAYER4_NAME_TOURNAMENT);
    if (tournamentInput4) tournamentInput4.placeholder = "Enter Player 4 name";

    const startBtn = getElementById(EL.BUTTONS.START_GAME);
    if (startBtn) startBtn.textContent = t.startGame;

    const setupBack = getElementById(EL.BUTTONS.SETUP_BACK);
    if (setupBack) setupBack.textContent = t.back;

    // Pause dialogs (3D)
    const pauseTitle3d = getElementById(EL.GAME.PAUSE_TITLE_3D);
    if (pauseTitle3d) pauseTitle3d.textContent = t.gamePaused;

    const pauseText3d = getElementById(EL.GAME.PAUSE_TEXT_3D);
    if (pauseText3d) pauseText3d.textContent = t.exitGame;

    const pauseControl3d = getElementById(EL.GAME.PAUSE_CONTROLS_3D);
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