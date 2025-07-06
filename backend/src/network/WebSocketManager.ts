import { FastifyInstance } from 'fastify';
import { gameManager } from '../models/GameManager.js';
import { Client } from '../models/Client.js';
import { MessageType, Direction } from '../shared/constants.js';
import { ClientMessage, ServerMessage } from '../shared/types.js';

export class WebSocketManager {
    private clients = new Map<string, Client>();

    async setupRoutes(fastify: FastifyInstance): Promise<void> {
        fastify.get('/', { websocket: true }, (socket, req) => {
            this.handleConnection(socket);
        });
    }

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
                default:
                    await this.sendError(socket, 'Unknown message type');
            }
        } catch (error) {
            console.error('❌ Error parsing message:', error);
            await this.sendError(socket, 'Invalid message format');
        }
    }

    private async handleJoinGame(
        socket: any, 
        client: Client, 
        data: ClientMessage,
        setCurrentGameId: (gameId: string) => void
    ): Promise<void> {
        if (!data.gameMode) {
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
                    await game.start();
                }
            }
        } catch (error) {
            console.error('❌ Error joining game:', error);
            await this.sendError(socket, 'Failed to join game');
        }
    }

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

    private handleDisconnection(client: Client): void {
        gameManager.removeClientFromGames(client);
        this.clients.delete(client.id);
    }

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

    private async sendWelcomeMessage(socket: any): Promise<void> {
        const welcome: ServerMessage = {
            type: MessageType.GAME_STARTED,
            message: 'Connected to game server'
        };
        
        try {
            await socket.send(JSON.stringify(welcome));
        } catch (error) {
            console.error('❌ Failed to send welcome message:', error);
        }
    }

    private findClientGame(client: Client): any {
        for (const [gameId, game] of (gameManager as any).games) {
            if (game.clients.includes(client)) {
                return game;
            }
        }
        return null;
    }

    private generateClientId(): string {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getConnectedClientsCount(): number {
        return this.clients.size;
    }

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

// export default async function websocketRoutes(fastify: FastifyInstance): Promise<void> {
//     await webSocketManager.setupRoutes(fastify);

// async function websocketRoutes(fastify: FastifyInstance) {
//     fastify.get('/', {websocket: true}, (socket, req) => {

//         // Create new client after ws connection
//         const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
//         const client = new Client(clientId, 'anonymous', '', socket);
//         let currentGameId: string | null = null;

//         socket.on('message', (message: string) => {
//             try {
//                 const data: ClientMessage = JSON.parse(message.toString());
//                 switch (data.type) {
//                     case MessageType.JOIN_GAME:
//                         handleJoinGame(data);
//                         break;
//                     case MessageType.PLAYER_INPUT:
//                         handlePlayerInput(data);
//                         break;
                    
//                     default:
//                         console.log('Unknown message type:', data.type);
//                 }
//             } catch (error) {
//                 console.error('❌ Error parsing message: ', error);
//                 sendError('Invalid message format');
//             }
//         });

//         socket.on('close', () => {
//             gameManager.removeClientFromGames(client);
//         });

//         function handleJoinGame(data: ClientMessage) {
//             if (!data.gameMode) {
//                 sendError('Game mode required');
//                 return;
//             }
//             try {
//                 currentGameId = gameManager.findOrCreateGame(data.gameMode, client);
//                 const game = gameManager.getGame(currentGameId);

//                 if (game) {
//                     // Start game if ready
//                     if (game.full && !game.running) {
//                         game.start();
//                     }
//                 }
//             } catch (error) {
//                 console.error('❌ Error joining game:', error);
//                 sendError('Failed to join game');
//             }
//         }

//         function handlePlayerInput(data: ClientMessage) {
//             if (!currentGameId || data.direction === undefined)
//                 return;

//             const game = gameManager.getGame(currentGameId);
//             if (!game)
//                 return;

//             // Convert direction to movement
//             let dx = 0;
//             if (data.direction === Direction.LEFT) dx = -1;
//             else if (data.direction === Direction.RIGHT) dx = 1;

//             // Add input to game queue
//             game.game.enqueue({
//                 id: clientId,
//                 type: MessageType.PLAYER_INPUT,
//                 side: data.side || 0,
//                 dx: dx
//             });
//         }

//         function sendError(message: string) {
//             const errorMsg: ServerMessage = {
//                 type: MessageType.ERROR,
//                 message: message
//             };
//             socket.send(JSON.stringify(errorMsg));
//         }

//         // Send welcome message
//         const welcome: ServerMessage = {
//             type: MessageType.GAME_STARTED,
//             message: 'Connected to game server'
//         };
//         socket.send(JSON.stringify(welcome));
        
//     });
// }

// export default websocketRoutes;