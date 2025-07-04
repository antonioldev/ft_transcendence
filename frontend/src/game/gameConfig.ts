
declare var BABYLON: any; //TODO need to find a way to keep one file for both back and front end

const fieldWidth = 50;
const fieldHeight = 100;

export const GAME_CONFIG = {
    // Field dimensions
    fieldWidth: fieldWidth,
    fieldHeight: fieldHeight,
    fieldBoundary: fieldWidth / 2,

    // Walls
    wallHeight: 1,
    wallThickness: 1,
    
    // Player settings
    playerWidth: 8,
    playerHeight: 0.5,
    playerDepth: 1.0,
    playerOffsetFromEdge: 2,
    playerSpeed: 0.5,
    
    // Camera settings
    camera2DHeight: 80,
    camera3DHeight: 10,
    camera3DDistance: 20,

    followSpeed : 0.1,
    edgeBuffer : 13,

    // Ball settings
    ballRadius: 0.5,
    ballInitialSpeed : 0.2,
    ballMaxAngle: Math.PI / 6,

    // Court boundaries (calculated from field dimensions)
    // courtBounds: {
    //     minZ: -(fieldHeight / 2),      // Top wall
    //     maxZ: fieldHeight / 2,         // Bottom wall  
    //     minX: -(fieldWidth / 2),       // Left goal line
    //     maxX: fieldWidth / 2           // Right goal line
    // },
    
    // Wall collision boundaries (accounting for ball radius)
    wallBounds: {
        minX: -(fieldWidth / 2) + 1,   // Left wall + wall thickness  
        maxX: (fieldWidth / 2) - 1     // Right wall - wall thickness
    },
    
    // Goal boundaries (behind paddles)
    goalBounds: {
        rightGoal: -(fieldHeight / 2) + 2,    // Behind top player
        leftGoal: (fieldHeight / 2) - 2   // Behind bottom player  
    },

    // Game mechanics
    serveRandomAngle: 0.3,  // Random Z velocity range on serve
    scoreToWin: 5,          // Points needed to win
    
    // Physics
    ballSpeedIncrease: 1.05, // Speed multiplier after paddle hit
    maxBallSpeed: 0.8,       // Maximum ball speed

    // Input mappings
    input2D: {
        playerLeft: { left: 87, right: 83 },    // W/S keys
        playerRight: { left: 38, right: 40 }    // Up/Down arrows
    },
    input3D: {
        playerLeft: { left: 65, right: 68 },    // A/D keys  
        playerRight: { left: 39, right: 37 }    // Left/Right arrows
    }  
};



// Add Babylon-specific configs
// export { GAME_CONFIG };


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

// Common Utility Functions
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
    return new BABYLON.Vector3(0, 1, 0);
}

export function getInitialBallVelocity(serveDirection: number) {
    const baseSpeed = GAME_CONFIG.ballInitialSpeed;
    const randomX = (Math.random() - 0.5) * GAME_CONFIG.serveRandomAngle;
    const randomZ = serveDirection * baseSpeed;
    return {
        x: randomX,
        z: randomZ
    };
}
// 3D View Utility Functions
export function getCamera3DPlayer1Position() {
    return new BABYLON.Vector3(0, GAME_CONFIG.camera3DHeight, -(GAME_CONFIG.fieldHeight/2 + GAME_CONFIG.camera3DDistance));
}

export function getCamera3DPlayer2Position() {
    return new BABYLON.Vector3(0, GAME_CONFIG.camera3DHeight, GAME_CONFIG.fieldHeight/2 + GAME_CONFIG.camera3DDistance);
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

// 2D View Utility Functions
export function getCamera2DPosition() {
    return new BABYLON.Vector3(0, GAME_CONFIG.camera2DHeight, 0);
}

export function get2DCameraViewport() {
    return new BABYLON.Viewport(0, 0, 1, 1);
}
