import { AiDifficulty } from '../shared/constants.js';
import { generateClientId } from '../data/database.js';

/**
 * Represents a physical device/browser connection to the server
 * One client can control multiple players (e.g., local multiplayer)
 * This is about the WebSocket connection, not the game participant
 */
export class Client {
    id: string = generateClientId();
    username: string;       // Username for future authentication (not used yet)
    email: string;       // email for future authentication (not used yet)
    websocket: any;
    loggedIn: boolean;      // Whether this client is authenticated
    is_connected: Boolean = true;

    constructor(username: string, email: string, websocket: any) {
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
    client: Client;    // Which client connection controls this player (undefined for AI)
    side: number = 0;         // Which paddle this player controls (LEFT/RIGHT)

    constructor(id: string, name: string, client: Client) {
        this.id = id;
        this.name = name;
        this.client = client;
    }
}

export class CPU {
    id: string;           // Unique identifier for this player
    name: string;         // Display name shown in game
    difficulty: AiDifficulty;    // difficulty of CPU
    side: number = 0;         // Which paddle this player controls (LEFT/RIGHT)

    constructor(id: string, name: string, difficulty: AiDifficulty) {
        this.id = id;
        this.name = name;
        this.difficulty = difficulty;
    }
}
