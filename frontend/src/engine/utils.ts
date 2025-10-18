import { Vector3, Viewport } from "@babylonjs/core";
import { GAME_CONFIG } from '../shared/gameConfig.js';
import { Powerup } from "../shared/types.js";
import { KeysProfile } from "./services/KeybordManager.js";

// Utility functions for Babylon.js game objects
// They get datas from gameConfig TypeScript and convert them to Babylon.js objects

export function getPlayerSize() {
	// Returns the size of a player as a Vector3 object
	return new Vector3(GAME_CONFIG.paddleWidth, GAME_CONFIG.paddleHeight, GAME_CONFIG.paddleDepth);
}

export function getPlayerLeftPosition() {
	// Returns the starting position of the left player
	return new Vector3(0, 0.5, -(GAME_CONFIG.fieldHeight / 2 - GAME_CONFIG.paddleOffsetFromEdge));
}

export function getPlayerRightPosition() {
	// Returns the starting position of the right player
	return new Vector3(0, 0.5, GAME_CONFIG.fieldHeight / 2 - GAME_CONFIG.paddleOffsetFromEdge);
}

export function getBallStartPosition() {
	// Returns the starting position of the ball
	return new Vector3(0, 0.3, 0);
}

// Camera position utility functions
export function getCamera2DPosition() {
	// Returns the position of the 2D camera
	return new Vector3(3, GAME_CONFIG.camera2DHeight, 0);
}

export function getCamera3DPlayer1Position() {
	// Returns the position of the 3D camera for Player 1
	return new Vector3(0, GAME_CONFIG.camera3DHeight, -(GAME_CONFIG.fieldHeight / 2 + GAME_CONFIG.camera3DDistance));
}

export function getCamera3DPlayer2Position() {
	// Returns the position of the 3D camera for Player 2
	return new Vector3(0, GAME_CONFIG.camera3DHeight, GAME_CONFIG.fieldHeight / 2 + GAME_CONFIG.camera3DDistance);
}

// Viewport utility functions
const VIEWPORTS = {
	FULLSCREEN: new Viewport(0, 0, 1, 1),
	LEFT_HALF: new Viewport(0, 0, 0.5, 1),
	RIGHT_HALF: new Viewport(0.5, 0, 0.5, 1),
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

export enum PlayerSide {
	LEFT = 0,
	RIGHT = 1
}

export interface PlayerState {
	name: string;
	isControlled: boolean;
	keyboardProfile?: KeysProfile;
	size: number;
	score: number;
	powerUpsAssigned: boolean;
	powerUps: Powerup [];
	inverted: boolean;
}

export function randomFromRange(min: number, max: number): number {
	return Math.random() * (max - min) + min;
}

export function randomFromArray(arr: string[]): string {
	return arr[Math.floor(Math.random() * arr.length)];
}
