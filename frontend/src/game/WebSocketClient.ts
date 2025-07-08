import { MessageType, GameMode, Direction } from '../shared/constants.js'
import { ClientMessage, ServerMessage, GameStateData } from '../shared/types.js'

/**
 * WebSocketClient is responsible for managing the WebSocket connection
 * to the game server, handling messages, and providing callbacks for
 * game state updates, connection events, and errors.
 */
export class WebSocketClient {
    private ws: WebSocket | null = null;
    private gameStateCallback: ((state: GameStateData) => void) | null = null;
    private connectionCallback: (() => void) | null = null;
    private errorCallback: ((error: string) => void) | null = null;

    /**
     * Initializes the WebSocketClient and connects to the server.
     * @param url - The WebSocket server URL.
     */
    constructor(url: string) {
        this.connect(url);
    }

    /**
     * Establishes a WebSocket connection to the specified URL.
     * @param url - The WebSocket server URL.
     */
    private connect(url: string): void {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            console.log('Connected to game server');
            if (this.connectionCallback) {
                this.connectionCallback();
            }
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
            console.log('❌ Disconnected from game server');
        };

        this.ws.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
            if (this.errorCallback)
                this.errorCallback('Connection error');
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
    joinGame(gameMode: GameMode): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const message: ClientMessage = {
                type: MessageType.JOIN_GAME,
                gameMode: gameMode
            };
            this.ws.send(JSON.stringify(message));
        }
    }

    /**
     * Sends player input to the server.
     * @param side - The player's side.
     * @param direction - The direction of the player's input.
     */
    sendPlayerInput(side: number, direction: Direction): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const message: ClientMessage = {
                type: MessageType.PLAYER_INPUT,
                side: side,
                direction: direction
            };
            this.ws.send(JSON.stringify(message));
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

    /**
     * Checks if the WebSocket connection is currently open.
     * @returns True if connected, false otherwise.
     */
    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}