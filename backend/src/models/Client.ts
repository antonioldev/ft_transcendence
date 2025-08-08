import { Paddle } from '../core/Paddle.js'

/**
 * Represents a physical device/browser connection to the server
 * One client can control multiple players (e.g., local multiplayer)
 * This is about the WebSocket connection, not the game participant
 */
export class Client {
    id: string;
    username: string;       // Username for future authentication (not used yet)
    email: string;       // email for future authentication (not used yet)
    websocket: any;
    loggedIn: boolean;      // Whether this client is authenticated

    constructor(id: string, username: string, email: string, websocket: any) {
        this.id = id;
        this.username = username;       // Keep for future use
        this.email = email;       // Keep for future use
        this.websocket = websocket;
        this.loggedIn = false;          // Default to not logged in
    }
}

/**
 * Represents an actual game participant (human or AI)
 * This is about the person playing, not the connection
 * Multiple players can be controlled by one client (local multiplayer)
 */
export class Player {
    id: string;           // Unique identifier for this player
    name: string;         // Display name shown in game
    client?: Client;    // Which client connection controls this player (undefined for AI)
    side: number = 0;         // Which paddle this player controls (LEFT_PADDLE/RIGHT_PADDLE)
    difficulty?: number;    // difficulty of CPU

    constructor(id: string, name: string, client?: Client, difficulty: number = 3) {
        this.id = id;
        this.name = name;
        this.client = client;
        this.difficulty = difficulty;
    }
}
