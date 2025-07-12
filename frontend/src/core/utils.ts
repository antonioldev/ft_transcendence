declare var BABYLON: any;

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