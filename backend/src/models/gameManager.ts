import { GameSession } from '../network/GameSession';
import { Client } from './Client';
import { GameMode } from '../shared/constants';

class GameManager {
    private games: Map<string, GameSession> = new Map();
    private waitingPlayers: Client[] = [];

    createGame(mode: GameMode, client: Client): string {
        const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const gameSession = new GameSession(mode, gameId);

        gameSession.add_client(client);
        this.games.set(gameId, gameSession);

        console.log(`Created ${mode} game: ${gameId}`);
        return gameId;
    }

    joinGame(gameId: string, client: Client): boolean {
        const game = this.games.get(gameId);
        if (game && !game.full) {
            game.add_client(client);
            return true;
        }
        return false;
    }

    findOrCreateGame(mode: GameMode, client: Client): string {
        //For single player, just create a game
        if (mode === GameMode.SINGLE_PLAYER) {
            return this.createGame(mode, client);
        }

        // For two player, try to find waiting game or create new one
        for (const [gameId, game] of this.games) {
            if (game.mode === mode && !game.full) {
                game.add_client(client);
                return gameId;
            }
        }

        // No waiting games, create new one
        return this.createGame(mode, client);
    }

    getGame(gameId: string): GameSession | undefined {
        return this.games.get(gameId);
    }

    removeGame(gameId: string): void {
        this.games.delete(gameId);
        console.log(`Removed game: ${gameId}`);
    }

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