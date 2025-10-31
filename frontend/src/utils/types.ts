import { ViewMode } from "./constants";
import { GameMode, AiDifficulty } from "../shared/constants";
import { Powerup } from "../shared/types";

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

}

export interface Players {
	left: any;
	right: any;
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
	leftGlow: any;
	rightGlow: any;
	leftCage: any;
	rightCage: any;
	ballsGlow: any[];
	ballsFreeze: any[];
	leftShield: any;
	rightShield: any;
}

// Represents the game objects in a Babylon.js scene
export interface GameObjects {
	players: Players;
	balls: any[];
	gameField: any;
	walls: any;
	cameras: any[];
	guiCamera: any;
	lights: any[];
	effects: Effects;
	// players: {
	// 	left: Mesh;
	// 	right: Mesh;
	// };
	// ball: Mesh;
	// gameField: Mesh;
	// walls: Mesh[];
	// cameras: Camera[];
	// guiCamera: Camera;
	// lights: Light[]; // TODO
}

type ThemeActor = { update: (dt: number) => void; dispose: () => void };
type ThemeEffect = { dispose: () => void };

export type ThemeObject = {
  props: any[];         // static meshes (trees/bushes now; wreck/rocks later)
  actors: ThemeActor[]; // moving things later (clouds, fish, bubbles)
  effects: ThemeEffect[]; // glow layer, particle systems, post-process, etc.
};


type MoveKeys = { left: number; right: number; };
type PowerKeys = { k1: number; k2: number; k3: number };
export type KeysProfile = { move: MoveKeys; power: PowerKeys };