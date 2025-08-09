import { GameSession } from '../network/GameSession.js';
import { TournamentLocal, TournamentRemote } from '../network/Tournament.js';
import { Client } from './Client.js';
import { GameMode } from '../shared/constants.js';
import { registerNewGame, addPlayer2 } from '../data/validation.js';
import * as db from "../data/validation.js";
import { GAME_CONFIG } from '../shared/gameConfig.js';

/**
 * Manages game sessions and player interactions within the game.
 */
class GameManager {
    private games: Map<string, GameSession | TournamentLocal | TournamentRemote> = new Map();
    private waitingPlayers: Client[] = [];

    /**
     * Creates a new game session with the specified mode and adds the given client to it.
     * @param mode - The game mode (e.g., SINGLE_PLAYER, MULTIPLAYER).
     * @param client - The client initiating the game.
     * @returns The unique ID of the created game session.
     */
    createGame(mode: GameMode, client: Client): string {
        const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // Create a new game in DB with 1st player as client only if the game is remote
        if (mode === GameMode.TWO_PLAYER_REMOTE)
            registerNewGame(gameId, client.username, 0);
        else if (mode === GameMode.TOURNAMENT_REMOTE)
            registerNewGame(gameId, client.username, 1);

        // Create new gamesession and add the client
        let gameSession: GameSession | TournamentLocal | TournamentRemote;
        if (mode === GameMode.TOURNAMENT_LOCAL) {
            gameSession = new TournamentLocal(mode, gameId, 4); // TEMP HARDCODED TO 4 PLAYERS
        }
        else if (mode === GameMode.TOURNAMENT_REMOTE) {
            gameSession = new TournamentRemote(mode, gameId, 4); // TEMP HARDCODED TO 4 PLAYERS
        }
        else {
            gameSession = new GameSession(mode, gameId);
        }

        gameSession.add_client(client);
        this.games.set(gameId, gameSession);

        // if gameSession not full after a period of time then start automatically with CPU's
        // setTimeout(() => this.runGame(gameSession), (GAME_CONFIG.maxJoinWaitTime * 1000));
        setTimeout(() => { // [x] added a check if gameId exist, so it won't launch a new game
            if (this.games.has(gameId))
                this.runGame(gameSession);
        }, (GAME_CONFIG.maxJoinWaitTime * 1000));
        console.log(`Created ${mode} game: ${gameId}`);
        return gameId;
    }

    /**
     * Allows a client to join an existing game session if it is not full.
     * @param gameId - The unique ID of the game session.
     * @param client - The client attempting to join the game.
     * @returns True if the client successfully joined the game, otherwise false.
     */
    joinGame(gameId: string, client: Client): boolean {
        const game = this.games.get(gameId);
        if (game && !game.full) {
            game.add_client(client);
            return true;
        }
        return false;
    }

    /**
     * Finds an available game session for the specified mode or creates a new one.
     * @param mode - The game mode (e.g., SINGLE_PLAYER, MULTIPLAYER).
     * @param client - The client looking for a game session.
     * @returns The unique ID of the found or created game session.
     */
    findOrCreateGame(mode: GameMode, client: Client): string {
        //For local games, just create game
        if (mode === GameMode.SINGLE_PLAYER || mode === GameMode.TWO_PLAYER_LOCAL|| mode === GameMode.TOURNAMENT_LOCAL) {
            return this.createGame(mode, client);
        }
        else { // all remote games
            // Try to find waiting game or create new one
            for (const [gameId, game] of this.games) {
                if (game.mode === mode && !game.full) {
                    game.add_client(client);
                    addPlayer2(gameId, client.username); // add security
                    return gameId;
                }

            }
        }

        // No waiting games, create new one
        return this.createGame(mode, client);
    }

    async runGame(gameSession: GameSession | TournamentLocal | TournamentRemote): Promise<void> {
        if (gameSession.running) return ;

        db.updateStartTime(gameSession.id);
        await gameSession.start();
        gameManager.removeGame(gameSession.id);
    }

    /**
     * Retrieves a game session by its unique ID.
     * @param gameId - The unique ID of the game session.
     * @returns The game session if found, otherwise undefined.
     */
    getGame(gameId: string): GameSession | TournamentLocal | TournamentRemote | undefined {
        return this.games.get(gameId);
    }

    /**
     * Removes a game session by its unique ID.
     * @param gameId - The unique ID of the game session to be removed.
     */
    removeGame(gameId: string): void {
        this.games.delete(gameId);
        console.log(`Removed game: ${gameId}`);
    }

    /**
     * Removes a client from all game sessions they are part of.
     * If a game session becomes empty, it is removed.
     * @param client - The client to be removed from game sessions.
     */
    removeClientFromGames(client: Client): void {
        for (const [gameId, game] of this.games) {
            game.remove_client(client);
            if (game.clients.length === 0) {
                this.removeGame(gameId);
            }
        }
    }
}

export const gameManager = new GameManager();