declare var BABYLON: any;

import { build2DScene, build3DScene } from './sceneBuilder.js';
import { InputManager } from '../game/InputManager.js';
import { GUIManager } from '../game/GuiManager.js';
import { NetworkGameManager } from '../game/NetworkGameManager.js';
import { ViewMode } from '../shared/constants.js';

/**
 * BabylonEngine is responsible for managing the Babylon.js engine, scenes, and game lifecycle.
 */
export class BabylonEngine {
    private engine: any = null;
    private scene: any = null;
    private canvas: HTMLCanvasElement | null = null;
    private networkGameManager: NetworkGameManager | null = null;
    private inputManager: InputManager | null = null;
    private guiManager: GUIManager | null = null;

    /**
     * Initializes the BabylonEngine with the given canvas ID.
     * @param canvasId - The ID of the HTML canvas element to use for rendering.
     */
    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!this.canvas)
            throw new Error(`Canvas element not found`);
    }

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
     * Resizes the engine to adapt to the current canvas size.
     */
    resize(): void {
        if (this.engine) {
            this.engine.resize();
        }
    }

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

    /**
     * Disposes of all resources used by the engine, including scenes and managers.
     */
    dispose(): void {
        
        // Stop render loop
        if (this.engine)
            this.engine.stopRenderLoop();

        if (this.networkGameManager) {
            this.networkGameManager.dispose();
            this.networkGameManager = null;
        }
        
        if (this.guiManager) {
            this.guiManager.dispose();
            this.guiManager = null;
        }
        
        if (this.inputManager) {
            this.inputManager.dispose();
            this.inputManager = null;
        }
        
        // Dispose scene
        if (this.scene) {
            this.scene.dispose();
            this.scene = null;
        }
        
        // Dispose engine
        if (this.engine) {
            this.engine.dispose();
            this.engine = null;
        }
        
        this.canvas = null;
    }

    /**
     * Creates a scene based on the specified view mode (2D or 3D).
     * @param mode - The view mode (2D or 3D) for the scene.
     * @returns The created scene instance.
     */
    private createScene(mode: ViewMode): any {
        const scene = new BABYLON.Scene(this.engine);

        // Build scene based on mode
        let gameObjects;
        if (mode === ViewMode.MODE_2D)
            gameObjects = build2DScene(scene, this.engine)
        else
            gameObjects = build3DScene(scene, this.engine)

        // Setup managers (same for both modes)
        this.inputManager = new InputManager(scene);
        this.inputManager.setupControls(gameObjects.players, mode);

        this.guiManager = new GUIManager(scene, this.engine);
        this.guiManager.createFPSDisplay();

        this.networkGameManager = new NetworkGameManager(scene, gameObjects, this.inputManager, this.guiManager);
        
        this.scene = scene;
        return scene;
    }

    /**
     * Creates and initializes a 2D scene.
     * @returns The created 2D scene instance.
     */
    create2DScene(): any {
        return this.createScene(ViewMode.MODE_2D);
    }

    /**
     * Creates and initializes a 3D scene.
     * @returns The created 3D scene instance.
     */
    create3DScene(): any {
        return this.createScene(ViewMode.MODE_3D);
    }

    /**
     * Starts a single-player game session.
     */
    startSinglePlayer(): void {
        if (this.networkGameManager) {
            this.networkGameManager.startSinglePlayer();
        }
    }

    /**
     * Starts a two-player local game session.
     */
    startTwoPlayerLocal(): void {
        if (this.networkGameManager) {
            this.networkGameManager.startTwoPlayerLocal();
        }
    }
}
