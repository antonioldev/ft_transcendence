declare var BABYLON: any;

import { WebSocketClient } from './WebSocketClient.js';
import { InputManager } from './InputManager.js';
import { GUIManager } from './GuiManager.js';
import { GAME_CONFIG } from '../shared/gameConfig.js';
import { Direction, GameMode} from '../shared/constants.js';
import { GameStateData, PlayerInfo, GameObjects } from '../shared/types.js';

/**
 * GameSession is THE ONLY class responsible for starting and managing games.
 * All game starting logic is centralized here.
 */
export class GameSession {
    private scene: any;
    private gameObjects: GameObjects;
    private inputManager: InputManager;
    private guiManager: GUIManager;
    private webSocketClient: WebSocketClient;
    private isRunning = false;
    private playerSide = 0;

    /**
     * Initializes the GameSession with the required dependencies.
     * @param scene - The Babylon.js scene object.
     * @param gameObjects - The game objects to be managed.
     * @param inputManager - Handles player input.
     * @param guiManager - Manages the GUI elements.
     */
    constructor(scene: any, gameObjects: GameObjects, inputManager: InputManager, guiManager: GUIManager) {
        this.scene = scene;
        this.gameObjects = gameObjects;
        this.inputManager = inputManager;
        this.guiManager = guiManager;
        this.webSocketClient = new WebSocketClient('ws://localhost:3000'); //TODO make this configurable, important for remote players
        this.setupWebSocketCallbacks();
    }

    /**
     * Sets up WebSocket event callbacks for handling game state updates,
     * connection events, and errors.
     */
    private setupWebSocketCallbacks(): void {
        this.webSocketClient.onGameState((state: GameStateData) => {
            this.updateGameObjects(state);
        });

        this.webSocketClient.onConnection(() => {
            console.log('🔗 Connected to game server');
        });

        this.webSocketClient.onError((error: string) => {
            console.error('❌ WebSocket error:', error);
        });
    }

    /**
     * Updates the positions of game objects based on the received game state.
     * @param state - The current game state data.
     */
    private updateGameObjects(state: GameStateData): void {
        if (this.gameObjects.players.left) {
            this.gameObjects.players.left.position.x = state.paddleLeft.x;
        }

        if (this.gameObjects.players.right) {
            this.gameObjects.players.right.position.x = state.paddleRight.x;
        }

        if (this.gameObjects.ball) {
            this.gameObjects.ball.position.x = state.ball.x;
            this.gameObjects.ball.position.z = state.ball.z;
        }

        if (this.guiManager) {
            //TODO add score display or other game state info
        }
    }

    /**
     * Extracts player information from the UI based on game mode.
     * @param gameMode - The current game mode.
     * @returns Array of player information.
     */
    private getPlayerInfoFromUI(gameMode: GameMode): PlayerInfo[] {
        const getInputValue = (id: string, defaultName: string): string => {
            const input = document.getElementById(id) as HTMLInputElement;
            return input?.value.trim() || defaultName;
        };

        switch (gameMode) {
            case GameMode.SINGLE_PLAYER: {
                const name = getInputValue('player1-name', 'Player 1');
                return [{ id: name, name: name }];
            }
        
            case GameMode.TWO_PLAYER_LOCAL: {
                const name1 = getInputValue('player1-name-local', 'Player 1');
                const name2 = getInputValue('player2-name-local', 'Player 2');
                return [
                    { id: name1, name: name1 },
                    { id: name2, name: name2 }
                ];
            }

            case GameMode.TWO_PLAYER_REMOTE: {
                const name1 = getInputValue('player1-name-online', 'Player 1');
                return [{ id: name1, name: name1 }];
            }
        
            default: {
                return [{ id: 'Player 1', name: 'Player 1' }];
            }
        }
    }

    /**
     * ⭐ THE MAIN METHOD - Starts a game with the specified mode.
     * This is the ONLY place where games are started.
     * @param gameMode - The game mode to start.
     * @param controlledSide - Which side this client controls (for remote games).
     */
    startGame(gameMode: GameMode, controlledSide: number = 0): void {
        console.log(`🎮 Starting game: ${GameMode[gameMode]} (side: ${controlledSide})`);
        
        const players = this.getPlayerInfoFromUI(gameMode);
        console.log('👥 Player names extracted:', players);
        
        this.inputManager.configureInput(gameMode, controlledSide);
        this.playerSide = controlledSide;

        const joinGameAndStart = () => {
            this.webSocketClient.joinGame(gameMode, players);
            this.startGameLoop();
        };

        if (this.webSocketClient.isConnected()) {
            joinGameAndStart();
        } else {
            this.webSocketClient.onConnection(joinGameAndStart);
        }
    }

    /**
     * Starts the game loop and sets up input handling and rendering updates.
     * Private method - only called internally by startGame().
     */
    private startGameLoop(): void {
        if (this.isRunning) {
            return;
        }
        this.isRunning = true;

        this.inputManager.setNetworkCallback((side: number, direction: Direction) => {
            this.webSocketClient.sendPlayerInput(side, direction);
        });

        this.scene.registerBeforeRender(() => {
            if (!this.isRunning)
                return;
                
            this.inputManager.updateInput();

            if (this.guiManager)
                this.guiManager.updateFPS();

            if (this.gameObjects.cameras.length > 1)
                this.update3DCameras();
        });
    }

    /**
     * Updates the 3D camera targets to follow the players.
     */
    private update3DCameras(): void {
        const [camera1, camera2] = this.gameObjects.cameras;

        if (camera1 && camera2) {
            const targetLeft = this.inputManager.getFollowTarget(this.gameObjects.players.left);
            const targetRight = this.inputManager.getFollowTarget(this.gameObjects.players.right);

            camera1.setTarget(BABYLON.Vector3.Lerp(camera1.getTarget(), targetLeft, GAME_CONFIG.followSpeed));
            camera2.setTarget(BABYLON.Vector3.Lerp(camera2.getTarget(), targetRight, GAME_CONFIG.followSpeed));
        }
    }

    /**
     * Stops the game loop.
     */
    stop(): void {
        this.isRunning = false;
    }

    /**
     * Cleans up resources and disconnects the WebSocket client.
     */
    dispose(): void {
        this.stop();
        this.webSocketClient.disconnect();
        this.inputManager.dispose();
    }
}