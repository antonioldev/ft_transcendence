// gameManager.ts - Single manager for both 2D and 3D
import { BabylonEngine } from './BabylonEngine.js';

class GameManager {
    private engine: BabylonEngine | null = null;
    private resizeHandler: (() => void) | null = null;

    async init(canvasId: string, mode: "2D" | "3D"): Promise<void> {
        try {
            console.log(`Initializing Babylon ${mode} scene...`);
            
            this.engine = new BabylonEngine(canvasId);
            this.engine.createEngine();
            
            if (mode === "2D") {
                this.engine.create2DScene();
            } else {
                this.engine.create3DScene();
            }
            
            this.engine.startRenderLoop();
            
            this.resizeHandler = () => this.engine?.resize();
            window.addEventListener("resize", this.resizeHandler);
            
            console.log(`Babylon ${mode} scene initialized successfully!`);
        } catch (error) {
            console.error(`Error initializing Babylon ${mode}:`, error);
        }
    }

    pause(): void {
        this.engine?.pause();
    }

    resume(): void {
        this.engine?.resume();
    }

    dispose(): void {
        if (this.resizeHandler) {
            window.removeEventListener("resize", this.resizeHandler);
            this.resizeHandler = null;
        }
        this.engine?.dispose();
        this.engine = null;
    }
}

// Export instances
export const game2D = new GameManager();
export const game3D = new GameManager();

// Convenience functions
export const initBabylon2D = () => game2D.init("game-canvas-2d", "2D");
export const initBabylon3D = () => game3D.init("game-canvas-3d", "3D");

export const pauseBabylon2D = () => game2D.pause();
export const resumeBabylon2D = () => game2D.resume();
export const disposeBabylon2D = () => game2D.dispose();

export const pauseBabylon3D = () => game3D.pause();
export const resumeBabylon3D = () => game3D.resume();
export const disposeBabylon3D = () => game3D.dispose();