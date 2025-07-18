import { ConnectionStatus, MessageType, GameMode, Direction } from '../shared/constants.js'
import { ClientMessage, ServerMessage, GameStateData, PlayerInfo, RegisterUser, LoginUser } from '../shared/types.js'

/**
 * WebSocketClient is responsible for managing the WebSocket connection
 * to the game server, handling messages, and providing callbacks for
 * game state updates, connection events, and errors.
 */
export class WebSocketClient {
    private static instance: WebSocketClient;
    private ws: WebSocket | null = null;
    private connectionStatus: ConnectionStatus = ConnectionStatus.CONNECTING;
    private gameStateCallback: ((state: GameStateData) => void) | null = null;
    private connectionCallback: (() => void) | null = null;
    private errorCallback: ((error: string) => void) | null = null;
    private statusCallback: ((status: ConnectionStatus, message?: string) => void) | null = null;
    private loginFailureCallback: ((message: string) => void) | null = null;
    private loginSuccess: ((message: string) => void) | null = null;
    private RegistrationSuccess: ((message: string) => void) | null = null;
    private RegistrationFailureCallback: ((message: string) => void) | null = null;

    static getInstance(): WebSocketClient {
        if (!WebSocketClient.instance) {
            WebSocketClient.instance = new WebSocketClient();
        }
        return WebSocketClient.instance;
    }

    private constructor() {
        this.connect();
    }

    // ========================================
    // CONNECTION MANAGEMENT
    // ========================================

    // Establishes a WebSocket connection to the specified URL.
    private connect(): void {
        this.connectionStatus = ConnectionStatus.CONNECTING;
        this.notifyStatus(ConnectionStatus.CONNECTING);

        this.ws = new WebSocket('ws://localhost:3000'); // TODO make it a variable

        const timeout = setTimeout(() => {
            if (this.connectionStatus === ConnectionStatus.CONNECTING) {
                this.connectionStatus = ConnectionStatus.FAILED;
                this.notifyStatus(ConnectionStatus.FAILED);
                this.errorCallback?.('Connection timeout');
            }
        }, 5000);

        this.ws.onopen = () => {
            clearTimeout(timeout);
            this.connectionStatus = ConnectionStatus.CONNECTED;
            this.notifyStatus(ConnectionStatus.CONNECTED);
            console.log('🔗 Connected to game server');
            this.connectionCallback?.();
        };

        this.ws.onmessage = (event) => {
            try {
                const message: ServerMessage = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (error) {
                console.error('❌ Error parsing server message:', error);
            }
        };

        this.ws.onclose = () => {
            clearTimeout(timeout);
            console.log('❌ Disconnected from game server');
            this.connectionStatus = ConnectionStatus.FAILED;
            this.notifyStatus(ConnectionStatus.FAILED);
        };

        this.ws.onerror = (error) => {
            clearTimeout(timeout);
            console.error('❌ WebSocket error');
            this.connectionStatus = ConnectionStatus.FAILED;
            this.notifyStatus(ConnectionStatus.FAILED);
            this.errorCallback?.('Connection failed');
        };
    }

    // NEW: Send quit game message (but keep ws connection open) //TODO doesn't work with browser <-
    sendQuitGame(): void {
        if (this.isConnected()) {
            const message: ClientMessage = {
                type: MessageType.QUIT_GAME
            };
            
            try {
                this.ws!.send(JSON.stringify(message));
                console.log('🚪 Sent quit game message to server (WebSocket stays open)');
            } catch (error) {
                console.error('❌ Error sending quit message:', error);
            }
        }
    }

    // Disconnects the WebSocket connection.
    disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    // ========================================
    // MESSAGE HANDLING
    // ========================================

    // Handles incoming messages from the server.
    // @param message - The message received from the server.
    private handleMessage(message: ServerMessage): void {
        switch (message.type) {
            case MessageType.GAME_STATE:
                if (message.state && this.gameStateCallback)
                    this.gameStateCallback(message.state);
                break;
            case MessageType.GAME_STARTED:
                console.log('🎮 Game started:', message.message);
                break;
            case MessageType.ERROR:
                console.error('❌  Server error:', message.message);
                if (this.errorCallback)
                    this.errorCallback(message.message || 'Unknown error');
                break;
            case MessageType.SUCCESS_LOGIN:
                console.error('✅ Login success:', message.message);
                if (this.loginSuccess)
                    this.loginSuccess(message.message || "✅ Login success");
                break;
            case MessageType.SUCCESS_REGISTRATION:
                console.error('✅ Registration success:', message.message);
                if (this.RegistrationSuccess)
                    this.RegistrationSuccess(message.message || "✅ Registration success");
                break;
            case MessageType.LOGIN_FAILURE:
                console.error('🚫 Login failed:', message.message);
                if (this.loginFailureCallback)
                    this.loginFailureCallback(message.message || "🚫 Login failed: ID/Password not matching");
                break;
            case MessageType.USER_NOTEXIST:
                console.error('🚫 Login failed:', message.message);
                if (this.loginFailureCallback)
                    this.loginFailureCallback(message.message || "User doesn't exist");
                break;
            case MessageType.USER_EXIST:
                console.error('🚫 Registration failed:', message.message);
                if (this.RegistrationFailureCallback)
                    this.RegistrationFailureCallback(message.message || "🚫 Registration failed: user exist");
                break;
            case MessageType.USERNAME_TAKEN:
                console.error('🚫 Registration failed:', message.message);
                if (this.RegistrationFailureCallback)
                    this.RegistrationFailureCallback(message.message || "Username is already registered");
                break;
            default:
                break; //TODO
        }
    }

    // ========================================
    // GAME COMMUNICATION
    // ========================================

    // Sends a request to join a game with the specified game mode.
    joinGame(gameMode: GameMode, players: PlayerInfo[]): void {
        if (this.isConnected()) {
            const message: ClientMessage = {
                type: MessageType.JOIN_GAME,
                gameMode: gameMode,
                players: players
            };
            this.ws!.send(JSON.stringify(message));
        }
    }

    // Sends player input to the server.
    sendPlayerInput(side: number, direction: Direction): void {
        if (this.isConnected()) {
            const message: ClientMessage = {
                type: MessageType.PLAYER_INPUT,
                side: side,
                direction: direction
            };
            this.ws!.send(JSON.stringify(message));
        }
    }

    // ========================================
    // LOGIN/REGISTRATION 
    // ========================================

    registerNewUser(registrationInfo: RegisterUser): void {
        console.log("In registration user");
        if (this.isConnected()) {
            const message: ClientMessage = {
                type: MessageType.REGISTER_USER,
                registerUser: registrationInfo
            };
            this.ws!.send(JSON.stringify(message));
        }        
    }

    loginUser(loginInfo: LoginUser): void {
        console.log("In login user");
        if (this.isConnected()) {
            const message: ClientMessage = {
                type: MessageType.LOGIN_USER,
                loginUser: loginInfo
            };
            this.ws!.send(JSON.stringify(message));
        }          
    }

    // ========================================
    // CALLBACK REGISTRATION
    // ========================================

    // Registers a callback to be invoked when the game state is updated.
    onGameState(callback: (state: GameStateData) => void): void {
        this.gameStateCallback = callback;
    }

    // Registers a callback to be invoked when the connection is established.
    onConnection(callback: () => void): void {
        this.connectionCallback = callback;
        if (this.isConnected())
            callback();
    }

    // Registers a callback to be invoked when an error occurs.
    onError(callback: (error: string) => void): void {
        this.errorCallback = callback;
    }

    // Registers a callback to be invoked when connection status changes.
    onStatusChange(callback: (status: ConnectionStatus) => void): void {
        this.statusCallback = callback;
        this.notifyStatus(this.connectionStatus);
    }

    onLoginFailure(callback: (message?: string) => void): void {
        this.loginFailureCallback = callback;
    }

    onRegistrationFailure(callback: (message: string) => void): void {
        this.RegistrationFailureCallback = callback;
    }

    onLoginSuccess(callback: (message: string) => void): void {
        this.loginSuccess = callback;
    }

    onRegistrationSuccess(callback: (message: string) => void): void {
        this.RegistrationSuccess = callback;
    }



    // ========================================
    // STATUS & UTILITY
    // ========================================

    // Checks if the WebSocket is currently connected.
    isConnected(): boolean {
        return this.connectionStatus === ConnectionStatus.CONNECTED;
    }

    // Gets the current connection status.
    getConnectionStatus(): ConnectionStatus {
        return this.connectionStatus;
    }

    // Notifies registered callbacks about status changes.
    private notifyStatus(status: ConnectionStatus): void {
        this.statusCallback?.(status);
    }
}

export const webSocketClient = WebSocketClient.getInstance();