import { Engine, Scene} from "@babylonjs/core";
import { Logger } from '../utils/LogManager.js';
import { GUIManager } from './GuiManager.js';
import { ViewMode } from '../shared/constants.js';
import { AnimationManager } from "./AnimationManager.js";


/**
 * Manages the rendering and frame rate control
 * 
 * Responsibilities:
 * - Render loop management (start/stop)
 * - Frame rate limiting and timing
 * - FPS calculation and reporting
 * - Scene rendering coordination
 * - Render performance monitoring
 */
export class RenderManager {
    isRenderingActive: boolean = false;
    private lastFrameTime: number = 0;
    private fpsLimit: number = 60;
    private isInitialized: boolean = false;
    private camerasAnimation: any[] = [];

    constructor(private engine: Engine, private scene: Scene, private guiManager: GUIManager, private animationManager: AnimationManager) {
        this.isInitialized = true;
    }

    // Start the render loop
    startRendering(): void {
        if (!this.isInitialized)
            return (Logger.error('Cannot start rendering: RenderManager not initialized', 'RenderManager'));
        if (this.isRenderingActive)
            return (Logger.warn('Render loop already active', 'RenderManager'));
        if (!this.engine || !this.scene)
            return (Logger.error('Cannot start rendering: engine or scene not available', 'RenderManager'));

        this.isRenderingActive = true;
        this.lastFrameTime = performance.now();

        this.engine.runRenderLoop(() => {
            if (!this.isRenderingActive) return;

            const currentTime = performance.now();
            const deltaTime = currentTime - this.lastFrameTime;
            
            // Frame rate limiting
            if (deltaTime < (1000 / this.fpsLimit)) return;

            try {
                // Render the scene
                if (this.scene && this.scene.activeCamera)
                    this.scene.render();

                // Update FPS display
                this.updateFPSDisplay(deltaTime);

                this.lastFrameTime = currentTime;
            } catch (error) {
                Logger.error('Error in render loop', 'RenderManager', error);
            }
        });

        // this.engine.runRenderLoop(() => {
        //     if (!this.isRenderingActive) return;

        //     const currentTime = performance.now();
        //     const deltaTime = currentTime - this.lastFrameTime;
            
        //     // Render the scene
        //         if (this.scene && this.scene.activeCamera)
        //             this.scene.render();
        //         // Update FPS display
        //         this.updateFPSDisplay(deltaTime);
        //         this.lastFrameTime = currentTime;
        // });
    }

    // Stop the render loop
    stopRendering(): void {
        if (!this.isRenderingActive) return;

        this.isRenderingActive = false;
        if (this.engine)
            this.engine.stopRenderLoop();

    }

    // Update the FPS display through the GUI manager
    private updateFPSDisplay(deltaTime: number): void {
        if (this.guiManager && this.guiManager.isInitialized) {
            const fps = 1000 / deltaTime;
            this.guiManager.updateFPS(fps);
        }
    }

    startCameraAnimation(cameras: any, viewMode: ViewMode, controlledSides: number[] = [], isLocalMultiplayer: boolean = false) {
        if (!this.scene || !cameras || viewMode === ViewMode.MODE_2D)
            return;

        const gameCameras = cameras;
        gameCameras.forEach((camera: any, index: number) => {
            if (!camera) return;

            if (isLocalMultiplayer || controlledSides.includes(index) || controlledSides.length === 0) {
                const positionAnimation = this.animationManager.createCameraMoveAnimation(camera.name);
                const targetAnimation   = this.animationManager.createCameraTargetAnimation();
                camera.animations = [positionAnimation, targetAnimation];
                const animationGroup = this.scene?.beginAnimation(camera, 0, 180, false);
                this.camerasAnimation.push(animationGroup);
            }
        });
    }

    stopCameraAnimation(): void {
        this.camerasAnimation.forEach(animation => {
            animation?.stop();
        });
        this.camerasAnimation = [];
    }

    // Clean up render manager resources
    dispose(): void {
        if (!this.isInitialized) return;

        // Stop rendering if active
        this.stopRendering();
        this.stopCameraAnimation();

        this.isInitialized = false;

        Logger.debug('Class disposed', 'RenderManager');
    }
}