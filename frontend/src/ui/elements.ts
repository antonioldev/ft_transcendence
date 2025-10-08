import { Logger } from "../utils/LogManager.js";

// Centralized element ID constants to eliminate hard-coded strings throughout the application.
// All DOM element IDs should be defined here and referenced via these constants.

export const EL = {
  // ========================================
  // MAIN SCREENS
  // ========================================
  SCREENS: {
	MAIN_MENU: 'main-menu',
	LOGIN_MODAL: 'login-modal', 
	REGISTER_MODAL: 'register-modal',
	GAME_MODE_OVERLAY: 'game-mode-overlay',
	PLAYER_SETUP_OVERLAY: 'player-setup-overlay',
	GAME_3D: 'game-3d',
	STATS_DASHBOARD: 'stats-dashboard'
  },

  // ========================================
  // NAVIGATION & BUTTONS
  // ========================================
  BUTTONS: {
	// Main menu buttons
	PLAY: 'play-btn',
	LOGIN: 'login-btn',
	REGISTER: 'register-btn',
	LOGOUT: 'logout-btn',

	// Navigation buttons
	BACK: 'back',
	FORWARD: 'forward',
	MODE_BACK: 'mode-back',
	SETUP_BACK: 'setup-back',
	LOGIN_BACK: 'login-back',
	REGISTER_BACK: 'register-back',
	DASHBOARD_BACK: 'dashboard-back',
	SOLO_DIFFICULTY_BACK: 'solo-difficulty-back',
	SOLO_DIFFICULTY_FORWARD: 'solo-difficulty-forward',
	TOURNAMENT_NUMBER_BACK: 'tournament-number-back',
	TOURNAMENT_NUMBER_FORWARD: 'tournament-number-forward',
	TOURNAMENT_ONLINE_NUMBER_BACK: 'tournament-online-number-back',
	TOURNAMENT_ONLINE_NUMBER_FORWARD: 'tournament-online-number-forward',


	// View mode navigation
  VIEW_MODE_CLASSIC: 'view-mode-classic',
  VIEW_MODE_IMMERSIVE: 'view-mode-immersive',

  // Form submission buttons
  LOGIN_TITLE: 'login-title',
  REGISTER_TITLE: 'register-title',
  LOGIN_SUBMIT: 'login-submit',
  REGISTER_SUBMIT: 'register-submit',
  START_GAME: 'start-game',
  GOOGLE_LOGIN: 'google-login-btn-container',
  FORGOT_PASSWORD: 'forgot-password',
  NOT_REGISTERED: 'not-registered',
  ALREADY_REGISTERED: 'already-registered',

	// Modal switching
	SHOW_REGISTER: 'show-register',
	SHOW_LOGIN: 'show-login',

	// Dashboard view
	DASHBOARD: 'dashboard-btn'
  },

  // ========================================
  // GAME MODE BUTTONS
  // ========================================
  GAME_MODES: {
	SOLO: 'solo-mode',			  // GameMode.SINGLE_PLAYER
	LOCAL: 'local-mode',			// GameMode.TWO_PLAYER_LOCAL  
	ONLINE: 'online-mode',		  // GameMode.TWO_PLAYER_REMOTE
	TOURNAMENT: 'tournament-mode',  // GameMode.TOURNAMENT_LOCAL
	TOURNAMENT_ONLINE: 'tournament-online-mode' // GameMode.TOURNAMENT_REMOTE
  },

  // ========================================
  // AUTHENTICATION FORMS
  // ========================================
  AUTH: {
	// Login form
	LOGIN_USERNAME: 'login-username',
	LOGIN_PASSWORD: 'login-password',
	LOGIN_FORM: 'login-form',

	// Register form  
	REGISTER_USERNAME: 'register-username',
	REGISTER_EMAIL: 'register-email',
	REGISTER_PASSWORD: 'register-password',
	REGISTER_CONFIRM_PASSWORD: 'register-confirm-password',
	REGISTER_FORM: 'register-form'
  },

  // ========================================
  // PLAYER SETUP FORMS
  // ========================================
  PLAYER_SETUP: {
// 	// Solo player setup
// 	PLAYER1_NAME: 'player1-name',

// 	// Local multiplayer setup
// 	PLAYER1_NAME_LOCAL: 'player1-name-local',
// 	PLAYER2_NAME_LOCAL: 'player2-name-local',

// 	// Online setup (if needed)
// 	PLAYER1_NAME_ONLINE: 'player1-name-online',

// 	// Tournament setup
// 	PLAYER1_NAME_TOURNAMENT: 'player1-name-tournament',
// 	PLAYER2_NAME_TOURNAMENT: 'player2-name-tournament',
// 	PLAYER3_NAME_TOURNAMENT: 'player3-name-tournament',
// 	PLAYER4_NAME_TOURNAMENT: 'player4-name-tournament',

	// Setup forms
	SOLO_SETUP: 'solo-setup',
	TWO_PLAYERS_SETUP: 'two-players-setup',
	TOURNAMENT_SETUP: 'offline-tournament-setup',
  },

	PLAYER_COLLECTION: {
		FORM: 'player-setup',
		LABEL: 'player-label',
		INPUT: 'player-input',
		ADD_CPU: 'add-cpu',
	},

  // ========================================
  // UI DISPLAY ELEMENTS
  // ========================================
  DISPLAY: {
	// Main title and headers
	MAIN_TITLE: 'main-title',
	MODE_TITLE: 'mode-title',
	SETUP_TITLE: 'setup-title',

	// Language selector
	LANGUAGE_SELECT: 'language_select',
	VIEW_MODE_DISPLAY: 'view-mode-display',

  // User info display
  USER_INFO: 'user-info',
  USER_NAME: 'user-name',
  AUTH_BUTTONS: 'auth-buttons',
  GREETING: 'greeting',

	// Connection status
	CONNECTION_STATUS: 'connection-status'
  },

	// ========================================
	// DASHBOARD ELEMENTS
	// ========================================
	DASHBOARD: {
	USER_STATS_CHART: 'user-stats-chart',
	GAME_HISTORY_TABLE: 'game-history-table'
  },
  // ========================================
  // GAME ELEMENTS
  // ========================================
  GAME: {
	// Canvas
	CANVAS_3D: 'game-canvas-3d',

	LOADING_SCREEN: 'loading-screen',
	LOADING_TEXT: 'loading',
	PROGRESS_FILL: 'progress-fill',
	PROGRESS_TEXT: 'progress-text'
  },

  // ========================================
  // CONTAINERS & LAYOUT
  // ========================================
  CONTAINERS: {
    MODE_BUTTONS_TABLE: 'mode-buttons-table'
  },

  // ========================================
  // ERROR MESSAGES
  // ========================================
  ERRORS: {
    LOGIN_USERNAME_ERROR: 'login-username-error',
    LOGIN_PASSWORD_ERROR: 'login-password-error',
    REGISTER_USERNAME_ERROR: 'register-username-error',
    REGISTER_EMAIL_ERROR: 'register-email-error',
    REGISTER_PASSWORD_ERROR: 'register-password-error',
    REGISTER_CONFIRM_PASSWORD_ERROR: 'register-confirm-password-error'
  }
} as const;

// ========================================
// UTILITY TYPES
// ========================================

/**
 * Extract all element ID values for type safety
 */
type ElementIdValues = 
  | typeof EL.SCREENS[keyof typeof EL.SCREENS]
  | typeof EL.BUTTONS[keyof typeof EL.BUTTONS]
  | typeof EL.GAME_MODES[keyof typeof EL.GAME_MODES]
  | typeof EL.AUTH[keyof typeof EL.AUTH]
//   | typeof EL.PLAYER_SETUP[keyof typeof EL.PLAYER_SETUP]
  | typeof EL.PLAYER_COLLECTION[keyof typeof EL.PLAYER_COLLECTION]
  | typeof EL.DISPLAY[keyof typeof EL.DISPLAY]
  | typeof EL.GAME[keyof typeof EL.GAME]
  | typeof EL.CONTAINERS[keyof typeof EL.CONTAINERS]
  | typeof EL.DASHBOARD[keyof typeof EL.DASHBOARD];

/**
 * Type-safe helper function to get element by ID
 */
export function getElementById<T extends HTMLElement = HTMLElement>(
  elementId: ElementIdValues
): T | null {
  return document.getElementById(elementId) as T | null;
}

/**
 * Type-safe helper function to get element by ID with assertion
 */
export function requireElementById<T extends HTMLElement = HTMLElement>(
  elementId: ElementIdValues
): T {
  const element = document.getElementById(elementId) as T | null;
  if (!element)
	Logger.errorAndThrow(`Required element not found: ${elementId}`, 'UIManager');
  return element;
}