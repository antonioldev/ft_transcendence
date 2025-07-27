import { FastifyInstance } from 'fastify';
import { gameManager } from '../models/gameManager.js';
import { Client, Player } from '../models/Client.js';
import { MessageType, Direction, GameMode } from '../shared/constants.js';
import { ClientMessage, ServerMessage } from '../shared/types.js';
import { LEFT_PADDLE, RIGHT_PADDLE } from '../shared/gameConfig.js';

/**
 * Manages WebSocket connections, client interactions, and game-related messaging.
 */
export class WebSocketManager {
    private clients = new Map<string, Client>();

    /**
     * Sets up WebSocket routes for the Fastify server.
     * @param fastify - The Fastify instance to configure.
     */
    async setupRoutes(fastify: FastifyInstance): Promise<void> {
        fastify.get('/', { websocket: true } as any, (socket, req) => {
            this.handleConnection(socket);
        });
    }

    /**
     * Handles a new WebSocket connection, initializing the client and setting up event listeners.
     * @param socket - The WebSocket connection object.
     */
    private handleConnection(socket: any): void {
        const clientId = this.generateClientId();
        const client = new Client(clientId, 'anonymous', '', socket);
        this.clients.set(clientId, client);
        let currentGameId: string | null = null;
        socket.on('message', async (message: string) => {
            await this.handleMessage(socket, client, message, (gameId) => {
                currentGameId = gameId;
            });
        });

        socket.on('close', () => {
            this.handleDisconnection(client);
        });

        socket.on('error', (error: any) => {
            console.error(`❌ WebSocket error for client ${clientId}:`, error);
            this.handleDisconnection(client);
        });

        this.sendWelcomeMessage(socket);
    }

    /**
     * Processes incoming messages from a client and routes them to the appropriate handler.
     * @param socket - The WebSocket connection object.
     * @param client - The client sending the message.
     * @param message - The raw message string received.
     * @param setCurrentGameId - Callback to update the current game ID for the client.
     */
    private async handleMessage(
        socket: any, 
        client: Client, 
        message: string,
        setCurrentGameId: (gameId: string) => void
    ): Promise<void> {
        try {
            const data: ClientMessage = JSON.parse(message.toString());
            
            switch (data.type) {
                case MessageType.JOIN_GAME:
                    await this.handleJoinGame(socket, client, data, setCurrentGameId);
                    break;
                case MessageType.PLAYER_INPUT:
                    await this.handlePlayerInput(client, data);
                    break;
                case MessageType.PAUSE_REQUEST:
                    await this.handlePauseRequest(client); // TODO server need to check and confirm to clients
                    break;
                case MessageType.RESUME_REQUEST:
                    await this.handleResumeRequest(client); // TODO server need to check and confirm to clients
                    break;
                case MessageType.QUIT_GAME:  // TODO I added because it was creating issue, need to check
                    await this.handleQuitGame(client);
                    break;
                default:
                    await this.sendError(socket, 'Unknown message type');
            }
        } catch (error) {
            console.error('❌ Error parsing message:', error);
            await this.sendError(socket, 'Invalid message format');
        }
    }

    /**
     * Handles a client's request to join a game, creating or finding a game as needed.
     * @param socket - The WebSocket connection object.
     * @param client - The client requesting to join a game.
     * @param data - The message data containing game mode information.
     * @param setCurrentGameId - Callback to update the current game ID for the client.
     */
    private async handleJoinGame(
        socket: any, 
        client: Client, 
        data: ClientMessage,
        setCurrentGameId: (gameId: string) => void
    ): Promise<void> {
        if (data.gameMode === undefined || data.gameMode === null) {
            await this.sendError(socket, 'Game mode required');
            return;
        }

        try {
            const gameId = gameManager.findOrCreateGame(data.gameMode, client);
            const game = gameManager.getGame(gameId);
            setCurrentGameId(gameId);

            if (game) {
                // Start game if ready
                if (game.full && !game.running) {
                    // just for testing
                    game.add_player(new Player("001", "Eden", game.clients[0]));
                    game.add_player(new Player("002", "CPU"));
                    
                    game.start();
                }
            }
        } catch (error) {
            console.error('❌ Error joining game:', error);
            await this.sendError(socket, 'Failed to join game');
        }
    }

    /**
     * Processes player input messages and updates the game state accordingly.
     * @param client - The client sending the input.
     * @param data - The message data containing input details.
     */
    private async handlePlayerInput(client: Client, data: ClientMessage): Promise<void> {
        if (data.direction === undefined || data.side === undefined) {
            console.warn('Invalid player input: missing direction or side');
            return;
        }

        // Find the game this client is in
        const game = this.findClientGame(client);
        if (!game) {
            console.warn(`Client ${client.id} not in any game`);
            return;
        }

        if (game.isPaused())
            return;

        // Convert direction to movement
        let dx = 0;
        if (data.direction === Direction.LEFT) dx = -1;
        else if (data.direction === Direction.RIGHT) dx = 1;

        // Add input to game queue
        game.game.enqueue({
            id: client.id,
            type: MessageType.PLAYER_INPUT,
            side: data.side,
            dx: dx
        });
    }

    /**
     * Handles the request from a client to pause a game
     * @param client - The client that send the request.
     */
    private async handlePauseRequest(client: Client): Promise<void> {
        const game = this.findClientGame(client);
        if (!game) {
            console.warn(`Client ${client.id} not in any game for pause request`);
            return;
        }

        if (!game.canClientControlGame(client)){
            console.warn(`Client ${client.id} not authorized to pause game`);
            return;
        }

        const success = await game.pauseGame(client);
        if (!success)
            console.warn(`Failed to pause game for client ${client.id}`);
    }

    /**
     * Handles the request from a client to resume a game
     * @param client - The client that send the request.
     */
    private async handleResumeRequest(client: Client): Promise<void> {
        const game = this.findClientGame(client);
        if (!game) {
            console.warn(`Client ${client.id} not in any game for resume request`);
            return;
        }

        if (!game.canClientControlGame(client)){
            console.warn(`Client ${client.id} not authorized to resume game`);
            return;
        }

        const success = await game.resumeGame(client);
        if (!success)
            console.warn(`Failed to resume game for client ${client.id}`);
    }

    private async handleQuitGame(client: Client): Promise<void> {
        const game = this.findClientGame(client);
        if (!game) {
            console.warn(`Client ${client.id} not in any game to quit`);
            return;
        }
    
        await game.broadcastMessage(MessageType.GAME_ENDED);
        console.log(`Game ${game.id} ended by client ${client.id}`);
        
        // Then do the cleanup (your original working code)
        gameManager.removeClientFromGames(client);

    }

    /**
     * Handles the disconnection of a client, removing them from games and cleaning up resources.
     * @param client - The client that disconnected.
     */
    private handleDisconnection(client: Client): void {
        gameManager.removeClientFromGames(client);
        this.clients.delete(client.id);
    }

    /**
     * Sends an error message to a client.
     * @param socket - The WebSocket connection object.
     * @param message - The error message to send.
     */
    private async sendError(socket: any, message: string): Promise<void> {
        const errorMsg: ServerMessage = {
            type: MessageType.ERROR,
            message: message
        };
        
        try {
            await socket.send(JSON.stringify(errorMsg));
        } catch (error) {
            console.error('❌ Failed to send error message:', error);
        }
    }

    /**
     * Sends a welcome message to a newly connected client.
     * @param socket - The WebSocket connection object.
     */
    private async sendWelcomeMessage(socket: any): Promise<void> {
        const welcome: ServerMessage = {
            type: MessageType.WELCOME,
            message: 'Connected to game server'
        };
        
        try {
            await socket.send(JSON.stringify(welcome));
        } catch (error) {
            console.error('❌ Failed to send welcome message:', error);
        }
    }

    /**
     * Finds the game a client is currently participating in.
     * @param client - The client whose game is being searched for.
     * @returns The game object or null if the client is not in a game.
     */
    private findClientGame(client: Client): any {
        for (const [gameId, game] of (gameManager as any).games) {
            if (game.clients.includes(client)) {
                return game;
            }
        }
        return null;
    }

    /**
     * Generates a unique client ID.
     * @returns A unique string representing the client ID.
     */
    private generateClientId(): string {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Gets the count of currently connected clients.
     * @returns The number of connected clients.
     */
    getConnectedClientsCount(): number {
        return this.clients.size;
    }

    /**
     * Disconnects all connected clients and clears the client list.
     */
    async disconnectAllClients(): Promise<void> {
        for (const [clientId, client] of this.clients) {
            try {
                client.websocket.close();
            } catch (error) {
                console.error(`❌ Error disconnecting client ${clientId}:`, error);
            }
        }
        this.clients.clear();
    }
}

export const webSocketManager = new WebSocketManager();