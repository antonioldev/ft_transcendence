import { MessageType, GameMode, Direction } from '../shared/constants.js'
import { ClientMessage, ServerMessage, GameStateData } from '../shared/types.js'

export class WebSocketClient {
    private ws: WebSocket | null = null;
    private gameStateCallback: ((state: GameStateData) => void) | null = null;
    private connectionCallback: (() => void) | null = null;
    private errorCallback: ((error: string) => void) | null = null;

    constructor(url: string) {
        this.connect(url);
    }

    private connect(url:string): void {
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

        this.ws.onclose =  () => {
            console.log('❌ Disconnected from game server');
        };

        this.ws.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
            if (this.errorCallback)
                this.errorCallback('Connection error');
        }
    }

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

    joinGame(gameMode: GameMode): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const message: ClientMessage = {
                type: MessageType.JOIN_GAME,
                gameMode: gameMode
            };
            this.ws.send(JSON.stringify(message));
        }
    }

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

    onGameState(callback: (state: GameStateData) => void): void {
        this.gameStateCallback = callback;
    }

    onConnection(callback: () => void): void {
        this.connectionCallback = callback;
    }

    onError(callback: (error: string) => void): void {
        this.errorCallback = callback;
    }

    disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}