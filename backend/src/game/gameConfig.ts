const fieldWidth = 50;
const fieldHeight = 100;

//TODO need to find a way to keep one file for both back and front end
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
    
    // Camera settings (not used in backend but kept for consistency)
    camera2DHeight: 80,
    camera3DHeight: 10,
    camera3DDistance: 20,

    followSpeed: 0.1,
    edgeBuffer: 13,

    // Ball settings
    ballRadius: 0.5,
    ballInitialSpeed: 0.2,
    ballMaxAngle: Math.PI / 6,
    
    // Wall collision boundaries (accounting for ball radius)
    wallBounds: {
        minX: -(fieldWidth / 2) + 1,   // Left wall + wall thickness  
        maxX: (fieldWidth / 2) - 1     // Right wall - wall thickness
    },
    
    // Goal boundaries (behind paddles)
    goalBounds: {
        rightGoal: -(fieldHeight / 2) + 2,    // Behind top player
        leftGoal: (fieldHeight / 2) - 2      // Behind bottom player  
    },

    // Game mechanics
    serveRandomAngle: 0.3,  // Random Z velocity range on serve
    scoreToWin: 5,          // Points needed to win
    
    // Physics
    ballSpeedIncrease: 1.05, // Speed multiplier after paddle hit
    maxBallSpeed: 0.8,       // Maximum ball speed

    // Input mappings (for reference)
    input2D: {
        playerLeft: { left: 87, right: 83 },    // W/S keys
        playerRight: { left: 38, right: 40 }    // Up/Down arrows
    },
    input3D: {
        playerLeft: { left: 65, right: 68 },    // A/D keys  
        playerRight: { left: 39, right: 37 }    // Left/Right arrows
    }
}

export interface Position {
    x: number;
    y: number;
    z: number;
}

export interface Size {
    x: number;
    y: number;
    z: number;
}

export function getPlayerSize(): Size {
    return {
        x: GAME_CONFIG.playerWidth,
        y: GAME_CONFIG.playerHeight,
        z: GAME_CONFIG.playerDepth
    }
}

export function getPlayerLeftPosition(): Position {
    return {
        x: 0,
        y: 1,
        z: -(GAME_CONFIG.fieldHeight/2 - GAME_CONFIG.playerOffsetFromEdge)
    }
}

export function getPlayerRightPosition(): Position {
    return {
        x: 0,
        y: 1,
        z: GAME_CONFIG.fieldHeight/2 - GAME_CONFIG.playerOffsetFromEdge
    };
}

export function getPlayerBoundaries() {
    return {
        left: -(GAME_CONFIG.fieldWidth/2 - GAME_CONFIG.playerWidth/2 - GAME_CONFIG.wallThickness),
        right: GAME_CONFIG.fieldWidth/2 - GAME_CONFIG.playerWidth/2 - GAME_CONFIG.wallThickness
    };
}

export function getBallStartPosition(): Position {
    return { x: 0, y: 1, z: 0 };
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