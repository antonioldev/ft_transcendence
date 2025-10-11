import { FastifyInstance } from 'fastify';
import { gameManager } from '../network/GameManager.js';
import { Client } from '../network/Client.js';
import { MessageType } from '../shared/constants.js';
import { ClientMessage, PlayerInput} from '../shared/types.js';
import * as db from "../data/validation.js";
import { getUserBySession } from '../data/validation.js';
import { TournamentRemote } from '../network/Tournament.js';
import { getClient, send, setClient } from './utils.js';
/**
 * Sets up WebSocket routes for the Fastify server.
 * @param app - The Fastify instance to configure.
 */
export async function setupWebsocket(app: FastifyInstance): Promise<void> {
    app.get('/ws', { websocket: true } as any, (socket, request) => { //testing change here
        // const cookieHeader = req.headers.cookie || '';
        // const sidFromCookie = this.parseCookie(cookieHeader)['sid'];
        
        // // 2) optional fallbacks: ?sid=... or Google ?token=...
        // const { sid: sidFromQuery, token } = (req.query as { sid?: string; token?: string }) || {};
        // const sid = sidFromCookie || sidFromQuery;
        
        const { sid } = request.query as { sid: string}; 
        const { token } = request.query as { token?: string };

        if (sid) { // client reconnected
            const user = safeGetUserBySession(sid);
            if (user) {
                handleConnection(socket, sid, { username: user.username, email: user.email ?? '' });
            }
        }
        else if (token) {
            try {
                // Google authentication: verify JWT token
                const decoded = app.jwt.verify(token) as any;
                handleConnection(socket, decoded.user);
            } catch (err) {
                socket.close(1008, 'Invalid token');
                return;
            }
        } else {
            // Traditional authentication: accept connection without token
            console.log('Traditional connection (will authenticate via messages)');
            handleConnection(socket, sid);
        }
    });
}

/**
 * Handles a new WebSocket connection, initializing the client and setting up event listeners.
 * @param socket - The WebSocket connection object.
 */
function handleConnection(socket: any, sid: string, authenticatedUser?: { username: string; email: string }): void {
    let client = getClient(sid);
    if (!client) {
        if (authenticatedUser) { // Google authenticated user
            client = new Client(sid);
            client.setInfo(authenticatedUser.username, authenticatedUser.email,)
            client.loggedIn = true; // Mark as already authenticated
        }
        else { // Traditional authentication via messages, details updated with login request
            client = new Client(sid);
        }
        setClient(sid, client);
    }
    if (!client.websocket) client.websocket = socket;
    client.is_connected = true;

    socket.on('message', async (message: string) => {
        await handleMessage(client!, message);
    });

    socket.on('close', () => {
        console.log(`WebSocket closed for client ${client!.username}:`);
        client!.is_connected = false;
        setTimeout(() => { logoutAfterTimeout(client!) }, 5000);
    });

    socket.on('error', (error: any) => {
        console.error(`❌ WebSocket error for client ${client!.username}:`, error);
        client!.is_connected = false;
        setTimeout(() => { logoutAfterTimeout(client!) }, 5000);
    });
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
            console.warn(`Client ${client.username} not in any game for "${MessageType[data.type]}" signal`);
            return;
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
                if (gameSession instanceof TournamentRemote && data.direction) {
                    gameSession.toggle_spectator_game(client, data.direction);
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

// private parseCookie(cookieHeader: string): Record<string, string> {
//     const out: Record<string, string> = {};
//     cookieHeader.split(';').forEach(kv => {
//         const [k, ...rest] = kv.trim().split('=');
//         if (k) out[k] = decodeURIComponent(rest.join('=') || '');
//     });
// return out;
// }

function safeGetUserBySession(sid: string) {
    try { return getUserBySession(sid); }
    catch (e) { console.error('getUserBySession error:', e); return null; }
}