export interface GameStateData {
    paddleLeft: {x: number; score: number};
    paddleRight: {x: number; score: number};
    ball: {x: number; z: number};
}

export interface ServerMessage {
    type: 'game_state' | 'side_assignment' | 'game_started' | 'error';
    state? : GameStateData;
    side?: number;
    message?: string;
}

export interface ClientMessage {
    type: 'join_game' | 'player_input';
    gameMode?: 'single_player' | 'two_player_local' | 'two_player_remote';
    side?: number;
    direction?: 'left' | 'right' | 'stop';
}

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
            console.log('🌐 Connected to game server');
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
            case 'game_state':
                if (message.state && this.gameStateCallback)
                    this.gameStateCallback(message.state);
                break;
            case 'game_started':
                console.log('🎮 Game started:', message.message);
                break;
            case 'error':
                console.error('🚨 Server error:', message.message);
                if (this.errorCallback)
                    this.errorCallback(message.message || 'Unknown error');
                break;
            default:
                console.log('📩 Received:', message);
        }
    }

    joinGame(gameMode: 'single_player' | 'two_player_local' | 'two_player_remote'): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const message: ClientMessage = {
                type: 'join_game',
                gameMode: gameMode
            };
            this.ws.send(JSON.stringify(message));
        }
    }

    sendPlayerInput(side: number, direction: 'left' | 'right' | 'stop'): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const message: ClientMessage = {
                type: 'player_input',
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