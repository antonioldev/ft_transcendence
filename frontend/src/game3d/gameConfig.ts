declare var BABYLON: any;

export const GAME_CONFIG = {
    // Field dimensions
    fieldWidth: 50,
    fieldHeight: 100,

    // Walls
    wallHeight: 1,
    wallThickness: 1,
    
    // Player settings
    playerWidth: 5,
    playerHeight: 0.5,
    playerDepth: 0.5,
    playerOffsetFromEdge: 2,
    playerSpeed: 0.5,
    
    // Camera settings
    cameraHeight: 10,
    cameraDistance: 20,
    followSpeed : 0.1,
    edgeBuffer : 13
};

export function getPlayerSize() {
    return new BABYLON.Vector3(GAME_CONFIG.playerWidth, GAME_CONFIG.playerHeight, GAME_CONFIG.playerDepth);
}

// Helper functions to calculate positions
export function getPlayerLeftPosition() {
    return new BABYLON.Vector3(0, 1, -(GAME_CONFIG.fieldHeight/2 - GAME_CONFIG.playerOffsetFromEdge));
}

export function getPlayerRightPosition() {
    return new BABYLON.Vector3(0, 1, GAME_CONFIG.fieldHeight/2 - GAME_CONFIG.playerOffsetFromEdge);
}

export function getPlayerBoundaries() {
    return {
        left: -(GAME_CONFIG.fieldWidth/2 - GAME_CONFIG.playerWidth/2),
        right: GAME_CONFIG.fieldWidth/2 - GAME_CONFIG.playerWidth/2
    };
}

export function getBallStartPosition() {
    return new BABYLON.Vector3(0, 5, GAME_CONFIG.fieldHeight/2 - 10);
}

export function getCamera1Position() {
    return new BABYLON.Vector3(0, GAME_CONFIG.cameraHeight, -(GAME_CONFIG.fieldHeight/2 + GAME_CONFIG.cameraDistance));
}

export function getCamera2Position() {
    return new BABYLON.Vector3(0, GAME_CONFIG.cameraHeight, GAME_CONFIG.fieldHeight/2 + GAME_CONFIG.cameraDistance);
}

export function getCamera1Viewport() {
    return new BABYLON.Viewport(0, 0, 0.5, 1);
}

export function getCamera2Viewport() {
    return new BABYLON.Viewport(0.5, 0, 0.5, 1);
}

export function getSoloCameraViewport() {
    return new BABYLON.Viewport(0, 0, 1, 1);
}