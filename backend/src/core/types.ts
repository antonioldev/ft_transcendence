import { MessageType, GameMode, Direction } from './constants.js';

export type PlayerInput = {
	id: string;
	type: MessageType.PLAYER_INPUT;
	side: number;
	dx: number;
}

export type GameState = {
	paddleLeft: {x: number, score: number};
	paddleRight: {x: number, score: number};
	ball: {x: number, z: number}
}

export type ClientMessage = {
	type: MessageType;
    gameMode?: GameMode;
    side?: number;
    direction?: Direction;
}

export type ServerMessage = {
	type: MessageType;
    state?: GameState;
    side?: number;
    message?: string;
}