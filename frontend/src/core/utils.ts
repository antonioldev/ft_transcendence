declare var BABYLON: any;

import { GAME_CONFIG } from '../shared/gameConfig.js';

// Colors for Babylon.js (frontend only)
export const COLORS = {
    field2D: BABYLON.Color3.Black(),
    field3D: new BABYLON.Color3(0.4, 0.6, 0.4),
    player1_2D: BABYLON.Color3.Red(),
    player2_2D: BABYLON.Color3.White(),
    player1_3D: new BABYLON.Color3(0.89, 0.89, 0),
    player2_3D: new BABYLON.Color3(1, 0, 0),
    ball2D: BABYLON.Color3.White(),
    ball3D: new BABYLON.Color3(0.89, 0.89, 1),
    walls2D: BABYLON.Color3.White(),
    walls3D: new BABYLON.Color3(0.8, 0.8, 0.8),
};

// BABYLON-specific utility functions
export function getPlayerSize() {
    return new BABYLON.Vector3(GAME_CONFIG.playerWidth, GAME_CONFIG.playerHeight, GAME_CONFIG.playerDepth);
}

export function getPlayerLeftPosition() {
    return new BABYLON.Vector3(0, 1, -(GAME_CONFIG.fieldHeight/2 - GAME_CONFIG.playerOffsetFromEdge));
}

export function getPlayerRightPosition() {
    return new BABYLON.Vector3(0, 1, GAME_CONFIG.fieldHeight/2 - GAME_CONFIG.playerOffsetFromEdge);
}

export function getBallStartPosition() {
    return new BABYLON.Vector3(0, 1, 0);
}

// Camera positions
export function getCamera2DPosition() {
    return new BABYLON.Vector3(0, GAME_CONFIG.camera2DHeight, 0);
}

export function getCamera3DPlayer1Position() {
    return new BABYLON.Vector3(0, GAME_CONFIG.camera3DHeight, -(GAME_CONFIG.fieldHeight/2 + GAME_CONFIG.camera3DDistance));
}

export function getCamera3DPlayer2Position() {
    return new BABYLON.Vector3(0, GAME_CONFIG.camera3DHeight, GAME_CONFIG.fieldHeight/2 + GAME_CONFIG.camera3DDistance);
}

// Viewports
export function get2DCameraViewport() {
    return new BABYLON.Viewport(0, 0, 1, 1);
}

export function get3DCamera1Viewport() {
    return new BABYLON.Viewport(0, 0, 0.5, 1);
}

export function get3DCamera2Viewport() {
    return new BABYLON.Viewport(0.5, 0, 0.5, 1);
}

export function get3DSoloCameraViewport() {
    return new BABYLON.Viewport(0, 0, 1, 1);
}