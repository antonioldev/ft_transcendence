import { Paddle } from '../core/Paddle.js'

/**
 * Represents a physical device/browser connection to the server
 * One client can control multiple players (e.g., local multiplayer)
 * This is about the WebSocket connection, not the game participant
 */
export class Client {
    id: string;
    username: string;     // Username for future authentication (not used yet)
    password: string;     // Password for future authentication (not used yet)
    websocket: any;
    loggedIn: boolean;    // Track authentication status
    isGuest: boolean;     // Track if this is a guest user

    constructor(id: string, username: string, password: string, websocket: any) {
        this.id = id;
        this.username = username;     // Keep for future use
        this.password = password;     // Keep for future use
        this.websocket = websocket;
        this.loggedIn = false;        // Default to not logged in
        this.isGuest = false;         // Default to not guest
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
    client: Client | null;    // Which client connection controls this player (undefined for AI)
    side: number = 0;         // Which paddle this player controls (LEFT_PADDLE/RIGHT_PADDLE)

    constructor(id: string, name: string, client: Client | null = null) {
        this.id = id;
        this.name = name;
        this.client = client;
    }
}

