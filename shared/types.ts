// !!!!!!! Please update file in the root folder if you want to change or add something
// This file will be shared between frontend and backend

import { MessageType, GameMode, Direction } from './constants.js';

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
    ball: { x: number; z: number }; // Ball position
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
    side?: number; // Player side (optional)
    direction?: Direction; // Movement direction (optional)
}

// Represents a message sent from the server to the client
export interface ServerMessage {
    type: MessageType; // Type of message
    state?: GameStateData; // Current game state (optional)
    side?: number; // Player side (optional)
    message?: string; // Additional message (optional)
}

export interface PlayerInfo {
    id: string;        // Now: same as name, Future: real user ID from database
    name: string;      // Display name (can have duplicates)
}