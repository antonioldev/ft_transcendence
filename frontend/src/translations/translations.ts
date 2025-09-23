import { english } from './en-EN.js';
import { italian } from './it-IT.js';
import { french } from './fr-FR.js';
import { portuguese } from './pt-PT.js';
import { russian } from './ru-RU.js';
import type { Translation } from './Translation.js';
import { EL, requireElementById } from '../ui/elements.js';
import { TranslationKey } from './Translation.js';

export let currentLang = 0;
export const langs: string[] = ['🇬🇧  English', '🇮🇹  Italiano', '🇫🇷  Français', '🇧🇷  Brasileiro', '🇷🇺  Русский'];

const allTranslations = [english, italian, french, portuguese, russian];

// Retrieves the current translation object based on the selected language.
export function getCurrentTranslation(): Translation {
	return allTranslations[currentLang];
}

// Updates the text content of various elements in the UI to match the current language.
export function updateLanguageDisplay(): void {
	const t = getCurrentTranslation();

    // Language selector
    const langDisplay = requireElementById(EL.DISPLAY.LANGUAGE_SELECT);
    langDisplay.textContent = langs[currentLang];

	const playBtn = requireElementById(EL.BUTTONS.PLAY);
	playBtn.textContent = t.play;

	// Auth buttons
	const registerBtn = requireElementById(EL.BUTTONS.REGISTER);
	registerBtn.textContent = t.register;

	const loginBtn = requireElementById(EL.BUTTONS.LOGIN);
	loginBtn.textContent = t.login;

	const logoutBtn = requireElementById(EL.BUTTONS.LOGOUT);
	logoutBtn.textContent = t.logout;

	// Login modal
	const loginUsernameLabel = document.querySelector('#login-modal label[for="login-username"]');
	if (loginUsernameLabel) loginUsernameLabel.textContent = t.usernameOrEmail;

	const loginUsernameInput = requireElementById<HTMLInputElement>(EL.AUTH.LOGIN_USERNAME);
	loginUsernameInput.placeholder = t.enterUsernameOrEmail;

	const loginPasswordLabel = document.querySelector('#login-modal label[for="login-password"]');
	if (loginPasswordLabel) loginPasswordLabel.textContent = t.password;

	const loginPasswordInput = requireElementById<HTMLInputElement>(EL.AUTH.LOGIN_PASSWORD);
	loginPasswordInput.placeholder = t.enterPassword;

	const loginSubmit = requireElementById(EL.BUTTONS.LOGIN_SUBMIT);
	loginSubmit.textContent = t.login;

	const loginBack = requireElementById(EL.BUTTONS.LOGIN_BACK);
	loginBack.textContent = t.back;

	const showRegister = requireElementById(EL.BUTTONS.SHOW_REGISTER);
	showRegister.textContent = t.createAccount;

	// Update "Don't have an account?" text
	const loginFooter = document.querySelector('#login-modal .modal-footer .info-text');
	if (loginFooter) loginFooter.textContent = t.dontHaveAccount;

	// Register modal
	const registerUsernameLabel = document.querySelector('#register-modal label[for="register-username"]');
	if (registerUsernameLabel) registerUsernameLabel.textContent = t.username;

	const registerUsernameInput = requireElementById<HTMLInputElement>(EL.AUTH.REGISTER_USERNAME);
	registerUsernameInput.placeholder = t.enterUsername;

	const registerEmailLabel = document.querySelector('#register-modal label[for="register-email"]');
	if (registerEmailLabel) registerEmailLabel.textContent = t.email;

	const registerEmailInput = requireElementById<HTMLInputElement>(EL.AUTH.REGISTER_EMAIL);
	registerEmailInput.placeholder = t.enterEmail;

	const registerPasswordLabel = document.querySelector('#register-modal label[for="register-password"]');
	if (registerPasswordLabel) registerPasswordLabel.textContent = t.password;

	const registerPasswordInput = requireElementById<HTMLInputElement>(EL.AUTH.REGISTER_PASSWORD);
	registerPasswordInput.placeholder = t.enterPassword;

	const registerConfirmPasswordLabel = document.querySelector('#register-modal label[for="register-confirm-password"]');
	if (registerConfirmPasswordLabel) registerConfirmPasswordLabel.textContent = t.confirmPassword;

	const registerConfirmPasswordInput = requireElementById<HTMLInputElement>(EL.AUTH.REGISTER_CONFIRM_PASSWORD);
	registerConfirmPasswordInput.placeholder = t.confirmPasswordPlaceholder;

	const registerSubmit = requireElementById(EL.BUTTONS.REGISTER_SUBMIT);
	registerSubmit.textContent = t.createAccount;

	const registerBack = requireElementById(EL.BUTTONS.REGISTER_BACK);
	registerBack.textContent = t.back;

	const showLogin = requireElementById(EL.BUTTONS.SHOW_LOGIN);
	showLogin.textContent = t.login;

	const registerFooter = document.querySelector('#register-modal .modal-footer .info-text');
	if (registerFooter) registerFooter.textContent = t.alreadyHaveAccount;

	// Game mode selection
	const modeTitle = requireElementById(EL.DISPLAY.MODE_TITLE);
	modeTitle.textContent = t.selectGameMode;

	const viewModeDisplay = requireElementById(EL.DISPLAY.VIEW_MODE_DISPLAY);
	viewModeDisplay.textContent = t.classicMode;

	const soloBtn = requireElementById(EL.GAME_MODES.SOLO);
	soloBtn.textContent = t.soloMode + t.easy;

	const localBtn = requireElementById(EL.GAME_MODES.LOCAL);
	localBtn.textContent = t.localMode;

	const onlineBtn = requireElementById(EL.GAME_MODES.ONLINE);
	onlineBtn.textContent = t.onlineMode;

	const tournamentBtn = requireElementById(EL.GAME_MODES.TOURNAMENT);
	tournamentBtn.textContent = t.tournamentMode;

	const modeBack = requireElementById(EL.BUTTONS.MODE_BACK);
	modeBack.textContent = t.backToMain;

	const tournamentOnlineBtn = requireElementById(EL.GAME_MODES.TOURNAMENT_ONLINE);
	tournamentOnlineBtn.textContent = t.tournamentOnline;

	// Player setup overlay
	const setupTitle = requireElementById(EL.DISPLAY.SETUP_TITLE);
	setupTitle.textContent = t.playerSetup;

	// const soloLabel = document.querySelector('#solo-setup label[for="player1-name"]');
	// if (soloLabel) soloLabel.textContent = t.playerName;

	// const soloInput = requireElementById<HTMLInputElement>(EL.PLAYER_SETUP.PLAYER1_NAME);
	// soloInput.placeholder = t.enterName;

	// const localLabel1 = document.querySelector('#two-players-setup label[for="player1-name-local"]');
	// if (localLabel1) localLabel1.textContent = t.player1Name;

	// const localInput1 = requireElementById<HTMLInputElement>(EL.PLAYER_SETUP.PLAYER1_NAME_LOCAL);
	// localInput1.placeholder = t.enterPlayer1Name;

	// const localLabel2 = document.querySelector('#two-players-setup label[for="player2-name-local"]');
	// if (localLabel2) localLabel2.textContent = t.player2Name;

	// const localInput2 = requireElementById<HTMLInputElement>(EL.PLAYER_SETUP.PLAYER2_NAME_LOCAL);
	// localInput2.placeholder = t.enterPlayer2Name;

	// // Tournament labels
	// const tournamentLabel1 = document.querySelector('#tournament-setup label[for="player1-name-tournament"]');
	// if (tournamentLabel1) tournamentLabel1.textContent = t.player1Name;

	// const tournamentInput1 = requireElementById<HTMLInputElement>(EL.PLAYER_SETUP.PLAYER1_NAME_TOURNAMENT);
	// tournamentInput1.placeholder = t.enterPlayer1Name;

	// const tournamentLabel2 = document.querySelector('#tournament-setup label[for="player2-name-tournament"]');
	// if (tournamentLabel2) tournamentLabel2.textContent = t.player2Name;

	// const tournamentInput2 = requireElementById<HTMLInputElement>(EL.PLAYER_SETUP.PLAYER2_NAME_TOURNAMENT);
	// tournamentInput2.placeholder = t.enterPlayer2Name;

	// const tournamentLabel3 = document.querySelector('#tournament-setup label[for="player3-name-tournament"]');
	// if (tournamentLabel3) tournamentLabel3.textContent = "Player 3 Name:";

	// const tournamentInput3 = requireElementById<HTMLInputElement>(EL.PLAYER_SETUP.PLAYER3_NAME_TOURNAMENT);
	// tournamentInput3.placeholder = "Enter Player 3 name";

	// const tournamentLabel4 = document.querySelector('#tournament-setup label[for="player4-name-tournament"]');
	// if (tournamentLabel4) tournamentLabel4.textContent = "Player 4 Name:";

	// const tournamentInput4 = requireElementById<HTMLInputElement>(EL.PLAYER_SETUP.PLAYER4_NAME_TOURNAMENT);
	// tournamentInput4.placeholder = "Enter Player 4 name";

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
}

// Cycles to the next language in the list and updates the UI accordingly.
export function nextLanguage(): void {
	currentLang = (currentLang + 1) % langs.length;
	updateLanguageDisplay();
}

// Cycles to the previous language in the list and updates the UI accordingly.
export function previousLanguage(): void {
	currentLang = (currentLang - 1 + langs.length) % langs.length;
	updateLanguageDisplay();
}

// Retrieves a specific item based on current language
export function getText(key: TranslationKey): string {
	const t = getCurrentTranslation();
	return t[key];
}