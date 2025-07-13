import { GameConfig } from './GameConfig.js';
import { BabylonScene } from './BabylonScene.js';
import { GameRenderer } from './GameRenderer.js';
import { InputHandler } from './InputHandler.js';
import { NetworkManager } from './NetworkManager.js';
import { GUIManager } from './GuiManager.js';
import { GAME_CONFIG } from '../shared/gameConfig.js';


/**
 * Main class responsible for managing the lifecycle and core components of the game.
 * 
 * The `Game` class handles initialization, starting, pausing, resuming, stopping, and disposing of the game.
 * It orchestrates the interaction between the rendering engine, input handling, networking, and GUI management.
 * 
 * ### Core Responsibilities
 * - Initializes and connects all game subsystems (Babylon.js scene, renderer, input handler, network manager, GUI manager).
 * - Manages the main game loop and render loop.
 * - Handles game state transitions (start, pause, resume, stop, dispose).
 * - Provides state query methods for external consumers.
 */
export class Game {
    private babylonScene: BabylonScene | null = null;
    private renderer: GameRenderer | null = null;
    private inputHandler: InputHandler | null = null;
    private networkManager: NetworkManager | null = null;
    private guiManager: GUIManager | null = null;

    // State
    private isInitialized: boolean = false;
    private isRunning: boolean = false;
    private isDisposed: boolean = false;

    // Game loop
    private gameLoopObserver: any = null;

    constructor(private config: GameConfig) {
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

    // Initialize all game components
    async initialize(): Promise<void> {
        if (this.isInitialized || this.isDisposed) return;

        try {
            console.log('Initializing game...');

            // 1. Create Babylon.js scene
            this.babylonScene = new BabylonScene(this.config.canvasId, this.config.viewMode);
            await this.babylonScene.initialize();

            // 2. Create renderer
            this.renderer = new GameRenderer(this.babylonScene);

            // 3. Create input handler
            const scene = this.babylonScene.getScene();
            if (!scene)
                throw new Error('Failed to get Babylon.js scene');
            this.inputHandler = new InputHandler(this.config.gameMode, this.config.controls, scene);
            
            const gameObjects = this.babylonScene.getGameObjects();
            if (!gameObjects)
                throw new Error('Failed to get game objects from scene');
            this.inputHandler.setGameObjects(gameObjects);

            // 4. Create GUI manager
            const engine = this.babylonScene.getEngine();
            if (!engine)
                throw new Error('Failed to get Babylon.js engine');
            this.guiManager = new GUIManager(scene, engine);
            this.guiManager.createFPSDisplay();

            // 5. Create network manager
            this.networkManager = new NetworkManager(this.config.gameMode, this.config.players);

            // 6. Connect components
            this.connectComponents();

            this.isInitialized = true;
            console.log('Game initialized successfully');

        } catch (error) {
            console.error('Error initializing game:', error);
            await this.dispose();
            throw error;
        }
    }

    // Connect all components together
    private connectComponents(): void {
        if (!this.inputHandler || !this.networkManager || !this.renderer || !this.guiManager)
            throw new Error('Components not initialized');

        // Input → Network
        this.inputHandler.onInput((input) => {
            if (this.networkManager) {
                this.networkManager.sendInput(input);
            }
        });

        // Network → Scene updates
        this.networkManager.onGameState((state) => {
            if (this.babylonScene) {
                this.babylonScene.updateGameObjects(state);
            }
        });

        // Network → Connection handling
        this.networkManager.onConnection(() => {
            console.log('Connected to game server');
        });

        this.networkManager.onError((error) => {
            console.error('Network error:', error);
        });

        // Renderer → FPS updates
        this.renderer.setFPSUpdateCallback(() => {
            if (this.guiManager) {
                this.guiManager.updateFPS();
            }
        });
    }

    // ========================================
    // GAME CONTROL
    // ========================================

    // Start the game
    start(): void {
        if (!this.isInitialized || this.isRunning || this.isDisposed) return;

        try {
            console.log('Starting game...');

            // Start network connection
            if (this.networkManager)
                this.networkManager.joinGame();

            // Start render loop
            if (this.renderer)
                this.renderer.startRenderLoop();

            // Start game loop
            this.startGameLoop();

            this.isRunning = true;
            console.log('Game started successfully');

        } catch (error) {
            console.error('Error starting game:', error);
        }
    }

    // Pause the game
    pause(): void {
        if (!this.isRunning || this.isDisposed) return;

        this.renderer?.pause();
        this.stopGameLoop();
        console.log('Game paused');
    }

    // Resume the game
    resume(): void {
        if (!this.isInitialized || this.isRunning || this.isDisposed) return;

        this.renderer?.resume();
        this.startGameLoop();
        this.isRunning = true;
        console.log('Game resumed');
    }

    // Stop the game
    stop(): void {
        if (!this.isRunning) return;

        this.isRunning = false;
        this.renderer?.stopRenderLoop();
        this.stopGameLoop();
        console.log('Game stopped');
    }

    // ========================================
    // GAME LOOP
    // ========================================

    // Start the game loop
    private startGameLoop(): void {
        if (this.gameLoopObserver || !this.babylonScene) return;

        const scene = this.babylonScene.getScene();
        if (!scene || !scene.onBeforeRenderObservable) return;

        this.gameLoopObserver = scene.onBeforeRenderObservable.add(() => {
            if (!this.isRunning || this.isDisposed) return;

            try {
                // Update input
                if (this.inputHandler) {
                    this.inputHandler.updateInput();
                }

                // Update 3D cameras if needed
                if (this.babylonScene) {
                    const gameObjects = this.babylonScene.getGameObjects();
                    if (gameObjects && gameObjects.cameras.length > 1) {
                        this.babylonScene.update3DCameras(GAME_CONFIG.followSpeed);
                    }
                }
            } catch (error) {
                console.error('Error in game loop:', error);
            }
        });
    }

    // Stop the game loop
    private stopGameLoop(): void {
        if (this.gameLoopObserver && this.babylonScene) {
            const scene = this.babylonScene.getScene();
            if (scene && scene.onBeforeRenderObservable) {
                scene.onBeforeRenderObservable.remove(this.gameLoopObserver);
            }
            this.gameLoopObserver = null;
        }
    }

    // Check if game is initialized
    isGameInitialized(): boolean {
        return this.isInitialized && !this.isDisposed;
    }

    // Check if game is running
    isGameRunning(): boolean {
        return this.isRunning && !this.isDisposed;
    }

    // Check if game is disposed
    isGameDisposed(): boolean {
        return this.isDisposed;
    }

    // Get game configuration
    getConfig(): GameConfig {
        return this.config;
    }

    // ========================================
    // CLEANUP
    // ========================================

    // Dispose all game resources
    async dispose(): Promise<void> {
        if (this.isDisposed) return;

        console.log('Disposing game...');
        this.isDisposed = true;
        this.isRunning = false;

        try {
            // Stop game loop first
            this.stopGameLoop();

            // Dispose components in reverse order
            if (this.networkManager) {
                this.networkManager.quitCurrentGame();
                
                // Small delay to ensure quit message is sent
                await new Promise(resolve => setTimeout(resolve, 100));

                this.networkManager.dispose();
                this.networkManager = null;
            }

            if (this.guiManager) {
                this.guiManager.dispose();
                this.guiManager = null;
            }

            if (this.inputHandler) {
                await this.inputHandler.dispose();
                this.inputHandler = null;
            }

            if (this.renderer) {
                await this.renderer.dispose();
                this.renderer = null;
            }

            if (this.babylonScene) {
                await this.babylonScene.dispose();
                this.babylonScene = null;
            }

            // Reset flags
            this.isInitialized = false;

            console.log('Game disposed successfully');

        } catch (error) {
            console.error('Error disposing game:', error);
        }
    }
}