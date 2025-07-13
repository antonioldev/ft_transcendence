import { Game } from './Game.js';
import { GameConfig } from './GameConfig.js';

/**
 * Simplified Game Controller - manages single game instance
 * Replaces the old complex GameController + SceneManager + GameSession approach
 */
export class GameController {
    private currentGame: Game | null = null;
    private isStarting: boolean = false;

    // ========================================
    // GAME MANAGEMENT
    // ========================================

    /**
     * Start a new game with the given configuration
     */
    async startGame(config: GameConfig): Promise<void> {
        // Prevent multiple simultaneous starts
        if (this.isStarting) {
            console.warn('Game start already in progress');
            return;
        }

        // Stop existing game if running
        if (this.currentGame) {
            await this.endGame();
        }

        this.isStarting = true;

        try {
            console.log('GameController: Starting new game');

            // Create new game instance
            this.currentGame = new Game(config);

            // Initialize all components
            await this.currentGame.initialize();

            // Start the game
            this.currentGame.start();

            console.log('GameController: Game started successfully');

        } catch (error) {
            console.error('GameController: Error starting game:', error);
            
            // Cleanup on failure
            if (this.currentGame) {
                await this.currentGame.dispose();
                this.currentGame = null;
            }
            
            throw error;
        } finally {
            this.isStarting = false;
        }
    }

    /**
     * End the current game and clean up
     */
    async endGame(): Promise<void> {
        if (!this.currentGame) {
            return;
        }

        console.log('GameController: Ending current game');

        try {
            // Stop and dispose the game
            this.currentGame.stop();
            await this.currentGame.dispose();

        } catch (error) {
            console.error('GameController: Error ending game:', error);
        } finally {
            this.currentGame = null;
        }

        console.log('GameController: Game ended successfully');
    }

    // ========================================
    // GAME CONTROL
    // ========================================

    /**
     * Pause the current game
     */
    pauseGame(): void {
        if (this.currentGame && this.currentGame.isGameRunning()) {
            this.currentGame.pause();
            console.log('GameController: Game paused');
        }
    }

    /**
     * Resume the current game
     */
    resumeGame(): void {
        if (this.currentGame && this.currentGame.isGameInitialized() && !this.currentGame.isGameRunning()) {
            this.currentGame.resume();
            console.log('GameController: Game resumed');
        }
    }

    // ========================================
    // STATE QUERIES
    // ========================================

    /**
     * Check if a game is currently running
     */
    hasActiveGame(): boolean {
        return this.currentGame !== null && this.currentGame.isGameInitialized();
    }

    /**
     * Check if current game is running (not paused)
     */
    isGameRunning(): boolean {
        return this.currentGame !== null && this.currentGame.isGameRunning();
    }

    /**
     * Check if current game is paused
     */
    isGamePaused(): boolean {
        return this.currentGame !== null && 
               this.currentGame.isGameInitialized() && 
               !this.currentGame.isGameRunning();
    }

    /**
     * Get current game configuration
     */
    getCurrentGameConfig(): GameConfig | null {
        return this.currentGame?.getConfig() || null;
    }

    // ========================================
    // CLEANUP
    // ========================================

    /**
     * Dispose the controller and any active game
     */
    async dispose(): Promise<void> {
        console.log('GameController: Disposing controller');
        
        if (this.currentGame) {
            await this.endGame();
        }
    }
}

// ========================================
// SINGLETON INSTANCES
// ========================================

// Single controller instance for the entire application
export const gameController = new GameController();