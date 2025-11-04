import { GameMode } from "../shared/constants";

export enum ConnectionStatus {
	CONNECTING = 0,	// Attempting to connect
	CONNECTED = 1,	 // Connected and ready
	FAILED = 2		 // Connection failed - show error
}

export enum AppState {
	MAIN_MENU ,
	LOGIN ,
	REGISTER ,
	INSTRUCTIONS,
	GAME_MODE ,
	PLAYER_SETUP ,
	GAME_3D ,
	STATS_DASHBOARD ,
	SETTINGS ,
}

export enum ViewMode {
	MODE_2D = 0,		// 2D view
	MODE_3D = 1			// 3D view
}

export enum PlayerSide {
	LEFT = 0,
	RIGHT = 1
}

export enum Quality {
	LOW,
	MEDIUM,
	HIGH
}

// export enum UserManagement {
// 	SEND_USER_PROFILE,	  // Type for front to backend comm
// 	REQUEST_USER_PROFILE,	// Type for back to frontend comm
// 	UPDATE_USER_PROFILE	 // Request to update user information 
// }

export const TOURNAMENT_SIZES = [4, 8, 16] as const;

export const MIN_PLAYERS_FOR_CPU: Record<number, number> = { 4: 3, 8: 5, 16: 9 };

export const GAME_MODE_CONFIG = {
	[GameMode.SINGLE_PLAYER]: {
		requiresAuth: false,
		requiresSetup: true,
		availableOfflineOnly: false
	},
	[GameMode.TWO_PLAYER_LOCAL]: {
		requiresAuth: false,
		requiresSetup: true,
		availableOfflineOnly: true
	},
	[GameMode.TWO_PLAYER_REMOTE]: {
		requiresAuth: true,
		requiresSetup: false,
		availableOfflineOnly: false
	},
	[GameMode.TOURNAMENT_LOCAL]: {
		requiresAuth: false,
		requiresSetup: true,
		availableOfflineOnly: true
	},
	[GameMode.TOURNAMENT_REMOTE]: {
		requiresAuth: true,
		requiresSetup: false,
		availableOfflineOnly: false
	}
} as const;

export enum BUTTON_NAV {
	PREV,
	NEXT
}

export const Keys = {
  W: 87, S: 83, A: 65, D: 68,
  C: 67, V: 86, B: 66, I: 73, O: 79, P: 80,
  UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39,
  ESC: 27, Y: 89,
  ONE: 49, TWO: 50, THREE: 51
} as const;

export const PROFILES_2D = {
  P1: { move: { left: Keys.W, right: Keys.S }, power: { k1: Keys.C, k2: Keys.V, k3: Keys.B } },
  P2: { move: { left: Keys.UP, right: Keys.DOWN }, power: { k1: Keys.I, k2: Keys.O, k3: Keys.P } },
  DEFAULT: { move: { left: Keys.UP, right: Keys.DOWN }, power: { k1: Keys.ONE, k2: Keys.TWO, k3: Keys.THREE } },
  DEFAULT_RIGHT: { move: { left: Keys.UP, right: Keys.DOWN }, power: { k1: Keys.ONE, k2: Keys.TWO, k3: Keys.THREE } }
} as const;

export const PROFILES_3D = {
  P1: { move: { left: Keys.A, right: Keys.D }, power: { k1: Keys.C, k2: Keys.V, k3: Keys.B } },
  P2: { move: { left: Keys.RIGHT, right: Keys.LEFT }, power: { k1: Keys.I, k2: Keys.O, k3: Keys.P } },
  DEFAULT: { move: { left: Keys.LEFT, right: Keys.RIGHT }, power: { k1: Keys.ONE, k2: Keys.TWO, k3: Keys.THREE } },
  DEFAULT_RIGHT: { move: { left: Keys.RIGHT, right: Keys.LEFT }, power: { k1: Keys.ONE, k2: Keys.TWO, k3: Keys.THREE } }
} as const;

export enum KeyboardMode {
	NORMAL,
	PAUSED,
	SPECTATOR_CHOICE,
	SPECTATOR,
	DISABLED
}