import { OneOffGame, AbstractGameSession } from './GameSession.js';
import { TournamentLocal, TournamentRemote } from './Tournament.js';
import { Client } from './Client.js';
import { GameMode } from '../shared/constants.js';
import * as db from "../data/validation.js";
import { GAME_CONFIG } from '../shared/gameConfig.js';
import { EventEmitter } from 'events';

/**
 * Manages game sessions and player interactions within the game.
 */
class GameManager extends EventEmitter {
    private allGameSessions: Set<AbstractGameSession> = new Set();
    private clientGamesMap: Map<string, AbstractGameSession> = new Map(); // maps client id to gameSession

    addClient(client: Client, gameSession: AbstractGameSession) {
        gameSession.add_client(client);
        this.clientGamesMap.set(client.id, gameSession);
    }

    /**
     * Removes a client from all game sessions they are part of.
     * If a game session becomes empty, it is removed.
     * @param client - The client to be removed from game sessions.
     */
    removeClient(client: Client): void {
        const gameSession = this.clientGamesMap.get(client.id);
        if (!gameSession) {
            console.warn(`Cannot disconnect: Client ${client.username}:${client.id} not in any game`);
            return;
        }
        console.log(`Client disconnected: ${client.username}:${client.id}`);
        
        gameSession.handlePlayerQuit(client);
        if (gameSession instanceof TournamentRemote && gameSession.clients.size === 0) {
            this.endGame(gameSession);
        }
        else {
            this.endGame(gameSession);
        }
    }

    /**
     * Creates a new game session with the specified mode and adds the given client to it.
     * @param mode - The game mode (e.g., SINGLE_PLAYER, MULTIPLAYER).
     * @param client - The client initiating the game.
     * @returns The unique ID of the created game session.
     */
    createGame(mode: GameMode, capacity?: number): AbstractGameSession {
        // Create new gamesession and add the client
        let gameSession: AbstractGameSession;
        if (mode === GameMode.TOURNAMENT_LOCAL) {
            gameSession = new TournamentLocal(mode, capacity ?? 4); // maybe handle undefined capacity better ??
        }
        else if (mode === GameMode.TOURNAMENT_REMOTE) {
            gameSession = new TournamentRemote(mode, capacity ?? 4);
        }
        else {
            gameSession = new OneOffGame(mode);
        }
        console.log(`Created ${mode} game: ${gameSession.id}`);

        this.allGameSessions.add(gameSession);
        return gameSession;
    }

    /**
     * Finds an available game session for the specified mode or creates a new one.
     * @param mode - The game mode (e.g., SINGLE_PLAYER, MULTIPLAYER).
     * @param client - The client looking for a game session.
     * @returns The unique ID of the found or created game session.
     */
    findOrCreateGame(mode: GameMode, capacity?: number): AbstractGameSession {
        if (mode === GameMode.TWO_PLAYER_REMOTE || mode === GameMode.TOURNAMENT_REMOTE) /*Remote Games*/{
            // Try to find waiting game
            for (const gameSession of this.allGameSessions) {
                if (gameSession.mode === mode && !gameSession.full && !gameSession.is_running()) {
                    if (mode === GameMode.TOURNAMENT_REMOTE && gameSession.client_capacity !== capacity) {
                        continue ;
                    }
                    return gameSession;
                }
            }
        }
        // Local game or no waiting games => create new one
        return (this.createGame(mode, capacity));
    }

    async runGame(gameSession: AbstractGameSession): Promise<void> {
        if (gameSession.is_running()) return ;
        if (gameSession.mode === GameMode.TOURNAMENT_REMOTE && gameSession.players.size < GAME_CONFIG.minTournamentSize) {
            // wait another 30 seconds for at least 3 players to be in the tournament
            setTimeout(() => { this.runGame(gameSession) }, (GAME_CONFIG.maxJoinWaitTime * 1000));
            return ;
        }
        console.log(`Game started with ${gameSession.players.size} players`);
        db.updateStartTime(gameSession.id);
        gameSession.add_CPUs(); // add CPU's if necessary
        await gameSession.start();
        gameManager.endGame(gameSession);
    }

    /**
     * Removes a game session
     */
    endGame(gameSession: AbstractGameSession): void {
        gameSession.stop();
        this.allGameSessions.delete(gameSession);
        for (const client of gameSession.clients) {
            this.clientGamesMap.delete(client.id);
        }
        console.log(`Game ended: ${gameSession.id}`);
    }

    /**
     * Finds the game a client is currently participating in.
     * @param client - The client whose game is being searched for.
     * @returns The game object or null if the client is not in a game.
     */
    findGameSession(client: Client): AbstractGameSession | undefined {
        return (this.clientGamesMap.get(client.id));
    }

    

}

export const gameManager = new GameManager();