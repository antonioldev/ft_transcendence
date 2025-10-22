import { Logger } from '../utils/LogManager.js';
import { ConnectionStatus, MessageType, Direction, PowerupType, AppState } from '../shared/constants.js'
import { ClientMessage, ServerMessage } from '../shared/types.js'
import { appManager } from './AppManager.js';

/**
 * WebSocketClient is responsible for managing the WebSocket connection
 * to the game server, handling messages, and providing callbacks for
 * game state updates, connection events, and errors.
 */
export class WebSocketClient {
    private ws?: WebSocket;
    private connectionStatus: ConnectionStatus = ConnectionStatus.CONNECTING;
    private callbacks: { [event: string]: Function | null } = {};

    // ========================================
    // CONNECTION MANAGEMENT
    // ========================================

    // Establishes a WebSocket connection to the specified URL.
    connect(WS_URL: string): void {
        console.log(`Connecting to websocket at '${WS_URL}'`);
        this.ws = new WebSocket(WS_URL);
        this.connectionStatus = ConnectionStatus.CONNECTING;
        this.notifyStatus(ConnectionStatus.CONNECTING);

        const timeout = setTimeout(() => {
            if (this.connectionStatus === ConnectionStatus.CONNECTING) {
                this.connectionStatus = ConnectionStatus.FAILED;
                this.notifyStatus(ConnectionStatus.FAILED);
                this.triggerCallback(MessageType.ERROR, 'Connection timeout');
            }
        }, 5000);

        this.ws.onopen = () => {
            clearTimeout(timeout);
            this.connectionStatus = ConnectionStatus.CONNECTED;
            this.notifyStatus(ConnectionStatus.CONNECTED);
        };

        this.ws.onmessage = (event) => {
            try {
                const message: ServerMessage = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (error) {
                Logger.errorAndThrow('Error parsing server message', 'WebSocketClient', error);
            }
        };

        this.ws.onclose = () => {
            clearTimeout(timeout);
            Logger.warn('Disconnected from game server', 'WebSocketClient');
            appManager.navigateTo(AppState.MAIN_MENU);
            this.connectionStatus = ConnectionStatus.FAILED;
            this.notifyStatus(ConnectionStatus.FAILED);
        };

        this.ws.onerror = (error) => {
            clearTimeout(timeout);
            Logger.error('WebSocket error', 'WebSocketClient', error);
            appManager.navigateTo(AppState.MAIN_MENU);
            this.connectionStatus = ConnectionStatus.FAILED;
            this.notifyStatus(ConnectionStatus.FAILED);
        };
    }

    // Disconnects the WebSocket connection.
    disconnect(): void {
        this.ws?.close();
    }

    // ========================================
    // MESSAGE HANDLING
    // ========================================

    // Handles incoming messages from the server.
    private handleMessage(message: ServerMessage): void {
        switch (message.type) {
            case MessageType.GAME_STATE:
                this.triggerCallback(MessageType.GAME_STATE, message.state);
                break;
            case MessageType.SESSION_ENDED:
                this.triggerCallback(MessageType.SESSION_ENDED, message);
                break;
            case MessageType.SIDE_ASSIGNMENT:
                this.triggerCallback(MessageType.SIDE_ASSIGNMENT, message);
                break;
            case MessageType.COUNTDOWN:
                this.triggerCallback(MessageType.COUNTDOWN, message);
                break;
            case MessageType.ERROR:
                this.triggerCallback(MessageType.ERROR, message.message);
                break;
            case MessageType.MATCH_ASSIGNMENT:
                this.triggerCallback(MessageType.MATCH_ASSIGNMENT, message);
                break;
            case MessageType.MATCH_RESULT:
                this.triggerCallback(MessageType.MATCH_RESULT, message);
                break;
            case MessageType.TOURNAMENT_LOBBY:
                this.triggerCallback(MessageType.TOURNAMENT_LOBBY, message); 
                break;
            default:
                Logger.errorAndThrow(`Unhandled message type: ${message.type}`, 'WebSocketClient');
                break;
        }
    }
.
    // ========================================
    // GAME COMMUNICATION
    // ========================================

    sendPlayerReady(): void {
        this.sendMessage(MessageType.PLAYER_READY);
    }

    sendSpectatorReady(): void {
        this.sendMessage(MessageType.SPECTATE_GAME);
    }

    requestLobby(): void {
        this.sendMessage(MessageType.REQUEST_LOBBY);
    }

    sendPlayerInput(side: number, direction: Direction): void {
        this.sendMessage(MessageType.PLAYER_INPUT, { side, direction});
    }

    sendPauseRequest(): void {
        this.sendMessage(MessageType.PAUSE_REQUEST);
    }

    sendResumeRequest(): void {
        this.sendMessage(MessageType.RESUME_REQUEST);
    }

    sendQuitGame(): void {
        this.sendMessage(MessageType.QUIT_GAME);
    }

    sendSwitchGame(direction: Direction): void {
        this.sendMessage(MessageType.TOGGLE_SPECTATOR_GAME, direction)
    }

    sendPowerupActivationRequest(powerup_type: PowerupType, side: number, slot: number,): void {
        this.sendMessage(MessageType.ACTIVATE_POWERUP, {powerup_type, slot, side});
    }

    private sendMessage(type: MessageType, data: any = {}): void {
        if (!this.isConnected()) {
            Logger.warn(`Cannot send ${type}: WebSocket not connected`, 'WebSocketClient');
            return;
        }

        const message: ClientMessage = { type, ...data };

        try {
            this.ws!.send(JSON.stringify(message));
        } 
        catch (error) {
            Logger.error(`Error sending message of type ${type}`, 'WebSocketClient', error);
            this.connectionStatus = ConnectionStatus.FAILED;
            this.notifyStatus(ConnectionStatus.FAILED);
        }
    }

    // ========================================
    // CALLBACK REGISTRATION
    // ========================================

    registerCallback(event: MessageType, callback: Function): void {
        this.callbacks[event] = callback;
    }

    unregisterCallback(event: MessageType): void {
        this.callbacks[event] = null;
    }

    triggerCallback(event: MessageType, data?: any): void {
        const callback = this.callbacks[event];
        if (callback) {
            try {
                callback(data);
            } catch (error) {
                Logger.errorAndThrow(`Error triggering callback for event ${event}`, 'WebSocketClient', error);
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
        this.triggerCallback(MessageType.STATUS_CHANGE, status);
    }
}
export const webSocketClient = new WebSocketClient();