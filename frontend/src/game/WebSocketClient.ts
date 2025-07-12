import { ConnectionStatus, MessageType, GameMode, Direction } from '../shared/constants.js'
import { ClientMessage, ServerMessage, GameStateData, PlayerInfo } from '../shared/types.js'

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

    /**
     * Initializes the WebSocketClient and connects to the server.
     * @param url - The WebSocket server URL.
     */
    private constructor() {
        this.connect();
    }

    static getInstance(): WebSocketClient {
        if (!WebSocketClient.instance) {
            WebSocketClient.instance = new WebSocketClient();
        }
        return WebSocketClient.instance;
    }

    /**
     * Establishes a WebSocket connection to the specified URL.
     * @param url - The WebSocket server URL.
     */
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

    /**
     * Handles incoming messages from the server.
     * @param message - The message received from the server.
     */
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
            default:
                console.log('📩 Received:', message); //TODO
        }
    }

    /**
     * Sends a request to join a game with the specified game mode.
     * @param gameMode - The game mode to join.
     */
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

    /**
     * Sends player input to the server.
     * @param side - The player's side.
     * @param direction - The direction of the player's input.
     */
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

    /**
     * Registers a callback to be invoked when the game state is updated.
     * @param callback - The callback function.
     */
    onGameState(callback: (state: GameStateData) => void): void {
        this.gameStateCallback = callback;
    }

    /**
     * Registers a callback to be invoked when the connection is established.
     * @param callback - The callback function.
     */
    onConnection(callback: () => void): void {
        this.connectionCallback = callback;
        if (this.isConnected())
            callback();
    }

    /**
     * Registers a callback to be invoked when an error occurs.
     * @param callback - The callback function.
     */
    onError(callback: (error: string) => void): void {
        this.errorCallback = callback;
    }

    /**
     * Disconnects the WebSocket connection.
     */
    disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
    
    onStatusChange(callback: (status: ConnectionStatus) => void): void {
        this.statusCallback = callback;
        this.notifyStatus(this.connectionStatus);
    }

    // Status
    isConnected(): boolean {
        return this.connectionStatus === ConnectionStatus.CONNECTED;
    }

    getConnectionStatus(): ConnectionStatus {
        return this.connectionStatus;
    }

    // Simple retry (just try to connect again)
    retry(): void {
        if (this.ws) {
            this.ws.close();
        }
        this.connect();
    }

    private notifyStatus(status: ConnectionStatus): void {
        this.statusCallback?.(status);
    }
}

export const webSocketClient = WebSocketClient.getInstance();