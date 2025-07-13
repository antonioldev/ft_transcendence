import { webSocketClient } from '../core/WebSocketClient.js';
import { GameMode } from '../shared/constants.js';
import { PlayerInfo, GameStateData, InputData } from '../shared/types.js';

/**
 * Manages network communication for the game, handling WebSocket events, sending player actions,
 * and managing callbacks for game state, connection, and error events.
 *
 * The `NetworkManager` is responsible for:
 * - Registering and invoking callbacks for game state updates, connection events, and errors.
 * - Sending join game requests and player input to the server.
 * - Managing the connection status and providing connection state information.
 * - Cleaning up its own resources without disconnecting the shared WebSocket connection.
 */
export class NetworkManager {
    private isDisposed: boolean = false;
    private gameStateCallback: ((state: GameStateData) => void) | null = null;
    private connectionCallback: (() => void) | null = null;
    private errorCallback: ((error: string) => void) | null = null;

    constructor(
        private gameMode: GameMode,
        private players: PlayerInfo[]
    ) {
        this.setupWebSocketCallbacks();
    }

    // ========================================
    // WEBSOCKET SETUP
    // ========================================

    // Setup WebSocket event callbacks
    private setupWebSocketCallbacks(): void {
        // Game state updates
        webSocketClient.onGameState((state: GameStateData) => {
            if (!this.isDisposed && this.gameStateCallback) {
                this.gameStateCallback(state);
            }
        });

        // Connection events
        webSocketClient.onConnection(() => {
            if (!this.isDisposed && this.connectionCallback) {
                this.connectionCallback();
            }
        });

        // Error events
        webSocketClient.onError((error: string) => {
            if (!this.isDisposed && this.errorCallback) {
                this.errorCallback(error);
            }
        });
    }

    // ========================================
    // CALLBACK REGISTRATION
    // ========================================

    // Register callback for game state updates
    onGameState(callback: (state: GameStateData) => void): void {
        this.gameStateCallback = callback;
    }

    // Register callback for connection established
    onConnection(callback: () => void): void {
        this.connectionCallback = callback;
    }

    // Register callback for errors
    onError(callback: (error: string) => void): void {
        this.errorCallback = callback;
    }

    // ========================================
    // GAME COMMUNICATION
    // ========================================

    // Join the game on the server
    joinGame(): void {
        if (this.isDisposed) return;

        if (webSocketClient.isConnected()) {
            this.sendJoinRequest();
        } else {
            // Wait for connection then join
            this.onConnection(() => {
                if (!this.isDisposed) {
                    this.sendJoinRequest();
                }
            });
        }
    }

    // Send join game request to server
    private sendJoinRequest(): void {
        try {
            webSocketClient.joinGame(this.gameMode, this.players);
            console.log('Join game request sent:', {
                gameMode: GameMode[this.gameMode],
                players: this.players
            });
        } catch (error) {
            console.error('Error sending join request:', error);
        }
    }

    // Send player input to server
    sendInput(input: InputData): void {
        if (this.isDisposed) return;

        try {
            webSocketClient.sendPlayerInput(input.side, input.direction);
        } catch (error) {
            console.error('Error sending input:', error);
        }
    }

    quitCurrentGame(): void {
        if (this.isDisposed) return;

        try {
            console.log('🚪 NetworkManager: Quitting current game (keeping WebSocket open)');
            webSocketClient.sendQuitGame();
        } catch (error) {
            console.error('Error sending quit message:', error);
        }
    }

    // ========================================
    // CONNECTION STATUS
    // ========================================

    // Check if connected to server
    isConnected(): boolean {
        return webSocketClient.isConnected();
    }

    // Get connection status
    getConnectionStatus(): string {
        return webSocketClient.isConnected() ? 'connected' : 'disconnected';
    }

    // ========================================
    // CLEANUP
    // ========================================

    // Clean up network manager (but don't disconnect WebSocket as it's shared)
    dispose(): void {
        if (this.isDisposed) return;

        this.isDisposed = true;

        try {
            // Clear callbacks to prevent further updates
            this.gameStateCallback = null;
            this.connectionCallback = null;
            this.errorCallback = null;

            // Note: We don't disconnect the WebSocket itself as it's a singleton
            // and might be used by other components. The WebSocketClient handles
            // its own lifecycle.

            console.log('NetworkManager disposed successfully');
        } catch (error) {
            console.error('Error disposing NetworkManager:', error);
        }
    }
}