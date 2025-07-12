declare var BABYLON: any;

import { build2DScene, build3DScene } from './sceneBuilder.js';
import { InputManager } from '../game/InputManager.js';
import { GUIManager } from '../game/GuiManager.js';
import { GameSession } from '../game/GameSession.js';
import { ViewMode } from '../shared/constants.js';

/**
 * SceneManager is responsible for managing the Babylon.js engine, scenes, and managers.
 * It handles scene creation and lifecycle but does not start games directly.
 */
export class SceneManager {
    private engine: any = null;
    private scene: any = null;
    private canvas: HTMLCanvasElement | null = null;
    private gameSession: GameSession | null = null;
    private inputManager: InputManager | null = null;
    private guiManager: GUIManager | null = null;

    /**
     * Initializes the SceneManager with the given canvas ID.
     * @param canvasId - The ID of the HTML canvas element to use for rendering.
     */
    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!this.canvas)
            throw new Error(`Canvas element not found: ${canvasId}`);
    }

    // ========================================
    // SCENE CREATION & SETUP
    // ========================================
    /**
     * Creates and initializes the Babylon.js engine.
     * @returns The created engine instance.
     */
    createEngine(): any {
        this.engine = new BABYLON.Engine(this.canvas, true, { 
            preserveDrawingBuffer: true, 
            stencil: true, 
            disableWebGL2Support: false,
            antialias: false,
            powerPreference: "high-performance"
        });
        return this.engine;
    }

    /**
     * Creates a scene based on the specified view mode and sets up all managers.
     * @param mode - The view mode (2D or 3D) for the scene.
     * @returns The created scene instance.
     */
    createScene(mode: ViewMode): any {
        const scene = new BABYLON.Scene(this.engine);

        // Build scene based on mode
        let gameObjects;
        if (mode === ViewMode.MODE_2D)
            gameObjects = build2DScene(scene, this.engine)
        else
            gameObjects = build3DScene(scene, this.engine)

        // Setup managers for both modes
        this.inputManager = new InputManager(scene);
        this.inputManager.setupControls(gameObjects.players, mode);

        this.guiManager = new GUIManager(scene, this.engine);
        this.guiManager.createFPSDisplay();

        this.gameSession = new GameSession(scene, gameObjects, this.inputManager, this.guiManager);
        
        this.scene = scene;
        return scene;
    }

    // ========================================
    // GAME SESSION ACCESS
    // ========================================
    /**
     * Gets the GameSession instance.
     * @returns The GameSession instance or null if not created.
     */
    getGameSession(): GameSession | null {
        return this.gameSession;
    }

    // ========================================
    // RENDER CONTROL
    // ========================================
    /**
     * Starts the render loop for the engine.
     */
    startRenderLoop(): void {
        if (this.engine) {
            this.engine.runRenderLoop(() => {
                if (this.scene && this.scene.activeCamera)
                    this.scene.render();
            });
        }
    }

    /**
     * Pauses the render loop of the engine.
     */
    pause(): void {
        if (this.engine) {
            this.engine.stopRenderLoop();
        }
    }

    /**
     * Resumes the render loop of the engine.
     */
    resume(): void {
        if (this.engine && this.scene) {
            this.startRenderLoop();
        }
    }

    // ========================================
    // UTILITY
    // ========================================
    /**
     * Resizes the engine to adapt to the current canvas size.
     */
    resize(): void {
        if (this.engine) {
            this.engine.resize();
        }
    }

    // ========================================
    // CLEANUP
    // ========================================
    /**
     * Disposes of all resources used by the SceneManager.
     */
    dispose(): void {
        // Stop render loop first
        if (this.engine)
            this.engine.stopRenderLoop();

        // Dispose managers in reverse order of creation
        if (this.gameSession) {
            this.gameSession.dispose();
            this.gameSession = null;
        }
        
        if (this.guiManager) {
            this.guiManager.dispose();
            this.guiManager = null;
        }
        
        if (this.inputManager) {
            this.inputManager.dispose();
            this.inputManager = null;
        }
        
        // Dispose Babylon.js objects
        if (this.scene) {
            this.scene.dispose();
            this.scene = null;
        }
        
        if (this.engine) {
            this.engine.dispose();
            this.engine = null;
        }
        
        this.canvas = null;
    }
}