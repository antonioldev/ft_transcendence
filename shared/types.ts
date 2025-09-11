import { MessageType, GameMode, Direction, GameState, AuthState, PowerupType} from './constants.js';

// ============================== SHARED TYPES  ==============================

// Represents a 3D position in space
export interface Position {
	x: number; // X-coordinate
	y: number; // Y-coordinate
	z: number; // Z-coordinate
}

// Represents the size of an object in 3D space
export interface Size {
	x: number; // Width
	y: number; // Height
	z: number; // Depth
}

// Represents the state of the game (paddles and ball positions)
export interface GameStateData {
	paddleLeft: { x: number; score: number }; // Left paddle position and score
	paddleRight: { x: number; score: number }; // Right paddle position and score
	ball: { x: number; z: number, current_rally: number }; // Ball position
}

// Represents input from a player
export interface PlayerInput {
	id: string; // Player ID
	type: MessageType.PLAYER_INPUT; // Message type
	side: number; // Player side (left/right)
	dx: number; // Movement direction (-1, 0, 1)
}

// Represents a message sent from the client to the server
export interface ClientMessage {
	type: MessageType; // Type of message
	gameMode?: GameMode; // Game mode (optional)
	players?: PlayerInfo[];
	registerUser?: RegisterUser; // Used for create a new registration (not Google auth)
	loginUser?: LoginUser; // Use to confirm the ID of the user (not Google auth)
	side?: number; // Player side (optional)
	direction?: Direction; // Movement direction (optional)
	username?: string;
	aiDifficulty?: number,
	powerup_type?: PowerupType,
	slot?: 0 | 1 | 2,
}

// Represents a message sent from the server to the client
export interface ServerMessage {
	type: MessageType; // Type of message
	AuthState?: AuthState;
	state?: GameStateData; // Current game state (optional)
	message?: string; // Additional message (optional)
	stats?: UserStats;
	countdown?: number;
	gameHistory?: GameHistoryEntry[];
	winner?: string; // sent on end Game to display who won
	left?: string; // used to assign name of player on the left
	right?: string; // used to assign name of player on the right
	username?: string;
	sid?: string,
	match_index?: number,
	match_total?: number,
	round_index?: number
	powerup?: PowerupType,
	powerups?: (PowerupType | null)[],
	slot?: number,
	side?: number; // Player side (optional)
	lobby?: string[];
}

// Player information for game sessions
export interface PlayerInfo {
	id: string;		// Now: same as name, Future: real user ID from database
	name: string;	  // Display name (can have duplicates)
	isGuest: boolean;   // check if player is on database or just alias
}

// Represents the input data for a specific action or event.
export interface InputData{
	side: number;
	direction: Direction;
}

// ============================== AUTHENTIFICATION TYPES ==============================

/**
 * Represents the register/login structure without google that will be saved in db
 */
export interface RegisterUser {
	username: string;
	email: string;
	password: string;
}

export interface LoginUser {
	username: string;
	password: string;
}

export interface SessionUser {
	sid: string;
	userId: number;
	createdAt: number; 
	expiresAt: number; 
}

// ============================== USER MANAGEMENT TYPES ==============================

export interface UserProfileData {
  userId: number;
  username: string;
  email: string;
  victories: number;
  defeats: number;
  games: number;
}

export interface GetUserProfile {
  type: MessageType;
  data: { username: string };
}

export interface UserProfileMessage {
  type: MessageType;
  data: UserProfileData;
}

// ============================== DASHBOARD TYPES ==============================

export interface UserStats {
  victories: number;
  defeats: number;
  games: number;
  winRatio: number;
  [key: string]: number;
  tournamentsPlayed: number;
  tournamentWins: number;
  tournamentWinRatio: number;
}

export interface GameHistoryEntry {
  playedAt: string;
  opponent: string;
  score: string;
  result: string;
  isTournament: string;
  duration: number;
}


// ============================== FRONTEND-ONLY TYPES ==============================

// Represents the game objects in a Babylon.js scene
export interface GameObjects {
	players: {
		left: any;
		right: any;
	};
	ball: any;
	gameField: any;
	walls: any;
	cameras: any[];
	guiCamera: any;
	lights: any[];
}

// Player control configuration (keyboard mappings)
export interface PlayerControls {
	left: number;  // Key code for left movement
	right: number; // Key code for right movement
}

// Input configuration for both players
export interface InputConfig {
	playerLeft: PlayerControls;
	playerRight: PlayerControls;
}

// State configuration for game state management
export interface StateConfig {
	dialogId?: string;	  // ID of pause dialog
	controller?: any;	   // Game controller instance
	oppositeState?: GameState; // State to transition to
	playingState?: GameState;  // Playing state for this mode
}

// ============================== CAMERA & SCENE TYPES ==============================

// Camera configuration for scene setup
export interface CameraConfig {
	name: string;
	position: Position;
	viewport: {
		x: number;
		y: number; 
		width: number;
		height: number;
	};
}

// Light configuration for scene setup
export interface LightConfig {
	name: string;
	position: Position;
}

// Scene color configuration
export interface SceneColors {
	field: any;
	walls: any;
	players: {
		left: any;
		right: any;
	};
	ball: any;
}

// Complete scene configuration
export interface SceneConfig {
	colors: SceneColors;
	cameras: CameraConfig[];
	lights: LightConfig[];
}

// ============================== UTILITY TYPES ==============================

// Generic callback function type
export type Callback<T = void> = (data: T) => void;

// Network callback for input events
export type NetworkCallback = (side: number, direction: Direction) => void;

// WebSocket event callbacks
export interface WebSocketCallbacks {
	onGameState?: Callback<GameStateData>;
	onConnection?: Callback;
	onError?: Callback<string>;
}

// ============================== GAME CONFIGURATION TYPES ==============================

// Boundary configuration for player movement
export interface PlayerBoundaries {
	left: number;
	right: number;
}

// Wall configuration
export interface WallConfig {
	name: string;
	position: Position;
	size: {
		width: number;
		height: number;
		depth: number;
	};
}