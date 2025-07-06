import { hideOverlay, hidePauseDialog, showPauseDialog } from '../ui/styles.js';
import { engine2D, engine3D } from '../engine/GameEngine.js';
import { GameState } from './constants.js';

class GameStateManager {
    private currentState: GameState = GameState.MENU;
    private previousState: GameState = GameState.MENU;

// ===== STATE GETTERS =====
    getCurrentState(): GameState {
        return this.currentState;
    }

    getPreviousState(): GameState {
        return this.previousState;
    }

    setState(newState: GameState): void {
        this.previousState = this.currentState;
        this.currentState = newState;
    }

// ===== STATE CHECKS =====
    isInGame(): boolean {
        return this.currentState === GameState.PLAYING_2D || 
               this.currentState === GameState.PLAYING_3D;
    }

    isPaused(): boolean {
        return this.currentState === GameState.PAUSED_2D || 
               this.currentState === GameState.PAUSED_3D;
    }

    isInMenu(): boolean {
        return this.currentState === GameState.MENU;
    }

// ===== LIFECYCLE ACTIONS =====
    pauseCurrentGame(): void {
        if (this.currentState === GameState.PLAYING_2D) {
            this.setState(GameState.PAUSED_2D);
            showPauseDialog('pause-dialog-2d');
            engine2D.pause();
        } else if (this.currentState === GameState.PLAYING_3D) {
            this.setState(GameState.PAUSED_3D);
            showPauseDialog('pause-dialog-3d');
            engine3D.pause();
        }
    }

    resumeGame(): void {
        if (this.currentState === GameState.PAUSED_2D) {
            this.setState(GameState.PLAYING_2D);
            hidePauseDialog('pause-dialog-2d');
            engine2D.resume();
        } else if (this.currentState === GameState.PAUSED_3D) {
            this.setState(GameState.PLAYING_3D);
            hidePauseDialog('pause-dialog-3d');
            engine3D.resume();
        }
    }

    exitToMenu(): void {
        if (this.currentState === GameState.PAUSED_2D) {
            engine2D.dispose();
            hideOverlay('game-2d');
            hidePauseDialog('pause-dialog-2d');
        } else if (this.currentState === GameState.PAUSED_3D) {
            engine3D.dispose();
            hideOverlay('game-3d');
            hidePauseDialog('pause-dialog-3d');
        }

        this.setState(GameState.MENU);
    }

    startGame2D(): void {
        this.setState(GameState.PLAYING_2D);
    }

    startGame3D(): void {
        this.setState(GameState.PLAYING_3D);
    }
}

export const gameStateManager = new GameStateManager();