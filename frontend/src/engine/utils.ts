declare var BABYLON: typeof import('@babylonjs/core'); // declare var BABYLON: any;

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
    return new BABYLON.Vector3(GAME_CONFIG.paddleWidth, GAME_CONFIG.paddleHeight, GAME_CONFIG.paddleDepth);
}

export function getPlayerLeftPosition() {
    // Returns the starting position of the left player
    return new BABYLON.Vector3(0, 0.5, -(GAME_CONFIG.fieldHeight/2 - GAME_CONFIG.paddleOffsetFromEdge));
}

export function getPlayerRightPosition() {
    // Returns the starting position of the right player
    return new BABYLON.Vector3(0, 0.5, GAME_CONFIG.fieldHeight/2 - GAME_CONFIG.paddleOffsetFromEdge);
}

export function getBallStartPosition() {
    // Returns the starting position of the ball
    return new BABYLON.Vector3(0, 0.3, 0);
}

// Camera position utility functions
export function getCamera2DPosition() {
    // Returns the position of the 2D camera
    return new BABYLON.Vector3(3, GAME_CONFIG.camera2DHeight, 0);
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
const VIEWPORTS = {
    FULLSCREEN: new BABYLON.Viewport(0, 0, 1, 1),
    LEFT_HALF: new BABYLON.Viewport(0, 0, 0.5, 1),
    RIGHT_HALF: new BABYLON.Viewport(0.5, 0, 0.5, 1),
};

export function getSoloCameraViewport() {
    return VIEWPORTS.FULLSCREEN;
}

export function get3DCamera1Viewport() {
    return VIEWPORTS.LEFT_HALF;
}

export function get3DCamera2Viewport() {
    return VIEWPORTS.RIGHT_HALF;
}



