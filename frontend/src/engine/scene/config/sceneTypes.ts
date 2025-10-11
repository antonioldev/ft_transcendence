import { Color3 } from "@babylonjs/core";

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
	particleType?: 'dust' | 'underwater' | 'rain' | 'snow' | 'lensFlare' | null;
	actors: ActorConfig[];
};

export enum MAP_OBJECT_TYPE {
	GROUND,
	WALLS,
	TERRAIN,
	PLAYER,
	BALL
}