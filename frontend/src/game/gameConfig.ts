declare var BABYLON: any;

const fieldWidth = 50;

export const GAME_CONFIG = {
    // Field dimensions
    fieldWidth: fieldWidth,
    fieldHeight: 100,
    fieldBoundary: fieldWidth / 2,

    // Walls
    wallHeight: 1,
    wallThickness: 1,
    
    // Player settings
    playerWidth: 8,
    playerHeight: 0.5,
    playerDepth: 0.5,
    playerOffsetFromEdge: 2,
    playerSpeed: 0.5,
    
    // Camera settings
    camera2DHeight: 80,
    
    camera3DHeight: 10,
    camera3DDistance: 20,
    followSpeed : 0.1,
    edgeBuffer : 13,

    // Input mappings
    input2D: {
        playerLeft: { left: 87, right: 83 },    // W/S keys
        playerRight: { left: 38, right: 40 }    // Up/Down arrows
    },
    input3D: {
        playerLeft: { left: 65, right: 68 },    // A/D keys  
        playerRight: { left: 37, right: 39 }    // Left/Right arrows
    }  
};

export function getPlayerSize() {
    return new BABYLON.Vector3(GAME_CONFIG.playerWidth, GAME_CONFIG.playerHeight, GAME_CONFIG.playerDepth);
}

export function getPlayerLeftPosition() {
    return new BABYLON.Vector3(0, 1, -(GAME_CONFIG.fieldHeight/2 - GAME_CONFIG.playerOffsetFromEdge));
}

export function getPlayerRightPosition() {
    return new BABYLON.Vector3(0, 1, GAME_CONFIG.fieldHeight/2 - GAME_CONFIG.playerOffsetFromEdge);
}

export function getPlayerBoundaries() {
    return {
        left: -(GAME_CONFIG.fieldWidth/2 - GAME_CONFIG.playerWidth/2 - GAME_CONFIG.wallThickness),
        right: GAME_CONFIG.fieldWidth/2 - GAME_CONFIG.playerWidth/2 - GAME_CONFIG.wallThickness
    };
}

export function getBallStartPosition() {
    return new BABYLON.Vector3(0, 5, GAME_CONFIG.fieldHeight/2 - 10);
}

export function getCamera3DPlayer1Position() {
    return new BABYLON.Vector3(0, GAME_CONFIG.camera3DHeight, -(GAME_CONFIG.fieldHeight/2 + GAME_CONFIG.camera3DDistance));
}

export function getCamera3DPlayer2Position() {
    return new BABYLON.Vector3(0, GAME_CONFIG.camera3DHeight, GAME_CONFIG.fieldHeight/2 + GAME_CONFIG.camera3DDistance);
}

export function getCamera2DPosition() {
    return new BABYLON.Vector3(0, GAME_CONFIG.camera2DHeight, 0);
}

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