import { GameObjectFactory } from './gameObjectFactory.js';

declare var BABYLON: any;

let engine: any = null;
let scene: any = null;
let canvas: HTMLCanvasElement | null = null;
const MOVEMENT_SPEED = 0.5;

function createDefaultEngine(): any {
    return new BABYLON.Engine(canvas, true, { 
        preserveDrawingBuffer: true, 
        stencil: true, 
        disableWebGL2Support: false 
    });
}

function moveLeft(player: any): void {
    if (player.position.x > -22)
        player.position.x -= MOVEMENT_SPEED;
}

function moveRight(player: any): void {
    if (player.position.x < 22)
        player.position.x += MOVEMENT_SPEED;
}

function createScene(): any {

    const scene = new BABYLON.Scene(engine);

    const camera1 = GameObjectFactory.createCamera(scene, "camera1", new BABYLON.Vector3(0, 5, -70), new BABYLON.Viewport(0, 0, 0.5, 1));
    const camera2 = GameObjectFactory.createCamera(scene, "camera2", new BABYLON.Vector3(0, 5, 70), new BABYLON.Viewport(0.5, 0, 0.5, 1));
    scene.activeCameras = [camera1, camera2];

    const light = GameObjectFactory.createLight(scene, "light1", new BABYLON.Vector3(1, 1, 0));

    const ground = GameObjectFactory.createGround(scene, "ground", 50, 100, new BABYLON.Color3(0.4, 0.6, 0.4));

    const playerLeft = GameObjectFactory.createPlayer(scene, "player1", new BABYLON.Vector3(0, 1, -45), new BABYLON.Vector3(5, 0.5, 0.5), new BABYLON.Color3(0.89, 0.89, 0));
    const playerRight = GameObjectFactory.createPlayer(scene, "player2", new BABYLON.Vector3(0, 1, 45), new BABYLON.Vector3(5, 0.5, 0.5), new BABYLON.Color3(1, 0, 0));


    const ball = GameObjectFactory.createBall(scene, "ball", new BABYLON.Vector3(0, 1, 35), new BABYLON.Color3(0.89, 0.89, 1));

    var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    var inputChanged = new BABYLON.GUI.TextBlock();
    inputChanged.text = "Press keys";
    inputChanged.color = "white";
    inputChanged.fontSize = 24;
    inputChanged.verticalAlignment = BABYLON.GUI.TextBlock.VERTICAL_ALIGNMENT_CENTER;
    inputChanged.horizontalAlignment = BABYLON.GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER;
    inputChanged.width = 1;
    inputChanged.height = .3;
    advancedTexture.addControl(inputChanged);
    const deviceSourceManager = new BABYLON.DeviceSourceManager(scene.getEngine());
    deviceSourceManager.onDeviceConnectedObservable.add((deviceSource: any) => {

    // If Keyboard, add an Observer to change text
    if (deviceSource.deviceType === BABYLON.DeviceType.Keyboard) {
        deviceSource.onInputChangedObservable.add((eventData: any) => {
            console.log(`Key event - Device: ${BABYLON.DeviceType[deviceSource.deviceType]}, Input Index: ${eventData.inputIndex}`);
            // inputChanged.text = `onInputChangedObservable inputIndex\n${BABYLON.DeviceType[deviceSource.deviceType]}(${eventData.inputIndex})`;
            });
        }
    });
    scene.registerBeforeRender(() => {
        const keyboardSource = deviceSourceManager.getDeviceSource(BABYLON.DeviceType.Keyboard);
        if (keyboardSource) {
            if (keyboardSource.getInput(65) == 1) {
                moveLeft(playerLeft);
            }
            else if (keyboardSource.getInput(68) == 1) {
                moveRight(playerLeft);
            }
            if (keyboardSource.getInput(37) == 1) {
                moveRight(playerRight);
            }
            else if (keyboardSource.getInput(39) == 1) {
                moveLeft(playerRight);
            }
        }
    });
    return scene;
}

function startRenderLoop(): void {
    if (engine) {
        engine.runRenderLoop(function () {
            if (scene && scene.activeCamera) {
                scene.render();
            }
        });
    }
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
            if (engine) {
                engine.resize();
            }
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