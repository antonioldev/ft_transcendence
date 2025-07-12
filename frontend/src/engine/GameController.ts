import { ViewMode, GameMode } from '../shared/constants.js';
import { SceneManager } from './SceneManager.js';

/**
 * GameController class manages the initialization, rendering, and lifecycle of the game.
 * It coordinates between scene management and game sessions.
 */
class GameController {
    private sceneManager: SceneManager | null = null;
    private resizeHandler: (() => void) | null = null;

    // ========================================
    // INITIALIZATION
    // ========================================
    /**
     * Initializes the game controller with the specified canvas and view mode.
     * @param canvasId - The ID of the canvas element.
     * @param mode - The view mode (2D or 3D).
     */
    async init(canvasId: string, mode: ViewMode): Promise<void> {
        try {
            this.sceneManager = new SceneManager(canvasId);
            this.sceneManager.createEngine();
            this.sceneManager.createScene(mode);
            this.sceneManager.startRenderLoop();
            this.resizeHandler = () => this.sceneManager?.resize();
            window.addEventListener("resize", this.resizeHandler);
        } catch (error) {
            console.error(`Error initializing game ${mode}:`, error);
        }
    }

    // ========================================
    // GAME SESSION ACCESS
    // ========================================
    /**
     * Gets the GameSession to control game flow.
     * @returns The GameSession instance or null if not initialized.
     */
    getGameSession() {
        return this.sceneManager?.getGameSession() || null;
    }

    // ========================================
    // RENDER CONTROL
    // ========================================
    /**
     * Pauses the game rendering loop.
     */
    pause(): void { 
        this.sceneManager?.pause(); 
    }

    /**
     * Resumes the game rendering loop.
     */
    resume(): void { 
        this.sceneManager?.resume(); 
    }

    // ========================================
    // CLEANUP
    // ========================================
    /**
     * Disposes of the game controller and cleans up resources.
     */
    dispose(): void {
        if (this.resizeHandler) {
            window.removeEventListener("resize", this.resizeHandler);
            this.resizeHandler = null;
        }
        this.sceneManager?.dispose();
        this.sceneManager = null;
    }
}

// ========================================
// CONTROLLER INSTANCES
// ========================================
export const gameController2D = new GameController();
export const gameController3D = new GameController();

// ========================================
// INITIALIZATION FUNCTIONS
// ========================================
/**
 * Initializes the 2D game and starts the game in the specified mode.
 * @param gameMode - The game mode to start.
 */
export const init2D = async (gameMode: GameMode) => {
    await gameController2D.init("game-canvas-2d", ViewMode.MODE_2D);
    const gameSession = gameController2D.getGameSession();
    if (gameSession) {
        gameSession.startGame(gameMode);
    }
};

/**
 * Initializes the 3D game and starts the game in the specified mode.
 * @param gameMode - The game mode to start.
 */
export const init3D = async (gameMode: GameMode) => {
    await gameController3D.init("game-canvas-3d", ViewMode.MODE_3D);
    const gameSession = gameController3D.getGameSession();
    if (gameSession) {
        gameSession.startGame(gameMode);
    }
};