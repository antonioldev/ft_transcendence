import { english } from './en-EN.js';
import { italian } from './it-IT.js';
import { french } from './fr-FR.js';
import { portuguese } from './pt-PT.js';
import { russian } from './ru-RU.js';
import type { Translation } from './Translation.js';
import { EL, requireElementById } from '../ui/elements.js';
// import { TranslationKey } from './Translation.js';
import { currentSettings } from '../core/AppManager.js';

const allTranslations = [english, italian, french, portuguese, russian];

// Retrieves the current translation object based on the selected language.
export function getCurrentTranslation(): Translation {
	return allTranslations[currentSettings.language];
}

// Updates the text content of various elements in the UI to match the current language.
export function updateLanguageDisplay(): void {
	const t = getCurrentTranslation();

    // Language selector
    const languageSelect = document.getElementById('language_select') as HTMLSelectElement;
    if (languageSelect) {
        const languageMapping = ['UK', 'IT', 'FR', 'BR', 'RU'];
        languageSelect.value = languageMapping[currentSettings.language];
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

    // Instructions
    const instructionsBtn = requireElementById(EL.BUTTONS.INSTRUCTIONS);
    instructionsBtn.textContent = t.instructions;

    // Settings Menu
    const settingsTitle = requireElementById(EL.DISPLAY.SETTINGS_TITLE);
    settingsTitle.textContent = t.settings;

    const languageLabel = document.querySelector('label[for="language_select"]');
    if (languageLabel) languageLabel.textContent = t.language;

    const sceneLabel = document.querySelector('label[for="map-selector"]');
    if (sceneLabel) sceneLabel.textContent = t.scene3d;

    const musicToggleLabel = requireElementById(EL.BUTTONS.MUSIC_TOGGLE_LABEL);
    musicToggleLabel.textContent = t.music;

    const soundEffectToggleLabel = requireElementById(EL.BUTTONS.SOUND_EFFECT_TOGGLE_LABEL);
    soundEffectToggleLabel.textContent = t.soundEffects;

    const settingsBack = requireElementById(EL.BUTTONS.SETTING_BACK);
    settingsBack.textContent = t.backToMainMenu;

	// Game mode selection
	const modeTitle = requireElementById(EL.DISPLAY.MODE_TITLE);
	modeTitle.textContent = t.selectGameMode;

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

    const dashboardBack = requireElementById(EL.BUTTONS.DASHBOARD_BACK);
	dashboardBack.textContent = t.backToMainMenu;

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

    // Dashboard
    try {
        const t = getCurrentTranslation();

        // Titles
        requireElementById(EL.DASHBOARD.USER_STATS_TITLE).textContent = t.userStats;
        requireElementById(EL.DASHBOARD.GAME_HISTORY_TITLE).textContent = t.gameHistory;

        // KPI labels
        requireElementById(EL.DASHBOARD.VICTORIES_LABEL).textContent = t.victories;
        requireElementById(EL.DASHBOARD.DEFEATS_LABEL).textContent = t.defeats;

        // Table headers
        requireElementById(EL.DASHBOARD.TH_DATETIME).textContent = t.dateTime;
        requireElementById(EL.DASHBOARD.TH_OPPONENT).textContent = t.opponent;
        requireElementById(EL.DASHBOARD.TH_SCORE).textContent = t.score;
        requireElementById(EL.DASHBOARD.TH_RESULT).textContent = t.result;
        requireElementById(EL.DASHBOARD.TH_TOURNAMENT).textContent = t.tournament;
    } catch {}

    // Instructions modal texts
    const instructionsTitle = document.getElementById('instructions-title');
    if (instructionsTitle) instructionsTitle.textContent = t.howToPlay;

    const instructions2d = document.getElementById('instructions-2d-title');
    if (instructions2d) instructions2d.textContent = t.games2DTitle;

    const instructions3d = document.getElementById('instructions-3d-title');
    if (instructions3d) instructions3d.textContent = t.games3DTitle;

    const moveElements = document.querySelectorAll<HTMLElement>('.instructions-move');
    moveElements.forEach(el => el.textContent = t.moveLabel);

    const localLabelElements = document.querySelectorAll<HTMLElement>('.instructions-local');
    localLabelElements.forEach(el => el.textContent = t.localLabel);

    const gameModesTitle = document.getElementById('instructions-game-modes-title');
    if (gameModesTitle) gameModesTitle.textContent = t.gameModesTitle;

    const soloTitle = document.getElementById('instructions-solo-title');
    if (soloTitle) soloTitle.textContent = t.soloVsAITitle;

    const soloDesc = document.getElementById('instructions-solo-desc');
    if (soloDesc) soloDesc.textContent = t.difficultyInfo;

    const localTitleCard = document.getElementById('instructions-local-title');
    if (localTitleCard) localTitleCard.textContent = t.localMode;

    const localDesc = document.getElementById('instructions-local-desc');
    if (localDesc) localDesc.textContent = t.shareKeyboard;

    const onlineTitle = document.getElementById('instructions-online-title');
    if (onlineTitle) onlineTitle.textContent = t.onlineMatchTitle;

    const onlineDesc = document.getElementById('instructions-online-desc');
    if (onlineDesc) onlineDesc.textContent = t.onlineMatchInfo;

    const tournamentTitle = document.getElementById('instructions-tournament-title');
    if (tournamentTitle) tournamentTitle.textContent = t.tournamentMode;

    const tournamentDesc = document.getElementById('instructions-tournament-desc');
    if (tournamentDesc) tournamentDesc.textContent = t.tournamentInfo;

    const player1Els = document.querySelectorAll<HTMLElement>('.instructions-player1');
    player1Els.forEach(el => el.textContent = t.player1Label);

    const player2Els = document.querySelectorAll<HTMLElement>('.instructions-player2');
    player2Els.forEach(el => el.textContent = t.player2Label);

}

// Retrieves a specific item based on current language
// export function getText(key: TranslationKey): string {
// 	const t = getCurrentTranslation();
// 	return t[key];
// }
