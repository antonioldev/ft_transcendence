export enum GameState {
    MENU = 'menu',
    PLAYING_2D = 'playing_2d',
    PLAYING_3D = 'playing_3d',
    PAUSED_2D = 'paused_2d',
    PAUSED_3D = 'paused_3d'
}

import { hideOverlay, hidePauseDialog, showPauseDialog } from './styles.js';
import { 
    disposeBabylon3D, pauseBabylon3D, resumeBabylon3D, 
    disposeBabylon2D, pauseBabylon2D, resumeBabylon2D 
} from './game/EngineManager.js';

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
        console.log(`Game state: ${this.currentState} -> ${newState}`);
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
            pauseBabylon2D();
        } else if (this.currentState === GameState.PLAYING_3D) {
            this.setState(GameState.PAUSED_3D);
            showPauseDialog('pause-dialog-3d');
            pauseBabylon3D();
        }
    }

    resumeGame(): void {
        if (this.currentState === GameState.PAUSED_2D) {
            this.setState(GameState.PLAYING_2D);
            hidePauseDialog('pause-dialog-2d');
            resumeBabylon2D();
        } else if (this.currentState === GameState.PAUSED_3D) {
            this.setState(GameState.PLAYING_3D);
            hidePauseDialog('pause-dialog-3d');
            resumeBabylon3D();
        }
    }

    exitToMenu(): void {
        console.log("Exiting to menu...");

        if (this.currentState === GameState.PAUSED_2D) {
            disposeBabylon2D();
            hideOverlay('game-2d');
            hidePauseDialog('pause-dialog-2d');
        } else if (this.currentState === GameState.PAUSED_3D) {
            disposeBabylon3D();
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