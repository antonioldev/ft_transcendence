// !!!!!!! Please update file in the root folder if you want to change or add something
// This file will be shared between frontend and backend

// Types of messages exchanged between client and server
export enum MessageType {
	JOIN_GAME,		  // CLIENT -> SERVER: Client requests to start a game
	PLAYER_INPUT,	   // CLIENT -> SERVER: Player input data
	GAME_STATE,		 // SERVER -> CLIENTS: Current game state update
	SIDE_ASSIGNMENT,	// SERVER -> CLIENTS: Assign player to a side (left/right)
	ERROR,			  // SERVER -> CLIENTS: Error message
	QUIT_GAME,		  // CLIENT -> SERVER: Send this message when CTRL + Y
	PAUSE_REQUEST,	  // CLIENT -> SERVER: Client requests pause (ESC key)
	RESUME_REQUEST,	 // CLIENT -> SERVER: Client requests resume (N key)  
	SESSION_ENDED,	  // SERVER -> CLIENTS: Server notifies all games are completed
	PLAYER_READY,	   // CLIENT -> SERVER: Client loaded babylon and is waiting for server
	REQUEST_LOBBY,		// Client requests the lobby from the server
	TOURNAMENT_LOBBY,	   // broadcasts the tournament lobby whenever it changes 
	REGISTER_USER,		 // New User want to register --> going to create a new row in db
	LOGIN_USER,			// User want to connect to their account --> calling function for validate info
	LOGOUT_USER,
	SUCCESS_LOGIN,		 // Successfully login a user 
	SUCCESS_REGISTRATION,  // Succesfylly register new user
	LOGIN_FAILURE,		 // failure in login user -- id or pwd not matching
	USERNAME_TAKEN,		 // failure to register new user -- username already exist in database  
	USER_EXIST,			// failure to register new user -- exist in db
	USER_NOTEXIST,		 // failure in login user -- do not exist in db 
	SEND_USER_PROFILE,	  // Type for front to backend comm
	REQUEST_USER_STATS,
	SEND_USER_STATS,
	REQUEST_GAME_HISTORY,
	SEND_GAME_HISTORY,
	REQUEST_USER_PROFILE,	// Type for back to frontend comm
	UPDATE_USER_PROFILE,	 // Request to update user information 
	COUNTDOWN,			   // Used to send countdown timer before game starts
	MATCH_WINNER,			// Used to display winner screen
	MATCH_RESULT,			// Used to update tournament tree with match winner
	MATCH_ASSIGNMENT,		// Used to send tournament match assignment to all clients
	ACTIVATE_POWERUP,		// Activates a specified powerup
	TOGGLE_SPECTATOR_GAME	// Used to change which game the spectator is watching
}

export enum WebSocketEvent {
	GAME_STATE = 'gameState',
	CONNECTION = 'connection',
	COUNTDOWN = 'countdown',
	ERROR = 'error',
	GAME_PAUSED = 'gamePaused',
	GAME_RESUMED = 'gameResumed',
	SESSION_ENDED = 'sessionEnded',
	STATUS_CHANGE = 'statusChange',
	SIDE_ASSIGNMENT = 'side_assignment',
	LOGIN_SUCCESS = 'LOGIN_SUCCESS',
	LOGIN_FAILURE = 'LOGIN_FAILURE',
	REGISTRATION_SUCCESS = 'REGISTRATION_SUCCESS',
	REGISTRATION_FAILURE = 'REGISTRATION_FAILURE',
	USER_STATS = 'USER_STATS',
	GAME_HISTORY = 'GAME_HISTORY',
	MATCH_ASSIGNMENT = 'match_assignment',
	MATCH_WINNER = 'match_winner',
	MATCH_RESULT = 'match_result',
	POWERUP_ASSIGNMENT = 'powerup_assignment',
	POWERUP_ACTIVATED = 'powerup_activated',
	POWERUP_DEACTIVATED = 'powerup_deactivated',
	TOURNAMENT_LOBBY = 'tournament_lobby'
	
}

// Different game modes available
export enum GameMode {
	SINGLE_PLAYER = 'solo-mode',
	TWO_PLAYER_LOCAL = 'local-mode',			// Two players on the same device
	TWO_PLAYER_REMOTE = 'online-mode',		  // Two players over the network
	TOURNAMENT_LOCAL = 'tournament-mode',	   // Tournament mode, all player same page
	TOURNAMENT_REMOTE = 'tournament-online-mode'// Tournament mode, over the network
}

export enum PowerupType {
	SLOW_OPPONENT,
	SHRINK_OPPONENT,
	INVERT_OPPONENT,
	INCREASE_PADDLE_SPEED,
	GROW_PADDLE,
	FREEZE,
}
export enum PowerupState {
	UNUSED,
	ACTIVE,
	SPENT,
}

// Directions for player movement
export enum Direction {
	LEFT = -1,			  // Move left
	RIGHT = 1,			 // Move right
	STOP = 0			   // Stop movement
}

// States the client can be in
export enum ClientState {
	PLAYING,
	PAUSED,
	MATCH_ENDED,
	WAITING,
	EXITING,
	CONNECTING,
	PAUSED_LOCAL,
	SPECTATOR,
	SPECTATOR_PAUSED
}

// States the game can be in
export enum GameState {
	INIT,
	RUNNING,
	PAUSED,
	ENDED,
}

// View modes for the game
export enum ViewMode {
	MODE_2D = 0,		   // 2D view
	MODE_3D = 1			// 3D view
}

// Directions of collision
export enum CollisionDirection {
	HORIZONTAL = 0,		// Horizontal collision
	FRONT = 1		   // Front collision
}

export enum AuthState {
	GUEST = 0,
	LOGGED_IN = 1,
	LOGGED_FAILED = 2
}

export enum AuthCode {
  OK = 0,
  NOT_FOUND = 1,
  BAD_CREDENTIALS = 2,
  USERNAME_TAKEN = 2,
  USER_EXISTS = 1,
  ALREADY_LOGIN = 3,
}

export enum ConnectionStatus {
	CONNECTING = 0,	// Attempting to connect
	CONNECTED = 1,	 // Connected and ready
	FAILED = 2		 // Connection failed - show error
}

export enum AppState {
	MAIN_MENU ,// = 'main-menu',
	LOGIN ,//= 'login',
	REGISTER ,//= 'register',
	GAME_MODE ,//= 'game-mode',
	PLAYER_SETUP ,//= 'player-setup',
	GAME_3D ,//= 'game-3d',
	STATS_DASHBOARD ,//= 'STATS_DASHBOARD'
}

export enum AiDifficulty {
	EASY,
	MEDIUM,
	HARD,
	IMPOSSIBLE
}

export enum UserManagement {
	SEND_USER_PROFILE,	  // Type for front to backend comm
	REQUEST_USER_PROFILE,	// Type for back to frontend comm
	UPDATE_USER_PROFILE	 // Request to update user information 
}

// export enum PowerUpAction {
// 	CREATED = "created",
// 	ACTIVATED = "activated", 
// 	DEACTIVATED = "deactivated"
// }