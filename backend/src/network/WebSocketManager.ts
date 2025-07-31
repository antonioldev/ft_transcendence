import { FastifyInstance } from 'fastify';
import { gameManager } from '../models/gameManager.js';
import { Client, Player } from '../models/Client.js';
import { MessageType, Direction, GameMode, UserManagement } from '../shared/constants.js';
import { ClientMessage, ServerMessage, GetUserProfile, UserProfileData } from '../shared/types.js';
import * as db from "../data/validation.js";
import { UserStats, GameHistoryEntry } from '../shared/types.js';
import { Game } from '../core/game.js';

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
                case MessageType.PLAYER_READY:
                    await this.handlePlayerReady(client);
                    break;
                case MessageType.PLAYER_INPUT:
                    await this.handlePlayerInput(client, data);
                    break;
                case MessageType.PAUSE_REQUEST:
                    await this.handlePauseRequest(client);
                    break;
                case MessageType.RESUME_REQUEST:
                    await this.handleResumeRequest(client);
                    break;
                case MessageType.LOGIN_USER:
                    console.log("HandleMessage WSM: calling Login_user");
                    await this.handleLoginUser(socket, data);
                    break;
                case MessageType.REGISTER_USER:
                    console.log("HandleMessage WSM: calling Register_user");
                    await this.handleRegisterNewUser(socket, data);
                    break;
                case MessageType.REQUEST_USER_STATS:
                    console.log("HandleMessage WSM: calling get User stats");
                    await this.handleUserStats(socket, message);
                    break;
                case MessageType.REQUEST_GAME_HISTORY:
                    console.log("HandleMessage WSM: calling get User game history");
                    await this.handleUserGameHistory(socket, message);
                    break;
                // case MessageType.REQUEST_USER_PROFILE:
                //     console.log("HandleMessage WSM: Requesting user profile");
                //     await this.handleUserProfileRequest(socket, data);
                //     break;
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
        if (!data.gameMode) {
            await this.sendError(socket, 'Game mode required');
            return;
        }

        try {
            const gameId = gameManager.findOrCreateGame(data.gameMode, client);
            const gameSession = gameManager.getGame(gameId);
            setCurrentGameId(gameId);

            // add players to gameSession
            if (data.players && gameSession) {
                for (const player of data.players) {
                    gameSession.add_player(new Player(player.id, player.name, client));
                }
                if (gameSession.mode === GameMode.SINGLE_PLAYER) { // TEMP PATCH NEED TO HANDLE CPU DATA
                    gameSession.add_player(new Player("001", "CPU"));
                }
            }
        } catch (error) {
            console.error('❌ Error joining game:', error);
            await this.sendError(socket, 'Failed to join game');
        }
    }

    /**
     * Handles when a client signals they are ready (finished loading)
     * @param client - The client that is ready
     */
    private async handlePlayerReady(client: Client): Promise<void> {
        console.log(`Client ${client.id} is ready`);

        const gameSession = this.findClientGame(client);
        if (!gameSession) {
            console.warn(`Client ${client.id} not in any game for ready signal`);
            return;
        }

        gameSession.setClientReady(client);
        if (gameSession.allClientsReady()) {
            console.log(`All clients ready in game ${gameSession.id}, sending ALL_READY`);
            await gameSession.sendAllReady();

            if (gameSession.full && !gameSession.running) {
                await gameSession.start();
                // broadcast to client and win screen displayed
            }
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
        const gameSession = this.findClientGame(client);
        if (!gameSession) {
            console.warn(`Client ${client.id} not in any game`);
            return;
        }

        if (gameSession.isPaused()) return;

        const input = {
            id: client.id,
            type: MessageType.PLAYER_INPUT,
            side: data.side,
            dx: data.direction
        }
        gameSession.enqueue(input, data.match_id);
    }

   /**
     * Handles the request from a client to pause a game
     * @param client - The client that send the request.
     */
    private async handlePauseRequest(client: Client): Promise<void> {
        const gameSession = this.findClientGame(client);
        if (!gameSession) {
            console.warn(`Client ${client.id} not in any game for pause request`);
            return;
        }

        if (!gameSession.canClientControlGame(client)){
            console.warn(`Client ${client.id} not authorized to pause game`);
            return;
        }

        const success = await gameSession.pauseGame(client);
        if (!success)
            console.warn(`Failed to pause game for client ${client.id}`);
    }

    /**
     * Handles the request from a client to resume a game
     * @param client - The client that send the request.
     */
    private async handleResumeRequest(client: Client): Promise<void> {
        const gameSession = this.findClientGame(client);
        if (!gameSession) {
            console.warn(`Client ${client.id} not in any game for resume request`);
            return;
        }

        if (!gameSession.canClientControlGame(client)){
            console.warn(`Client ${client.id} not authorized to resume game`);
            return;
        }

        const success = await gameSession.resumeGame(client);
        if (!success)
            console.warn(`Failed to resume game for client ${client.id}`);
    }

    private async handleQuitGame(client: Client): Promise<void> {
        const game = this.findClientGame(client);
        if (!game) {
            console.warn(`Client ${client.id} not in any game to quit`);
            return;
        }

        await game.broadcast({ type: MessageType.GAME_ENDED });
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
     * Handles the disconnection of a client, removing them from games and cleaning up resources.
     * @param data - The user information that are used to confirm login
     */
    private async handleLoginUser(socket: any, data: ClientMessage): Promise<void> {
        console.log("handleLoginUser WSM called()");
        const loginInfo = data.loginUser;
        if (!loginInfo || !loginInfo.username || !loginInfo.password) {
            console.warn("Missing login information");
            return;
        }
        console.log("handleLoginUser WSM: structure contain username and password", loginInfo.username, loginInfo.password);
        try {
            switch (db.verifyLogin(loginInfo.username, loginInfo.password)) {
                case 0:
                    console.log("handleLoginUser WSM: sending success");
                    await this.sendSuccessLogin(socket, "User ID confirmed");
                    return;
                case 1:
                    console.log("handleLoginUser WSM: sending error 1 no user in db");
                    await this.sendErrorUserNotExist(socket, "User doesn't exist");
                    return;
                case 2:
                    console.log("handleLoginUser WSM: sending error 2 incorrect ID/PWD");
                    await this.sendErrorLogin(socket, "Username or password are incorrect");
                    return;
            }
        } catch (error) {
            console.error('❌ Error checking user login information:', error);
            await this.sendError(socket, 'Failed to log user');
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
            return;
        }
        const { username, email, password } = regInfo;
    
        if (!username || !email || !password) {
            console.warn("Missing registration fields:", username, email, password);
            return;
        }
        try {
            switch (db.registerNewUser(username, email, password)) {
                case 0:
                    await this.sendSuccessRegistration(socket, "User registered successfully");
                    return;
                case 1:
                    await this.sendErrorUserExist(socket, "User already exists");
                    return;
                case 2:
                    await this.sendErrorUsernameTaken(socket, "Username is already registered");
                    return;
            }
        } catch (error) {
            console.error('❌ Error registering user:', error);
            await this.sendError(socket, 'Failed to register user');
        }
    }

    /**
     * Sends an status message to a client to confirm login/registration or error
     * @param socket - The WebSocket connection object.
     * @param message - The messagee to send.
     */
    private async sendSuccessLogin(socket: any, message: string): Promise<void> {
        const successMsg: ServerMessage = {
            type: MessageType.SUCCESS_LOGIN,
            message: message
        };
        
        try {
            await socket.send(JSON.stringify(successMsg));
        } catch (error) {
            console.error('❌ Failed to send success message:', error);
        }
    }  

    private async sendSuccessRegistration(socket: any, message: string): Promise<void> {
        const successMsg: ServerMessage = {
            type: MessageType.SUCCESS_REGISTRATION,
            message: message
        };
        
        try {
            await socket.send(JSON.stringify(successMsg));
        } catch (error) {
            console.error('❌ Failed to send success message:', error);
        }
    }  

    private async sendErrorLogin(socket: any, message: string): Promise<void> {
        const errorMsg: ServerMessage = {
            type: MessageType.LOGIN_FAILURE,
            message: message
        };
        
        try {
            await socket.send(JSON.stringify(errorMsg));
        } catch (error) {
            console.error('❌ Failed to send success message:', error);
        }
    }  

    private async sendErrorUserNotExist(socket: any, message: string): Promise<void> {
        const errorMsg: ServerMessage = {
            type: MessageType.USER_NOTEXIST,
            message: message
        };
        
        try {
            await socket.send(JSON.stringify(errorMsg));
        } catch (error) {
            console.error('❌ Failed to send success message:', error);
        }
    }  

    private async sendErrorUserExist(socket: any, message: string): Promise<void> {
        const errorMsg: ServerMessage = {
            type: MessageType.USER_EXIST,
            message: message
        };
        
        try {
            await socket.send(JSON.stringify(errorMsg));
        } catch (error) {
            console.error('❌ Failed to send success message:', error);
        }
    }  

    private async sendErrorUsernameTaken(socket: any, message: string): Promise<void> {
        const errorMsg: ServerMessage = {
            type: MessageType.USERNAME_TAKEN,
            message: message
        };
        
        try {
            await socket.send(JSON.stringify(errorMsg));
        } catch (error) {
            console.error('❌ Failed to send success message:', error);
        }
    } 


    private async handleUserStats(socket: any, message: string) {
        const stats = db.getUserStats(message); // from DB
        if (!stats)
            this.sendError(socket, 'user not recognised');
        else
            this.sendUserStats(socket, stats);
    }


    private async handleUserGameHistory(socket: any, message: string) {
        const history = db.getGameHistoryForUser(message); // from DB
        if (!history)
            this.sendError(socket, 'user not recognised');
        else
            this.sendUserGameHistory(socket, history);
    }

    private async sendUserStats(socket: any, data: UserStats): Promise<void> {
        const msg: ServerMessage = {
            type: MessageType.SEND_USER_STATS,
            stats: data
        };
        
        try {
            await socket.send(JSON.stringify(msg));
        } catch (error) {
            console.error('❌ Failed to send success message:', error);
        }
    } 

    private async sendUserGameHistory(socket: any, data: GameHistoryEntry[]): Promise<void> {
        const msg: ServerMessage = {
            type: MessageType.SEND_GAME_HISTORY,
            gameHistory: data
        };
        
        try {
            await socket.send(JSON.stringify(msg));
        } catch (error) {
            console.error('❌ Failed to send success message:', error);
        }
    } 

    /**
     * Handle displaying information
    */
    // private async handleUserProfileRequest(socket: any, data: string) {
    //     const userName = data;
    //     if (!userName) {
    //         console.warn("Missing userID");
    //         return;
    //     }
    //     try { 
    //         const userInfo = db.requestUserInformation(userName);
    //         if (userInfo) {
    //             await this.sendUserProfile(socket, userInfo);
    //             return;
    //         } else {
    //             await this.sendErrorUserNotExist(socket, "User doesn't exist");
    //             return;
    //         }
    //     } catch (error) {
    //         console.error('❌ Error get user profile:', error);
    //         await this.sendError(socket, 'Failed to get user profile information');
    //     }        
    // }

    // private async sendUserProfile(socket: any, data: UserProfileData): Promise<void> {
    //     const userProfile: UserProfileMessage= {
    //         type: MessageType.SEND_USER_PROFILE,
    //         data: data,
    //     };
        
    //     try {
    //         await socket.send(JSON.stringify(userProfile));
    //     } catch (error) {
    //         console.error('❌ Failed to send user Profile Information:', error);
    //     }
    // }  

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
        for (const [gameId, gameSession] of (gameManager as any).games) {
            if (gameSession.clients.includes(client)) {
                return gameSession;
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