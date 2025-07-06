import { ViewMode } from '../shared/constants.js';
import { BabylonEngine } from './BabylonEngine.js';

class GameEngine {
    private engine: BabylonEngine | null = null;
    private resizeHandler: (() => void) | null = null;

    async init(canvasId: string, mode: ViewMode): Promise<void> {
        try {
            this.engine = new BabylonEngine(canvasId);
            this.engine.createEngine();
            
            if (mode === ViewMode.MODE_2D) {
                this.engine.create2DScene();
            } else {
                this.engine.create3DScene();
            }
            
            this.engine.startRenderLoop();
            this.resizeHandler = () => this.engine?.resize();
            window.addEventListener("resize", this.resizeHandler);
        } catch (error) {
            console.error(`❌ Error initializing Babylon ${mode}:`, error);
        }
    }

    pause(): void { this.engine?.pause(); }
    resume(): void { this.engine?.resume(); }
    dispose(): void {
        if (this.resizeHandler) {
            window.removeEventListener("resize", this.resizeHandler);
            this.resizeHandler = null;
        }
        this.engine?.dispose();
        this.engine = null;
    }

    startSinglePlayer(): void { this.engine?.startSinglePlayer(); }
    startTwoPlayerLocal(): void { this.engine?.startTwoPlayerLocal(); }
}

export const init2D = async () => {
    await engine2D.init("game-canvas-2d", ViewMode.MODE_2D);
    engine2D.startTwoPlayerLocal();
};

export const init3D = async () => {
    await engine3D.init("game-canvas-3d", ViewMode.MODE_3D);
    engine3D.startTwoPlayerLocal();
};

export const engine2D = new GameEngine();
export const engine3D = new GameEngine();