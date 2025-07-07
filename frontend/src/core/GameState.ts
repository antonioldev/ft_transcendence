import { uiManager } from '../ui/UIManager.js';
import { engine2D, engine3D } from '../engine/GameEngine.js';
import { GameState } from '../shared/constants.js';

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
            uiManager.showPauseDialog('pause-dialog-2d');
            engine2D.pause();
        } else if (this.currentState === GameState.PLAYING_3D) {
            this.setState(GameState.PAUSED_3D);
            uiManager.showPauseDialog('pause-dialog-3d');
            engine3D.pause();
        }
    }

    resumeGame(): void {
        if (this.currentState === GameState.PAUSED_2D) {
            this.setState(GameState.PLAYING_2D);
            uiManager.hidePauseDialog('pause-dialog-2d');
            engine2D.resume();
        } else if (this.currentState === GameState.PAUSED_3D) {
            this.setState(GameState.PLAYING_3D);
            uiManager.hidePauseDialog('pause-dialog-3d');
            engine3D.resume();
        }
    }

    exitToMenu(): void {
        if (this.currentState === GameState.PAUSED_2D) {
            engine2D.dispose();
            uiManager.hidePauseDialog('pause-dialog-2d');
        } else if (this.currentState === GameState.PAUSED_3D) {
            engine3D.dispose();
            uiManager.hidePauseDialog('pause-dialog-3d');
        }

        this.setState(GameState.MENU);
        uiManager.showScreen('main-menu');
    }

    startGame2D(): void {
        this.setState(GameState.PLAYING_2D);
    }

    startGame3D(): void {
        this.setState(GameState.PLAYING_3D);
    }
}

export const gameStateManager = new GameStateManager();