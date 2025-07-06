// !!!!!!! Please update file in the root folder if you want to change or add something
// This file will be shared between frontend and backend

import { MessageType, GameMode, Direction } from './constants.js';

export interface Position {
    x: number;
    y: number;
    z: number;
}

export interface Size {
    x: number;
    y: number;
    z: number;
}

export interface GameStateData {
    paddleLeft: { x: number; score: number };
    paddleRight: { x: number; score: number };
    ball: { x: number; z: number };
}

export interface PlayerInput {
    id: string;
    type: MessageType.PLAYER_INPUT;
    side: number;
    dx: number;
}

export interface ClientMessage {
    type: MessageType;
    gameMode?: GameMode;
    side?: number;
    direction?: Direction;
}

export interface ServerMessage {
    type: MessageType;
    state?: GameStateData;
    side?: number;
    message?: string;
}