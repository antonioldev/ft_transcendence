declare var BABYLON: any;

import { build2DScene, build3DScene } from './sceneBuilder.js';
import { InputManager } from './InputManager.js';
import { GUIManager } from './GuiManager.js';
// import { GameLoopManager } from './GameLoopManager.js';
import { NetworkGameManager } from './NetworkGameManager.js';

export class BabylonEngine {
    private engine: any = null;
    private scene: any = null;
    private canvas: HTMLCanvasElement | null = null;
    // private gameLoopManager: GameLoopManager | null = null;
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
            console.log("Babylon render loop paused");
        }
    }

    resume(): void {
        if (this.engine && this.scene) {
            this.startRenderLoop();
            console.log("Babylon render loop resumed");
        }
    }

    dispose(): void {
        console.log("Disposing Babylon 3D scene...");
        
        // Stop render loop
        if (this.engine)
            this.engine.stopRenderLoop();
        
        // Dispose managers
        // if (this.gameLoopManager) {
        //     this.gameLoopManager.dispose();
        //     this.gameLoopManager = null;
        // }
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
        
        console.log("Babylon 3D scene disposed.");
    }

    private createScene(mode: string): any {
        const scene = new BABYLON.Scene(this.engine);
        
        // Build scene based on mode
        let gameObjects;
        if (mode === "2D")
            gameObjects = build2DScene(scene, this.engine)
        else
            gameObjects = build3DScene(scene, this.engine)
        
        // Setup managers (same for both modes)
        this.inputManager = new InputManager(scene);
        this.inputManager.setupControls(gameObjects.players, mode);
        
        this.guiManager = new GUIManager(scene, this.engine);
        this.guiManager.createFPSDisplay();
        
        // this.gameLoopManager = new GameLoopManager(scene, gameObjects, this.inputManager, this.guiManager);
        // this.gameLoopManager.start();
        this.networkGameManager = new NetworkGameManager(scene, gameObjects, this.inputManager, this.guiManager);
        
        this.scene = scene;
        return scene;
    }

    create2DScene(): any {
        return this.createScene("2D");
    }

    create3DScene(): any {
        return this.createScene("3D");
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
