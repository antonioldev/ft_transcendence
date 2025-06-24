declare var BABYLON: any;

import { 
    GAME_CONFIG,
    getPlayerSize,
    getPlayerLeftPosition,
    getPlayerRightPosition,
    getPlayerBoundaries,
    getBallStartPosition,
    getCamera3DPlayer1Position,
    getCamera3DPlayer2Position,
    getCamera2DPosition,
    get2DCameraViewport,
    get3DCamera1Viewport,
    get3DCamera2Viewport,
    get3DSoloCameraViewport
} from './gameConfig.js';

import {handlePlayerInput, getFollowTarget} from "./inputController.js"
import { GameObjectFactory } from "./gameObjectFactory.js";

export class BabylonEngine {
    private engine: any = null;
    private scene: any = null;
    private canvas: HTMLCanvasElement | null = null;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
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


    create2DScene(): any {
        const scene = new BABYLON.Scene(this.engine);
        scene.clearColor = BABYLON.Color3.Black();
        const camera1 = GameObjectFactory.createCamera(
            scene, "camera1", getCamera2DPosition(), get2DCameraViewport(), true);
        scene.activeCamera = camera1;

        const light = GameObjectFactory.createLight(scene, "light1", new BABYLON.Vector3(0, 1, 0));
        
        const ground = GameObjectFactory.createGround(scene, "ground", GAME_CONFIG.fieldWidth, 
            GAME_CONFIG.fieldHeight, BABYLON.Color3.Black(), true);

        const walls = GameObjectFactory.createWalls(
            scene, "walls", GAME_CONFIG.fieldWidth, GAME_CONFIG.fieldHeight, GAME_CONFIG.wallHeight, GAME_CONFIG.wallThickness, BABYLON.Color3.White(), true);
        
        const playerLeft = GameObjectFactory.createPlayer(
            scene, "player1", getPlayerLeftPosition(), getPlayerSize(), BABYLON.Color3.Red(), true);
        
        const playerRight = GameObjectFactory.createPlayer(
            scene, "player2", getPlayerRightPosition(), getPlayerSize(), BABYLON.Color3.White(), true);
        
        const ball = GameObjectFactory.createBall(scene, "ball", getBallStartPosition(), BABYLON.Color3.White(), true);

        const deviceSourceManager = new BABYLON.DeviceSourceManager(scene.getEngine());
        scene.registerBeforeRender(() => {
            const keyboardSource = deviceSourceManager.getDeviceSource(BABYLON.DeviceType.Keyboard);
            if (keyboardSource)
                handlePlayerInput(keyboardSource, playerLeft, playerRight, '2D');
        });
        this.scene = scene; 
        return scene;
    }

    create3DScene() {
        const scene = new BABYLON.Scene(this.engine);
    
        const camera1 = GameObjectFactory.createCamera(
            scene, "camera1", getCamera3DPlayer1Position(), get3DCamera1Viewport(), false);
        const camera2 = GameObjectFactory.createCamera(
            scene, "camera2", getCamera3DPlayer2Position(), get3DCamera2Viewport(), false);
        scene.activeCameras = [camera1, camera2];

        const light = GameObjectFactory.createLight(scene, "light1", new BABYLON.Vector3(1, 1, 0));

        const ground = GameObjectFactory.createGround(scene, "ground", GAME_CONFIG.fieldWidth, 
            GAME_CONFIG.fieldHeight, new BABYLON.Color3(0.4, 0.6, 0.4), false);

        const walls = GameObjectFactory.createWalls(
            scene, "walls", GAME_CONFIG.fieldWidth, GAME_CONFIG.fieldHeight, GAME_CONFIG.wallHeight, GAME_CONFIG.wallThickness, new BABYLON.Color3(0.8, 0.8, 0.8), false);
        const playerLeft = GameObjectFactory.createPlayer(
            scene, "player1", getPlayerLeftPosition(), getPlayerSize(), new BABYLON.Color3(0.89, 0.89, 0), false);
        const playerRight = GameObjectFactory.createPlayer(
            scene, "player2", getPlayerRightPosition(), getPlayerSize(), new BABYLON.Color3(1, 0, 0), false);

        const ball = GameObjectFactory.createBall(scene, "ball", getBallStartPosition(), new BABYLON.Color3(0.89, 0.89, 1), false);
        

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

        const deviceSourceManager = new BABYLON.DeviceSourceManager(scene.getEngine());
        // deviceSourceManager.onDeviceConnectedObservable.add((deviceSource: any) => {

        // // If Keyboard, add an Observer
        // if (deviceSource.deviceType === BABYLON.DeviceType.Keyboard) {
        //     deviceSource.onInputChangedObservable.add((eventData: any) => {
        //         console.log(`Key event - Device: ${BABYLON.DeviceType[deviceSource.deviceType]}, Input Index: ${eventData.inputIndex}`);
        //         });
        //     }
        // });

        scene.registerBeforeRender(() => {
            const keyboardSource = deviceSourceManager.getDeviceSource(BABYLON.DeviceType.Keyboard);
            if (keyboardSource) {
                handlePlayerInput(keyboardSource, playerLeft, playerRight, '3D');
            }

            // Handle the camera rotation when player move
            const targetLeft = getFollowTarget(playerLeft);
            const targetRight = getFollowTarget(playerRight);

            camera1.setTarget(BABYLON.Vector3.Lerp(camera1.getTarget(), targetLeft,  GAME_CONFIG.followSpeed));
            camera2.setTarget(BABYLON.Vector3.Lerp(camera2.getTarget(), targetRight,  GAME_CONFIG.followSpeed));
        });
        this.scene = scene; 
        return scene;
    }
}