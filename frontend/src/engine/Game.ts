declare var BABYLON: typeof import('@babylonjs/core') & {
    GUI: typeof import('@babylonjs/gui');
}; //declare var BABYLON: any;

import { GameConfig } from './GameConfig.js';
import { buildScene2D, buildScene3D } from './scene/sceneBuilder.js';
import { webSocketClient } from '../core/WebSocketClient.js';
import { GameStateData, GameObjects } from '../shared/types.js';
import { GAME_CONFIG } from '../shared/gameConfig.js';
import { GameState, ViewMode, WebSocketEvent, AppState } from '../shared/constants.js';
import { Logger } from '../utils/LogManager.js';
import { uiManager } from '../ui/UIManager.js';
import { GUIManager } from './GuiManager.js';
import { RenderManager } from './RenderManager.js';
import { GameMode, Direction } from '../shared/constants.js';
import { PlayerControls} from '../shared/types.js';
import { getPlayerBoundaries } from '../shared/gameConfig.js';
import { appStateManager } from '../core/AppStateManager.js';
import { authManager } from '../core/AuthManager.js';
import { PlayerInfo } from '../shared/types.js';
import { GameConfigFactory } from './GameConfig.js';
import { EL } from '../ui/elements.js';
import { AudioManager } from './AudioManager.js';

/**
 * Main Game class that handles everything for running one game instance.
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
    private guiManager: GUIManager | null = null;
    private renderManager: RenderManager | null = null;
    private audioManager: AudioManager | null =null;
    private resizeHandler: (() => void) | null = null;
    private isInitialized: boolean = false;
    private isRunning: boolean = false;
    private isDisposed: boolean = false;
    private isPausedByServer: boolean = false;
    private countdownLoop: number | null = null;
    private gameLoopObserver: any = null;
    private deviceSourceManager: any = null;
    private boundaries = getPlayerBoundaries();
    private isLocalMultiplayer: boolean = false;
    private controlledSides: number[] = [];
    private currentState: GameState | null = null;
    private isExiting: boolean = false;
    private playerLeftScore: number = 0;
    private playerRightScore: number = 0;

    static getCurrentInstance(): Game | null {
        return Game.currentInstance;
    }

    static async requestExitToMenu(): Promise<void> {
        const game = Game.currentInstance;
        if (!game) return;
        await game.requestExitToMenu();
    }

    static isInGame(): boolean {
        const game = Game.currentInstance;
        return game ? game.isInGame() : false;
    }

    static isPaused(): boolean {
        const game = Game.currentInstance;
        return game ? game.isPaused() : false;
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
        game.renderManager?.stopRendering();
        game.stopGameLoop();
        Logger.info('Game stopped', 'Game');
    }

    static async disposeGame(): Promise<void> {
        const game = Game.currentInstance;
        if (!game) return;
        await game.dispose();
    }

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
    }

    // ========================================
    // GAME STATE MANAGEMENT
    // ========================================

    private setGameState(state: GameState): void {
        const previousState = this.currentState;
        this.currentState = state;
        this.isExiting = false;
        
        Logger.info(`Game state changed: ${previousState} -> ${state}`, 'Game');
    }

    private updateGamePauseState(isPaused: boolean): void {
        this.currentState = isPaused ? GameState.PAUSED : GameState.PLAYING;
        
        // Update UI directly
        uiManager.setElementVisibility(EL.GAME.PAUSE_DIALOG_3D, isPaused);
        
        Logger.info(`Game ${isPaused ? 'paused' : 'resumed'}`, 'Game');
    }

    async requestExitToMenu(): Promise<void> {
        if (this.isExiting) return;

        this.isExiting = true;
        Logger.info('Exiting to menu...', 'Game');
        
        try {
            webSocketClient.sendQuitGame();
            Logger.info('Request to end the game sent', 'Game');
        } catch (error) {
            Logger.error('Error during request exit', 'Game', error);
            this.resetToMenu();
        }
    }

    private resetToMenu(): void {
        this.currentState = null;
        this.isExiting = false;
        
        // Navigate back to menu
        appStateManager.navigateTo(AppState.MAIN_MENU);
        
        Logger.info('Game reset, returning to menu', 'Game');
    }

    isInGame(): boolean {
        return this.currentState === GameState.PLAYING && !this.isExiting;
    }

    isPaused(): boolean {
        return this.currentState === GameState.PAUSED && !this.isExiting;
    }

    // ========================================
    // INITIALIZATION
    // ========================================

    static async createAndStart(viewMode: ViewMode, gameMode: GameMode, aiDifficulty: number): Promise<Game> {
        try {
            Logger.info(`Starting game: ${gameMode} in ${ViewMode[viewMode]} mode`, 'Game');

            // Create players array
            let players: PlayerInfo[];
            if (authManager.isUserAuthenticated())
                players = GameConfigFactory.getAuthenticatedPlayer();
            else
                players = GameConfigFactory.getPlayersFromUI(gameMode);

            const config = GameConfigFactory.createConfig(viewMode, gameMode, players);
            // Create game instance
            const game = new Game(config);
            
            // Initialize and connect
            await game.connect(aiDifficulty);
            await game.initialize();

            Logger.info('Game created and initialized successfully', 'Game');
            return game;

        } catch (error) {
            Logger.error('Error creating game', 'Game', error);
            throw error;
        }
    }

    async initialize(): Promise<void> {
        if (this.isInitialized || this.isDisposed) return;
        
        this.setupGlobalKeyboardEvents();
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

            // In Game.ts initialize method:
            this.audioManager = new AudioManager(this.scene);
            await this.audioManager.initialize();
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

            this.initializeInput();

            this.connectComponents();
            this.isInitialized = true;
            webSocketClient.sendPlayerReady();
            uiManager.updateLoadingText();
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

    private setupGlobalKeyboardEvents(): void {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                if (this.isInGame()) Game.pause();
                else if (this.isPaused()) Game.resume();
            }
            
            if (this.isPaused()) {
                if (event.key === 'Y' || event.key === 'y') this.requestExitToMenu();
                else if (event.key === 'N' || event.key === 'n') Game.resume();
            }
        });
    }

    // Connect all components together
    private connectComponents(): void {
        webSocketClient.registerCallback(WebSocketEvent.GAME_STATE, (state: GameStateData) => { this.updateGameObjects(state); });
        webSocketClient.registerCallback(WebSocketEvent.CONNECTION, () => { Logger.info('Connected', 'Game'); });
        webSocketClient.registerCallback(WebSocketEvent.ERROR, (error: string) => { Logger.error('Network error', 'Game', error); });
        webSocketClient.registerCallback(WebSocketEvent.GAME_PAUSED, () => { this.onServerPausedGame(); });
        webSocketClient.registerCallback(WebSocketEvent.GAME_RESUMED, () => { this.onServerResumedGame(); });
        webSocketClient.registerCallback(WebSocketEvent.GAME_ENDED, (message: any) => { this.onServerEndedGame(message.winner); });
        webSocketClient.registerCallback(WebSocketEvent.ALL_READY, (message: any) => {
            this.handlePlayerAssignment(message.left, message.right);
        });
        webSocketClient.registerCallback(WebSocketEvent.COUNTDOWN, (message: any) => {
            this.handleCountdown(message.countdown); 
        })
    }

    async connect(aiDifficulty: number): Promise<void> {
        Logger.info('Connecting to server...', 'Game');
        webSocketClient.joinGame(this.config.gameMode, this.config.players, aiDifficulty);
        Logger.info('Connected to server', 'Game');
    }

    // ========================================
    // GAME CONTROL
    // ========================================

    start(): void {
        if (!this.isInitialized || this.isRunning || this.isDisposed) return;

        try {
            Logger.info('Starting game...', 'Game');
            this.setGameState(GameState.PLAYING);
            // Start game loop
            this.startGameLoop();

            this.isRunning = true;
            Logger.info('Game started successfully', 'Game');

        } catch (error) {
            Logger.error('Error starting game', 'Game', error);
        }
    }

    private handleCountdown(countdown: number): void {
        if (countdown === undefined || countdown === null)
            Logger.errorAndThrow('Server sent ALL_READY without countdown parameter', 'Game');

        uiManager.setLoadingScreenVisible(false);
        if (countdown === 5) {
            this.renderManager?.startCameraAnimation(
                this.gameObjects?.cameras, 
                this.config.viewMode,
                this.controlledSides,
                this.isLocalMultiplayer
            );
        }
        if (countdown > 0) {
            this.audioManager?.playCountdown();
            this.guiManager?.showCountdown(countdown);
        }
        else {
            this.audioManager?.stopCountdown();
            this.audioManager?.startGameMusic();
            this.renderManager?.stopCameraAnimation();
            this.guiManager?.hideCountdown();
            this.start();
        }
    }

    // Handle server confirming game is paused
    private onServerPausedGame(): void {
        if (this.isDisposed || !this.isRunning) return;

        Logger.info('Server confirmed game is paused', 'Game');
        
        this.audioManager?.pauseGameMusic();
        this.isPausedByServer = true;
        this.isRunning = false;
        this.updateGamePauseState(true);
        this.audioManager?.pauseGameMusic();
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
        this.updateGamePauseState(false);
        this.audioManager?.resumeGameMusic();
        this.renderManager?.startRendering();
        this.startGameLoop();
        
        Logger.info('Game resumed by server', 'Game');
    }

    // Handle server ending the game
    private async onServerEndedGame(winner: string): Promise<void> {
        if (this.isDisposed) return;

        if (!this.renderManager?.isRendering())
            this.renderManager?.startRendering();

        let gameWinner = "CPU";
        if (winner !== undefined) // TODO what shall we send
            gameWinner = winner;
        uiManager.setElementVisibility('pause-dialog-3d', false);
        // if (this.config.gameMode === GameMode.SINGLE_PLAYER
        //     || this.config.gameMode === GameMode.TOURNAMENT_REMOTE || this.config.gameMode === GameMode.TWO_PLAYER_REMOTE)
            await this.guiManager?.showWinner(gameWinner);

        this.audioManager?.stopGameMusic();
        this.renderManager?.stopRendering();
        this.stopGameLoop();
        Game.disposeGame();
        this.resetToMenu();

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
            this.updateInput();
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
            }

            this.guiManager?.updateRally(state.ball.current_rally);
            this.audioManager?.updateMusicSpeed(state.ball.current_rally);

            // Update Score
            if (this.guiManager && this.guiManager.isReady()){
                if (this.playerLeftScore < state.paddleLeft.score) {
                    this.playerLeftScore = state.paddleLeft.score
                    this.audioManager?.playScore();
                }
                if (this.playerRightScore < state.paddleRight.score) {
                    this.playerRightScore = state.paddleRight.score
                    this.audioManager?.playScore();
                }
                this.guiManager.updateScores(state.paddleLeft.score, state.paddleRight.score);
            }

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
        this.currentState = null;
        this.isExiting = false;

        try {
            this.stopGameLoop();

            this.renderManager?.dispose();
            this.renderManager = null;

            if (this.countdownLoop) {
                clearInterval(this.countdownLoop);
                this.countdownLoop = null;
            }

            this.deviceSourceManager?.dispose();
            this.deviceSourceManager = null;

            this.controlledSides = [];

            if (this.resizeHandler) {
                window.removeEventListener("resize", this.resizeHandler);
                this.resizeHandler = null;
            }

            this.guiManager?.dispose();
            this.guiManager = null;

            uiManager.setLoadingScreenVisible(false);
            uiManager.updateLoadingProgress(0);

            this.gameObjects = null;
            this.audioManager?.dispose();
            this.audioManager = null;

            if (this.scene) {
                this.scene.onBeforeRenderObservable?.clear();
                this.scene.onAfterRenderObservable?.clear();
                this.scene.dispose();
                this.scene = null;
            }

            this.engine?.dispose();
            this.engine = null;

            if (this.canvas) {
                const context = this.canvas.getContext('2d');
                if (context)
                    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
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


    // ========================================
    // INPUT HANDLING
    // ========================================

    private initializeInput(): void {
        try {
            this.deviceSourceManager = new BABYLON.DeviceSourceManager(this.scene.getEngine());
            
            // Configure input based on game mode
            this.isLocalMultiplayer = (
                this.config.gameMode === GameMode.TWO_PLAYER_LOCAL || 
                this.config.gameMode === GameMode.TOURNAMENT_LOCAL
            );
            
            Logger.info('Input initialized', 'Game', {
                gameMode: this.config.gameMode,
                isLocalMultiplayer: this.isLocalMultiplayer
            });
        } catch (error) {
            Logger.error('Error setting up input', 'Game', error);
        }
    }

    private assignPlayerSide(name: string, side: number): void {
        const isOurPlayer = this.config.players.some(player => player.name === name);
        if (isOurPlayer && !this.controlledSides.includes(side))
            this.controlledSides.push(side);
    }

    private setActiveCameras(): void {
        if (!this.gameObjects?.cameras || this.config.viewMode === ViewMode.MODE_2D)
            return;

        const cameras = this.gameObjects.cameras;
        const guiCamera = this.gameObjects.guiCamera;

        if (this.isLocalMultiplayer)
            this.scene.activeCameras = [cameras[0], cameras[1], guiCamera];
        else {
            let activeGameCamera;
            if (this.controlledSides.includes(0))
                activeGameCamera = cameras[0];
            else if (this.controlledSides.includes(1))
                activeGameCamera = cameras[1];
            else
                activeGameCamera = cameras[0];

            if (activeGameCamera && guiCamera)
                this.scene.activeCameras = [activeGameCamera, guiCamera];
        }

    }

    private handlePlayerAssignment(leftPlayerName: string, rightPlayerName: string): void {
        if (this.guiManager)
            this.guiManager.updatePlayerNames(leftPlayerName, rightPlayerName);

        this.assignPlayerSide(leftPlayerName, 0);
        this.assignPlayerSide(rightPlayerName, 1);
        this.setActiveCameras();
        if (this.guiManager) {
            const leftPlayerControlled = this.controlledSides.includes(0);
            const rightPlayerControlled = this.controlledSides.includes(1);
            this.guiManager.updateControlVisibility(leftPlayerControlled, rightPlayerControlled);
        }
    }

    // Update input state - call this in render loop
    private updateInput(): void {
        if (this.isDisposed || !this.deviceSourceManager || !this.gameObjects) return;

        try {
            const keyboardSource = this.deviceSourceManager.getDeviceSource(BABYLON.DeviceType.Keyboard);
            if (keyboardSource) {
                // Handle left player (side 0)
                this.handlePlayerInput(keyboardSource, this.gameObjects.players.left, this.config.controls.playerLeft, 0);
                // Handle right player (side 1)  
                this.handlePlayerInput(keyboardSource, this.gameObjects.players.right, this.config.controls.playerRight, 1);
            }
        } catch (error) {
            Logger.error('Error updating input', 'Game', error);
        }
    }

    private handlePlayerInput(keyboardSource: any, player: any, controls: PlayerControls, side: number): void {
        // Check if we should listen to this player
        if (!(this.isLocalMultiplayer || this.controlledSides.includes(side))) return;

        let direction = Direction.STOP;

        // Check input and validate boundaries
        if ((keyboardSource.getInput(controls.left) === 1) && (player.position.x > this.boundaries.left)) 
            direction = Direction.LEFT;
        else if ((keyboardSource.getInput(controls.right) === 1) && (player.position.x < this.boundaries.right))
            direction = Direction.RIGHT;

        // Send input directly
        if (direction !== Direction.STOP)
            webSocketClient.sendPlayerInput(side, direction);
    }
}
