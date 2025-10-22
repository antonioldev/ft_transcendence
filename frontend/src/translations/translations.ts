import { english } from './en-EN.js';
import { italian } from './it-IT.js';
import { french } from './fr-FR.js';
import { portuguese } from './pt-PT.js';
import { russian } from './ru-RU.js';
import type { Translation } from './Translation.js';
import { EL, requireElementById } from '../ui/elements.js';
import { TranslationKey } from './Translation.js';
import { currentSettings } from '../core/AppManager.js';

const allTranslations = [english, italian, french, portuguese, russian];

// Retrieves the current translation object based on the selected language.
export function getCurrentTranslation(): Translation {
	return allTranslations[currentSettings.lang];
}

// Updates the text content of various elements in the UI to match the current language.
export function updateLanguageDisplay(): void {
	const t = getCurrentTranslation();

    // Language selector
    const languageSelect = document.getElementById('language_select') as HTMLSelectElement;
    if (languageSelect) {
        const languageMapping = ['UK', 'IT', 'FR', 'BR', 'RU'];
        languageSelect.value = languageMapping[currentSettings.lang];
    }

	// Auth buttons
	const registerBtn = requireElementById(EL.BUTTONS.REGISTER);
	registerBtn.textContent = t.register;
    
    const playBtn = requireElementById(EL.BUTTONS.PLAY);
    playBtn.textContent = t.play;

	const loginBtn = requireElementById(EL.BUTTONS.LOGIN);
	loginBtn.textContent = t.login;

	const logoutBtn = requireElementById(EL.BUTTONS.LOGOUT);
	logoutBtn.textContent = t.logout;

    // Login modal
    const loginUsernameLabel = document.querySelector('#login-modal label[for="login-username"]');
    if (loginUsernameLabel) loginUsernameLabel.textContent = t.usernameOrEmail;
    
    const loginTitle = requireElementById(EL.BUTTONS.LOGIN_TITLE);
    loginTitle.textContent = t.loginTitle;

	const loginPasswordLabel = document.querySelector('#login-modal label[for="login-password"]');
	if (loginPasswordLabel) loginPasswordLabel.textContent = t.password;

    const forgotPassword = document.getElementById('forgot-password');
    if (forgotPassword) forgotPassword.textContent = t.forgotPassword;

    const loginSubmit = requireElementById(EL.BUTTONS.LOGIN_SUBMIT);
    loginSubmit.textContent = t.loginSubmit;

	const loginBack = requireElementById(EL.BUTTONS.LOGIN_BACK);
	loginBack.textContent = t.back;

    const showRegister = requireElementById(EL.BUTTONS.SHOW_REGISTER);
    showRegister.textContent = t.createAccount;

    const notRegistered = document.getElementById('not-registered');
    if (notRegistered) notRegistered.textContent = t.notRegistered;

    // Update "Don't have an account?" text
    const loginFooter = document.querySelector('#login-modal .modal-footer .info-text');
    if (loginFooter) loginFooter.textContent = t.dontHaveAccount;

    // Register modal
    const registerUsernameLabel = document.querySelector('#register-modal label[for="register-username"]');
    if (registerUsernameLabel) registerUsernameLabel.textContent = t.username;
    
    const registerTitle = requireElementById(EL.BUTTONS.REGISTER_TITLE);
    registerTitle.textContent = t.registerTitle;

    const registerEmailLabel = document.querySelector('#register-modal label[for="register-email"]');
    if (registerEmailLabel) registerEmailLabel.textContent = t.email;

    const registerPasswordLabel = document.querySelector('#register-modal label[for="register-password"]');
    if (registerPasswordLabel) registerPasswordLabel.textContent = t.password;

    const registerConfirmPasswordLabel = document.querySelector('#register-modal label[for="register-confirm-password"]');
    if (registerConfirmPasswordLabel) registerConfirmPasswordLabel.textContent = t.confirmPassword;

	const registerSubmit = requireElementById(EL.BUTTONS.REGISTER_SUBMIT);
	registerSubmit.textContent = t.createAccount;

	const registerBack = requireElementById(EL.BUTTONS.REGISTER_BACK);
	registerBack.textContent = t.back;

    const showLogin = requireElementById(EL.BUTTONS.SHOW_LOGIN);
    showLogin.textContent = t.loginSubmit;

    const alreadyRegistered = document.getElementById('already-registered');
    if (alreadyRegistered) alreadyRegistered.textContent = t.alreadyHaveAccount;

    const registerFooter = document.querySelector('#register-modal .modal-footer .info-text');
    if (registerFooter) registerFooter.textContent = t.alreadyHaveAccount;

    // Settings Menu
    const settingsTitle = requireElementById(EL.DISPLAY.SETTINGS_TITLE);
    settingsTitle.textContent = t.settings;

    const languageLabel = requireElementById(EL.DISPLAY.LANGUAGE_SELECT);
    languageLabel.textContent = t.language;

    const scene3dLabel = requireElementById(EL.BUTTONS.SCENE_3D_SELECT);
    scene3dLabel.textContent = t.scene3d;

    const musicToggleLabel = requireElementById(EL.BUTTONS.MUSIC_TOGGLE);
    musicToggleLabel.textContent = t.music;

    const soundEffectToggleLabel = requireElementById(EL.BUTTONS.SOUND_EFFECT_TOGGLE);
    soundEffectToggleLabel.textContent = t.soundEffects;

	// Game mode selection
	const modeTitle = requireElementById(EL.DISPLAY.MODE_TITLE);
	modeTitle.textContent = t.selectGameMode;

	// const viewModeDisplay = requireElementById(EL.DISPLAY.VIEW_MODE_DISPLAY);
	// viewModeDisplay.textContent = t.classicMode;

	const soloBtn = requireElementById(EL.GAME_MODES.SOLO);
	soloBtn.textContent = t.soloMode + t.easy;

	const localBtn = requireElementById(EL.GAME_MODES.LOCAL);
	localBtn.textContent = t.localMode;

	const onlineBtn = requireElementById(EL.GAME_MODES.ONLINE);
	onlineBtn.textContent = t.onlineMode;

	const tournamentBtn = requireElementById(EL.GAME_MODES.TOURNAMENT);
	tournamentBtn.textContent = t.tournamentMode;

    const modeBack = requireElementById(EL.BUTTONS.MODE_BACK);
    modeBack.textContent = t.back;

	const tournamentOnlineBtn = requireElementById(EL.GAME_MODES.TOURNAMENT_ONLINE);
	tournamentOnlineBtn.textContent = t.tournamentOnline;

	// Player setup overlay
	const setupTitle = requireElementById(EL.DISPLAY.SETUP_TITLE);
	setupTitle.textContent = t.playerSetup;

    const playerLabel = requireElementById(EL.PLAYER_COLLECTION.LABEL);
	playerLabel.textContent = t.playerName;

    const localLabel1 = document.querySelector('#two-players-setup label[for="player1-name-local"]');
    if (localLabel1) localLabel1.textContent = t.player1Name;

    const localLabel2 = document.querySelector('#two-players-setup label[for="player2-name-local"]');
    if (localLabel2) localLabel2.textContent = t.player2Name;

    // Tournament labels
    const tournamentLabel1 = document.querySelector('#tournament-setup label[for="player1-name-tournament"]');
    if (tournamentLabel1) tournamentLabel1.textContent = t.player1Name;

    const tournamentLabel2 = document.querySelector('#tournament-setup label[for="player2-name-tournament"]');
    if (tournamentLabel2) tournamentLabel2.textContent = t.player2Name;

    const tournamentLabel3 = document.querySelector('#tournament-setup label[for="player3-name-tournament"]');
    if (tournamentLabel3) tournamentLabel3.textContent = "Player 3 Name:"; // TODO: Add translation key for player3Name

    const tournamentLabel4 = document.querySelector('#tournament-setup label[for="player4-name-tournament"]');
    if (tournamentLabel4) tournamentLabel4.textContent = "Player 4 Name:"; // TODO: Add translation key for player4Name

	const playerName = requireElementById<HTMLInputElement>(EL.PLAYER_COLLECTION.INPUT);
	playerName.placeholder = t.enterName;


	const startBtn = requireElementById(EL.BUTTONS.START_GAME);
	startBtn.textContent = t.startGame;

	const setupBack = requireElementById(EL.BUTTONS.SETUP_BACK);
	setupBack.textContent = t.back;

    // Loading
    const loading = requireElementById(EL.GAME.LOADING_TEXT);
    loading.textContent = t.loading;

    // Dashboard
    const greeting = requireElementById(EL.DISPLAY.GREETING);
    greeting.textContent = t.greeting;

    // Update error message spans with translated text
    const loginUsernameError = document.getElementById(EL.ERRORS.LOGIN_USERNAME_ERROR);
    if (loginUsernameError) loginUsernameError.textContent = t.errorEnterEmailOrUsername;

    const loginPasswordError = document.getElementById(EL.ERRORS.LOGIN_PASSWORD_ERROR);
    if (loginPasswordError) loginPasswordError.textContent = t.errorEnterPassword;

    const registerUsernameError = document.getElementById(EL.ERRORS.REGISTER_USERNAME_ERROR);
    if (registerUsernameError) registerUsernameError.textContent = t.errorEnterUsername;

    const registerEmailError = document.getElementById(EL.ERRORS.REGISTER_EMAIL_ERROR);
    if (registerEmailError) registerEmailError.textContent = t.errorEnterValidEmail;

    const registerPasswordError = document.getElementById(EL.ERRORS.REGISTER_PASSWORD_ERROR);
    if (registerPasswordError) registerPasswordError.textContent = t.errorEnterPassword;

    const registerConfirmPasswordError = document.getElementById(EL.ERRORS.REGISTER_CONFIRM_PASSWORD_ERROR);
    if (registerConfirmPasswordError) registerConfirmPasswordError.textContent = t.errorConfirmPassword;

}

// Cycles to the next language in the list and updates the UI accordingly.
// export function nextLanguage(): void {
// 	currentLang = (currentLang + 1) % langs.length;
// 	updateLanguageDisplay();
// }

// Cycles to the previous language in the list and updates the UI accordingly.
// export function previousLanguage(): void {
// 	currentLang = (currentLang - 1 + langs.length) % langs.length;
// 	updateLanguageDisplay();
// }

// Retrieves a specific item based on current language
export function getText(key: TranslationKey): string {
	const t = getCurrentTranslation();
	return t[key];
}
