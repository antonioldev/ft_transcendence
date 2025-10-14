import { Color3, HDRCubeTexture, HemisphericLight, MeshBuilder, Scene, Vector3 } from "@babylonjs/core";
import { GridMaterial } from "@babylonjs/materials";
import { ViewMode } from '../../../shared/constants.js';
import { GAME_CONFIG } from '../../../shared/gameConfig.js';
import { Logger } from '../../../utils/LogManager.js';
import { MAP_OBJECT_TYPE, MapAssetConfig, TextureSet } from "../config/sceneTypes.js";
import { createLavaMaterial, createMaterial, getStandardTextureScale } from '../rendering/materials.js';
import { MAP_CONFIGS } from "../config/mapConfigs.js";

// Creates HDRI environment with fallback to default environment
export function createEnvironment(scene: Scene, path: string | null): void {
	if (!path) return;
	try {
		const hdrTexture = new HDRCubeTexture(path, scene, 1024);
		scene.environmentTexture = hdrTexture;
		scene.createDefaultSkybox(hdrTexture, true, 200);
		
	} catch (error) {
		Logger.errorAndThrow('Error creating HDRI environment, using default environment', 'MaterialFactory');
	}
}

export function createTerrain(scene: Scene, name: string, texture: TextureSet, map_asset: MapAssetConfig): any {
	const terrainWidth = GAME_CONFIG.fieldWidth * 10;
	const terrainHeight = GAME_CONFIG.fieldHeight * 10;

	let terrain: any;
	if (texture?.height) {
		terrain = MeshBuilder.CreateGroundFromHeightMap(name, texture.height, {
			width: terrainWidth,
			height: terrainHeight,
			subdivisions: 200,		// More subdivisions = smoother terrain
			minHeight: 0,			 // Lowest point of terrain
			maxHeight: 5			 // Highest point of terrain
		}, scene);
	} else {
		terrain = MeshBuilder.CreateGround(name, { 
			width: terrainWidth,
			height: terrainHeight,
			subdivisions: 200
		}, scene);
	}

	if (map_asset === MAP_CONFIGS.map0) {
		terrain.material = new GridMaterial(name + "Material");
		terrain.material.backFaceCulling = false;
	}
	else if (map_asset === MAP_CONFIGS.map5) {
		terrain.material = createLavaMaterial(scene, name + "Material");
		terrain.checkCollisions = false;
		terrain.doNotComputeBoundingBox = true;
		terrain.isPickable = false;
		terrain.position.y = -0.5;
	}
	else if (map_asset === MAP_CONFIGS.map6) {
		terrain.isVisible = false;
	} else {
		const terrainTextureScale = getStandardTextureScale(terrainWidth, terrainHeight, MAP_OBJECT_TYPE.TERRAIN);
		terrain.material = createMaterial(scene, name + "Material", ViewMode.MODE_3D, texture, terrainTextureScale);
		terrain.position.y = -0.01;
	}

	return terrain;
}

export function createLight(scene: any, name: string, viewMode: ViewMode, intensity: number = 1): any {
	const position = viewMode === ViewMode.MODE_2D ? new Vector3(0, 10, 0) : new Vector3(100, 400, 0);
	const light = new HemisphericLight(name, position, scene);
	light.intensity = intensity;
	light.diffuse = new Color3(1, 1, 1);
	light.specular = new Color3(0, 0, 0);
	return light;
}