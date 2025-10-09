import { Color3, Color4 } from "@babylonjs/core";

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
	type: 'flying' | 'swimming' | 'ground' | 'floating';
	scale?: number;
};

export type RainConfig = {
	density: number;
	speed: number;
	color: Color4;
	width: number;
	height: number;
};

export type MapAssetConfig = {
	ground: TextureSet;
	walls: TextureSet;
	ball: TextureSet;
	paddle: TextureSet;
	terrain: TextureSet;
	staticObjects: StaticObject[];
	skybox: string | null;
	light: number;
	glow: number;
	fogColor?: Color3 | null;
	rain?: RainConfig | null;
	particleType?: 'dust' | 'underwater' | null;
	actors: ActorConfig[];
};

export enum MAP_OBJECT_TYPE {
	GROUND,
	WALLS,
	TERRAIN,
	PLAYER,
	BALL
}