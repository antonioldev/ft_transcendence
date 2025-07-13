import { BabylonScene } from './BabylonScene.js';


/**
 * Manages the rendering loop, FPS updates, and window resize handling for a Babylon.js scene.
 * 
 * The `GameRenderer` class provides methods to start, stop, pause, and resume the render loop,
 * as well as to manage FPS updates and handle window resizing. It ensures proper cleanup of
 * resources when disposed.
 */
export class GameRenderer {
    private isRenderingActive: boolean = false;
    private isDisposed: boolean = false;
    private resizeHandler: (() => void) | null = null;
    private fpsUpdateCallback: (() => void) | null = null;

    constructor(private babylonScene: BabylonScene) {
        this.setupResizeHandler();
    }

    // ========================================
    // RENDER LOOP CONTROL
    // ========================================

    // Start the render loop
    startRenderLoop(): void {
        if (this.isDisposed || this.isRenderingActive) return;

        const engine = this.babylonScene.getEngine();
        const scene = this.babylonScene.getScene();

        if (!engine || !scene) {
            console.error('Cannot start render loop: engine or scene not available');
            return;
        }

        this.isRenderingActive = true;

        engine.runRenderLoop(() => {
            if (!this.isRenderingActive || this.isDisposed) return;

            try {
                if (scene.activeCamera) {
                    scene.render();
                }

                // Update FPS if callback is set
                if (this.fpsUpdateCallback) {
                    this.fpsUpdateCallback();
                }
            } catch (error) {
                console.error('Error in render loop:', error);
            }
        });

        console.log('Render loop started');
    }

    // Stop the render loop
    stopRenderLoop(): void {
        if (!this.isRenderingActive) return;

        this.isRenderingActive = false;
        
        const engine = this.babylonScene.getEngine();
        if (engine) {
            engine.stopRenderLoop();
        }

        console.log('Render loop stopped');
    }

    // Pause rendering (same as stop for now)
    pause(): void {
        this.stopRenderLoop();
    }

    // Resume rendering
    resume(): void {
        this.startRenderLoop();
    }

    // ========================================
    // FPS MANAGEMENT
    // ========================================

    // Set callback for FPS updates
    setFPSUpdateCallback(callback: () => void): void {
        this.fpsUpdateCallback = callback;
    }

    // Get current FPS
    getFPS(): number {
        const engine = this.babylonScene.getEngine();
        return engine ? engine.getFps() : 0;
    }

    // ========================================
    // WINDOW MANAGEMENT
    // ========================================

    // Setup window resize handler
    private setupResizeHandler(): void {
        this.resizeHandler = () => {
            if (!this.isDisposed) {
                this.babylonScene.resize();
            }
        };

        window.addEventListener("resize", this.resizeHandler);
    }

    // ========================================
    // STATE CHECKS
    // ========================================

    // Check if rendering is currently active
    isRendering(): boolean {
        return this.isRenderingActive && !this.isDisposed;
    }

    // ========================================
    // CLEANUP
    // ========================================

    // Dispose renderer and clean up resources
    async dispose(): Promise<void> {
        if (this.isDisposed) return;

        this.isDisposed = true;

        try {
            // Stop render loop
            this.stopRenderLoop();

            // Wait a frame to ensure render loop stops
            await new Promise(resolve => setTimeout(resolve, 16));

            // Remove resize handler
            if (this.resizeHandler) {
                window.removeEventListener("resize", this.resizeHandler);
                this.resizeHandler = null;
            }

            // Clear callbacks
            this.fpsUpdateCallback = null;

            console.log('GameRenderer disposed successfully');
        } catch (error) {
            console.error('Error disposing GameRenderer:', error);
        }
    }
}