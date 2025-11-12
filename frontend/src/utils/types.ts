import { ViewMode, Quality } from "./constants";
import { GameMode, AiDifficulty } from "../shared/constants";
import type { Powerup } from "../shared/types";
import { FreeCamera, Light, Mesh } from "@babylonjs/core";

export interface GameSetting {
	language: number;
	viewMode: ViewMode;
	scene3D: string;
	gameMode: GameMode | null;
	AiDifficulty: AiDifficulty;
	musicEnabled: boolean;
	soundEffectsEnabled: boolean;
	offlineTournamentSize: number;
	onlineTournamentSize: number;
	quality: Quality;

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

export interface Effects {
	leftGlow: Mesh;
	rightGlow: Mesh;
	leftCage: Mesh;
	rightCage: Mesh;
	ballsGlow: Mesh[];
	ballsFreeze: Mesh[];
	leftShield: Mesh;
	rightShield: Mesh;
}

export interface Players {
	left: Mesh;
	right: Mesh;
}

// Represents the game objects in a Babylon.js scene
export interface CoreGameObjects {
	players: Players;
	balls: Mesh[];
	gameField: Mesh;
	walls: Mesh[];
	cameras: FreeCamera[];
	guiCamera: FreeCamera;
	lights: Light;
}
export interface GameObjects extends CoreGameObjects {
    effects: Effects;
}

type MoveKeys = { left: number; right: number; };
type PowerKeys = { k1: number; k2: number; k3: number };
export type KeysProfile = { move: MoveKeys; power: PowerKeys };