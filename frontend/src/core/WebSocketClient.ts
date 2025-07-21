import { ConnectionStatus, MessageType, GameMode, Direction, WebSocketEvent } from '../shared/constants.js'
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
    private callbacks: { [event: string]: Function | null } = {};

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
                this.triggerCallback(WebSocketEvent.ERROR, 'Connection timeout');
            }
        }, 5000);

        this.ws.onopen = () => {
            clearTimeout(timeout);
            this.connectionStatus = ConnectionStatus.CONNECTED;
            this.notifyStatus(ConnectionStatus.CONNECTED);
            console.log('🔗 Connected to game server');
            this.triggerCallback(WebSocketEvent.CONNECTION);
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
            this.triggerCallback(WebSocketEvent.ERROR, 'Connection failed');
        };
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
    private handleMessage(message: ServerMessage): void {
        switch (message.type) {
            case MessageType.GAME_STATE:
                this.triggerCallback(WebSocketEvent.GAME_STATE, message.state);
                break;
            case MessageType.PAUSED:
                this.triggerCallback(WebSocketEvent.GAME_PAUSED);
                break;
            case MessageType.RESUMED:
                this.triggerCallback(WebSocketEvent.GAME_RESUMED);
                break;
            case MessageType.GAME_ENDED:
                this.triggerCallback(WebSocketEvent.GAME_ENDED);
                break;
            case MessageType.WELCOME:
                console.log('Server says:', message.message);
                break;
            case MessageType.ERROR:
                this.triggerCallback(WebSocketEvent.ERROR, message.message);
                break;
            case MessageType.SUCCESS_LOGIN:
                console.error('✅ Login success:', message.message);
                this.triggerCallback(WebSocketEvent.LOGIN_SUCCESS, message.message || "✅ Login success");
                break;
            case MessageType.SUCCESS_REGISTRATION:
                console.error('✅ Registration success:', message.message);
                this.triggerCallback(WebSocketEvent.REGISTRATION_SUCCESS, message.message || "✅ Registration success");
                break;
            case MessageType.LOGIN_FAILURE:
                console.error('🚫 Login failed:', message.message);
                this.triggerCallback(WebSocketEvent.LOGIN_FAILURE, message.message || "🚫 Login failed: ID/Password not matching");
                break;
            case MessageType.USER_NOTEXIST:
                console.error('🚫 Login failed:', message.message);
                this.triggerCallback(WebSocketEvent.LOGIN_FAILURE, message.message || "User doesn't exist");
                break;
            case MessageType.USER_EXIST:
                console.error('🚫 Registration failed:', message.message);
                this.triggerCallback(WebSocketEvent.REGISTRATION_FAILURE, message.message || "🚫 Registration failed: user exist");
                break;
            case MessageType.USERNAME_TAKEN:
                console.error('🚫 Registration failed:', message.message);
                this.triggerCallback(WebSocketEvent.REGISTRATION_FAILURE, message.message || "Username is already registered");
                break;
            default:
                console.warn(`Unhandled message type: ${message.type}`);
                break;
        }
    }

    // ========================================
    // GAME COMMUNICATION
    // ========================================

    joinGame(gameMode: GameMode, players: PlayerInfo[]): void {
        this.sendMessage(MessageType.JOIN_GAME, { gameMode, players });
    }

    sendPlayerInput(side: number, direction: Direction): void {
        this.sendMessage(MessageType.PLAYER_INPUT, { side, direction });
    }
    
    sendPauseRequest(): void {
        this.sendMessage(MessageType.PAUSE_REQUEST);
    }
    
    sendResumeRequest(): void {
        this.sendMessage(MessageType.RESUME_REQUEST);
    }

    sendQuitGame(): void { //TODO doesn't work with browser <-
        this.sendMessage(MessageType.QUIT_GAME);
    }

    private sendMessage(type: MessageType, data: any = {}): void {
        if (!this.isConnected()) {
            console.error('WebSocket is not connected. Cannot send message.');
            return;
        }
    
        const message: ClientMessage = { type, ...data };
    
        try {
            this.ws!.send(JSON.stringify(message));
            console.log(`Message sent: ${type}`, message);
        } catch (error) {
            console.error(`Error sending message of type ${type}:`, error);
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

    registerCallback(event: WebSocketEvent, callback: Function): void {
        this.callbacks[event] = callback;
    }
    
    triggerCallback(event: WebSocketEvent, data?: any): void {
        const callback = this.callbacks[event];
        if (callback) {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error triggering callback for event ${event}:`, error);
            }
        }
    }
    
    // ========================================
    // STATUS & UTILITY
    // ========================================

    // Checks if the WebSocket is currently connected.
    isConnected(): boolean {
        return this.connectionStatus === ConnectionStatus.CONNECTED;
    }

    // Notifies registered callbacks about status changes.
    private notifyStatus(status: ConnectionStatus): void {
        this.triggerCallback(WebSocketEvent.STATUS_CHANGE, status);
    }
}

export const webSocketClient = WebSocketClient.getInstance();