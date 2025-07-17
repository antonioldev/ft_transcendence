import { MessageType, GameMode, Direction, GameState } from './constants.js';

// ============================== SHARED TYPES  ==============================

/**
 * Represents a 3D position in space
 */
export interface Position {
    x: number; // X-coordinate
    y: number; // Y-coordinate
    z: number; // Z-coordinate
}

/**
 * Represents the size of an object in 3D space
 */
export interface Size {
    x: number; // Width
    y: number; // Height
    z: number; // Depth
}

/**
 * Represents the state of the game (paddles and ball positions)
 */
export interface GameStateData {
    paddleLeft: { x: number; score: number }; // Left paddle position and score
    paddleRight: { x: number; score: number }; // Right paddle position and score
    ball: { x: number; z: number }; // Ball position
}

/**
 * Represents input from a player
 */
export interface PlayerInput {
    id: string; // Player ID
    type: MessageType.PLAYER_INPUT; // Message type
    side: number; // Player side (left/right)
    dx: number; // Movement direction (-1, 0, 1)
}

/**
 * Represents a message sent from the client to the server
 */
export interface ClientMessage {
    type: MessageType; // Type of message
    gameMode?: GameMode; // Game mode (optional)
    players?: PlayerInfo[];
    registerUser?: RegisterUser; // Used for create a new registration (not Google auth)
    loginUser?: LoginUser; // Use to confirm the ID of the user (not Google auth)
    side?: number; // Player side (optional)
    direction?: Direction; // Movement direction (optional)
}

/**
 * Represents a message sent from the server to the client
 */
export interface ServerMessage {
    type: MessageType; // Type of message
    state?: GameStateData; // Current game state (optional)
    side?: number; // Player side (optional)
    message?: string; // Additional message (optional)
}

/**
 * Player information for game sessions
 */
export interface PlayerInfo {
    id: string;        // Now: same as name, Future: real user ID from database
    name: string;      // Display name (can have duplicates)
}

/**
 * Represents the input data for a specific action or event.
 */
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


// ============================== FRONTEND-ONLY TYPES ==============================

/**
 * Represents the game objects in a Babylon.js scene
 */
export interface GameObjects {
    players: {
        left: any;
        right: any;
    };
    ball: any;
    ground: any;
    walls: any;
    cameras: any[];
    lights: any[];
}

/**
 * Player control configuration (keyboard mappings)
 */
export interface PlayerControls {
    left: number;  // Key code for left movement
    right: number; // Key code for right movement
}

/**
 * Input configuration for both players
 */
export interface InputConfig {
    playerLeft: PlayerControls;
    playerRight: PlayerControls;
}

/**
 * State configuration for game state management
 */
export interface StateConfig {
    dialogId?: string;      // ID of pause dialog
    controller?: any;       // Game controller instance
    oppositeState?: GameState; // State to transition to
    playingState?: GameState;  // Playing state for this mode
}

// ============================== CAMERA & SCENE TYPES ==============================

/**
 * Camera configuration for scene setup
 */
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

/**
 * Light configuration for scene setup
 */
export interface LightConfig {
    name: string;
    position: Position;
}

/**
 * Scene color configuration
 */
export interface SceneColors {
    field: any;
    walls: any;
    players: {
        left: any;
        right: any;
    };
    ball: any;
}

/**
 * Complete scene configuration
 */
export interface SceneConfig {
    colors: SceneColors;
    cameras: CameraConfig[];
    lights: LightConfig[];
}

// ============================== UTILITY TYPES ==============================

/**
 * Generic callback function type
 */
export type Callback<T = void> = (data: T) => void;

/**
 * Network callback for input events
 */
export type NetworkCallback = (side: number, direction: Direction) => void;

/**
 * WebSocket event callbacks
 */
export interface WebSocketCallbacks {
    onGameState?: Callback<GameStateData>;
    onConnection?: Callback;
    onError?: Callback<string>;
}

// ============================== GAME CONFIGURATION TYPES ==============================

/**
 * Boundary configuration for player movement
 */
export interface PlayerBoundaries {
    left: number;
    right: number;
}

/**
 * Wall configuration
 */
export interface WallConfig {
    name: string;
    position: Position;
    size: {
        width: number;
        height: number;
        depth: number;
    };
}