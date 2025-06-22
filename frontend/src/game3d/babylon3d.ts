import { GameObjectFactory } from './gameObjectFactory.js';
import { GAME_CONFIG, getPlayerSize, getPlayerLeftPosition, getPlayerRightPosition, getBallStartPosition, getCamera1Position, getCamera2Position, getCamera1Viewport, getCamera2Viewport, getSoloCameraViewport} from './gameConfig.js';
import { handlePlayerInput, getFollowTarget} from './inputController.js';


declare var BABYLON: any;

let engine: any = null;
let scene: any = null;
let canvas: HTMLCanvasElement | null = null;

function createDefaultEngine(): any {
    return new BABYLON.Engine(canvas, true, { 
        preserveDrawingBuffer: true, 
        stencil: true, 
        disableWebGL2Support: false 
    });
}

function startRenderLoop(): void {
    if (engine) {
        engine.runRenderLoop(function () {
            if (scene && scene.activeCamera)
                scene.render();
        });
    }
}

function createScene(): any {

    const scene = new BABYLON.Scene(engine);
    
    const camera1 = GameObjectFactory.createCamera(
        scene, "camera1", getCamera1Position(), getCamera1Viewport());
    const camera2 = GameObjectFactory.createCamera(
        scene, "camera2", getCamera2Position(), getCamera2Viewport());
    scene.activeCameras = [camera1, camera2];

    const light = GameObjectFactory.createLight(scene, "light1", new BABYLON.Vector3(1, 1, 0));

    const ground = GameObjectFactory.createGround(scene, "ground", GAME_CONFIG.fieldWidth, 
        GAME_CONFIG.fieldHeight, new BABYLON.Color3(0.4, 0.6, 0.4));

    const walls = GameObjectFactory.createWalls(
        scene, "walls", GAME_CONFIG.fieldWidth, GAME_CONFIG.fieldHeight, GAME_CONFIG.wallHeight, GAME_CONFIG.wallThickness, new BABYLON.Color3(0.8, 0.8, 0.8));
    const playerLeft = GameObjectFactory.createPlayer(
        scene, "player1", getPlayerLeftPosition(), getPlayerSize(), new BABYLON.Color3(0.89, 0.89, 0));
    const playerRight = GameObjectFactory.createPlayer(
        scene, "player2", getPlayerRightPosition(), getPlayerSize(), new BABYLON.Color3(1, 0, 0));

    const ball = GameObjectFactory.createBall(scene, "ball", getBallStartPosition(), new BABYLON.Color3(0.89, 0.89, 1));
    

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
        handlePlayerInput(keyboardSource, playerLeft, playerRight);
    }

    // Handle the camera rotation when player move
    const targetLeft = getFollowTarget(playerLeft);
    const targetRight = getFollowTarget(playerRight);

    camera1.setTarget(BABYLON.Vector3.Lerp(camera1.getTarget(), targetLeft,  GAME_CONFIG.followSpeed));
    camera2.setTarget(BABYLON.Vector3.Lerp(camera2.getTarget(), targetRight,  GAME_CONFIG.followSpeed));
});

    return scene;
}

export async function initBabylon3D(): Promise<void> {
    try {
        console.log("Initializing Babylon 3D scene...");

        // Get canvas
        canvas = document.getElementById("game-canvas-3d") as HTMLCanvasElement;
        if (!canvas) {
            console.error("Canvas not found!");
            return;
        }

        // Create engine
        engine = createDefaultEngine();
        if (!engine) {
            console.error("Engine creation failed!");
            return;
        }

        // Create scene
        scene = createScene();
        
        // Start render loop
        startRenderLoop();

        // Handle window resize
        const resizeHandler = () => {
            if (engine)
                engine.resize();
        };
        window.addEventListener("resize", resizeHandler);

        console.log("Babylon 3D scene initialized successfully!");
        
    } catch (error) {
        console.error("Error initializing Babylon 3D:", error);
    }
}

export function pauseBabylon3D(): void {
    if (engine) {
        engine.stopRenderLoop();
        console.log("Babylon render loop paused");
    }
}

export function resumeBabylon3D(): void {
    if (engine && scene) {
        startRenderLoop();
        console.log("Babylon render loop resumed");
    }
}

export function disposeBabylon3D(): void {
    console.log("Disposing Babylon 3D scene...");
    // Stop render loop
    if (engine) {
        engine.stopRenderLoop();
    }
    
    // Dispose scene
    if (scene) {
        scene.dispose();
        scene = null;
    }
    
    // Dispose engine
    if (engine) {
        engine.dispose();
        engine = null;
    }
    
    canvas = null;
    
    console.log("Babylon 3D scene disposed.");
}