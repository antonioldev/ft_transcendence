import { FastifyInstance } from 'fastify';
import { gameManager } from '../models/gameManager.js';
import { Client } from '../models/client.js';
import { ClientMessage, ServerMessage } from '../core/types.js';
import { MessageType, GameMode, Direction } from '../core/constants.js';

async function websocketRoutes(fastify: FastifyInstance) {
    fastify.get('/', {websocket: true}, (socket, req) => {

        // Create new client after ws connection
        const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const client = new Client(clientId, 'anonymous', '', socket);
        let currentGameId: string | null = null;

        socket.on('message', (message: string) => {
            try {
                const data: ClientMessage = JSON.parse(message.toString());
                switch (data.type) {
                    case MessageType.JOIN_GAME:
                        handleJoinGame(data);
                        break;
                    case MessageType.PLAYER_INPUT:
                        handlePlayerInput(data);
                        break;
                    
                    default:
                        console.log('Unknown message type:', data.type);
                }
            } catch (error) {
                console.error('❌ Error parsing message: ', error);
                sendError('Invalid message format');
            }
        });

        socket.on('close', () => {
            gameManager.removeClientFromGames(client);
        });

        function handleJoinGame(data: ClientMessage) {
            if (!data.gameMode) {
                sendError('Game mode required');
                return;
            }
            try {
                currentGameId = gameManager.findOrCreateGame(data.gameMode, client);
                const game = gameManager.getGame(currentGameId);

                if (game) {
                    // Start game if ready
                    if (game.full && !game.running) {
                        game.start();
                    }
                }
            } catch (error) {
                console.error('❌ Error joining game:', error);
                sendError('Failed to join game');
            }
        }

        function handlePlayerInput(data: ClientMessage) {
            if (!currentGameId || data.direction === undefined)
                return;

            const game = gameManager.getGame(currentGameId);
            if (!game)
                return;

            // Convert direction to movement
            let dx = 0;
            if (data.direction === Direction.LEFT) dx = -1;
            else if (data.direction === Direction.RIGHT) dx = 1;

            // Add input to game queue
            game.game.enqueue({
                id: clientId,
                type: MessageType.PLAYER_INPUT,
                side: data.side || 0,
                dx: dx
            });
        }

        function sendError(message: string) {
            const errorMsg: ServerMessage = {
                type: MessageType.ERROR,
                message: message
            };
            socket.send(JSON.stringify(errorMsg));
        }

        // Send welcome message
        const welcome: ServerMessage = {
            type: MessageType.GAME_STARTED,
            message: 'Connected to game server'
        };
        socket.send(JSON.stringify(welcome));
        
    });
}

export default websocketRoutes;