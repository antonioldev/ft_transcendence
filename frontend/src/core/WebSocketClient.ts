import { Logger } from '../utils/LogManager.js';
import { ConnectionStatus, MessageType, Direction, WebSocketEvent, PowerupType, AppState } from '../shared/constants.js'
import { ClientMessage, ServerMessage } from '../shared/types.js'
import { AppStateManager } from './AppStateManager.js';

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
                this.triggerCallback(WebSocketEvent.ERROR, 'Connection timeout');
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
            AppStateManager.getInstance().navigateTo(AppState.MAIN_MENU);
            this.connectionStatus = ConnectionStatus.FAILED;
            this.notifyStatus(ConnectionStatus.FAILED);
        };

        this.ws.onerror = (error) => {
            clearTimeout(timeout);
            Logger.error('WebSocket error', 'WebSocketClient', error);
            AppStateManager.getInstance().navigateTo(AppState.MAIN_MENU);
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
                this.triggerCallback(WebSocketEvent.GAME_STATE, message.state);
                break;
            case MessageType.SESSION_ENDED:
                this.triggerCallback(WebSocketEvent.SESSION_ENDED, message);
                break;
            case MessageType.SIDE_ASSIGNMENT:
                this.triggerCallback(WebSocketEvent.SIDE_ASSIGNMENT, message);
                break;
            case MessageType.COUNTDOWN:
                this.triggerCallback(WebSocketEvent.COUNTDOWN, message);
                break;
            case MessageType.ERROR:
                this.triggerCallback(WebSocketEvent.ERROR, message.message);
                break;
            // case MessageType.SUCCESS_LOGIN:
            //     this.triggerCallback(WebSocketEvent.LOGIN_SUCCESS, message.message || "✅ Login success");
            //     break;
            // case MessageType.SUCCESS_REGISTRATION:
                // this.triggerCallback(WebSocketEvent.REGISTRATION_SUCCESS, message.message || "✅ Registration success");
                // break;
            // case MessageType.LOGIN_FAILURE:
            //     this.triggerCallback(WebSocketEvent.LOGIN_FAILURE, message.message || "🚫 Login failed: ID/Password not matching");
            //     break;
            // case MessageType.USER_NOTEXIST:
            //     this.triggerCallback(WebSocketEvent.LOGIN_FAILURE, message.message || "User doesn't exist");
            //     break;
            // case MessageType.USER_EXIST:
            //     this.triggerCallback(WebSocketEvent.REGISTRATION_FAILURE, message.message || "🚫 Registration failed: user exist");
            //     break;
            // case MessageType.USERNAME_TAKEN:
                // this.triggerCallback(WebSocketEvent.REGISTRATION_FAILURE, message.message || "Username is already registered");
                // break;
            // case MessageType.SEND_USER_STATS:
            //     this.triggerCallback(WebSocketEvent.USER_STATS, message.stats);
            //     break;
            // case MessageType.SEND_GAME_HISTORY:
            //     this.triggerCallback(WebSocketEvent.GAME_HISTORY, message.gameHistory);
            //     break;
            case MessageType.MATCH_ASSIGNMENT:
                this.triggerCallback(WebSocketEvent.MATCH_ASSIGNMENT, message);
                break;
            case MessageType.MATCH_RESULT:
                this.triggerCallback(WebSocketEvent.MATCH_RESULT, message);
                break;
            case MessageType.TOURNAMENT_LOBBY:
                this.triggerCallback(WebSocketEvent.TOURNAMENT_LOBBY, message); 
                break;
            default:
                Logger.errorAndThrow(`Unhandled message type: ${message.type}`, 'WebSocketClient');
                break;
        }
    }

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
    // LOGIN/REGISTRATION 
    // ========================================



    // loginUser(loginInfo: LoginUser): void {
    //     if (!this.isConnected()) {
    //         this.triggerCallback(WebSocketEvent.ERROR, 'Not connected to server');
    //         return;
    //     }
    //     const message: ClientMessage = {
    //         type: MessageType.LOGIN_USER,
    //         loginUser: loginInfo
    //     };
    //     this.ws!.send(JSON.stringify(message));
    // }

    // logoutUser(): void {
    //     if (this.isConnected()) {
    //         const message: ClientMessage = {
    //             type: MessageType.LOGOUT_USER,
    //         };
    //         this.ws!.send(JSON.stringify(message));
    //     }          
    // }

    // ========================================
    // DASHBOARD
    // ========================================

    // requestUserStats(username: string): void {
    //     if (this.isConnected()) {
    //         const message: ClientMessage = {
    //             type: MessageType.REQUEST_USER_STATS,
    //             username: username
    //         };
    //         this.ws!.send(JSON.stringify(message));
    //     }
    // }

    // requestUserGameHistory(username: string): void {
    //     if (this.isConnected()) {
    //         const message: ClientMessage = {
    //             type: MessageType.REQUEST_GAME_HISTORY,
    //             username: username
    //         };
    //         this.ws!.send(JSON.stringify(message));
    //     }
    // }

    // ========================================
    // CALLBACK REGISTRATION
    // ========================================

    registerCallback(event: WebSocketEvent, callback: Function): void {
        this.callbacks[event] = callback;
    }

    unregisterCallback(event: WebSocketEvent): void {
        this.callbacks[event] = null;
    }

    triggerCallback(event: WebSocketEvent, data?: any): void {
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
        this.triggerCallback(WebSocketEvent.STATUS_CHANGE, status);
    }
}
export const webSocketClient = new WebSocketClient();