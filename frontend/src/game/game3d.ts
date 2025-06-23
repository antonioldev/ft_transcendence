import { BabylonEngine } from './babylonEngine.js';

let babylonEngine: BabylonEngine | null = null;

export async function initBabylon3D(): Promise<void> {
    try {
        console.log("Initializing Babylon 3D scene...");
        babylonEngine = new BabylonEngine("game-canvas-3d");
        babylonEngine.createEngine();
        babylonEngine.create3DScene();
        babylonEngine.startRenderLoop();
        
        const resizeHandler = () => {
            if (babylonEngine)
                babylonEngine.resize();
        };
        window.addEventListener("resize", resizeHandler);
        
        console.log("Babylon 3D scene initialized successfully!");
    } catch (error) {
        console.error("Error initializing Babylon 3D:", error);
    }
}

export function pauseBabylon3D(): void {
    babylonEngine?.pause();
}

export function resumeBabylon3D(): void {
    babylonEngine?.resume();
}

export function disposeBabylon3D(): void {
    babylonEngine?.dispose();
    babylonEngine = null;
}