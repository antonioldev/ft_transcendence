import { FastifyInstance } from 'fastify';
import { gameManager } from '../models/gameManager.js';
import { Client, Player } from '../models/Client.js';
import { MessageType, AuthCode } from '../shared/constants.js';
import { ClientMessage, ServerMessage, PlayerInput} from '../shared/types.js';
import * as db from "../data/validation.js";
import { getUserBySession, getSessionByUsername } from '../data/validation.js';

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
        fastify.get('/ws', { websocket: true } as any, (socket, req) => { //testing change here
            // const token = (req.query as { token?: string }).token;
            const cookieHeader = req.headers.cookie || '';
            const sidFromCookie = this.parseCookie(cookieHeader)['sid'];

            // 2) optional fallbacks: ?sid=... or Google ?token=...
            const { sid: sidFromQuery, token } = (req.query as { sid?: string; token?: string }) || {};
            const sid = sidFromCookie || sidFromQuery;

            if (sid) {
                const user = this.safeGetUserBySession(sid);
                if (user) {
                    this.handleConnection(socket, { username: user.username, email: user.email ?? '' });
                    return;
                }
            }
            if (token) {
                try {
                    // Google authentication: verify JWT token
                    const decoded = fastify.jwt.verify(token) as any;
                    this.handleConnection(socket, decoded.user);
                } catch (err) {
                    socket.close(1008, 'Invalid token');
                    return;
                }
            } else {
                // Traditional authentication: accept connection without token
                console.log('Traditional connection (will authenticate via messages)');
                this.handleConnection(socket);
            }
        });
    }

    /**
     * Handles a new WebSocket connection, initializing the client and setting up event listeners.
     * @param socket - The WebSocket connection object.
     */
    private handleConnection(socket: any, authenticatedUser?: { username: string; email: string }): void {
        const clientId = this.generateClientId();

        let client: Client;
        if (authenticatedUser) {
            // Google authenticated user
            client = new Client(clientId, authenticatedUser.username, authenticatedUser.email, socket);
            client.loggedIn = true; // Mark as already authenticated
        } else {
            // Traditional authentication will authenticate via messages
            client = new Client(clientId, 'temp', '', socket); // will be updated if server approve a classic login request from client
        }

        this.clients.set(clientId, client);
        let currentGameId: string | null = null;

        socket.on('message', async (message: string) => {
            await this.handleMessage(socket, client, message, (gameId) => {
                currentGameId = gameId;
            });
        });

        socket.on('close', () => {
            console.log(`WebSocket closed for client ${clientId}:`);
            this.handleDisconnection(client);
        });

        socket.on('error', (error: any) => {
            console.error(`❌ WebSocket error for client ${clientId}:`, error);
            this.handleDisconnection(client);
        });

        this.send(socket, {
            type: MessageType.WELCOME,
            message: 'Connected to game server'
        });
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
                    this.handleJoinGame(socket, client, data, setCurrentGameId);
                    break;
                case MessageType.PLAYER_READY:
                    this.handlePlayerReady(client);
                    break;
                case MessageType.PLAYER_INPUT:
                    this.handlePlayerInput(client, data);
                    break;
                case MessageType.PAUSE_REQUEST:
                    this.handlePauseRequest(client);
                    break;
                case MessageType.RESUME_REQUEST:
                    this.handleResumeRequest(client);
                    break;
                case MessageType.LOGIN_USER:
                    await this.handleLoginUser(socket, client, data);
                    break;
                case MessageType.LOGOUT_USER:
                    await this.handleLogoutUser(socket, client, data);
                    break;                    
                case MessageType.REGISTER_USER:
                    await this.handleRegisterNewUser(socket, data);
                    break;
                case MessageType.REQUEST_USER_STATS:
                    await this.handleUserStats(socket, message);
                    break;
                case MessageType.REQUEST_GAME_HISTORY:
                    this.handleUserGameHistory(socket, message);
                    break;
                case MessageType.PARTIAL_WINNER_ANIMATION_DONE:
                    this.handlePlayerReadyAfterGame(client);
                    break;
                case MessageType.ACTIVATE_POWERUP:
                    this.activatePowerup(client, data);
                    break;
                case MessageType.QUIT_GAME:
                    this.handleQuitGame(client);
                    break;
                default:
                    this.send(socket, {
                        type: MessageType.ERROR,
                        message: 'Unknown message type'
                    });

            }
        } catch (error) {
            console.error('❌ Error parsing message:', error);
            this.send(socket, {
                type: MessageType.ERROR,
                message: 'Invalid message format'
            });
        }
    }

    /**
     * Handles a client's request to join a game, creating or finding a game as needed.
     * @param socket - The WebSocket connection object.
     * @param client - The client requesting to join a game.
     * @param data - The message data containing game mode information.
     * @param setCurrentGameId - Callback to update the current game ID for the client.
     */
    private handleJoinGame(socket: any, client: Client, data: ClientMessage, setCurrentGameId: (gameId: string) => void) {
        if (!data.gameMode) {
            this.send(socket, {
                type: MessageType.ERROR,
                message: 'Game mode required'
            }); 
            return;
        }
        try {
            const gameId = gameManager.findOrCreateGame(data.gameMode, client);
            const gameSession = gameManager.getGame(gameId);
            if (!gameSession) return ;
            
            if (data.aiDifficulty !== undefined) {
                console.log("AI difficulty = " + data.aiDifficulty);
                gameSession.set_ai_difficulty(data.aiDifficulty);
            }
            setCurrentGameId(gameId);

            // add players to gameSession
            for (const player of data.players ?? []) {
                gameSession.add_player(new Player(player.id, player.name, client));
            }
            if (gameSession.full && !gameSession.running) {
                gameManager.runGame(gameSession, client.id);
            }
        } catch (error) {
            console.error('❌ Error joining game:', error);
            this.send(socket, {
                type: MessageType.ERROR,
                message: 'Failed to join game'
            });
        }
    }

    /**
     * Handles when a client signals they are ready (finished loading)
     * @param client - The client that is ready
     */
    private handlePlayerReady(client: Client): void {
        console.log(`Client ${client.id} is ready`);

        const gameSession = gameManager.findClientGame(client);
        if (!gameSession) {
            console.warn(`Client ${client.id} not in any game for ready signal`);
            return;
        }
        gameSession.setClientReady(client.id);
    }

    private handlePlayerReadyAfterGame(client: Client): void {
        const gameSession = gameManager.findClientGame(client);
        if (!gameSession) {
            console.warn(`Client ${client.id} not in any games.`);
            return;
        }
        gameSession.setClientReady(client.id);
    }

    /**
     * Processes player input messages and updates the game state accordingly.
     * @param client - The client sending the input.
     * @param data - The message data containing input details.
     */
    private handlePlayerInput(client: Client, data: ClientMessage): void {
        if (data.direction === undefined || data.side === undefined) {
            console.warn('Invalid player input: missing direction or side');
            return;
        }

        const gameSession = gameManager.findClientGame(client);
        if (!gameSession) {
            console.warn(`Client ${client.id} not in any game`);
            return;
        }

        const input: PlayerInput = {
            id: client.id,
            type: MessageType.PLAYER_INPUT,
            side: data.side,
            dx: data.direction
        }
        gameSession.enqueue(input, client.id);
    }

   /**
     * Handles the request from a client to pause a game
     * @param client - The client that send the request.
     */
    private handlePauseRequest(client: Client): void {
        const gameSession = gameManager.findClientGame(client);
        if (!gameSession) {
            console.warn(`Client ${client.id} not in any game for pause request`);
            return;
        }

        if (!gameSession.canClientControlGame(client)){
            console.warn(`Client ${client.id} not authorized to pause game`);
            return;
        }

        gameSession.pause(client.id);
    }

    /**
     * Handles the request from a client to resume a game
     * @param client - The client that send the request.
     */
    private handleResumeRequest(client: Client): void {
        const gameSession = gameManager.findClientGame(client);
        if (!gameSession) {
            console.warn(`Client ${client.id} not in any game for resume request`);
            return;
        }

        if (!gameSession.canClientControlGame(client)){
            console.warn(`Client ${client.id} not authorized to resume game`);
            return;
        }

        gameSession.resume(client.id);
    }

   /**
     * Handles the disconnection of a client, removing them from games and cleaning up resources.
     * @param data - The user information that are used to confirm login
     */
    private handleQuitGame(client: Client): void {
        const gameSession = gameManager.findClientGame(client);
        if (!gameSession) {
            console.warn(`Client ${client.id} not in any game to quit`);
            return;
        }
        
        gameSession.handlePlayerQuit(client.id);
        gameManager.removeClientFromGames(client);
        // gameManager.endGame(gameSession, client.id); // unecessary as .removeClientFromGames() handles this
        console.log(`Game ${gameSession.id} ended by client ${client.id}`);
    }

    /**
     * Handles the disconnection of a client, removing them from games and cleaning up resources.
     * @param client - The client that disconnected.
     */
    private handleDisconnection(client: Client): void {
        const gameSession = gameManager.findClientGame(client);
        if (!gameSession) return ;

        gameSession.stop(); // TODO: temp as wont work for Tournament 
        gameManager.removeClientFromGames(client);
        this.clients.delete(client.id);
    } 

    private activatePowerup(client: Client, data: ClientMessage) {
        if (!data.powerup_type || !data.side) {
            console.error("Error: cannot activate powerup, missing data");
            return ;
        }
        const gameSession = gameManager.findClientGame(client);
        if (!gameSession) {
            console.error("Error: cannot activate powerup, game does not exist");
            return ;
        }
        const game = gameSession.findGame(client.id);
        if (!game) {
            console.error("Error: cannot activate powerup, game does not exist");
            return ;
        }
        game.activate_powerup(data.powerup_type, data.side);
    }

   /**
     * Handles the disconnection of a client, removing them from games and cleaning up resources.
     * @param data - The user information that are used to confirm login
     */
    private async handleLoginUser(socket: any, client: Client, data: ClientMessage): Promise<void> {
        const loginInfo = data.loginUser;

        if (!loginInfo?.username || typeof loginInfo.password !== 'string') {
            console.warn("Missing login information");
            this.send(socket, {
                type: MessageType.LOGIN_FAILURE,
                message: 'Missing username or password'
            });
            return;
        }

        try {
            const result = await db.verifyLogin(loginInfo.username, loginInfo.password);
            switch (result) {
            case AuthCode.OK:
                const sid = getSessionByUsername(loginInfo.username);
                if (!sid) {
                    this.send(socket, {
                        type: MessageType.LOGIN_FAILURE,
                        message: 'SID is not valid',
                    });
                    return;
                }
                socket.send(JSON.stringify({
                type: MessageType.SUCCESS_LOGIN,
                message: {                     // keep "message" as an OBJECT, not a string
                    text: 'Login success',
                    sid: sid,                         // <-- put your generated session id here
                    username: loginInfo.username
                }
                }));
                client.username = loginInfo.username;
                client.loggedIn = true;
                return;
            case AuthCode.NOT_FOUND:
                this.send(socket, {
                    type: MessageType.USER_NOTEXIST,
                    message: "User doesn't exist"
                });
                return;
            case AuthCode.BAD_CREDENTIALS:
                this.send(socket, {
                    type: MessageType.LOGIN_FAILURE,
                    message: 'Username or password are incorrect'
                });
                return;
            case AuthCode.ALREADY_LOGIN:
                this.send(socket, {
                    type: MessageType.LOGIN_FAILURE,
                    message: "User already login"}
                );
                return;
            }
        } catch (error) {
            console.error('❌ Error checking user login information:', error);
            this.send(socket, {
                type: MessageType.ERROR,
                message: 'Failed to log user'
            });
        }
    }

    private async handleLogoutUser(socket: any, client: Client, data: ClientMessage): Promise<void> {
        const username = client.username;
        try {
            await db.logoutUser(username);
            console.log('User successfully logout');
        } catch (err) {
            console.error('Error in logout user');
        }
    }
    /**
     * Handles the disconnection of a client, removing them from games and cleaning up resources.
     * @param data - The user information that are used to confirm login
     */
    private async handleRegisterNewUser(socket: any, data: ClientMessage): Promise<void> {
        const regInfo = data.registerUser;

        if (!regInfo) {
            console.warn("Missing registration object");
            this.send(socket, {
                type: MessageType.ERROR,
                message: 'Missing registration data'
            });
            return;
        }

        const { username, email, password } = regInfo;

        if (!username || !email || typeof password !== 'string') {
            this.send(socket, {
                type: MessageType.ERROR,
                message: 'Missing username, email, or password'
            });
            return;
        }

        try {
            const result = await db.registerNewUser(username, email, password);

            switch (result) {
            case AuthCode.OK:
                this.send(socket, {
                    type: MessageType.SUCCESS_REGISTRATION,
                    message: 'User registered successfully'
                });
                return;
            case AuthCode.USER_EXISTS:
                this.send(socket, {
                    type: MessageType.USER_EXIST,
                    message: 'User already exists'
                });
                return;
            case AuthCode.USERNAME_TAKEN:
                this.send(socket, {
                    type: MessageType.USERNAME_TAKEN,
                    message: 'Username is already registered'
                });
                return;
            }
        } catch (error) {
            console.error('❌ Error registering user:', error);
            this.send(socket, {
                type: MessageType.ERROR,
                message: 'Failed to register user'
            });
        }
    }

    private send(socket: any, message: ServerMessage) {
        socket.send(JSON.stringify(message), (err?: Error) => {
            if (err) console.error(`❌ Failed to send message: `, err.stack);
        });
    }

    private async handleUserStats(socket: any, message: string) {
        console.log("HandleMessage WSM: calling get User stats");
        const stats = db.getUserStats(message); // from DB
        if (!stats) {
            this.send(socket, {
                type: MessageType.ERROR,
                message: 'user not recognised'
            });
        }
        else {
            this.send(socket, {
                type: MessageType.SEND_USER_STATS,
                stats: stats
            });
        }
    }

    private handleUserGameHistory(socket: any, message: string): void {
        console.log("HandleMessage WSM: calling get User game history");
        const history = db.getGameHistoryForUser(message); // from DB
        if (!history) {
            this.send(socket, {
                type: MessageType.ERROR,
                message: 'user not recognised'
            });
        }
        else {
            this.send(socket, {
                type: MessageType.SEND_GAME_HISTORY,
                gameHistory: history
            });
        }
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
    disconnectAllClients(): void {
        for (const [clientId, client] of this.clients) {
            try {
                client.websocket.close();
            } catch (error) {
                console.error(`❌ Error disconnecting client ${clientId}:`, error);
            }
        }
        this.clients.clear();
    }

    private parseCookie(cookieHeader: string): Record<string, string> {
        const out: Record<string, string> = {};
        cookieHeader.split(';').forEach(kv => {
            const [k, ...rest] = kv.trim().split('=');
            if (k) out[k] = decodeURIComponent(rest.join('=') || '');
        });
    return out;
    }

    private safeGetUserBySession(sid: string) {
        try { return getUserBySession(sid); }
        catch (e) { console.error('getUserBySession error:', e); return null; }
    }
}

export const webSocketManager = new WebSocketManager();