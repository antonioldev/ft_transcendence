// !!!!!!! Please update file in the root folder if you want to change or add something
// This file will be shared between frontend and backend

// Types of messages exchanged between client and server
export enum MessageType {
    JOIN_GAME,          // CLIENT -> SERVER: Client requests to start a game
    PLAYER_INPUT,       // CLIENT -> SERVER: Player input data
    GAME_STATE,         // SERVER -> CLIENTS: Current game state update
    SIDE_ASSIGNMENT,    // SERVER -> CLIENTS: Assign player to a side (left/right)
    // GAME_STARTED,       // SERVER -> CLIENT: Welcome to game (after JOIN_GAME)
    ERROR,              // SERVER -> CLIENTS: Error message
    QUIT_GAME,          // CLIENT -> SERVER: Send this message when CTRL + Y
    PAUSE_REQUEST,      // CLIENT -> SERVER: Client requests pause (ESC key)
    RESUME_REQUEST,     // CLIENT -> SERVER: Client requests resume (N key)  
    PAUSED,             // SERVER -> CLIENTS: Server confirms pause to all clients
    RESUMED,            // SERVER -> CLIENTS: Server confirms resume to all clients
    GAME_ENDED,         // SERVER -> CLIENTS: Server notifies game ended (when someone quits with Y)
    WELCOME,             // SERVER -> CLIENT: Welcome message on connection
    REGISTER_USER,         // New User want to register --> going to create a new row in db
    LOGIN_USER,            // User want to connect to their account --> calling function for validate info
    SUCCESS_LOGIN,         // Successfully login a user 
    SUCCESS_REGISTRATION,  // Succesfylly register new user
    LOGIN_FAILURE,         // failure in login user -- id or pwd not matching
    USERNAME_TAKEN,         // failure to register new user -- username already exist in database  
    USER_EXIST,            // failure to register new user -- exist in db
    USER_NOTEXIST         // failure in login user -- do not exist in db 
}

export enum WebSocketEvent {
    GAME_STATE = 'gameState',
    CONNECTION = 'connection',
    ERROR = 'error',
    GAME_PAUSED = 'gamePaused',
    GAME_RESUMED = 'gameResumed',
    GAME_ENDED = 'gameEnded',
    STATUS_CHANGE = 'statusChange',
}

// Different game modes available
export enum GameMode {
    SINGLE_PLAYER = 'solo-mode',
    TWO_PLAYER_LOCAL = 'local-mode',            // Two players on the same device
    TWO_PLAYER_REMOTE = 'online-mode',          // Two players over the network
	TOURNAMENT_LOCAL = 'tournament-mode',       // Tournament mode, all player same page
    TOURNAMENT_REMOTE = 'tournament-online-mode'// Tournament mode, over the network
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
    LOGGED_FAILED = 2
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
    GAME_3D = 'game-3d'
}

export enum UserManagement {
    SEND_USER_PROFILE,      // Type for front to backend comm
    REQUEST_USER_PROFILE,    // Type for back to frontend comm
    UPDATE_USER_PROFILE     // Request to update user information 
}