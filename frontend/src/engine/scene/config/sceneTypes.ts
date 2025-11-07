import { AbstractMesh, Color3 } from "@babylonjs/core";
import { Color4, Vector3 } from "@babylonjs/core";
import type { ParticleEffectType } from "./sceneConst";

export type StaticObject = {
	model: string;
	pos: [number, number, number];
	rot: number;
	scale: number;
	lighted?: boolean;
};

export type TextureSet = {
	diffuse: string | null;
	normal: string | null;
	roughness: string | null;
	color: string;
	height?: string | null;
};

export type ActorConfig = {
	model: string;
	count: number;
	type: 'flying' | 'swimming' | 'floating' | 'walking';
	scale?: number;
};

export type MapAssetConfig = {
	ground: TextureSet;
	walls: TextureSet;
	ball: TextureSet;
	paddle: TextureSet;
	light: number;
	glow: number;
	
	terrain: TextureSet | null;
	staticObjects: StaticObject[];
	skybox: string | null;
	fogColor?: Color3 | null;
	fogIntensity: number;
	particleType?: ParticleEffectType | null;
	actors: ActorConfig[];
};

export type ParticleConfig = {
	name: string;
	capacity: number;
	texturePath: string;
	emitter: {
		position: Vector3;
		minBox: Vector3;
		maxBox: Vector3;
	};
	direction: {
		dir1: Vector3;
		dir2: Vector3;
	};
	size: {
		min: number;
		max: number;
	};
	lifetime: {
		min: number;
		max: number;
	};
	emitRate: number;
	color: {
		color1: Color4;
		color2: Color4;
		colorDead?: Color4;
	};
	gravity: Vector3;
	angularSpeed?: {
		min: number;
		max: number;
	};
	blendMode?: number;
	autoStart?: boolean;
}

type ThemeActor = { update: (dt: number) => void; dispose: () => void };
type ThemeEffect = { dispose: () => void };

export type ThemeObject = {
  props: AbstractMesh[];         // static meshes
  actors: ThemeActor[]; // moving things
  effects: ThemeEffect[]; // glow layer, particle systems, post-process, etc.
};

