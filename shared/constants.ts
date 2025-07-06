// !!!!!!! Please update file in the root folder if you want to change or add something
// This file will be shared between frontend and backend

export enum MessageType {
    JOIN_GAME = 0,
    PLAYER_INPUT = 1,
    GAME_STATE = 2,
    SIDE_ASSIGNMENT = 3,
    GAME_STARTED = 4,
    ERROR = 5
}

export enum GameMode {
    SINGLE_PLAYER = 0,
    TWO_PLAYER_LOCAL = 1,
    TWO_PLAYER_REMOTE = 2
}

export enum Direction {
    LEFT = 0,
    RIGHT = 1,
    STOP = 2
}

export enum GameState {
    MENU = 0,
    PLAYING_2D = 1,
    PLAYING_3D = 2,
    PAUSED_2D = 3,
    PAUSED_3D = 4
}

export enum ViewMode {
    MODE_2D = 0,
    MODE_3D = 1
}

export enum CollisionDirection {
    HORIZONTAL = 0,
    VERTICAL = 1
}