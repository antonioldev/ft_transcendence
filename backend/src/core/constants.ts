export enum MessageType {
    JOIN_GAME, // = 'join_game',
    PLAYER_INPUT, // = 'player_input',
    GAME_STATE, // = 'game_state',
    SIDE_ASSIGNMENT, // = 'side_assignment',
    GAME_STARTED, // = 'game_started',
    ERROR // = 'error'
}

export enum GameMode {
    SINGLE_PLAYER, // = 'single_player',
    TWO_PLAYER_LOCAL, // = 'two_player_local',
    TWO_PLAYER_REMOTE // = 'two_player_remote'
}

export enum Direction {
    LEFT, // = 'left',
    RIGHT, // = 'right',
    STOP // = 'stop'
}

export enum CollisionDirection {
    HORIZONTAL,
    VERTICAL
}