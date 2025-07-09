declare var BABYLON: any;

import { WebSocketClient } from './WebSocketClient.js';
import { InputManager } from './InputManager.js';
import { GUIManager } from './GuiManager.js';
import { GameObjects } from '../engine/sceneBuilder.js';
import { GAME_CONFIG } from '../shared/gameConfig.js';
import { Direction, GameMode} from '../shared/constants.js';
import { GameStateData, PlayerInfo } from '../shared/types.js';

/**
 * Manages the networked game logic, including WebSocket communication,
 * input handling, and game state updates.
 */
export class NetworkGameManager {
    private scene: any;
    private gameObjects: GameObjects;
    private inputManager: InputManager;
    private guiManager: GUIManager;
    private webSocketClient: WebSocketClient;
    private isRunning = false;
    private playerSide = 0;

    /**
     * Initializes the NetworkGameManager with the required dependencies.
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
            // Handle WebSocket connection event
        });

        this.webSocketClient.onError((error: string) => {
            console.error('WebSocket error:', error);
        });
    }

    /**
     * Updates the positions of game objects based on the received game state.
     * @param state - The current game state data.
     */
    private updateGameObjects(state: GameStateData): void {
        if (this.gameObjects.players.left) {
            console.log(`Left paddle: ${state.paddleLeft.x} -> ${this.gameObjects.players.left.position.x}`);
            this.gameObjects.players.left.position.x = state.paddleLeft.x;
        }

        if (this.gameObjects.players.right) {
            console.log(`Right paddle: ${state.paddleRight.x} -> ${this.gameObjects.players.right.position.x}`);
            this.gameObjects.players.right.position.x = state.paddleRight.x;
        }

        if (this.gameObjects.ball) {
            this.gameObjects.ball.position.x = state.ball.x;
            this.gameObjects.ball.position.z = state.ball.z;
        }

        if (this.guiManager) {
            //TODO add results or other stuf
        }
    }

    private getPlayerInfoFromUI(gameMode: GameMode): PlayerInfo[] {
        //TODO is only for testing
        switch (gameMode) {
            case GameMode.SINGLE_PLAYER: {
                const soloInput = document.getElementById('player1-name') as HTMLInputElement;
                const name = soloInput?.value.trim() || 'Player 1';
                return [{
                    id: name,    // For now, id = name
                    name: name                    
                }];
            }
        
            case GameMode.TWO_PLAYER_LOCAL: {
                const localInput1 = document.getElementById('player1-name-local') as HTMLInputElement;
                const localInput2 = document.getElementById('player2-name-local') as HTMLInputElement;
                const name1 = localInput1?.value.trim() || 'Player 1';
                const name2 = localInput2?.value.trim() || 'Player 2';
                return [
                    { id: name1, name: name1 },
                    { id: name2, name: name2 }
                ];
            }

            case GameMode.TWO_PLAYER_REMOTE: {
                const onlineInput = document.getElementById('player1-name-online') as HTMLInputElement;
                const name1 = onlineInput?.value.trim() || 'Player 1';
                return [{
                    id: name1,    // For now, id = name
                    name: name1
                }];
            }
        
            default: {
                return [{
                    id: 'Player 1',
                    name: 'Player 1'
                }];
            }
        }
    }

    /**
     * Starts a single-player game mode.
     */
    startSinglePlayer(): void {
        const players = this.getPlayerInfoFromUI(GameMode.SINGLE_PLAYER);

        this.inputManager.configureInput(GameMode.SINGLE_PLAYER, 0);
        if (this.webSocketClient.isConnected()) {
            this.webSocketClient.joinGame(GameMode.SINGLE_PLAYER, players);
            this.playerSide = 0;
            this.start();
        } else {
            this.webSocketClient.onConnection(() => {
                this.webSocketClient.joinGame(GameMode.SINGLE_PLAYER, players);
                this.start();
            });
        }
    }

    /**
     * Starts a two-player local game mode.
     */
    startTwoPlayerLocal(): void {
        const players = this.getPlayerInfoFromUI(GameMode.TWO_PLAYER_LOCAL);
        this.inputManager.configureInput(GameMode.TWO_PLAYER_LOCAL, 0);
        if (this.webSocketClient.isConnected()) {
            this.webSocketClient.joinGame(GameMode.TWO_PLAYER_LOCAL, players);
            this.start();
        } else {
            this.webSocketClient.onConnection(() => {
                this.webSocketClient.joinGame(GameMode.TWO_PLAYER_LOCAL, players);
                this.start();
            });
        }
    }

    /**
     * Starts the game loop and sets up input handling and rendering updates.
     */
    start(): void {
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
                this.update3DCamere();
        });
    }

    /**
     * Updates the 3D camera targets to follow the players.
     */
    private update3DCamere(): void {
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