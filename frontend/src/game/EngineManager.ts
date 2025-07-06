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

    startSinglePlayer(): void {
        if (this.engine) {
            console.log("Starting single player mode...");
            this.engine.startSinglePlayer();
        } else {
            console.error("❌ Engine not initialized - call init() first");
        }
    }

    startTwoPlayerLocal(): void {
        if (this.engine) {
            console.log("Starting two player local mode...");
            this.engine.startTwoPlayerLocal();
        } else {
            console.error("❌ Engine not initialized - call init() first");
        }
    }
}

export const initAndStartSinglePlayer2D = async () => {
    await game2D.init("game-canvas-2d", "2D");
    game2D.startSinglePlayer();
};

export const initAndStartSinglePlayer3D = async () => {
    await game3D.init("game-canvas-3d", "3D");
    game3D.startSinglePlayer();
};

export const initAndStartTwoPlayerLocal2D = async () => {
    await game2D.init("game-canvas-2d", "2D");
    game2D.startTwoPlayerLocal();
};

export const initAndStartTwoPlayerLocal3D = async () => {
    await game3D.init("game-canvas-3d", "3D");
    game3D.startTwoPlayerLocal();
};

// Export instances
export const game2D = new GameManager();
export const game3D = new GameManager();

export const startSinglePlayer2D = () => game2D.startSinglePlayer();
export const startSinglePlayer3D = () => game3D.startSinglePlayer();
export const startTwoPlayerLocal2D = () => game2D.startTwoPlayerLocal();
export const startTwoPlayerLocal3D = () => game3D.startTwoPlayerLocal();

// Convenience functions
export const initBabylon2D = () => game2D.init("game-canvas-2d", "2D");
export const initBabylon3D = () => game3D.init("game-canvas-3d", "3D");

export const pauseBabylon2D = () => game2D.pause();
export const resumeBabylon2D = () => game2D.resume();
export const disposeBabylon2D = () => game2D.dispose();

export const pauseBabylon3D = () => game3D.pause();
export const resumeBabylon3D = () => game3D.resume();
export const disposeBabylon3D = () => game3D.dispose();