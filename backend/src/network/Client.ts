import { AiDifficulty } from '../shared/constants.js';
import { generateClientId } from '../data/database.js';

/**
 * Represents a physical device/browser connection to the server
 * One client can control multiple players (e.g., local multiplayer)
 * This is about the WebSocket connection, not the game participant
 */
export class Client {
    id: string = generateClientId();
    sid: string;
    username: string = "default";       // Username for future authentication (not used yet)
    email: string = "default@default";          // email for future authentication (not used yet)
    password?: string;
    websocket?: any;        // websocket is assigned when they join their first game
    loggedIn: boolean = false;      // Whether this client is authenticated
    is_connected: Boolean = true;

    constructor(sid: string) {
        this.sid = sid;
    }

    setInfo(username: string, email: string, password: string) {
        this.username = username;       // Keep for future use
        this.email = email;       // Keep for future use
        this.password = password
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
