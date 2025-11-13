import { AiDifficulty } from '../shared/constants.js';

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
