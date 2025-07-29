declare var BABYLON: typeof import('@babylonjs/core');

import { Logger } from '../core/LogManager.js';
import { GUIManager } from './GuiManager.js';
import { GameMode, ViewMode } from '../shared/constants.js';
import {
    getCamera2DPosition,
    getCamera3DPlayer1Position,
    getCamera3DPlayer2Position,
} from '../core/utils.js';

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
    private engine: any = null;
    private scene: any = null;
    private guiManager: GUIManager | null = null;
    private isRenderingActive: boolean = false;
    private lastFrameTime: number = 0;
    private fpsLimit: number = 60;
    private isInitialized: boolean = false;
    private camerasAnimation: any[] = [];

    // Initialize the render manager with required dependencies
    initialize(engine: any, scene: any, guiManager: GUIManager): void {
        if (this.isInitialized) {
            Logger.warn('RenderManager already initialized', 'RenderManager');
            return;
        }

        this.engine = engine;
        this.scene = scene;
        this.guiManager = guiManager;
        this.isInitialized = true;

        Logger.info('RenderManager initialized', 'RenderManager');
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

        this.engine.runRenderLoop(() => { // Try render without frame rate
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

        Logger.info('Render loop started', 'RenderManager');
    }

    // Stop the render loop
    stopRendering(): void {
        if (!this.isRenderingActive) return;

        this.isRenderingActive = false;
        
        if (this.engine)
            this.engine.stopRenderLoop();

        Logger.info('Render loop stopped', 'RenderManager');
    }

    // Set the FPS limit for the render loop
    setFpsLimit(fps: number): void {
        if (fps <= 0 || fps > 300) {
            Logger.warn(`Invalid FPS limit: ${fps}. Using default 60 FPS`, 'RenderManager');
            this.fpsLimit = 60;
            return;
        }

        this.fpsLimit = fps;
        Logger.info(`FPS limit set to ${fps}`, 'RenderManager');
    }

    // Get the current FPS limit
    getFpsLimit(): number {
        return this.fpsLimit;
    }

    // Check if rendering is currently active
    isRendering(): boolean {
        return this.isRenderingActive;
    }

    // Update the FPS display through the GUI manager
    private updateFPSDisplay(deltaTime: number): void {
        if (this.guiManager && this.guiManager.isReady()) {
            const fps = 1000 / deltaTime;
            this.guiManager.updateFPS(fps);
        }
    }

    startCameraAnimation(cameras: any, gameMode: GameMode, viewMode: ViewMode) {
        if (!this.scene || !cameras || viewMode === ViewMode.MODE_2D)
            return;

        const gameCameras = cameras;
        gameCameras.forEach((camera: any, index: number) => {
            if (!camera) return;

            const positionAnimation = this.createCameraMoveAnimation(camera.name);
            const targetAnimation = this.createCameraTargetAnimation(camera.name);
            camera.animations = [positionAnimation, targetAnimation];
            const animationGroup = this.scene.beginAnimation(camera, 0, 180, false);
            this.camerasAnimation.push(animationGroup);

        });
    }

    stopCameraAnimation(): void {
        this.camerasAnimation.forEach(animation => {
            if (animation)
                animation.stop();
        });
        this.camerasAnimation = [];
    }

    private createCameraMoveAnimation(cameraName: string): any {
        const startPosition = getCamera2DPosition();

        let endPosition;
        if (cameraName === "camera1")
            endPosition = getCamera3DPlayer1Position();
        else
            endPosition = getCamera3DPlayer2Position();

        const positionAnimation = BABYLON.Animation.CreateAnimation(
            "position", BABYLON.Animation.ANIMATIONTYPE_VECTOR3, 60, new BABYLON.QuadraticEase());

        const keys = [
            { frame: 0, value: startPosition },
            { frame: 180, value: endPosition }
        ];
        positionAnimation.setKeys(keys);
        return positionAnimation;
    }

    private createCameraTargetAnimation(cameraName: string): any {
        const startTarget = BABYLON.Vector3.Zero();
        const endTarget = BABYLON.Vector3.Zero(); // Keep looking at center

        const targetAnimation = BABYLON.Animation.CreateAnimation(
            "target", BABYLON.Animation.ANIMATIONTYPE_VECTOR3, 60, new BABYLON.QuadraticEase());

        const keys = [
            { frame: 0, value: startTarget },
            { frame: 180, value: endTarget }
        ];
        targetAnimation.setKeys(keys);
        return targetAnimation;
    }


    // Clean up render manager resources
    dispose(): void {
        if (!this.isInitialized) return;

        Logger.info('Disposing RenderManager...', 'RenderManager');

        // Stop rendering if active
        this.stopRendering();
        this.stopCameraAnimation();

        // Clear references
        this.engine = null;
        this.scene = null;
        this.guiManager = null;
        this.isInitialized = false;

        Logger.info('RenderManager disposed successfully', 'RenderManager');
    }
}