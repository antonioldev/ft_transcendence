import { HDRCubeTexture, MeshBuilder, Scene, HemisphericLight, Color3, Vector3} from "@babylonjs/core";
import { ViewMode } from '../../../shared/constants.js';
import { GAME_CONFIG } from '../../../shared/gameConfig.js';
import { Logger } from '../../../utils/LogManager.js';
import { TextureSet, MAP_OBJECT_TYPE } from "../config/sceneTypes.js";
import { createMaterial, getStandardTextureScale } from '../rendering/materials.js';

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

export function createTerrain(scene: Scene, name: string, texture: TextureSet): any {
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
			height: terrainHeight 
		}, scene);
	}

	terrain.position.y = -0.01;

	const terrainTextureScale = getStandardTextureScale(terrainWidth, terrainHeight, MAP_OBJECT_TYPE.GROUND);
	terrain.material = createMaterial(scene, name + "Material", ViewMode.MODE_3D, texture, terrainTextureScale);

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