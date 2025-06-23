import { BabylonEngine } from './babylonEngine.js';

let babylonEngine: BabylonEngine | null = null;

export async function initBabylon2D(): Promise<void> {
    try {
        console.log("Initializing Babylon 2D scene...");
        babylonEngine = new BabylonEngine("game-canvas-2d");
        babylonEngine.createEngine();
        babylonEngine.create2DScene();
        babylonEngine.startRenderLoop();
        
        const resizeHandler = () => {
            if (babylonEngine)
                babylonEngine.resize();
        };
        window.addEventListener("resize", resizeHandler);
        
        console.log("Babylon 2D scene initialized successfully!");
    } catch (error) {
        console.error("Error initializing Babylon 2D:", error);
    }
}

export function pauseBabylon2D(): void {
    babylonEngine?.pause();
}

export function resumeBabylon2D(): void {
    babylonEngine?.resume();
}

export function disposeBabylon2D(): void {
    babylonEngine?.dispose();
    babylonEngine = null;
}