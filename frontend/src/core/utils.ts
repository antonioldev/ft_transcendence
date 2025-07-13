declare var BABYLON: any;

import { gameController } from '../engine/GameController.js';
import { appStateManager } from './AppStateManager.js';
import { uiManager } from '../ui/UIManager.js';
import { GAME_CONFIG } from '../shared/gameConfig.js';

// Colors for Babylon.js (frontend only)
export const COLORS = {
    field2D: BABYLON.Color3.Black(),
    field3D: new BABYLON.Color3(0.4, 0.6, 0.4),
    player1_2D: BABYLON.Color3.Blue(),
    player2_2D: BABYLON.Color3.White(),
    player1_3D: new BABYLON.Color3(0.89, 0.89, 0),
    player2_3D: new BABYLON.Color3(1, 0, 0),
    ball2D: BABYLON.Color3.White(),
    ball3D: new BABYLON.Color3(0.89, 0.89, 1),
    walls2D: BABYLON.Color3.White(),
    walls3D: new BABYLON.Color3(0.8, 0.8, 0.8),
};

// Utility functions for Babylon.js game objects
// They get datas from gameConfig TypeScript and convert them to Babylon.js objects

export function getPlayerSize() {
    // Returns the size of a player as a Vector3 object
    return new BABYLON.Vector3(GAME_CONFIG.playerWidth, GAME_CONFIG.playerHeight, GAME_CONFIG.playerDepth);
}

export function getPlayerLeftPosition() {
    // Returns the starting position of the left player
    return new BABYLON.Vector3(0, 1, -(GAME_CONFIG.fieldHeight/2 - GAME_CONFIG.playerOffsetFromEdge));
}

export function getPlayerRightPosition() {
    // Returns the starting position of the right player
    return new BABYLON.Vector3(0, 1, GAME_CONFIG.fieldHeight/2 - GAME_CONFIG.playerOffsetFromEdge);
}

export function getBallStartPosition() {
    // Returns the starting position of the ball
    return new BABYLON.Vector3(0, 1, 0);
}

// Camera position utility functions
export function getCamera2DPosition() {
    // Returns the position of the 2D camera
    return new BABYLON.Vector3(0, GAME_CONFIG.camera2DHeight, 0);
}

export function getCamera3DPlayer1Position() {
    // Returns the position of the 3D camera for Player 1
    return new BABYLON.Vector3(0, GAME_CONFIG.camera3DHeight, -(GAME_CONFIG.fieldHeight/2 + GAME_CONFIG.camera3DDistance));
}

export function getCamera3DPlayer2Position() {
    // Returns the position of the 3D camera for Player 2
    return new BABYLON.Vector3(0, GAME_CONFIG.camera3DHeight, GAME_CONFIG.fieldHeight/2 + GAME_CONFIG.camera3DDistance);
}

// Viewport utility functions
export function get2DCameraViewport() {
    // Returns the viewport configuration for the 2D camera
    return new BABYLON.Viewport(0, 0, 1, 1);
}

export function get3DCamera1Viewport() {
    // Returns the viewport configuration for the 3D camera of Player 1
    return new BABYLON.Viewport(0, 0, 0.5, 1);
}

export function get3DCamera2Viewport() {
    // Returns the viewport configuration for the 3D camera of Player 2
    return new BABYLON.Viewport(0.5, 0, 0.5, 1);
}

export function get3DSoloCameraViewport() {
    // Returns the viewport configuration for a solo 3D camera
    return new BABYLON.Viewport(0, 0, 1, 1);
}

export function clearInput(id: string): void {
    const input = document.getElementById(id) as HTMLInputElement;
    if (input) {
        input.value = '';
    }
}

/**
 * One function to dispose current game using new architecture
 */
export async function disposeCurrentGame(): Promise<void> {
    console.log('Disposing current game...');
    
    try {
        // 1. Hide all pause dialogs first
        uiManager.hidePauseOverlays('pause-dialog-2d');
        uiManager.hidePauseOverlays('pause-dialog-3d');
        
        // 2.  NEW: Single call to dispose game using new controller
        await gameController.endGame();
        
        // 3. Reset game state manager (it should handle this internally, but just in case)
        appStateManager.resetToMenu();
        
        console.log(' Game disposed successfully with new architecture');
    } catch (error) {
        console.error('❌ Error during disposal:', error);
    }
}

/**
 * Check if any game is currently active
 */
export function isAnyGameActive(): boolean {
    return appStateManager.isInGameOrPaused() || gameController.hasActiveGame();
}

/**
 * Check if game is currently running (not paused)
 */
export function isGameRunning(): boolean {
    return gameController.isGameRunning();
}

/**
 * Check if game is currently paused
 */
export function isGamePaused(): boolean {
    return gameController.isGamePaused();
}

/**
 * Get current game info for debugging
 */
export function getGameInfo(): any {
    return {
        stateManager: appStateManager.getGameInfo ? appStateManager.getGameInfo() : 'N/A',
        controller: {
            hasActiveGame: gameController.hasActiveGame(),
            isRunning: gameController.isGameRunning(),
            isPaused: gameController.isGamePaused()
        }
    };
}