declare var BABYLON: any;

import { GameConfig } from './GameConfig.js';
import { buildScene } from './sceneBuilder.js';
import { InputHandler } from './InputHandler.js';
import { webSocketClient } from '../core/WebSocketClient.js';
import { GameStateData, GameObjects } from '../shared/types.js';
import { GAME_CONFIG } from '../shared/gameConfig.js';
import { appStateManager } from '../core/AppStateManager.js';
import { WebSocketEvent } from '../shared/constants.js';

/**
 * Main Game class that handles everything for running one game instance.
 * 
 * Merged from: Game + BabylonScene + GameRenderer + GUIManager
 * 
 * Responsibilities:
 * - Babylon.js engine/scene creation and management
 * - Render loop control
 * - Game object updates from network state
 * - FPS display
 * - Input and network coordination
 * - Complete game session lifecycle
 */
export class Game {
    private engine: any = null;
    private scene: any = null;
    private canvas: HTMLCanvasElement | null = null;
    private gameObjects: GameObjects | null = null;
    private inputHandler: InputHandler | null = null;
    private isRenderingActive: boolean = false;
    private resizeHandler: (() => void) | null = null;
    private advancedTexture: any = null;
    private fpsText: any = null;
    private isInitialized: boolean = false;
    private isRunning: boolean = false;
    private isDisposed: boolean = false;
    private gameLoopObserver: any = null;
    private isPausedByServer: boolean = false;

    constructor(private config: GameConfig) {
        this.canvas = document.getElementById(config.canvasId) as HTMLCanvasElement;
        if (!this.canvas) {
            throw new Error(`Canvas element not found: ${config.canvasId}`);
        }
        console.log('Game created with config:', {
            viewMode: config.viewMode,
            gameMode: config.gameMode,
            canvasId: config.canvasId,
            players: config.players
        });
    }

    // ========================================
    // INITIALIZATION
    // ========================================

    async initialize(): Promise<void> {
        if (this.isInitialized || this.isDisposed) return;

        try {
            console.log('Initializing game...');

            // Create Babylon.js engine and scene
            await this.initializeBabylonEngine();
            this.createScene();
            this.setupResizeHandler();

            // Create GUI
            this.createGUI();

            // Create input handler
            this.inputHandler = new InputHandler(this.config.gameMode, this.config.controls, this.scene);
            if (!this.gameObjects) throw new Error('Game objects not created');
            this.inputHandler.setGameObjects(this.gameObjects);

            // Connect components
            this.connectComponents();

            this.isInitialized = true;
            console.log('Game initialized successfully');

        } catch (error) {
            console.error('Error initializing game:', error);
            await this.dispose();
            throw error;
        }
    }

    // Initialize Babylon.js engine
    private async initializeBabylonEngine(): Promise<void> {
        this.engine = new BABYLON.Engine(this.canvas, true, { 
            preserveDrawingBuffer: true, 
            stencil: true, 
            disableWebGL2Support: false,
            antialias: false,
            powerPreference: "high-performance"
        });
    }

    // Create scene based on view mode
    private createScene(): void {
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.createDefaultEnvironment({ // TODO
    createGround: false, // Don't create another ground
    createSkybox: false  // Optional: add skybox for better lighting
});
        this.gameObjects = buildScene(this.scene, this.engine, this.config.viewMode)
    }

    // Create GUI elements
    private createGUI(): void {
        this.advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        
        // Create FPS display
        this.fpsText = new BABYLON.GUI.TextBlock();
        this.fpsText.text = "FPS: 0";
        this.fpsText.color = "white";
        this.fpsText.fontSize = 16;
        this.fpsText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.fpsText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.fpsText.top = "1px";
        this.fpsText.left = "-20px";
        this.fpsText.width = "200px";
        this.fpsText.height = "40px";
        
        this.advancedTexture.addControl(this.fpsText);
    }

    // Setup window resize handler
    private setupResizeHandler(): void {
        this.resizeHandler = () => {
            if (!this.isDisposed && this.engine) {
                this.engine.resize();
            }
        };
        window.addEventListener("resize", this.resizeHandler);
    }

    // Connect all components together
    private connectComponents(): void {
        if (!this.inputHandler) {
            throw new Error('Components not initialized');
        }

        this.inputHandler.onInput((input) => {
            webSocketClient.sendPlayerInput(input.side, input.direction);
        });
        webSocketClient.registerCallback(WebSocketEvent.GAME_STATE, (state: GameStateData) => { this.updateGameObjects(state); });
        webSocketClient.registerCallback(WebSocketEvent.CONNECTION, () => { console.log('Connected...'); });
        webSocketClient.registerCallback(WebSocketEvent.ERROR, (error: string) => { console.error('Network error:', error); });
        webSocketClient.registerCallback(WebSocketEvent.GAME_PAUSED, () => { this.onServerPausedGame(); });
        webSocketClient.registerCallback(WebSocketEvent.GAME_RESUMED, () => { this.onServerResumedGame(); });
        webSocketClient.registerCallback(WebSocketEvent.GAME_ENDED, () => { this.onServerEndedGame(); });
    }

    // ========================================
    // GAME CONTROL
    // ========================================

    start(): void {
        if (!this.isInitialized || this.isRunning || this.isDisposed) return;

        try {
            console.log('Starting game...');

            // Start network connection
            webSocketClient.joinGame(this.config.gameMode, this.config.players)

            // Start render loop
            this.startRenderLoop();

            // Start game loop
            this.startGameLoop();

            this.isRunning = true;
            console.log('Game started successfully');

        } catch (error) {
            console.error('Error starting game:', error);
        }
    }

    pause(): void {
        if (this.isDisposed || this.isPausedByServer) return;
        console.log('Game: Requesting pause from server...');
        webSocketClient.sendPauseRequest();
    }

    resume(): void {
        if (this.isDisposed || !this.isPausedByServer) return;
        console.log('Game: Requesting resume from server...');
        webSocketClient.sendResumeRequest();
    }

    stop(): void {
        this.isRunning = false;
        this.isPausedByServer = false;
        this.stopRenderLoop();
        this.stopGameLoop();
        console.log('Game stopped');
    }

    // Handle server confirming game is paused
    private onServerPausedGame(): void {
        if (this.isDisposed || !this.isRunning) return;

        console.log('Game: Server confirmed game is paused');
        
        this.isPausedByServer = true;
        this.isRunning = false;
        appStateManager.onServerConfirmedPause();
        
        this.stopRenderLoop();
        this.stopGameLoop();
        
        console.log('Game paused by server');
    }

    // Handle server confirming game is resumed
    private onServerResumedGame(): void {
        if (this.isDisposed || this.isRunning || !this.isPausedByServer) return;

        console.log('Game: Server confirmed game is resumed');
        
        this.isPausedByServer = false;
        this.isRunning = true;
        appStateManager.onServerConfirmedResume();

        this.startRenderLoop();
        this.startGameLoop();
        
        console.log('Game resumed by server');
    }

    // Handle server ending the game
    private onServerEndedGame(): void {
        if (this.isDisposed) return;

        console.log('Game: Server ended the game');
        
        // Stop everything
        this.isRunning = false;
        this.isPausedByServer = false;
        this.stopRenderLoop();
        this.stopGameLoop();

        appStateManager.exitToMenu();
        
        console.log('Game ended by server');
    }


    // ========================================
    // RENDER LOOP - These functions are in charge of the frame rendering
    // ========================================

    private startRenderLoop(): void {
        if (this.isDisposed || this.isRenderingActive || !this.engine || !this.scene) return;

        this.isRenderingActive = true;

        this.engine.runRenderLoop(() => {
            if (!this.isRenderingActive || this.isDisposed) return;

            try {
                if (this.scene.activeCamera) {
                    this.scene.render();
                }

                // Update FPS
                if (this.fpsText && this.engine) {
                    this.fpsText.text = "FPS: " + this.engine.getFps().toFixed(0);
                }
            } catch (error) {
                console.error('Error in render loop:', error);
            }
        });

        console.log('Render loop started');
    }

    private stopRenderLoop(): void {
        if (!this.isRenderingActive) return;
        this.isRenderingActive = false;
        if (this.engine) {
            this.engine.stopRenderLoop();
        }
        console.log('Render loop stopped');
    }

    // ========================================
    // GAME LOOP - These are in charge of the logic check
    // ========================================

    private startGameLoop(): void {
        if (this.gameLoopObserver) return;
        this.gameLoopObserver = setInterval(() => {
            if (!this.isRunning || this.isDisposed) return;
            try {
                // Update input
                if (this.inputHandler)
                    this.inputHandler.updateInput();
                // Update 3D cameras if needed
                const cameras = this.gameObjects?.cameras;
                if (cameras && cameras.length > 1)
                    this.update3DCameras();
            } catch (error) {
                console.error('Error in game loop:', error);
            }
        }, 16);
    }
    private stopGameLoop(): void {
        if (this.gameLoopObserver) {
            clearInterval(this.gameLoopObserver);
            this.gameLoopObserver = null;
        }
    }

    // ========================================
    // GAME STATE UPDATES
    // ========================================

    // Update game object positions from server state
    private updateGameObjects(state: GameStateData): void {
        if (this.isDisposed || !this.gameObjects) return;

        try {
            // Update paddle positions
            if (this.gameObjects.players.left) {
                this.gameObjects.players.left.position.x = state.paddleLeft.x;
            }

            if (this.gameObjects.players.right) {
                this.gameObjects.players.right.position.x = state.paddleRight.x;
            }

            // Update ball position
            if (this.gameObjects.ball) {
                this.gameObjects.ball.position.x = state.ball.x;
                this.gameObjects.ball.position.z = state.ball.z;
            }
        } catch (error) {
            console.error('Error updating game objects:', error);
        }
    }

    // Update 3D camera targets to follow players
    private update3DCameras(): void {
        if (this.isDisposed || !this.gameObjects?.cameras || this.gameObjects.cameras.length < 2) return;

        try {
            const [camera1, camera2] = this.gameObjects.cameras;
            
            if (camera1 && camera2 && this.gameObjects.players.left && this.gameObjects.players.right) {
                const targetLeft = this.gameObjects.players.left.position.clone();
                const targetRight = this.gameObjects.players.right.position.clone();

                if (camera1.getTarget && camera2.getTarget) {
                    camera1.setTarget(BABYLON.Vector3.Lerp(camera1.getTarget(), targetLeft, GAME_CONFIG.followSpeed));
                    camera2.setTarget(BABYLON.Vector3.Lerp(camera2.getTarget(), targetRight, GAME_CONFIG.followSpeed));
                }
            }
        } catch (error) {
            console.error('Error updating 3D cameras:', error);
        }
    }

    // ========================================
    // CLEANUP
    // ========================================

    async dispose(): Promise<void> {
        if (this.isDisposed) return;

        console.log('Disposing game...');
        this.isDisposed = true;
        this.isRunning = false;
        this.isPausedByServer = false;

        try {
            // Stop loops first
            this.stopGameLoop();
            this.stopRenderLoop();

            // Wait a frame to ensure loops stop
            await new Promise(resolve => setTimeout(resolve, 16));

            if (this.inputHandler) {
                await this.inputHandler.dispose();
                this.inputHandler = null;
            }

            // Remove resize handler
            if (this.resizeHandler) {
                window.removeEventListener("resize", this.resizeHandler);
                this.resizeHandler = null;
            }

            // Dispose GUI
            if (this.advancedTexture) {
                this.advancedTexture.dispose();
                this.advancedTexture = null;
            }
            this.fpsText = null;

            // Clear game objects reference
            this.gameObjects = null;

            // Dispose scene
            if (this.scene) {
                this.scene.onBeforeRenderObservable?.clear();
                this.scene.onAfterRenderObservable?.clear();
                this.scene.dispose();
                this.scene = null;
            }

            // Dispose engine
            if (this.engine) {
                this.engine.dispose();
                this.engine = null;
            }

            // Clear canvas reference
            this.canvas = null;

            // Reset flags
            this.isInitialized = false;

            console.log('Game disposed successfully');

        } catch (error) {
            console.error('Error disposing game:', error);
        }
    }
}