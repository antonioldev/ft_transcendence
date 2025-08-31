import { 
    Engine, 
    Scene, 
    // Animation, 
    // Animatable, 
    // EasingFunction, 
    // QuadraticEase, 
    Color4, 
    Vector3, 
    DeviceSourceManager, 
    DeviceType,
    SceneLoader
} from "@babylonjs/core";
// import { 
//     AdvancedDynamicTexture, 
//     TextBlock, 
//     Rectangle, 
//     Control 
// } from "@babylonjs/gui";


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

    private engine: Engine | null = null;
    private scene: Scene | null = null;
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
        if (!game || game.isDisposed || game.isPausedByServer || !game.isRunning) return;
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
        this.guiManager?.setPauseVisible(isPaused);
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
        return (this.currentState === GameState.PLAYING || this.currentState === GameState.MATCH_ENDED) && !this.isExiting;
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
        SceneLoader.ShowLoadingScreen = false;
        
        uiManager.updateLoadingProgress(0);
        uiManager.setLoadingScreenVisible(true);
        try {
            Logger.info('Initializing game...', 'Game');

            this.engine = await this.initializeBabylonEngine();
            if (!this.engine) Logger.errorAndThrow('Engine not created', 'Game');

            this.scene = await this.createScene();
            if (!this.scene) Logger.errorAndThrow('Scene not created', 'Game');

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
            if (this.config.gameMode === GameMode.TWO_PLAYER_REMOTE || this.config.gameMode === GameMode.TOURNAMENT_REMOTE)
                uiManager.updateLoadingText();
            Logger.info('Game initialized successfully', 'Game');

        } catch (error) {
            Logger.error('Error initializing game', 'Game', error);
            await this.dispose();
            throw error;
        }
    }

    // Initialize Babylon.js engine
    private async initializeBabylonEngine(): Promise<Engine> {
        const engine = new Engine(this.canvas, true, { 
            preserveDrawingBuffer: true, 
            stencil: true, 
            disableWebGL2Support: false,
            antialias: false,
            audioEngine: true,
            powerPreference: "high-performance"
        });
        return engine;
    }

    // Create scene based on view mode
    private async  createScene(): Promise<Scene> {
        const scene = new Scene(this.engine!);
        scene.createDefaultEnvironment({ createGround: false, createSkybox: false });
        scene.clearColor = new Color4(0, 0, 0, 1);
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
            if (event.key === 'Escape' && this.isRunning) {
                if (this.isInGame() && this.currentState === GameState.PLAYING)
                    Game.pause();
                else if (this.isPaused())
                    Game.resume();
            }
            
            if (this.isPaused()) {
                if (event.key === 'Y' || event.key === 'y')
                    this.requestExitToMenu();
                else if (event.key === 'N' || event.key === 'n')
                    Game.resume();
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
        webSocketClient.registerCallback(WebSocketEvent.SESSION_ENDED, (message: any) => { this.onServerEndedSession(message.winner); });
        webSocketClient.registerCallback(WebSocketEvent.SIDE_ASSIGNMENT, (message: any) => { this.handlePlayerAssignment(message.left, message.right); });
        webSocketClient.registerCallback(WebSocketEvent.COUNTDOWN, (message: any) => { this.handleCountdown(message.countdown);  })
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
        if (!this.isInitialized || this.isDisposed) return;

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

    private async handleCountdown(countdown: number): Promise<void> {
        if (countdown === undefined || countdown === null)
            Logger.errorAndThrow('Server sent SIGNAL without countdown parameter', 'Game');

        uiManager.setLoadingScreenVisible(false);

        if (this.currentState === GameState.MATCH_ENDED)
            this.resetForNextMatch();
        if (countdown === GAME_CONFIG.startDelay) {
            this.renderManager?.startCameraAnimation(
                this.gameObjects?.cameras, 
                this.config.viewMode,
                this.controlledSides,
                this.isLocalMultiplayer
            );
        }
        else if (countdown > 0 && GAME_CONFIG.startDelay - 1) {
            this.guiManager?.showCountdown(true, countdown);
            this.audioManager?.playCountdown();
        }
        else {
            this.audioManager?.stopCountdown();
            this.audioManager?.startGameMusic();
            this.renderManager?.stopCameraAnimation();
            this.guiManager?.showCountdown(false);
            await this.guiManager?.animateBackground(false);
            this.start();
        }
    }

    // Handle server confirming game is paused
    private onServerPausedGame(): void {
        if (this.isDisposed || !this.isRunning) return;

        Logger.info('Server confirmed game is paused', 'Game');

        this.isPausedByServer = true;
        this.isRunning = false;
        this.updateGamePauseState(true);
        this.audioManager?.pauseGameMusic();
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
        if (this.isDisposed)
            return;
        if (!(this.config.gameMode === GameMode.TOURNAMENT_LOCAL) && !(this.config.gameMode === GameMode.TOURNAMENT_REMOTE))
            return;
        this.guiManager?.setPauseVisible(false);
        await this.guiManager?.animateBackground(true);
        await this.guiManager?.showPartialWinner(winner);
        await this.guiManager?.waitForSpaceToContinue(2000);
        await this.guiManager?.hidePartialWinner();
        webSocketClient.notifyGameAnimationDone();
        this.audioManager?.stopGameMusic();
        this.controlledSides = [];
        this.stopGameLoop();
        this.setGameState(GameState.MATCH_ENDED);
        Logger.info('Game ended by server', 'Game');
    }

    private async onServerEndedSession(winner: string): Promise<void> {
        if (this.isDisposed) return;

        if (!this.renderManager?.isRenderingActive)
            this.renderManager?.startRendering();

        this.guiManager?.setPauseVisible(false);
        if (winner !== undefined)
            await this.guiManager?.showWinner(winner);

        this.audioManager?.stopGameMusic();
        this.renderManager?.stopRendering();
        this.controlledSides = []
        this.stopGameLoop();
        Game.disposeGame();
        this.resetToMenu();

        Logger.info('Session ended by server', 'Game');
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

    private resetForNextMatch(): void {
        if (this.isDisposed)
            return;

        this.playerLeftScore = 0;
        this.playerRightScore = 0;

        if (this.gameObjects) {
            if (this.gameObjects.players.left)
                this.gameObjects.players.left.position.x = 0;
            if (this.gameObjects.players.right)
                this.gameObjects.players.right.position.x = 0;
            if (this.gameObjects.ball) {
                this.gameObjects.ball.position.x = 0;
                this.gameObjects.ball.position.z = 0;
            }
        }

        this.guiManager?.updateScores(0, 0);
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
            if (this.guiManager && this.guiManager.isInitialized){
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
                camera1.setTarget(Vector3.Lerp(camera1.getTarget(), targetLeft, GAME_CONFIG.followSpeed));
            }
            if (camera2 && this.gameObjects.players.right) {
                const targetRight = this.gameObjects.players.right.position.clone();
                targetRight.x = Math.max(-cameraFollowLimit, Math.min(cameraFollowLimit, targetRight.x));
                camera2.setTarget(Vector3.Lerp(camera2.getTarget(), targetRight, GAME_CONFIG.followSpeed));
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
            this.deviceSourceManager = new DeviceSourceManager(this.scene!.getEngine());
            
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
            this.scene!.activeCameras = [cameras[0], cameras[1], guiCamera];
        else {
            let activeGameCamera;
            if (this.controlledSides.includes(0))
                activeGameCamera = cameras[0];
            else if (this.controlledSides.includes(1))
                activeGameCamera = cameras[1];
            else
                activeGameCamera = cameras[0];

            if (activeGameCamera && guiCamera)
                this.scene!.activeCameras = [activeGameCamera, guiCamera];
        }

    }

    private handlePlayerAssignment(leftPlayerName: string, rightPlayerName: string): void {
        this.guiManager?.updatePlayerNames(leftPlayerName, rightPlayerName);
        this.controlledSides = []
        this.assignPlayerSide(leftPlayerName, 0);
        this.assignPlayerSide(rightPlayerName, 1);
        this.setActiveCameras();

        const leftPlayerControlled = this.controlledSides.includes(0);
        const rightPlayerControlled = this.controlledSides.includes(1);
        this.guiManager?.updateControlVisibility(leftPlayerControlled, rightPlayerControlled);
    
        console.log(`Left=${leftPlayerName}, Right=${rightPlayerName}, Controlled sides: [${this.controlledSides}]`);
    }

    // Update input state - call this in render loop
    private updateInput(): void {
        if (this.isDisposed || !this.deviceSourceManager || !this.gameObjects) return;
        try {
            const keyboardSource = this.deviceSourceManager.getDeviceSource(DeviceType.Keyboard);
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
        if (direction !== Direction.STOP) {
            webSocketClient.sendPlayerInput(side, direction);
        }
    }
}
