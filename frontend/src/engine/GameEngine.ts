import { ViewMode, GameMode } from '../shared/constants.js';
import { BabylonEngine } from './BabylonEngine.js';

/**
 * GameEngine class manages the initialization, rendering, and lifecycle of the game engine.
 */
class GameEngine {
    private engine: BabylonEngine | null = null;
    private resizeHandler: (() => void) | null = null;

    /**
     * Initializes the game engine with the specified canvas and view mode.
     * @param canvasId - The ID of the canvas element.
     * @param mode - The view mode (2D or 3D).
     */
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

    /**
     * Pauses the game engine's rendering loop.
     */
    pause(): void { this.engine?.pause(); }

    /**
     * Resumes the game engine's rendering loop.
     */
    resume(): void { this.engine?.resume(); }

    /**
     * Disposes of the game engine and cleans up resources.
     */
    dispose(): void {
        if (this.resizeHandler) {
            window.removeEventListener("resize", this.resizeHandler);
            this.resizeHandler = null;
        }
        this.engine?.dispose();
        this.engine = null;
    }

    /**
     * Starts a single-player game mode.
     */
    startSinglePlayer(): void { this.engine?.startSinglePlayer(); }

    /**
     * Starts a two-player local game mode.
     */
    startTwoPlayerLocal(): void { this.engine?.startTwoPlayerLocal(); }
}

/**
 * Initializes the 2D game engine and starts the game in the specified mode.
 * @param gameMode - The game mode to start (e.g., single-player or two-player).
 */
export const init2D = async (gameMode: GameMode) => {
    await engine2D.init("game-canvas-2d", ViewMode.MODE_2D);
    // engine2D.startGame(gameMode);//TODO shall we create a single function?
    switch (gameMode) {
        case GameMode.SINGLE_PLAYER:
            engine2D.startSinglePlayer();
            break;
        case GameMode.TWO_PLAYER_LOCAL:
            engine2D.startTwoPlayerLocal();
            break;
        case GameMode.TWO_PLAYER_REMOTE:
            break; // TODO
        case GameMode.TOURNAMENT_LOCAL:
            break; // TODO
        case GameMode.TOURNAMENT_REMOTE:
            break; // TODO
        default:
            console.error("Unknown game mode:", gameMode);
            break;
    }
};

/**
 * Initializes the 3D game engine and starts the game in the specified mode.
 * @param gameMode - The game mode to start (e.g., single-player or two-player).
 */
export const init3D = async (gameMode: GameMode) => {
    await engine3D.init("game-canvas-3d", ViewMode.MODE_3D);
    switch (gameMode) {
        case GameMode.SINGLE_PLAYER:
            engine3D.startSinglePlayer();
            break;
        case GameMode.TWO_PLAYER_LOCAL:
            engine3D.startTwoPlayerLocal();
            break;
        case GameMode.TWO_PLAYER_REMOTE:
            break; // TODO
        case GameMode.TOURNAMENT_LOCAL:
            break; // TODO
        case GameMode.TOURNAMENT_REMOTE:
            break; // TODO
        default:
            console.error("Unknown game mode:", gameMode);
            break;
    }
};

export const engine2D = new GameEngine();
export const engine3D = new GameEngine();