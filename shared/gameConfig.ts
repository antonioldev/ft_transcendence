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
	cpu_names: ["Tom", "Richard", "Harry", "John", "Oliver", "William", "Jack", "Hugo",
				"Jane", "Sarah", "Suzie", "Sally", "Rebecca", "Rachel", "Karen", "Katie"],
	
	// Powerup settings
	slot_count: 3,				// number of powerup slots each player has
	increasedPaddleWidth: 6, // Width of the paddle when GROW_PADDLE activated
	decreasedPaddleWidth: 1.5, // Width of the paddle when SHRINK_PADDLE activated
	increasedPaddleSpeed: 22, // Speed of the paddle when INCREASE_PADDLE_SPEED activated
	decreasedPaddleSpeed: 4, // Speed of the paddle when SLOW_PADDLE activated
	powerupDuration: 7000,	   // time elapsed before powerup is deactivated
	freezeDuration: 1500.0, // duration of ball freeze
	powershotTimeLimit: 3000.0, // time limit to use powershot after activating
	invisibilityTimeLimit: 5000.0, // time limit to use powershot after activating
	curve_angle: -Math.PI / 1500,

	// Camera settings (mainly for frontend)
	camera2DHeight: 25, // Camera height in 2D mode
	camera3DHeight: 3, // Camera height in 3D mode
	camera3DDistance: 5, // Distance of the camera in 3D mode
	followSpeed: 0.1, // Speed at which the camera follows the paddle
	cameraFollowLimit: fieldWidth / 4, // Max limit for camera to follow player
	edgeBuffer: 13, // Buffer space at the edges of the field

	// Ball settings
	ballRadius: 0.3, // Radius of the ball
	ballServeSpeed: 5, // Initial speed of the ball
	ballInitialSpeed: 7, // Initial speed of the ball
	ballMaxAngle: Math.PI / 4, // Maximum angle of the ball trajectory
	ballMinAngle: Math.PI / 12, // Minimum angle of the ball trajectory
	ballSpeedIncrease: 1.1, // Speed multiplier after paddle hit
	ballPowerShotSpeed: 18, // Speed multiplier after paddle hit
	maxBallSpeed: 12,	   // Maximum ball speed
	
	// Wall collision boundaries (accounting for ball radius)
	wallBounds: {
		minX: -(fieldWidth / 2) + ballRadius,   // Left wall + wall thickness  
		maxX: (fieldWidth / 2) - ballRadius	 // Right wall - wall thickness
	},
	
	// Goal boundaries (behind paddles)
	goalBounds: {
		rightGoal: -(fieldHeight / 2),	// Behind top player
		leftGoal: (fieldHeight / 2)	  // Behind bottom player  
	},

	// Game mechanics
	scoreToWin: 50,		  // Points needed to win
	
	// Input mappings
	input2D: {
		playerLeft: { left: 87, right: 83 },	// W/S keys for left paddle
		playerRight: { left: 38, right: 40 }	// Up/Down arrows for right paddle
	},
	input3D: {
		playerLeft: { left: 65, right: 68 },	// A/D keys for left paddle  
		playerRight: { left: 39, right: 37 }	// Left/Right arrows for right paddle
	},
	
	// Timing
	startDelay: 8.0, // Delay before the game starts
	maxJoinWaitTime: 6.0, // Max time the server will wait for remote players to join before starting with CPU's

	minTournamentSize: 2, //3

} as const;

// CPU Difficulty: we pass this directly as the noise factor to regualate the CPU ability
export const CPUDifficultyMap: Record<AiDifficulty, number> = {
	[AiDifficulty.EASY]: 2.0,
	[AiDifficulty.MEDIUM]: 1.5,
	[AiDifficulty.HARD]: 1.0,
	[AiDifficulty.IMPOSSIBLE]: 0,
}

// Paddle/Player constants
export const LEFT = 0; // Identifier for the left paddle
export const RIGHT = 1; // Identifier for the right paddle

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

export const PLAYER_BOUNDARIES = {
	normal: {
		left: -(GAME_CONFIG.fieldWidth / 2 - GAME_CONFIG.wallThickness - GAME_CONFIG.paddleWidth / 2 - 0.2),
		right: GAME_CONFIG.fieldWidth / 2 - GAME_CONFIG.wallThickness - GAME_CONFIG.paddleWidth / 2 - 0.2
	},
	small: {
		left: -(GAME_CONFIG.fieldWidth / 2 - GAME_CONFIG.wallThickness - GAME_CONFIG.decreasedPaddleWidth / 2 - 0.2),
		right: GAME_CONFIG.fieldWidth / 2 - GAME_CONFIG.wallThickness - GAME_CONFIG.decreasedPaddleWidth / 2 - 0.2
	},
	large: {
		left: -(GAME_CONFIG.fieldWidth / 2 - GAME_CONFIG.wallThickness - GAME_CONFIG.increasedPaddleWidth / 2 - 0.2),
		right: GAME_CONFIG.fieldWidth / 2 - GAME_CONFIG.wallThickness - GAME_CONFIG.increasedPaddleWidth / 2 - 0.2
	}
} as const;

// Get the boundaries within which the paddle can move
export function getPlayerBoundaries(paddleWidth: number) {
	switch (paddleWidth) {
		case GAME_CONFIG.paddleWidth: return PLAYER_BOUNDARIES.normal;
		case GAME_CONFIG.decreasedPaddleWidth: return PLAYER_BOUNDARIES.small;
		case GAME_CONFIG.increasedPaddleWidth: return PLAYER_BOUNDARIES.large;
		default: return PLAYER_BOUNDARIES.normal;
	}
}

// Get the initial position of the ball
export function getBallStartPosition(): Position {
	return { x: 0, y: 1, z: 0 };
}
