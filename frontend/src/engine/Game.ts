declare var BABYLON: typeof import('@babylonjs/core') & {
    GUI: typeof import('@babylonjs/gui');
}; //declare var BABYLON: any;

import { GameConfig } from './GameConfig.js';
import { buildScene2D, buildScene3D } from './scene/sceneBuilder.js';
import { InputHandler } from './InputManager.js';
import { webSocketClient } from '../core/WebSocketClient.js';
import { GameStateData, GameObjects } from '../shared/types.js';
import { GAME_CONFIG } from '../shared/gameConfig.js';
import { appStateManager } from '../core/AppStateManager.js';
import { GameState, ViewMode, WebSocketEvent } from '../shared/constants.js';
import { Logger } from '../core/LogManager.js';
import { uiManager } from '../ui/UIManager.js';
import { GUIManager } from './GuiManager.js';
import { RenderManager } from './RenderManager.js';

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
    private static currentInstance: Game | null = null;
    private engine: any = null;
    private scene: any = null;
    private canvas: HTMLCanvasElement | null = null;
    private gameObjects: GameObjects | null = null;
    private inputHandler: InputHandler | null = null;
    private guiManager: GUIManager | null = null;
    private renderManager: RenderManager | null = null;
    private resizeHandler: (() => void) | null = null;
    private isInitialized: boolean = false;
    private isRunning: boolean = false;
    private isDisposed: boolean = false;
    private isPausedByServer: boolean = false;
    private countdownLoop: number | null = null;
    private gameLoopObserver: any = null;

    constructor(private config: GameConfig) {
        if (Game.currentInstance)
            Game.currentInstance.dispose();
        Game.currentInstance = this;

        try {
            this.guiManager = new GUIManager();
            this.renderManager = new RenderManager();
            
            const element = document.getElementById(config.canvasId);
            if (element instanceof HTMLCanvasElement) {
                this.canvas = element;
                const gl = this.canvas.getContext('webgl') || this.canvas.getContext('webgl2');
                
                if (gl) {
                    gl.getExtension('WEBGL_color_buffer_float');
                    gl.getExtension('EXT_color_buffer_half_float');
                }
                this.canvas.focus();
            }
        } catch (error) {
            Logger.errorAndThrow('Error creating game managers', 'Game', error);
        }

        Logger.info('Game created with config', 'Game', {
            viewMode: config.viewMode,
            gameMode: config.gameMode,
            canvasId: config.canvasId,
            players: config.players
        });
    }

    static getCurrentInstance(): Game | null {
        return Game.currentInstance;
    }

    // ========================================
    // INITIALIZATION
    // ========================================

    async initialize(): Promise<void> {
        if (this.isInitialized || this.isDisposed) return;
        
        // BABYLON.SceneLoader.ShowLoadingScreen = true;
        BABYLON.SceneLoader.ShowLoadingScreen = false;
        
        uiManager.updateLoadingProgress(0);
        uiManager.setLoadingScreenVisible(true);
        try {
            Logger.info('Initializing game...', 'Game');

            this.engine = await this.initializeBabylonEngine();
            if (!this.engine) Logger.errorAndThrow('Engine not created', 'Game');
            this.scene = await this.createScene();
            if (!this.scene) Logger.errorAndThrow('Scene not created', 'Game');

            // Build game objects
            if (this.config.viewMode === ViewMode.MODE_2D)
                this.gameObjects = await buildScene2D(this.scene, this.config.gameMode, this.config.viewMode, (progress: number) => uiManager.updateLoadingProgress(progress));
            else
                this.gameObjects = await buildScene3D(this.scene, this.config.gameMode, this.config.viewMode, (progress: number) => uiManager.updateLoadingProgress(progress));
            if (!this.gameObjects) Logger.errorAndThrow('Game objects not created', 'Game');
            this.guiManager?.createGUI(this.scene, this.config);

            if (this.guiManager)
                this.renderManager?.initialize(this.engine, this.scene, this.guiManager);
            this.renderManager?.startRendering();

            this.setupResizeHandler();

            this.inputHandler = new InputHandler(this.config.gameMode, this.config.controls, this.scene);
            this.inputHandler.setGameObjects(this.gameObjects);

            this.connectComponents();
            this.isInitialized = true;
            webSocketClient.sendPlayerReady();
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
        // webSocketClient.registerCallback(WebSocketEvent.ALL_READY, (countdown: number) => {this.handleCountdown(countdown); });
        webSocketClient.registerCallback(WebSocketEvent.ALL_READY, (message: any) => {
            this.handleCountdown(message.countdown, message.player1, message.player2); 
        });
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

    static pause(): void {
        const game = Game.currentInstance;
        if (!game || game.isDisposed || game.isPausedByServer) return;
        
        Logger.info('Requesting pause from server...', 'Game');
        webSocketClient.sendPauseRequest();
    }

    static resume(): void {
        const game = Game.currentInstance;
        if (!game || game.isDisposed || !game.isPausedByServer) return;
        
        Logger.info('Requesting resume from server...', 'Game');
        webSocketClient.sendResumeRequest();
    }

    static stop(): void {
        const game = Game.currentInstance;
        if (!game) return;
        
        game.isRunning = false;
        game.isPausedByServer = false;
        game.renderManager?.stopRendering();;
        game.stopGameLoop();
        Logger.info('Game stopped', 'Game');
    }

    static async disposeGame(): Promise<void> {
        const game = Game.currentInstance;
        if (!game) return;
        
        await game.dispose();
    }

    private handleCountdown(countdown: number, player1: string, player2: string): void {
        if (countdown === undefined || countdown === null)
            Logger.errorAndThrow('Server sent ALL_READY without countdown parameter', 'Game');
        if (player1 && player2 && this.guiManager)
        this.guiManager.updatePlayerNames(player1, player2);

        uiManager.setLoadingScreenVisible(false);
        if (countdown === 5)
            this.renderManager?.startCameraAnimation(this.gameObjects?.cameras, this.config.gameMode, this.config.viewMode);
        if (countdown > 0)
            this.guiManager?.showCountdown(countdown);
        else {
            this.renderManager?.stopCameraAnimation();
            this.guiManager?.hideCountdown();
            this.start();
        }
    }

    // Handle server confirming game is paused
    private onServerPausedGame(): void {
        if (this.isDisposed || !this.isRunning) return;

        Logger.info('Server confirmed game is paused', 'Game');
        
        this.isPausedByServer = true;
        this.isRunning = false;
        appStateManager.updateGamePauseStateTo(GameState.PAUSED);
        
        this.renderManager?.stopRendering();
        this.stopGameLoop();
        
        Logger.info('Game paused by server', 'Game');
    }

    // Handle server confirming game is resumed
    private onServerResumedGame(): void {
        if (this.isDisposed || this.isRunning || !this.isPausedByServer) return;

        Logger.info('Server confirmed game is resumed', 'Game');
        
        this.isPausedByServer = false;
        this.isRunning = true;
        appStateManager.updateGamePauseStateTo(GameState.PLAYING);

        this.renderManager?.startRendering();
        this.startGameLoop();
        
        Logger.info('Game resumed by server', 'Game');
    }

    // Handle server ending the game
    private onServerEndedGame(): void {
        if (this.isDisposed) return;

        Logger.info('Server ended the game', 'Game');

        this.renderManager?.stopRendering();
        this.stopGameLoop();
        Game.disposeGame();
        appStateManager.resetToMenu();

        Logger.info('Game ended by server', 'Game');
    }

    // ========================================
    // GAME LOOP - These are in charge of the logic check
    // ========================================

    private startGameLoop(): void {
        if (this.gameLoopObserver) return;
        this.gameLoopObserver = setInterval(() => {
            if (!this.isRunning || this.isDisposed) return;
        try {
            uiManager.setLoadingScreenVisible(false);
            // Update input
            if (this.inputHandler)
                this.inputHandler.updateInput();
            // Update 3D cameras if needed
            const cameras = this.gameObjects?.cameras;
            if (cameras && (this.config.viewMode === ViewMode.MODE_3D))
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
                this.gameObjects.ball.rotation.x += 0.1;
                this.gameObjects.ball.rotation.y += 0.05;
                // const rot = 3;
                // const deltaX = state.ball.x - this.gameObjects.ball.position.x;
                // const deltaZ = state.ball.z - this.gameObjects.ball.position.z;

                // this.gameObjects.ball.rotation.x += deltaZ * rot;
                // this.gameObjects.ball.rotation.z -= deltaX * rot;

                // this.gameObjects.ball.position.x = state.ball.x;
                // this.gameObjects.ball.position.z = state.ball.z;
            }

            // Update Score
            if (this.guiManager && this.guiManager.isReady())
                this.guiManager.updateScores(state.paddleLeft.score, state.paddleRight.score);

        } catch (error) {
            Logger.error('Error updating game objects', 'Game', error);
        }
    }

    // Update 3D camera targets to follow players
    private update3DCameras(): void {
        if (this.isDisposed || !this.gameObjects?.cameras) return;

        try {
            const [camera1, camera2] = this.gameObjects.cameras;
            const cameraFollowLimit = GAME_CONFIG.cameraFollowLimit;

            if (camera1 &&this.gameObjects.players.left) {
                const targetLeft = this.gameObjects.players.left.position.clone();
                targetLeft.x = Math.max(-cameraFollowLimit, Math.min(cameraFollowLimit, targetLeft.x));
                camera1.setTarget(BABYLON.Vector3.Lerp(camera1.getTarget(), targetLeft, GAME_CONFIG.followSpeed));
            }
            if (camera2 && this.gameObjects.players.right) {
                const targetRight = this.gameObjects.players.right.position.clone();
                targetRight.x = Math.max(-cameraFollowLimit, Math.min(cameraFollowLimit, targetRight.x));
                camera2.setTarget(BABYLON.Vector3.Lerp(camera2.getTarget(), targetRight, GAME_CONFIG.followSpeed));
            }
        } catch (error) {
            Logger.error('Error updating 3D cameras', 'Game', error);
        }
    } // if (camera1.getTarget && camera2.getTarget)

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
            this.stopGameLoop();
            if (this.renderManager) {
                this.renderManager.dispose();
                this.renderManager = null;
            }

            if (this.countdownLoop) {
                clearInterval(this.countdownLoop);
                this.countdownLoop = null;
            }

            if (this.inputHandler) {
                await this.inputHandler.dispose();
                this.inputHandler = null;
            }

            if (this.resizeHandler) {
                window.removeEventListener("resize", this.resizeHandler);
                this.resizeHandler = null;
            }

            if (this.guiManager) {
                this.guiManager.dispose();
                this.guiManager = null;
            }

            uiManager.setLoadingScreenVisible(false);
            uiManager.updateLoadingProgress(0);

            this.gameObjects = null;

            if (this.scene) {
                this.scene.onBeforeRenderObservable?.clear();
                this.scene.onAfterRenderObservable?.clear();
                this.scene.dispose();
                this.scene = null;
            }

            if (this.engine) {
                this.engine.dispose();
                this.engine = null;
            }

            this.canvas = null;
            this.isInitialized = false;

            if (Game.currentInstance === this)
                Game.currentInstance = null;

            Logger.info('Game disposed successfully', 'Game');
        } catch (error) {
            Logger.error('Error disposing game', 'Game', error);
        }
    }

}
