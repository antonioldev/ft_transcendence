declare var BABYLON: any;

import { build2DScene, build3DScene } from './sceneBuilder.js';
import { ViewMode } from '../shared/constants.js';
import { GameStateData, GameObjects } from '../shared/types.js';

/**
 * Manages the lifecycle and rendering of a Babylon.js scene for a game, supporting both 2D and 3D view modes.
 * 
 * The `BabylonScene` class is responsible for:
 * - Initializing the Babylon.js engine and scene on a specified HTML canvas.
 * - Building either a 2D or 3D scene based on the provided view mode.
 * - Updating game object positions and camera targets in response to game state changes.
 * - Handling engine resizing and resource cleanup/disposal.
 */
export class BabylonScene {
    private engine: any = null;
    private scene: any = null;
    private canvas: HTMLCanvasElement | null = null;
    private gameObjects: GameObjects | null = null;
    private isDisposed: boolean = false;

    constructor(canvasId: string, private viewMode: ViewMode) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!this.canvas) {
            throw new Error(`Canvas element not found: ${canvasId}`);
        }
    }

    // ========================================
    // INITIALIZATION
    // ========================================
    
    /**
     * Initialize the Babylon.js engine and scene
     */
    async initialize(): Promise<void> {
        if (this.isDisposed) return;

        try {
            // Create engine
            this.engine = new BABYLON.Engine(this.canvas, true, { 
                preserveDrawingBuffer: true, 
                stencil: true, 
                disableWebGL2Support: false,
                antialias: false,
                powerPreference: "high-performance"
            });

            // Create scene
            this.scene = new BABYLON.Scene(this.engine);

            // Build scene based on view mode
            if (this.viewMode === ViewMode.MODE_2D) {
                this.gameObjects = build2DScene(this.scene, this.engine);
            } else {
                this.gameObjects = build3DScene(this.scene, this.engine);
            }

            console.log('BabylonScene initialized successfully');
        } catch (error) {
            console.error('Error initializing BabylonScene:', error);
            throw error;
        }
    }

    // ========================================
    // ACCESSORS
    // ========================================

    getScene(): any {
        return this.scene;
    }

    getGameObjects(): GameObjects | null {
        return this.gameObjects;
    }

    getEngine(): any {
        return this.engine;
    }

    // ========================================
    // GAME STATE UPDATES
    // ========================================

    /**
     * Update game object positions from server state
     */
    updateGameObjects(state: GameStateData): void {
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

    /**
     * Update 3D camera targets to follow players
     */
    update3DCameras(followSpeed: number): void {
        if (this.isDisposed || !this.gameObjects || !this.gameObjects.cameras || this.gameObjects.cameras.length < 2) return;

        try {
            const [camera1, camera2] = this.gameObjects.cameras;
            
            if (camera1 && camera2 && this.gameObjects.players.left && this.gameObjects.players.right) {
                // Simple follow logic - can be enhanced later
                const targetLeft = this.gameObjects.players.left.position.clone();
                const targetRight = this.gameObjects.players.right.position.clone();

                if (camera1.getTarget && camera2.getTarget) {
                    camera1.setTarget(BABYLON.Vector3.Lerp(camera1.getTarget(), targetLeft, followSpeed));
                    camera2.setTarget(BABYLON.Vector3.Lerp(camera2.getTarget(), targetRight, followSpeed));
                }
            }
        } catch (error) {
            console.error('Error updating 3D cameras:', error);
        }
    }

    // ========================================
    // UTILITY
    // ========================================

    /**
     * Resize the engine
     */
    resize(): void {
        if (this.engine && !this.isDisposed) {
            this.engine.resize();
        }
    }

    // ========================================
    // CLEANUP
    // ========================================

    /**
     * Dispose all Babylon.js resources
     */
    async dispose(): Promise<void> {
        if (this.isDisposed) return;
        
        this.isDisposed = true;

        try {
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

            console.log('BabylonScene disposed successfully');
        } catch (error) {
            console.error('Error disposing BabylonScene:', error);
        }
    }
}