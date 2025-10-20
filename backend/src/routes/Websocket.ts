import { FastifyInstance } from 'fastify';
import { gameManager } from '../network/GameManager.js';
import { Client } from '../network/Client.js';
import { MessageType } from '../shared/constants.js';
import { ClientMessage} from '../shared/types.js';
import * as db from "../data/validation.js";
import { TournamentRemote } from '../network/Tournament.js';
import { getClientConnection, send } from './utils.js';

/**
 * Sets up WebSocket routes for the Fastify server.
 * @param app - The Fastify instance to configure.
 */
export async function setupWebsocket(app: FastifyInstance): Promise<void> {
    app.get('/ws', { websocket: true } as any, (socket, request) => {
        const { sid } = request.query as { sid: string}; 
        if (!sid) {
            console.log(`Cannot create websocket: missing SID`);
            return socket.close(1008, 'SID missing'); 
        }
        console.log(`Creating websocket for sid: ${sid}`);

        const client = getClientConnection(sid);
        if (!client) {
            console.log(`Cannot handle Websocket connection, client does not exist`);
            return ;
        }
        if (!client.websocket) client.websocket = socket;
    
        socket.on('message', async (message: string) => {
            await handleMessage(client!, message);
        });
    
        socket.on('close', () => {
            console.log(`WebSocket closed for client ${client!.username}:`);
            handleDisconnection(client!);
        });
    
        socket.on('error', (error: any) => {
            console.error(`❌ WebSocket error for client ${client!.username}:`, error);
            handleDisconnection(client!);
        });
    });
}

function handleDisconnection(client: Client) {
    client!.is_connected = false;
    gameManager.removeClient(client);
    setTimeout(() => { logoutAfterTimeout(client!) }, 5000);
}

async function logoutAfterTimeout(client:  Client) {
    if (!client.is_connected) {
        await db.logoutUser(client.username); 
    }
}

/**
 * Processes incoming messages from a client and routes them to the appropriate handler.
 * @param socket - The WebSocket connection object.
 * @param client - The client sending the message.
 * @param message - The raw message string received.
 * @param setCurrentGameId - Callback to update the current game ID for the client.
 */
async function handleMessage(client: Client, message: string) {
    try {
        const data: ClientMessage = JSON.parse(message.toString());
        const gameSession = gameManager.findGameSession(client);
        if (!gameSession) {
            throw( new Error(`Client ${client.username} not in any game for "${MessageType[data.type]}" signal`) );
        }
        switch (data.type) {
            case MessageType.PLAYER_READY:
                gameSession.setClientReady(client.id);
                break;
            case MessageType.PLAYER_INPUT:
                gameSession.handlePlayerInput(client, data);
                break;
            case MessageType.PAUSE_REQUEST:
                gameSession.pause(client);
                break;
            case MessageType.RESUME_REQUEST:
                gameSession.resume(client);
                break;
            case MessageType.ACTIVATE_POWERUP:
                await gameSession.activate_powerup(client, data);
                break;
            case MessageType.REQUEST_LOBBY:
                if (gameSession instanceof TournamentRemote) {
                    gameSession.send_lobby(client);
                } break;
            case MessageType.SPECTATE_GAME:
                if (gameSession instanceof TournamentRemote) {
                    gameSession.assign_spectator(client);
                } break;
            case MessageType.TOGGLE_SPECTATOR_GAME:
                if (gameSession instanceof TournamentRemote) {
                    gameSession.toggle_spectator_game(client, data);
                } break;
            case MessageType.QUIT_GAME:
                gameManager.removeClient(client);
                break;
            default:
                throw(new Error("Unknown message type"));
        }
    } 
    catch (error) {
        console.error('❌ Error parsing message:', error);
        send(client.websocket, {
            type: MessageType.ERROR,
            message: 'Message request failed',
        });
    }
}
