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
    const babylonScene = new BABYLON.Scene(engine);

    // Create camera
    const camera = new BABYLON.ArcRotateCamera(
        "camera", 
        BABYLON.Tools.ToRadians(0), 
        BABYLON.Tools.ToRadians(57.3), 
        10, 
        BABYLON.Vector3.Zero(), 
        babylonScene
    );
    
    // Attach camera controls to canvas
    camera.attachControl(canvas, true);

    // Create light
    const light = new BABYLON.HemisphericLight(
        "light", 
        new BABYLON.Vector3(0, 1, 0), 
        babylonScene
    );
    light.intensity = 0.7;

    // Create ground
    const ground = BABYLON.MeshBuilder.CreateGround(
        "ground", 
        { width: 6, height: 6 }, 
        babylonScene
    );
    
    // Ground material
    const groundMaterial = new BABYLON.StandardMaterial("Ground Material", babylonScene);
    ground.material = groundMaterial;
    
    const groundTexture = new BABYLON.Texture(
        Assets.textures.checkerboard_basecolor_png.path, 
        babylonScene
    );
    groundMaterial.diffuseColor = BABYLON.Color3.Red();
    ground.material.diffuseTexture = groundTexture;

    // Load Yeti model
    BABYLON.ImportMeshAsync(
        Assets.meshes.Yeti.rootUrl + Assets.meshes.Yeti.filename, 
        babylonScene
    ).then(function({meshes}: any) {
        meshes[0].scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
    });

    return babylonScene;
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