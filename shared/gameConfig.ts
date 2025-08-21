// !!!!!!! Please update file in the root folder if you want to change or add something
// Shared game configuration between frontend and backend

import { Position, Size } from './types.js';
import { AiDifficulty } from './constants.js';

const fieldWidth = 20; // Width of the game field
const fieldHeight = 40; // Height of the game field
const ballRadius = 0.3;

export const GAME_CONFIG = {
    // Field dimensions
    fieldWidth: fieldWidth, // Field width
    fieldHeight: fieldHeight, // Field height
    fieldBoundary: fieldWidth / 2, // Half of the field width

    // Walls
    wallHeight: 0.5, // Height of the walls
    wallThickness: 0.5, // Thickness of the walls
    
    // Player settings
    paddleWidth: 3, // Width of the paddle
    paddleHeight: 0.5, // Height of the paddle
    paddleDepth: 0.5, // Depth of the paddle
    paddleOffsetFromEdge: 2, // Distance from the edge of the field
    paddleSpeed: 15, // Speed of the paddle
    
    // Camera settings (mainly for frontend)
    camera2DHeight: 25, // Camera height in 2D mode
    camera3DHeight: 3, // Camera height in 3D mode
    camera3DDistance: 5, // Distance of the camera in 3D mode
    followSpeed: 0.1, // Speed at which the camera follows the paddle
    cameraFollowLimit: fieldWidth / 4, // Max limit for camera to follow player
    edgeBuffer: 13, // Buffer space at the edges of the field

    // Ball settings
    ballRadius: 0.3, // Radius of the ball
    ballInitialSpeed: 6, // Initial speed of the ball
    ballMaxAngle: Math.PI / 4, // Maximum angle of the ball trajectory
    ballMinAngle: Math.PI / 12, // Minimum angle of the ball trajectory
    ballSpeedIncrease: 1.05, // Speed multiplier after paddle hit
    maxBallSpeed: 12,       // Maximum ball speed
    
    // Wall collision boundaries (accounting for ball radius)
    wallBounds: {
        minX: -(fieldWidth / 2) + ballRadius,   // Left wall + wall thickness  
        maxX: (fieldWidth / 2) - ballRadius     // Right wall - wall thickness
    },
    
    // Goal boundaries (behind paddles)
    goalBounds: {
        rightGoal: -(fieldHeight / 2),    // Behind top player
        leftGoal: (fieldHeight / 2)      // Behind bottom player  
    },

    // Game mechanics
    scoreToWin: 1,          // Points needed to win
    
    // Input mappings
    input2D: {
        playerLeft: { left: 87, right: 83 },    // W/S keys for left paddle
        playerRight: { left: 38, right: 40 }    // Up/Down arrows for right paddle
    },
    input3D: {
        playerLeft: { left: 65, right: 68 },    // A/D keys for left paddle  
        playerRight: { left: 39, right: 37 }    // Left/Right arrows for right paddle
    },
    
    // Timing
    startDelay: 3.0, // Delay before the game starts
    ballDelay: 1.0, // Delay before the ball starts between rounds
    maxJoinWaitTime: 30.0, // Max time the server will wait for remote players to join before starting with CPU's

} as const;

    // CPU Difficulty: we pass this directly as the noise factor to regualate the CPU ability
export const CPUDifficultyMap: Record<AiDifficulty, number> = {
    [AiDifficulty.EASY]: 3,
    [AiDifficulty.MEDIUM]: 2,
    [AiDifficulty.HARD]: 1.5,
    [AiDifficulty.IMPOSSIBLE]: 0,
}

// Paddle/Player constants
export const LEFT_PADDLE = 0; // Identifier for the left paddle
export const RIGHT_PADDLE = 1; // Identifier for the right paddle
export const BALL = 2; // Identifier for the ball

// Utility functions that work for both frontend and backend

// Get the size of the paddle
export function getPlayerSize(): Size {
    return {
        x: GAME_CONFIG.paddleWidth,
        y: GAME_CONFIG.paddleHeight,
        z: GAME_CONFIG.paddleDepth
    };
}

// Get the initial position of the left paddle
export function getPlayerLeftPosition(): Position {
    return {
        x: 0,
        y: 1,
        z: -(GAME_CONFIG.fieldHeight/2 - GAME_CONFIG.paddleOffsetFromEdge)
    };
}

// Get the initial position of the right paddle
export function getPlayerRightPosition(): Position {
    return {
        x: 0,
        y: 1,
        z: GAME_CONFIG.fieldHeight/2 - GAME_CONFIG.paddleOffsetFromEdge
    };
}

const PLAYER_BOUNDARIES = {
    left: -(GAME_CONFIG.fieldWidth / 2 - GAME_CONFIG.wallThickness - GAME_CONFIG.paddleWidth / 2 - 0.2),
    right: GAME_CONFIG.fieldWidth / 2 - GAME_CONFIG.wallThickness - GAME_CONFIG.paddleWidth / 2 - 0.2
};

// Get the boundaries within which the paddle can move
export function getPlayerBoundaries() {
    return PLAYER_BOUNDARIES;
}

// Get the initial position of the ball
export function getBallStartPosition(): Position {
    return { x: 0, y: 1, z: 0 };
}
