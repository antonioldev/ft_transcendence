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
import { GameMode, WebSocketEvent } from '../shared/constants.js';
import { EL } from '../ui/elements.js';
import { ViewMode } from '../shared/constants.js';
import { requireElementById } from '../ui/elements.js';
import { Logger } from '../core/LogManager.js';

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
    private score1Text: any = null;
    private score2Text: any = null;
    
    private lastFrameTime: number = 0;
    private fpsLimit: number = 60;

    constructor(private config: GameConfig) {
        const element = document.getElementById(config.canvasId);
        
        if (element instanceof HTMLCanvasElement) {
            this.canvas = element;
            const gl = this.canvas.getContext('webgl') || this.canvas.getContext('webgl2');
            
            if (gl) {
                gl.getExtension('WEBGL_color_buffer_float');
                gl.getExtension('EXT_color_buffer_half_float');
            }
            this.canvas.focus();
        } else 
            throw new Error(`Canvas element not found or is not a canvas: ${config.canvasId}`);
        
        Logger.info('Game created with config', 'Game', {
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
            Logger.info('Initializing game...', 'Game');

            this.engine = await this.initializeBabylonEngine();
            if (!this.engine) Logger.errorAndThrow('Engine not created', 'Game');
            this.scene = await this.createScene();
            if (!this.scene) Logger.errorAndThrow('Scene not created', 'Game');

            // Build game objects
            this.gameObjects = await buildScene(this.scene, this.engine, this.config.viewMode, this.updateLoadingProgress.bind(this));
            if (!this.gameObjects) Logger.errorAndThrow('Game objects not created', 'Game');
            this.createGUI();
            this.startRenderLoop();
            this.setupResizeHandler();

            this.inputHandler = new InputHandler(this.config.gameMode, this.config.controls, this.scene);
            this.inputHandler.setGameObjects(this.gameObjects);

            this.connectComponents();
            this.isInitialized = true;
            Logger.info('Game initialized successfully', 'Game');

        } catch (error) {
            Logger.error('Error initializing game', 'Game', error);
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
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
        return scene;
    }

    // Create GUI elements
    private createGUI(): void {
        // this.advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this.advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this.scene);
        this.advancedTexture.layer.layerMask = 0x20000000;

        
        if (this.config.viewMode === ViewMode.MODE_3D && this.config.gameMode === GameMode.TWO_PLAYER_LOCAL) {
            const dividerLine = new BABYLON.GUI.Rectangle();
            dividerLine.widthInPixels = 5;
            dividerLine.height = "100%";
            dividerLine.color = "black";
            dividerLine.background = "black";
            dividerLine.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
            dividerLine.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
            
            this.advancedTexture.addControl(dividerLine);
        }

        // Create FPS display
        this.fpsText = new BABYLON.GUI.TextBlock();
        this.fpsText.text = "FPS: 0";
        this.fpsText.color = "white";
        this.fpsText.fontSize = 16;
        this.fpsText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.fpsText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.fpsText.top = "1px";
        this.fpsText.left = "-20px";
        this.fpsText.width = "200px";
        this.fpsText.height = "40px";
        
        this.advancedTexture.addControl(this.fpsText);

        // Create score container
        const scoreContainer = new BABYLON.GUI.StackPanel();
        scoreContainer.isVertical = true;
        scoreContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        scoreContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        scoreContainer.top = "-30px";
        scoreContainer.height = "80px";

        // Player names row
        const playersRow = new BABYLON.GUI.StackPanel();
        playersRow.isVertical = false;
        playersRow.height = "30px";

        const player1Label = new BABYLON.GUI.TextBlock();
        player1Label.text = "Player 1";
        player1Label.color = "white";
        player1Label.fontSize = 18;
        player1Label.width = "120px";

        const player2Label = new BABYLON.GUI.TextBlock();
        player2Label.text = "Player 2";
        player2Label.color = "white";
        player2Label.fontSize = 18;
        player2Label.width = "120px";

        playersRow.addControl(player1Label);
        playersRow.addControl(player2Label);

        // Scores row
        const scoresRow = new BABYLON.GUI.StackPanel();
        scoresRow.isVertical = false;
        scoresRow.height = "40px";

        this.score1Text = new BABYLON.GUI.TextBlock();
        this.score1Text.text = "0";
        this.score1Text.color = "white";
        this.score1Text.fontSize = 24;
        this.score1Text.width = "120px";

        this.score2Text = new BABYLON.GUI.TextBlock();
        this.score2Text.text = "0";
        this.score2Text.color = "white";
        this.score2Text.fontSize = 24;
        this.score2Text.width = "120px";

        scoresRow.addControl(this.score1Text);
        scoresRow.addControl(this.score2Text);

        scoreContainer.addControl(playersRow);
        scoreContainer.addControl(scoresRow);

        this.advancedTexture.addControl(scoreContainer);
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
        webSocketClient.registerCallback(WebSocketEvent.CONNECTION, () => { Logger.info('Connected', 'Game'); });
        webSocketClient.registerCallback(WebSocketEvent.ERROR, (error: string) => { Logger.error('Network error', 'Game', error); });
        webSocketClient.registerCallback(WebSocketEvent.GAME_PAUSED, () => { this.onServerPausedGame(); });
        webSocketClient.registerCallback(WebSocketEvent.GAME_RESUMED, () => { this.onServerResumedGame(); });
        webSocketClient.registerCallback(WebSocketEvent.GAME_ENDED, () => { this.onServerEndedGame(); });
    }

    async connect(): Promise<void> {
        Logger.info('Connecting to server...', 'Game');
        webSocketClient.joinGame(this.config.gameMode, this.config.players);
        Logger.info('Connected to server', 'Game');
    }

    // ========================================
    // GAME CONTROL
    // ========================================

    start(): void {
        if (!this.isInitialized || this.isRunning || this.isDisposed) return;

        try {
            Logger.info('Starting game...', 'Game');

            // Start game loop
            this.startGameLoop();

            this.isRunning = true;
            Logger.info('Game started successfully', 'Game');

        } catch (error) {
            Logger.error('Error starting game', 'Game', error);
        }
    }

    pause(): void {
        if (this.isDisposed || this.isPausedByServer) return;
        Logger.info('Requesting pause from server...', 'Game');
        webSocketClient.sendPauseRequest();
    }

    resume(): void {
        if (this.isDisposed || !this.isPausedByServer) return;
        Logger.info('Requesting resume from server...', 'Game');
        webSocketClient.sendResumeRequest();
    }

    stop(): void {
        this.isRunning = false;
        this.isPausedByServer = false;
        this.stopRenderLoop();
        this.stopGameLoop();
        Logger.info('Game stopped', 'Game');
    }

    // Handle server confirming game is paused
    private onServerPausedGame(): void {
        if (this.isDisposed || !this.isRunning) return;

        Logger.info('Server confirmed game is paused', 'Game');
        
        this.isPausedByServer = true;
        this.isRunning = false;
        appStateManager.onServerConfirmedPause();
        
        this.stopRenderLoop();
        this.stopGameLoop();
        
        Logger.info('Game paused by server', 'Game');
    }

    // Handle server confirming game is resumed
    private onServerResumedGame(): void {
        if (this.isDisposed || this.isRunning || !this.isPausedByServer) return;

        Logger.info('Server confirmed game is resumed', 'Game');
        
        this.isPausedByServer = false;
        this.isRunning = true;
        appStateManager.onServerConfirmedResume();

        this.startRenderLoop();
        this.startGameLoop();
        
        Logger.info('Game resumed by server', 'Game');
    }

    // Handle server ending the game
    private onServerEndedGame(): void {
        if (this.isDisposed) return;

        Logger.info('Server ended the game', 'Game');
        
        // Stop everything
        this.isRunning = false;
        this.isPausedByServer = false;
        this.stopRenderLoop();
        this.stopGameLoop();

        appStateManager.exitToMenu();
        
        Logger.info('Game ended by server', 'Game');
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
                Logger.error('Error in render loop:', 'Game');
            }
        });

        Logger.info('Render loop started', 'Game');
    }

    private stopRenderLoop(): void {
        if (!this.isRenderingActive) return;
        this.isRenderingActive = false;
        if (this.engine) {
            this.engine.stopRenderLoop();
        }
        Logger.info('Render loop stopped', 'Game');
    }

    // ========================================
    // GAME LOOP - These are in charge of the logic check
    // ========================================

    private startGameLoop(): void {
        if (this.gameLoopObserver) return;
        this.gameLoopObserver = setInterval(() => {
            if (!this.isRunning || this.isDisposed) return;
        try {
            this.setLoadingScreenVisible(false);
            // Update input
            if (this.inputHandler)
                this.inputHandler.updateInput();
            // Update 3D cameras if needed
            const cameras = this.gameObjects?.cameras;
            if (cameras && cameras.length > 2)
                this.update3DCameras();
        } catch (error) {
            Logger.error('Error in game loop', 'Game', error);
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
            if (this.gameObjects.players.left)
                this.gameObjects.players.left.position.x = state.paddleLeft.x;
            if (this.gameObjects.players.right)
                this.gameObjects.players.right.position.x = state.paddleRight.x;

            // Update ball position
            if (this.gameObjects.ball) {
                this.gameObjects.ball.position.x = state.ball.x;
                this.gameObjects.ball.position.z = state.ball.z;
            }

            // Update Score
            if (this.score1Text && this.score2Text) {
                this.score1Text.text = state.paddleLeft.score.toString();
                this.score2Text.text = state.paddleRight.score.toString();
            }
        } catch (error) {
            Logger.error('Error updating game objects', 'Game', error);
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
            Logger.error('Error updating 3D cameras', 'Game', error);
        }
    }

    // ========================================
    // CLEANUP
    // ========================================

    async dispose(): Promise<void> {
        if (this.isDisposed) return;

        Logger.info('Disposing game...', 'Game');
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
            this.score1Text = null;
            this.score2Text = null;

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

            Logger.info('Game disposed successfully', 'Game');

        } catch (error) {
            Logger.error('Error disposing game', 'Game', error);
        }
    }


    private updateLoadingProgress(progress: number): void{
        const progressBar = requireElementById(EL.GAME.PROGRESS_FILL);
        progressBar.style.width = progress + '%';
        const progressText = requireElementById(EL.GAME.PROGRESS_TEXT);
        progressText.textContent = progress + '%';
    }

    setLoadingScreenVisible(visible: boolean): void {
        const loadingScreen = requireElementById('loading-screen');
        loadingScreen.style.display = visible ? 'flex' : 'none';
    }

}

BABYLON.DefaultLoadingScreen.prototype.displayLoadingUI = function () {
    if ((this as any)._isLoading)
        return;

    (this as any)._isLoading = true;
};

BABYLON.DefaultLoadingScreen.prototype.hideLoadingUI = function () {
    const loading = requireElementById(EL.GAME.LOADING_SCREEN);
    loading.style.display = 'none';
    (this as any)._isLoading = false;
    
};
