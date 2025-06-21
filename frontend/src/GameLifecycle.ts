import { gameStateManager, GameState } from './gameState.js';
import { hideOverlay, hidePauseDialog, showPauseDialog } from './styles.js';
import { disposeBabylon3D, pauseBabylon3D, resumeBabylon3D } from './game3d/babylon3d.js';


export function exitToMenu(): void {
    console.log("Exiting to menu...");

    const currentState = gameStateManager.getCurrentState();
    if (currentState === GameState.PAUSED_2D) {
        hideOverlay('game-2d');
        hidePauseDialog('pause-dialog-2d');
    }
    else if (currentState === GameState.PAUSED_3D) {
        disposeBabylon3D();
        hideOverlay('game-3d');
        hidePauseDialog('pause-dialog-3d');
    }

    // Set state back to menu
    gameStateManager.setState(GameState.MENU);
}

export function resumeGame(): void {

    const currentState = gameStateManager.getCurrentState();

    if (currentState === GameState.PAUSED_2D) {
        gameStateManager.setState(GameState.PLAYING_2D);
        hidePauseDialog('pause-dialog-2d');
    }
    else if (currentState === GameState.PAUSED_3D){
        gameStateManager.setState(GameState.PLAYING_3D);
        hidePauseDialog('pause-dialog-3d');
        resumeBabylon3D();
    }
}

export function pauseCurrentGame(): void {

    const currentState = gameStateManager.getCurrentState();

    if (currentState === GameState.PLAYING_2D) {
        gameStateManager.setState(GameState.PAUSED_2D);
        showPauseDialog('pause-dialog-2d');
    } else if (currentState === GameState.PLAYING_3D) {
        gameStateManager.setState(GameState.PAUSED_3D);
        showPauseDialog('pause-dialog-3d');
        pauseBabylon3D();
    }
}