// !!!!!!! Please update file in the root folder if you want to change or add something
// This file will be shared between frontend and backend

// Types of messages exchanged between client and server
export enum MessageType {
    JOIN_GAME = 0,         // Client requests to join a game
    PLAYER_INPUT = 1,      // Player input data
    GAME_STATE = 2,        // Current game state update
    SIDE_ASSIGNMENT = 3,   // Assign player to a side (left/right)
    GAME_STARTED = 4,      // Notify that the game has started
    ERROR = 5,             // Error message
    QUIT_GAME = 6,         // Send this message when CTRL + Y
    REGISTER_USER,         // New User want to register --> going to create a new row in db
    LOGIN_USER             // User want to connect to their account --> calling function for validate info
}

// Different game modes available
export enum GameMode {
    SINGLE_PLAYER = 0,     // Single-player mode
    TWO_PLAYER_LOCAL = 1,  // Two players on the same device
    TWO_PLAYER_REMOTE = 2, // Two players over the network
	TOURNAMENT_LOCAL = 3,        // Tournament mode, all player same page
    TOURNAMENT_REMOTE = 4
}

// Directions for player movement
export enum Direction {
    LEFT = 0,              // Move left
    RIGHT = 1,             // Move right
    STOP = 2               // Stop movement
}

// States the game can be in
export enum GameState {
    PLAYING = 0,
    PAUSED = 1
}

// View modes for the game
export enum ViewMode {
    MODE_2D = 0,           // 2D view
    MODE_3D = 1            // 3D view
}

// Directions of collision
export enum CollisionDirection {
    HORIZONTAL = 0,        // Horizontal collision
    VERTICAL = 1           // Vertical collision
}

export enum AuthState {
    GUEST = 0,
    LOGGED_IN = 1,
    LOGGED_FAILED
}

export enum ConnectionStatus {
    CONNECTING = 0,    // Attempting to connect
    CONNECTED = 1,     // Connected and ready
    FAILED = 2         // Connection failed - show error
}

export enum AppState {
    MAIN_MENU = 'main-menu',
    LOGIN = 'login',
    REGISTER = 'register',
    GAME_MODE = 'game-mode',
    PLAYER_SETUP = 'player-setup',
    GAME_2D = 'game-2d',
    GAME_3D = 'game-3d'
}