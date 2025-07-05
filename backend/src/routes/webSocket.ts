import { FastifyInstance } from 'fastify';
import { gameManager } from '../models/gameManager.js';
import { Client } from '../models/client.js';
import { ClientMessage, ServerMessage } from '../game/types.js';

async function websocketRoutes(fastify: FastifyInstance) {
    fastify.get('/', {websocket: true}, (socket, req) => {
        console.log('🌐 Connected with ', req.socket.remoteAddress);

        // Create new client after ws connection
        const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const client = new Client(clientId, 'anonymous', '', socket);
        let currentGameId: string | null = null;

        socket.on('message', (message: string) => {
            try {
                const data: ClientMessage = JSON.parse(message.toString());
                console.log('📩 Received: ', data);

                switch (data.type) {
                    case 'join_game':
                        handleJoinGame(data);
                        break;
                    
                    case 'player_input':
                        handlePlayerInput(data);
                        break;
                    
                    default:
                        console.log('❓ Unknown message type:', data.type);
                }
            } catch (error) {
                console.error('❌ Error parsing message: ', error);
                sendError('Invalid message format');
            }
        });

        socket.on('close', () => {
            console.log('❌ Client disconnected', clientId);
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
                    console.log(`Client ${clientId} joined game ${currentGameId}`);
                    
                    // Start game if ready
                    if (game.full && !game.running) {
                        game.start();
                        console.log(`Started game ${currentGameId}`);
                    }
                }
            } catch (error) {
                console.error('Error joining game:', error);
                sendError('Failed to join game');
            }
        }

        function handlePlayerInput(data: ClientMessage) {
            if (!currentGameId || !data.direction)
                return;

            const game = gameManager.getGame(currentGameId);
            if (!game)
                return;

            // Convert direction to movement
            let dy = 0;
            if (data.direction === 'left') dy = -1;
            else if (data.direction === 'right') dy = 1;

            // Add input to game queue
            game.game.enqueue({
                id: clientId,
                type: 'player_input',
                side: data.side || 0,
                dy: dy
            });
        }

        function sendError(message: string) {
            const errorMsg: ServerMessage = {
                type: 'error',
                message: message
            };
            socket.send(JSON.stringify(errorMsg));
        }

        // Send welcome message
        const welcome: ServerMessage = {
            type: 'game_started',
            message: 'Connected to game server'
        };
        socket.send(JSON.stringify(welcome));
        
    });
}

export default websocketRoutes;