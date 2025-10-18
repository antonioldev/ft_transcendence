import { Color3 } from "@babylonjs/core";
import { MAP_OBJECT_TYPE, MapAssetConfig, StaticObject } from "./sceneTypes.js";
import { ParticleEffectType } from "./effectSceneConfig.js";

import mapLinesRaw from "../data/staticObjects/map.json";
const mapLines = mapLinesRaw as {
	lines: StaticObject[];
};

import map0BuildingsRaw from "../data/staticObjects/map0.json";
const map0Buildings = map0BuildingsRaw as {
	building1: StaticObject[];
	building2: StaticObject[];
	building3: StaticObject[];
	building4: StaticObject[];
};

import map1TreesRaw from "../data/staticObjects/map1.json";
const map1Trees = map1TreesRaw as {
	tree1: StaticObject[];
	tree2: StaticObject[];
};

import map2UnderwaterRaw from "../data/staticObjects/map2.json";
const map2Underwater = map2UnderwaterRaw as {
	rock1: StaticObject[];
	rock2: StaticObject[];
	coral1: StaticObject[];
	coral2: StaticObject[];
	wreck: StaticObject[];
};

import map3beachRaw from "../data/staticObjects/map3.json";
const map3beach = map3beachRaw as {
	palm: StaticObject[];
	bush: StaticObject[];
};

import map4SnowRaw from "../data/staticObjects/map4.json";
const map4Snow = map4SnowRaw as {
	castle: StaticObject[];
	castle2: StaticObject[];
	tree: StaticObject[];
}

import map5VolcanoRaw from "../data/staticObjects/map5.json";
const map5Volcano = map5VolcanoRaw as {
	stone: StaticObject[];
	stone2: StaticObject[];
}

import map6SpaceRaw from "../data/staticObjects/map6.json";
const map6Space = map6SpaceRaw as {
	asteroid: StaticObject[];
}

const ASSET_BASE = "assets";
const TEXTURE_BASE = `${ASSET_BASE}/textures`;
const MODEL_BASE = `${ASSET_BASE}/model`;

export const AssetPaths = {
	texture: (map: string, category: string, type: 'diff' | 'nor_gl' | 'rough' | 'height') =>
		`${TEXTURE_BASE}/${map}/${category}/${category}_${type}.jpg`,
	
	sky: (map: string, name: string) =>
		`${TEXTURE_BASE}/${map}/sky/${name}.hdr`,
	
	model: (map: string, name: string, ext: 'glb' | 'obj' = 'glb') =>
		`${MODEL_BASE}/${map}/${name}.${ext}`,
};

function createTextureSet(map: string, category: string, color: string, includeHeight = false) {
	return {
		diffuse: AssetPaths.texture(map, category, 'diff'),
		normal: AssetPaths.texture(map, category, 'nor_gl'),
		roughness: AssetPaths.texture(map, category, 'rough'),
		height: includeHeight ? AssetPaths.texture(map, category, 'height') : null,
		color
	};
}

function simpleColor(color: string) {
	return { diffuse: null, normal: null, roughness: null, height: null, color };
}

export const MAP_CONFIGS: Record<string, MapAssetConfig> = {
	map: {
		ground: simpleColor("#143D60"),
		walls: simpleColor("#FFFFFF"),
		ball: simpleColor("#FFFFFF"),
		paddle: simpleColor("#A0C878"),
		terrain: null,
		staticObjects: [
			...mapLines.lines
		],
		skybox: null,
		fogColor: null,
		fogIntensity: 0,
		particleType: null,
		light: 0.8,
		glow: 0.2,
		actors: []
	},
	map0: {
		ground: createTextureSet('map0', 'ground', "#281352"),
		walls: simpleColor("#281352"),
		ball: simpleColor("#cfcfcf"),
		paddle: simpleColor("#1a4d7a"),
		terrain: simpleColor("#281352"),
		staticObjects: [
			...map0Buildings.building1,
			...map0Buildings.building2,
			...map0Buildings.building3,
			...map0Buildings.building4
		],
		skybox: AssetPaths.sky('map0', 'sky4'),
		fogColor: new Color3(0.043, 0.043, 0.122),
		fogIntensity: 0.03,
		particleType: ParticleEffectType.RAIN,
		light: 0.4,
		glow: 0.6,
		actors: []
	},
	
	map1: {
		ground: createTextureSet('map1', 'ground', "#8B4513"),
		walls: createTextureSet('map1', 'wall', "#808080"),
		ball: createTextureSet('map1', 'ball', "#FFFFFF"),
		paddle: createTextureSet('map1', 'paddle', "#FFFFFF"),
		terrain: createTextureSet('map1', 'terrain', "#228B22", true),
		staticObjects: [
			...map1Trees.tree1,
			...map1Trees.tree2
		],
		skybox: AssetPaths.sky('map1', 'sky'),
		fogColor: null,
		fogIntensity: 0,
		particleType: ParticleEffectType.DUST,
		light: 0.8,
		glow: 0.5,
		actors: [
			{ model: 'assets/model/map1/bird1.glb', count: 4, type: 'flying', scale: 1 },
			{ model: 'assets/model/map1/bird2.glb', count: 4, type: 'flying', scale: 1 },
		]
	},
	
	map2: {
		ground: createTextureSet('map2', 'terrain', "#adb448"),
		walls: simpleColor("#5a3818ff"),
		ball: createTextureSet('map2', 'ball', "#fffb00"),
		paddle: createTextureSet('map2', 'paddle', "#670000"),
		terrain: createTextureSet('map2', 'terrain', "#adb448", true),
		staticObjects: [
			...map2Underwater.rock1,
			...map2Underwater.rock2,
			...map2Underwater.coral1,
			...map2Underwater.coral2,
			...map2Underwater.wreck
		],
		skybox: null,
		fogColor: new Color3(0.0, 0.2, 0.3),
		fogIntensity: 0.03,
		particleType: ParticleEffectType.UNDERWATER,
		light: 1,
		glow: 0.5,
		actors: [
			{ model: 'assets/model/map2/fish1.glb', count: 6, type: 'swimming', scale: 1 },
			{ model: 'assets/model/map2/fish2.glb', count: 6, type: 'swimming', scale: 1 },
		]
	},
	map3: {
		ground: createTextureSet('map3', 'terrain', "#adb448"),
		walls: createTextureSet('map3', 'wall', "#9D4EDD"),
		ball: simpleColor("#00F5FF"),
		paddle: simpleColor("#FF006E"),
		terrain: createTextureSet('map3', 'terrain', "#adb448", true),
		staticObjects: [
			...map3beach.palm,
			...map3beach.bush
		],
		skybox: AssetPaths.sky('map3', 'sky'),
		fogColor: new Color3(0.7, 0.4, 0.7),
		fogIntensity: 0.01,
		particleType: ParticleEffectType.LENS,
		light: 0.7,
		glow: 0.4,
		actors: []
	},
	map4: {
		ground: createTextureSet('map4', 'ground', "#ffffff"),
		walls: createTextureSet('map4', 'ground', "#ffffff"),
		ball: simpleColor("#ff4646"),
		paddle: simpleColor("#405cfd"),
		terrain: createTextureSet('map4', 'terrain', "#ffffff", true),
		staticObjects: [
			...map4Snow.castle,
			...map4Snow.castle2,
			...map4Snow.tree
		],
		skybox: AssetPaths.sky('map4', 'sky'),
		fogColor: new Color3(0.8, 0.85, 0.95),
		fogIntensity: 0.007,
		particleType: ParticleEffectType.SNOW,
		light: 1,
		glow: 0.1,
		actors: []
	},
	map5: {
		ground: createTextureSet('map5', 'ground', "#490f00"),
		walls: simpleColor("#8B0000"),
		ball: simpleColor("#c9ab00"),
		paddle: simpleColor("#b66700"),
		terrain: simpleColor("#FF4500"),
		staticObjects: [
			...map5Volcano.stone,
			...map5Volcano.stone2
		],
		skybox:AssetPaths.sky('map5', 'sky2'),
		fogColor: null,
		fogIntensity: 0,
		particleType: ParticleEffectType.SMOKE,
		light: 0.5,
		glow: 0.4,
		actors: []
	},
	map6: {
		ground: simpleColor("#000000"),
		walls: simpleColor("#000000"),
		ball: simpleColor("#fd8610"),
		paddle: simpleColor("#d4d4d4"),
		terrain: simpleColor("#000000"),
		staticObjects: [
			...map6Space.asteroid
		],
		skybox:AssetPaths.sky('map6', 'sky'),
		fogColor: new Color3(0.1, 0.1, 0.1),
		fogIntensity: 0.01,
		particleType: ParticleEffectType.STARS,
		light: 0.2,
		glow: 0.4,
		actors: [
			{ model: 'assets/model/map6/asteroidGroup.glb', count: 2, type: 'floating', scale: 1 },
		]
	}
};
export const TEXTURE_SCALING = {
	standardDivisor: 10,
	multipliers: {
		[MAP_OBJECT_TYPE.GROUND]: 1.0,
		[MAP_OBJECT_TYPE.WALLS]: 1.0,
		[MAP_OBJECT_TYPE.TERRAIN]: 1,
		[MAP_OBJECT_TYPE.PLAYER]: 0.33,
		[MAP_OBJECT_TYPE.BALL]: 13.33
	}
};