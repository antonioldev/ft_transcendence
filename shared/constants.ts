// !!!!!!! Please update file in the root folder if you want to change or add something
// This file will be shared between frontend and backend

// Types of messages exchanged between client and server
export enum MessageType {
    JOIN_GAME = 0,         // Client requests to join a game
    PLAYER_INPUT = 1,      // Player input data
    GAME_STATE = 2,        // Current game state update
    SIDE_ASSIGNMENT = 3,   // Assign player to a side (left/right)
    GAME_STARTED = 4,      // Notify that the game has started
    ERROR = 5              // Error message
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
    MENU = 0,              // Main menu
    PLAYING_2D = 1,        // Playing in 2D mode
    PLAYING_3D = 2,        // Playing in 3D mode
    PAUSED_2D = 3,         // Paused in 2D mode
    PAUSED_3D = 4          // Paused in 3D mode
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
    LOGGED_OUT = 0,
    LOGGED_IN = 1, 
    OFFLINE = 2
}

export enum ConnectionStatus {
    CONNECTING = 0,    // Attempting to connect
    CONNECTED = 1,     // Connected and ready
    FAILED = 2         // Connection failed - show error
}