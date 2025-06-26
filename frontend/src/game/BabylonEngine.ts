declare var BABYLON: any;

import { build2DScene, build3DScene } from './sceneBuilder.js';
import { InputManager } from './InputManager.js';
import { GUIManager } from './GuiManager.js';
import { GameLoopManager } from './GameLoopManager.js';

export class BabylonEngine {
    private engine: any = null;
    private scene: any = null;
    private canvas: HTMLCanvasElement | null = null;
    private gameLoopManager: GameLoopManager | null = null;
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
            disableWebGL2Support: false 
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
        if (this.gameLoopManager) {
            this.gameLoopManager.dispose();
            this.gameLoopManager = null;
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
        
        this.gameLoopManager = new GameLoopManager(scene, gameObjects, this.inputManager, this.guiManager);
        this.gameLoopManager.start();
        
        this.scene = scene;
        return scene;
    }

    create2DScene(): any {
        return this.createScene("2D");
    }

    create3DScene(): any {
        return this.createScene("3D");
    }
}

// var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
// var inputChanged = new BABYLON.GUI.TextBlock();
// inputChanged.text = "Press keys";
// inputChanged.color = "white";
// inputChanged.fontSize = 24;
// inputChanged.verticalAlignment = BABYLON.GUI.TextBlock.VERTICAL_ALIGNMENT_CENTER;
// inputChanged.horizontalAlignment = BABYLON.GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER;
// inputChanged.width = 1;
// inputChanged.height = .3;
// advancedTexture.addControl(inputChanged);
// const deviceSourceManager = new BABYLON.DeviceSourceManager(scene.getEngine());
// deviceSourceManager.onDeviceConnectedObservable.add((deviceSource: any) => {
// // If Keyboard, add an Observer
// if (deviceSource.deviceType === BABYLON.DeviceType.Keyboard) {
//     deviceSource.onInputChangedObservable.add((eventData: any) => {
//         console.log(`Key event - Device: ${BABYLON.DeviceType[deviceSource.deviceType]}, Input Index: ${eventData.inputIndex}`);
//         });
//     }
// });