import { hideOverlay, hidePauseDialog } from "./styles";

declare var BABYLON: any;
declare var Assets: any;

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

function createScene(): any {

    const scene = new BABYLON.Scene(engine);

    const camera1 = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -70), scene);
    camera1.setTarget(BABYLON.Vector3.Zero());
    camera1.viewport = new BABYLON.Viewport(0, 0, 0.5, 1);

    const camera2 = new BABYLON.FreeCamera("camera2", new BABYLON.Vector3(0, 5, 70), scene);
    camera2.setTarget(BABYLON.Vector3.Zero());
    camera2.viewport = new BABYLON.Viewport(0.5, 0, 0.5, 1);
    
    scene.activeCameras = [camera1, camera2];

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0)); 

    var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 50, height: 100}, scene);
    // Main ground material
    const groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.6, 0.4); // Green ground
    ground.material = groundMaterial;

    // Create grid overlay using wireframe
    const gridGround = BABYLON.MeshBuilder.CreateGround("gridGround", {width: 50, height: 100, subdivisions: 10}, scene);
    const gridMaterial = new BABYLON.StandardMaterial("gridMat", scene);
    gridMaterial.wireframe = true;
    gridMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    gridGround.material = gridMaterial;
    gridGround.position.y = 0.01;

    var cube1 = BABYLON.MeshBuilder.CreateBox("player1", {width: 5, height: 0.5, depth: 0.5}, scene);
    const material1 = new BABYLON.StandardMaterial("mat1", scene);
    material1.diffuseColor = new BABYLON.Color3(0.89, 0.89, 0);
    cube1.material = material1;
    cube1.position = new BABYLON.Vector3(0, 1, -45);

    var cube2 = BABYLON.MeshBuilder.CreateBox("player2", {width: 5, height: 0.5, depth: 0.5}, scene);
    const material2 = new BABYLON.StandardMaterial("mat2", scene);
    material1.diffuseColor = new BABYLON.Color3(1, 0, 0);
    cube2.material = material2;
    cube2.position = new BABYLON.Vector3(0, 1, 45);

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