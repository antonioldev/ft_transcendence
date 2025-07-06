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
        console.log('🔧 NetworkGameManager constructor called');
        this.scene = scene;
        this.gameObjects = gameObjects;
        this.inputManager = inputManager;
        this.guiManager = guiManager;
        console.log('📡 Creating WebSocket connection to ws://localhost:3000');
        this.webSocketClient = new WebSocketClient('ws://localhost:3000');
        this.setupWebSocketCallbacks();
        console.log('✅ NetworkGameManager initialized');
    }

    private setupWebSocketCallbacks(): void {
        console.log('🔗 Setting up WebSocket callbacks');
        
        this.webSocketClient.onGameState((state: GameStateData) => {
            console.log('📊 Game state received:', state);
            this.updateGameObjects(state);
        });

        this.webSocketClient.onConnection(() => {
            console.log('🎮 WebSocket connection established - Ready to join game');
        });

        this.webSocketClient.onError((error: string) => {
            console.error('🚨 WebSocket error:', error);
        });
    }

    private updateGameObjects(state: GameStateData): void {
        console.log('🎯 Updating game objects with state:', state);
        if (this.gameObjects.players.left) {
        console.log('👈 Left player before:', this.gameObjects.players.left.position);
        this.gameObjects.players.left.position.x = state.paddleLeft.x;
        console.log('👈 Left player after:', this.gameObjects.players.left.position);
    }
    
    if (this.gameObjects.ball) {
        console.log('⚽ Ball before:', this.gameObjects.ball.position);
        this.gameObjects.ball.position.x = state.ball.x;
        this.gameObjects.ball.position.z = state.ball.z;
        console.log('⚽ Ball after:', this.gameObjects.ball.position);
    }

        if (this.guiManager) {
            //TODO add results or other stuff
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
        console.log('🎮 startTwoPlayerLocal() called');
        console.log('📡 WebSocket connected?', this.webSocketClient.isConnected());
        
        if (this.webSocketClient.isConnected()) {
            console.log('✅ WebSocket is connected, joining two player local game...');
            this.webSocketClient.joinGame('two_player_local');
            this.start();
        } else {
            console.error('❌ Not connected to server');
            this.webSocketClient.onConnection(() => {
                console.log('🔄 Connection established, now joining game...');
                this.webSocketClient.joinGame('two_player_local');
                this.start();
            });
        }
    }

    start(): void {
        console.log("🚀 NetworkGameManager.start() called");
        if (this.isRunning) {
            console.log("⚠️ Game already running, skipping start");
            return;
        }
        this.isRunning = true;
        
        console.log("🎯 Setting up input callback");
        this.inputManager.setNetworkCallback((side: number, direction: 'left' | 'right' | 'stop') => {
            console.log(`🎮 Input: side=${side}, direction=${direction}`);
            this.webSocketClient.sendPlayerInput(side, direction);
        });
        
        console.log("🔄 Registering render loop");
        this.scene.registerBeforeRender(() => {
            if (!this.isRunning)
                return;
            this.handleInput();

            if (this.guiManager)
                this.guiManager.updateFPS();

            if (this.gameObjects.cameras.length > 1)
                this.update3DCamere();
        });
        
        console.log("✅ Game loop started successfully!");
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