import { OneOffGame, AbstractGameSession } from './GameSession.js';
import { TournamentLocal, TournamentRemote } from './Tournament.js';
import { Client } from './Client.js';
import { GameMode } from '../shared/constants.js';
import { registerNewGame, addPlayer2 } from '../data/validation.js';
import * as db from "../data/validation.js";
import { GAME_CONFIG } from '../shared/gameConfig.js';
import { EventEmitter } from 'events';

/**
 * Manages game sessions and player interactions within the game.
 */
class GameManager extends EventEmitter {
    private gameIdMap: Map<string, AbstractGameSession> = new Map();
    private clientGamesMap: Map<string, AbstractGameSession> = new Map(); // maps client id to gameSession

    /**
     * Creates a new game session with the specified mode and adds the given client to it.
     * @param mode - The game mode (e.g., SINGLE_PLAYER, MULTIPLAYER).
     * @param client - The client initiating the game.
     * @returns The unique ID of the created game session.
     */
    createGame(mode: GameMode, client: Client, capacity?: number): AbstractGameSession {
        const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // Create a new game in DB with 1st player as client only if the game is remote
        if (mode === GameMode.TWO_PLAYER_REMOTE) {
            registerNewGame(gameId, client.username, 0);
        }
        else if (mode === GameMode.TOURNAMENT_REMOTE) {
            registerNewGame(gameId, client.username, 1);
        }

        // Create new gamesession and add the client
        let gameSession: AbstractGameSession;
        if (mode === GameMode.TOURNAMENT_LOCAL) {
            gameSession = new TournamentLocal(mode, gameId, capacity ?? 4); // maybe handle undefined capacity better ??
        }
        else if (mode === GameMode.TOURNAMENT_REMOTE) {
            gameSession = new TournamentRemote(mode, gameId, capacity ?? 4);
        }
        else {
            gameSession = new OneOffGame(mode, gameId);
        }

        gameSession.add_client(client);
        this.gameIdMap.set(gameId, gameSession);
        this.clientGamesMap.set(client.id, gameSession);
        
        console.log(`Created ${mode} game: ${gameId}`);
        return gameSession;
    }

    /**
     * Finds an available game session for the specified mode or creates a new one.
     * @param mode - The game mode (e.g., SINGLE_PLAYER, MULTIPLAYER).
     * @param client - The client looking for a game session.
     * @returns The unique ID of the found or created game session.
     */
    findOrCreateGame(mode: GameMode, client: Client, capacity?: number): AbstractGameSession {
        if (mode === GameMode.TWO_PLAYER_REMOTE|| mode === GameMode.TOURNAMENT_REMOTE) /*Remote Games*/{
            // Try to find waiting game
            for (const [gameId, gameSession] of this.gameIdMap) {
                if (gameSession.mode === mode && !gameSession.full && !gameSession.running) {
                    if (mode === GameMode.TOURNAMENT_REMOTE && gameSession.client_capacity !== capacity) continue ;

                    gameSession.add_client(client);
                    this.clientGamesMap.set(client.id, gameSession);
                    addPlayer2(gameId, client.username); // add security // this is a mistake as wont work for tournaments
                    return gameSession;
                }
            }
        }
        // Local game or no waiting games => create new one
        return this.createGame(mode, client, capacity);
    }

    async runGame(gameSession: AbstractGameSession): Promise<void> {
        if (gameSession.running) return ;
        if (gameSession.mode === GameMode.TOURNAMENT_REMOTE && gameSession.players.length < 3) {
            // wait another 30 seconds for at least 3 players to be in the tournament
            setTimeout(() => { this.runGame(gameSession) }, (GAME_CONFIG.maxJoinWaitTime * 1000));
            return ;
        }
        console.log(`Game started with ${gameSession.players.length} players`);
        db.updateStartTime(gameSession.id);
        await gameSession.start();
        gameManager.endGame(gameSession);
    }

    /**
     * Retrieves a game session by its unique ID.
     * @param gameId - The unique ID of the game session.
     * @returns The game session if found, otherwise undefined.
     */
    getGame(gameId: string): AbstractGameSession | undefined {
        return this.gameIdMap.get(gameId);
    }

    /**
     * Finds the game a client is currently participating in.
     * @param client - The client whose game is being searched for.
     * @returns The game object or null if the client is not in a game.
     */
    findClientGameSession(client: Client): AbstractGameSession | undefined {
        return (this.clientGamesMap.get(client.id));
    }

    /**
     * Removes a game session by its unique ID.
     * @param gameId - The unique ID of the game session to be removed.
     */
    endGame(gameSession: AbstractGameSession): void {
        gameSession.stop();
        this.gameIdMap.delete(gameSession.id);
        for (const client of gameSession.clients) {
            this.clientGamesMap.delete(client.id);
        }
        console.log(`Removed game: ${gameSession.id}`);
    }

    /**
     * Removes a client from all game sessions they are part of.
     * If a game session becomes empty, it is removed.
     * @param client - The client to be removed from game sessions.
     */
    removeClientFromGames(client: Client): void {
        const gameSession = this.clientGamesMap.get(client.id);
        if (!gameSession) return ;

        if (gameSession instanceof TournamentRemote) {
            gameSession.remove_client(client);
            if (gameSession.clients.length === 0) {
                this.endGame(gameSession);
            }
        }
        else {
            this.endGame(gameSession);
        }
    }
}

export const gameManager = new GameManager();