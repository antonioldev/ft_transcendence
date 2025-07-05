declare var BABYLON: any;

import { WebSocketClient, GameStateData } from './WebSocketClient.js';
import { InputManager } from './InputManager.js';
import { GUIManager } from './GuiManager.js';
import { GameObjects } from './sceneBuilder.js';
import { GAME_CONFIG } from './gameConfig.js';

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
            console.log('🎮 Ready to join game');
        });

        this.webSocketClient.onError((error: string) => {
            console.error('🚨 Game error:', error);
        });
    }

    private updateGameObjects(state: GameStateData): void {
        if (this.gameObjects.players.left)
            this.gameObjects.players.left.position.x = state.paddleLeft.y;

        if (this.gameObjects.players.right)
            this.gameObjects.players.right.position.x = state.paddleRight.y;

        if (this.gameObjects.ball) {
            this.gameObjects.ball.position.x = state.ball.x;
            this.gameObjects.ball.position.z = state.ball.y;
        }

        if (this.guiManager) {
            // You can add score display here later //TODO
        }
    }

    startSinglePlayer(): void {
        if (this.webSocketClient.isConnected()) {
            this.webSocketClient.joinGame('single_player');
            this.playerSide = 0;
            this.start()
        } else {
            console.error('❌ Not connected to server');
        }
    }

    startTwoPlayerLocal(): void {
        if (this.webSocketClient.isConnected()) {
            this.webSocketClient.joinGame('two_player_local');
            this.start();
        } else {
            console.error('❌ Not connected to server');
        }
    }

    start(): void {
        if (this.isRunning)
            return ;
        this.isRunning = true;

        this.inputManager.setNetworkCallback((side: number, direction: 'left' | 'right' | 'stop') => {
            this.webSocketClient.sendPlayerInput(side, direction);
        });
        this.scene.registerBeforeRender(() =>{
            if (!this.isRunning)
                return;
            this.handleInput();

            if (this.guiManager)
                this.guiManager.updateFPS();

            if (this.gameObjects.cameras.length > 1)
                this.update3DCamere();
        });
    }

    private handleInput(): void {
        this.inputManager.updateInput();
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