declare var BABYLON: any;

import { WebSocketClient } from './WebSocketClient.js';
import { InputManager } from './InputManager.js';
import { GUIManager } from './GuiManager.js';
import { GameObjects } from '../engine/sceneBuilder.js';
import { GAME_CONFIG } from '../shared/gameConfig.js';
import { Direction, GameMode} from '../shared/constants.js';
import { GameStateData } from '../shared/types.js';

export class NetworkGameManager {
    private scene: any;
    private gameObjects: GameObjects;
    private inputManager: InputManager;
    private guiManager: GUIManager;
    private webSocketClient: WebSocketClient;
    private isRunning = false;
    private playerSide = 0;

    constructor(scene: any, gameObjects: GameObjects, inputManager: InputManager, guiManager: GUIManager) {
        this.scene = scene;
        this.gameObjects = gameObjects;
        this.inputManager = inputManager;
        this.guiManager = guiManager;
        this.webSocketClient = new WebSocketClient('ws://localhost:3000');
        this.setupWebSocketCallbacks();
    }

    private setupWebSocketCallbacks(): void {
        this.webSocketClient.onGameState((state: GameStateData) => {
            this.updateGameObjects(state);
        });

        this.webSocketClient.onConnection(() => {
        });

        this.webSocketClient.onError((error: string) => {
            console.error('WebSocket error:', error);
        });
    }

    private updateGameObjects(state: GameStateData): void {
        if (this.gameObjects.players.left) {
        this.gameObjects.players.left.position.x = state.paddleLeft.x;
    }
    
    if (this.gameObjects.ball) {
        this.gameObjects.ball.position.x = state.ball.x;
        this.gameObjects.ball.position.z = state.ball.z;
    }

        if (this.guiManager) {
            //TODO add results or other stuf
        }
    }

    startSinglePlayer(): void {
        if (this.webSocketClient.isConnected()) {
            this.webSocketClient.joinGame(GameMode.SINGLE_PLAYER);
            this.playerSide = 0;
            this.start()
        } else {
            this.webSocketClient.onConnection(() => {
                this.webSocketClient.joinGame(GameMode.SINGLE_PLAYER);
                this.start();
            });
        }
    }

    startTwoPlayerLocal(): void {
        if (this.webSocketClient.isConnected()) {
            this.webSocketClient.joinGame(GameMode.TWO_PLAYER_LOCAL);
            this.start();
        } else {
            this.webSocketClient.onConnection(() => {
                this.webSocketClient.joinGame(GameMode.TWO_PLAYER_LOCAL);
                this.start();
            });
        }
    }

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

    private update3DCamere(): void {
        const [camera1, camera2] = this.gameObjects.cameras;
    
    if (camera1 && camera2) {
        const targetLeft = this.inputManager.getFollowTarget(this.gameObjects.players.left);
        const targetRight = this.inputManager.getFollowTarget(this.gameObjects.players.right);

        camera1.setTarget(BABYLON.Vector3.Lerp(camera1.getTarget(), targetLeft, GAME_CONFIG.followSpeed));
        camera2.setTarget(BABYLON.Vector3.Lerp(camera2.getTarget(), targetRight, GAME_CONFIG.followSpeed));
    }
    }

    stop(): void {
        this.isRunning = false;
    }

    dispose(): void {
        this.stop();
        this.webSocketClient.disconnect();
        this.inputManager.dispose();
    }
}