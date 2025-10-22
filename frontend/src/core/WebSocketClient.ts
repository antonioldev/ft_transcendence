import { AppState, ConnectionStatus, Direction, GameMode, MessageType, PowerupType } from '../shared/constants.js';
import { ClientMessage, LoginUser, PlayerInfo, RegisterUser, ServerMessage } from '../shared/types.js';
import { Logger } from '../utils/LogManager.js';
import { AppManger } from './AppManager.js';

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
		
		// In development, connect directly to backend on port 3000
		let WS_URL: string;
		if (location.port === '5173') {
			// Development mode - connect directly to backend
			WS_URL = (location.protocol === 'https:' ? 'wss://' : 'ws://') + 'localhost:3000/ws';
		} else {
			// Production mode - use nginx proxy
			WS_URL = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws';
		}
		
		console.log('Connecting to WebSocket:', WS_URL);

		this.ws = new WebSocket(WS_URL);

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
			AppManger.getInstance().navigateTo(AppState.MAIN_MENU);
			this.connectionStatus = ConnectionStatus.FAILED;
			this.notifyStatus(ConnectionStatus.FAILED);
		};

		this.ws.onerror = (error) => {
			clearTimeout(timeout);
			Logger.error('WebSocket error', 'WebSocketClient', error);
 
			this.connectionStatus = ConnectionStatus.FAILED;
			this.notifyStatus(ConnectionStatus.FAILED);
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
			case MessageType.SUCCESS_LOGIN:
				this.triggerCallback(MessageType.SUCCESS_LOGIN, message.message || "✅ Login success");
				break;
			case MessageType.SUCCESS_REGISTRATION:
				this.triggerCallback(MessageType.SUCCESS_REGISTRATION, message.message || "✅ Registration success");
				break;
			case MessageType.LOGIN_FAILURE:
				this.triggerCallback(MessageType.LOGIN_FAILURE, message.message || "🚫 Login failed: ID/Password not matching");
				break;
			case MessageType.USER_NOTEXIST:
				this.triggerCallback(MessageType.LOGIN_FAILURE, message.message || "User doesn't exist");
				break;
			case MessageType.USER_EXIST:
				this.triggerCallback(MessageType.USER_EXIST, message.message || "🚫 Registration failed: user exist");
				break;
			case MessageType.USERNAME_TAKEN:
				this.triggerCallback(MessageType.USERNAME_TAKEN, message.message || "Username is already registered");
				break;
			case MessageType.SEND_USER_STATS:
				this.triggerCallback(MessageType.SEND_USER_STATS, message.stats);
				break;
			case MessageType.SEND_GAME_HISTORY:
				this.triggerCallback(MessageType.SEND_GAME_HISTORY, message.gameHistory);
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
		}
	}

	// ========================================
	// GAME COMMUNICATION
	// ========================================

	joinGame(gameMode: GameMode, players: PlayerInfo[], aiDifficulty: number, capacity?: number): void {
		this.sendMessage(MessageType.JOIN_GAME, { gameMode, players, aiDifficulty, capacity });
	}

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
		} catch (error) {
			Logger.error(`Error sending message of type ${type}`, 'WebSocketClient', error);
			this.connectionStatus = ConnectionStatus.FAILED;
			this.notifyStatus(ConnectionStatus.FAILED);
		}
	}

	// ========================================
	// LOGIN/REGISTRATION 
	// ========================================

	registerNewUser(registrationInfo: RegisterUser): void {
		if (!this.isConnected()) {
			this.triggerCallback(MessageType.ERROR, 'Not connected to server');
			return;
		}
		const message: ClientMessage = {
			type: MessageType.REGISTER_USER,
			registerUser: registrationInfo
		};
		this.ws!.send(JSON.stringify(message));
	}

	loginUser(loginInfo: LoginUser): void {
		if (!this.isConnected()) {
			this.triggerCallback(MessageType.ERROR, 'Not connected to server');
			return;
		}
		const message: ClientMessage = {
			type: MessageType.LOGIN_USER,
			loginUser: loginInfo
		};
		this.ws!.send(JSON.stringify(message));
	}

	logoutUser(): void {
		if (this.isConnected()) {
			const message: ClientMessage = {
				type: MessageType.LOGOUT_USER,
			};
			this.ws!.send(JSON.stringify(message));
		}		  
	}

	// ========================================
	// DASHBOARD
	// ========================================

	requestUserStats(username: string): void {
		if (this.isConnected()) {
			const message: ClientMessage = {
				type: MessageType.REQUEST_USER_STATS,
				username: username
			};
			this.ws!.send(JSON.stringify(message));
		}
	}

	requestUserGameHistory(username: string): void {
		if (this.isConnected()) {
			const message: ClientMessage = {
				type: MessageType.REQUEST_GAME_HISTORY,
				username: username
			};
			this.ws!.send(JSON.stringify(message));
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
		return this.connectionStatus === ConnectionStatus.CONNECTED && 
			this.ws !== null &&  this.ws.readyState === WebSocket.OPEN;
	}

	// Notifies registered callbacks about status changes.
	private notifyStatus(status: ConnectionStatus): void {
		this.triggerCallback(MessageType.STATUS_CHANGE, status);
	}
}

export const webSocketClient = WebSocketClient.getInstance();