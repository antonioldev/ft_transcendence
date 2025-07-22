declare var BABYLON: typeof import('@babylonjs/core') & {
    GUI: typeof import('@babylonjs/gui');
}; //declare var BABYLON: any;

import { GameConfig } from './GameConfig.js';
import { buildScene } from './sceneBuilder.js';
import { InputHandler } from './InputHandler.js';
import { webSocketClient } from '../core/WebSocketClient.js';
import { GameStateData, GameObjects } from '../shared/types.js';
import { GAME_CONFIG } from '../shared/gameConfig.js';
import { appStateManager } from '../core/AppStateManager.js';
import { WebSocketEvent } from '../shared/constants.js';
import { EL } from '../ui/elements.js';

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
    private isPausedByServer: boolean = false;
    private gameLoopObserver: any = null;
    
    private lastFrameTime: number = 0;
    private fpsLimit: number = 60;

    constructor(private config: GameConfig) {
        const element = document.getElementById(config.canvasId);
        
        if (element instanceof HTMLCanvasElement) {
            this.canvas = element;
            const gl = this.canvas.getContext('webgl');
            
            if (gl) {
                const renderer = gl.getParameter(gl.RENDERER);
                console.log('WebGL Renderer:', renderer); // TODO remove some warning
            }
        } else 
            throw new Error(`Canvas element not found or is not a canvas: ${config.canvasId}`);
        
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
        
        // BABYLON.SceneLoader.ShowLoadingScreen = true;
        BABYLON.SceneLoader.ShowLoadingScreen = false;
        
        this.updateLoadingProgress(0);
        this.setLoadingScreenVisible(true);
        try {
            console.log('Initializing game...');

            this.engine = await this.initializeBabylonEngine();
            if (!this.engine) throw new Error('Engine not created');
            // this.engine.displayLoadingUI()
            this.scene = await this.createScene()
            if (!this.scene) throw new Error('Scene not created');
            
            // Build game objects
            this.gameObjects = await buildScene(this.scene, this.engine, this.config.viewMode, this.updateLoadingProgress.bind(this));
            if (!this.gameObjects) throw new Error('Game objects not created');
            // Build game scene in background
            // await this.createGameScene();
            this.createGUI(); // Create FPS GUI on engine
            this.startRenderLoop();
            this.setupResizeHandler();

            // Create input handler for game scene
            this.inputHandler = new InputHandler(this.config.gameMode, this.config.controls, this.scene);
            
            this.inputHandler.setGameObjects(this.gameObjects);

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
    private async initializeBabylonEngine(): Promise<any> {
        const engine = new BABYLON.Engine(this.canvas, true, { 
            preserveDrawingBuffer: true, 
            stencil: true, 
            disableWebGL2Support: false,
            antialias: false,
            powerPreference: "high-performance"
        });
        return engine;
    }

    // Create scene based on view mode
    private async  createScene(): Promise<any> {
        const scene = new BABYLON.Scene(this.engine);
        scene.createDefaultEnvironment({ createGround: false, createSkybox: false });
        return scene;
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
        if (!this.inputHandler)
            throw new Error('Components not initialized');

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

    async connect(): Promise<void> {
        console.log('Connecting to server...');
        // Make this return a Promise that resolves when connected
        webSocketClient.joinGame(this.config.gameMode, this.config.players)
        console.log('Connected to server');
    }

    // ========================================
    // GAME CONTROL
    // ========================================

    start(): void {
        if (!this.isInitialized || this.isRunning || this.isDisposed) return;

        try {
            console.log('Starting game...');

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
        this.lastFrameTime = performance.now();

        this.engine.runRenderLoop(() => {
            if (!this.isRenderingActive || this.isDisposed) return;

            const currentTime = performance.now();
            const deltaTime = currentTime - this.lastFrameTime;
            if (deltaTime < (1000 / this.fpsLimit)) return;

            try {
                if (this.scene && this.scene.activeCamera)
                    this.scene.render();

                // Update FPS
                if (this.fpsText && this.engine)
                    this.fpsText.text = "FPS: " + Math.round(1000 / deltaTime);
                    // this.fpsText.text = "FPS: " + this.engine.getFps().toFixed(0);

                this.lastFrameTime = currentTime;
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
        // if (this.gameLoopObserver || !this.scene) return;

        // this.gameLoopObserver = this.scene.onBeforeRenderObservable.add(() => {
        //     if (!this.isRunning || this.isDisposed) return;

        //     try {
        //         // Update input
        //         if (this.inputHandler)
        //             this.inputHandler.updateInput();

        //         // Update 3D cameras if needed
        //         const cameras = this.gameObjects?.cameras;
        //         if (cameras && cameras.length > 1)
        //             this.update3DCameras();

        //     } catch (error) {
        //         console.error('Error in game loop:', error);
        //     }
        // });

        this.gameLoopObserver = setInterval(() => {
            if (!this.isRunning || this.isDisposed) return;
            try {
                this.setLoadingScreenVisible(false);
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
        // if (this.gameLoopObserver && this.scene?.onBeforeRenderObservable) {
        //     this.scene.onBeforeRenderObservable.remove(this.gameLoopObserver);
        //     this.gameLoopObserver = null;
        // }
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

            this.setLoadingScreenVisible(false);
            this.updateLoadingProgress(0);

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


    private updateLoadingProgress(progress: number): void{
        const progressBar = document.getElementById(EL.GAME.PROGRESS_FILL);
        if (progressBar)
            progressBar.style.width = progress + '%';
        const progressText = document.getElementById(EL.GAME.PROGRESS_TEXT);
        if (progressText)
            progressText.textContent = progress + '%';
    }

    setLoadingScreenVisible(visible: boolean): void {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = visible ? 'flex' : 'none';
        }
    }

}

BABYLON.DefaultLoadingScreen.prototype.displayLoadingUI = function () {
    if ((this as any)._isLoading)
        return;

    (this as any)._isLoading = true;
};

BABYLON.DefaultLoadingScreen.prototype.hideLoadingUI = function () {
    const loading = document.getElementById(EL.GAME.LOADING_SCREEN);
    if (loading)
        loading.style.display = 'none';
    (this as any)._isLoading = false;
    
};
