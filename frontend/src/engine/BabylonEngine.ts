declare var BABYLON: any;

import { build2DScene, build3DScene } from './sceneBuilder.js';
import { InputManager } from '../game/InputManager.js';
import { GUIManager } from '../game/GuiManager.js';
import { NetworkGameManager } from '../game/NetworkGameManager.js';
import { ViewMode } from '../shared/constants.js';

export class BabylonEngine {
    private engine: any = null;
    private scene: any = null;
    private canvas: HTMLCanvasElement | null = null;
    private networkGameManager: NetworkGameManager | null = null;
    private inputManager: InputManager | null = null;
    private guiManager: GUIManager | null = null;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!this.canvas)
            throw new Error(`Canvas element not found`);
    }

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

    resize(): void {
        if (this.engine) {
            this.engine.resize();
        }
    }

    startRenderLoop(): void {
        if (this.engine) {
            this.engine.runRenderLoop(() => {
                if (this.scene && this.scene.activeCamera)
                    this.scene.render();
            });
        }
    }

    pause(): void {
        if (this.engine) {
            this.engine.stopRenderLoop();
        }
    }

    resume(): void {
        if (this.engine && this.scene) {
            this.startRenderLoop();
        }
    }

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

    create2DScene(): any {
        return this.createScene(ViewMode.MODE_2D);
    }

    create3DScene(): any {
        return this.createScene(ViewMode.MODE_3D);
    }

    startSinglePlayer(): void {
        if (this.networkGameManager) {
            this.networkGameManager.startSinglePlayer();
        }
    }

    startTwoPlayerLocal(): void {
        if (this.networkGameManager) {
            this.networkGameManager.startTwoPlayerLocal();
        }
    }
}
