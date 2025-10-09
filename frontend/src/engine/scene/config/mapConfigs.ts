import { Color3, Color4 } from "@babylonjs/core";
import { GAME_CONFIG } from "../../../shared/gameConfig.js";
import { MapAssetConfig, StaticObject, MAP_OBJECT_TYPE } from "./sceneTypes.js"

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

const fw = GAME_CONFIG.fieldWidth;
const fh = GAME_CONFIG.fieldHeight;

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
	map0: {
		ground: createTextureSet('map0', 'ground', "#281352"),
		walls: simpleColor("#281352"),
		ball: simpleColor("#fffb00"),
		paddle: simpleColor("#670000"),
		terrain: createTextureSet('map0', 'terrain', "#281352"),
		staticObjects: [
			...map0Buildings.building1,
			...map0Buildings.building2,
			...map0Buildings.building3,
			...map0Buildings.building4
		],
		skybox: AssetPaths.sky('map0', 'sky4'),
		fogColor: new Color3(0.043, 0.043, 0.122),
		particleType: null,
		rain: {
			density: 1500,
			speed: 50,
			color: new Color4(0, 1, 1, 0),
			width: fw * 2,
			height: fh * 2
		},
		light: 0.3,
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
		particleType: 'dust',
		rain: null,
		light: 0.8,
		glow: 0,
		actors: [
			{ model: 'assets/model/map1/bird1.glb', count: 4, type: 'flying', scale: 1 },
			{ model: 'assets/model/map1/bird2.glb', count: 4, type: 'flying', scale: 1 },
		]
	},
	
	map2: {
		ground: createTextureSet('map2', 'terrain', "#adb448ff"),
		walls: simpleColor("#5a3818ff"),
		ball: createTextureSet('map2', 'ball', "#fffb00"),
		paddle: createTextureSet('map2', 'paddle', "#670000"),
		terrain: createTextureSet('map2', 'terrain', "#adb448ff", true),
		staticObjects: [
			...map2Underwater.rock1,
			...map2Underwater.rock2,
			...map2Underwater.coral1,
			...map2Underwater.coral2,
			...map2Underwater.wreck
		],
		skybox: null,
		fogColor: new Color3(0.0, 0.2, 0.3),
		rain: null,
		particleType: 'underwater',
		light: 1,
		glow: 0,
		actors: [
			{ model: 'assets/model/map2/fish1.glb', count: 6, type: 'swimming', scale: 1 },
			{ model: 'assets/model/map2/fish2.glb', count: 6, type: 'swimming', scale: 1 },
		]
	},
};

export const TEXTURE_SCALING = {
	standardDivisor: 10,
	multipliers: {
		[MAP_OBJECT_TYPE.GROUND]: 1.0,
		[MAP_OBJECT_TYPE.WALLS]: 1.0,
		[MAP_OBJECT_TYPE.TERRAIN]: 1.0,
		[MAP_OBJECT_TYPE.PLAYER]: 5.0,
		[MAP_OBJECT_TYPE.BALL]: 8.0
	}
};