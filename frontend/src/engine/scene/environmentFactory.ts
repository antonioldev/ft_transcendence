import { HDRCubeTexture, MeshBuilder, StandardMaterial, Color3, Vector3, SceneLoader, Scene} from "@babylonjs/core";

import { ViewMode } from '../../shared/constants.js';
import { GAME_CONFIG } from '../../shared/gameConfig.js';
import { Logger } from '../../utils/LogManager.js';
import { VegetationAsset } from './sceneAssets.js';
import { TextureSet, MAP_OBJECT_TYPE } from './sceneAssets.js';
import { createMaterial, getStandardTextureScale } from './materialFactory.js';

// Creates HDRI environment with fallback to default environment
export function createEnvironment(scene: Scene, path?: string): void {
	if (!path) return;
	try {
		const hdrTexture = new HDRCubeTexture(path, scene, 1024);
		
		// Set as environment texture (skybox + reflections)
		scene.environmentTexture = hdrTexture;
		
		// Create visible skybox
		scene.createDefaultSkybox(hdrTexture, true, 1000);
		
	} catch (error) {
		Logger.errorAndThrow('Error creating HDRI environment, using default environment', 'MaterialFactory');
	}
}

export function createTerrain(scene: Scene, name: string, mode: ViewMode, texture?: TextureSet): any {
	const terrainWidth = GAME_CONFIG.fieldWidth * 10;
	const terrainHeight = GAME_CONFIG.fieldHeight * 10;

	let terrain: any;
	// Check if we have a heightmap
	if (texture?.height) {
		terrain = MeshBuilder.CreateGroundFromHeightMap(name, texture.height, {
			width: terrainWidth,
			height: terrainHeight,
			subdivisions: 100,		// More subdivisions = smoother terrain
			minHeight: 0,			 // Lowest point of terrain
			maxHeight: 10			 // Highest point of terrain
		}, scene);
	} else {
		terrain = MeshBuilder.CreateGround(name, { 
			width: terrainWidth, 
			height: terrainHeight 
		}, scene);
	}

	terrain.position.y = -0.01;

	const terrainTextureScale = getStandardTextureScale(terrainWidth, terrainHeight, MAP_OBJECT_TYPE.GROUND);
	const material = new StandardMaterial(name + "Material", scene);
	material.diffuseColor = new Color3(1, 1, 0);
	terrain.material = createMaterial(scene, name + "Material",  new Color3(1, 1, 0), mode, texture, terrainTextureScale);

	return terrain;
}

export async function createVegetation(
	scene: Scene,
	vegetationAsset: VegetationAsset
): Promise<any[]> {
	if (!vegetationAsset?.path) return [];
	const objects: any[] = []
	try {
		const mesh = await SceneLoader.ImportMeshAsync("", "", vegetationAsset.path, scene);
		const originalMesh = mesh.meshes[0] as any;

		if (!originalMesh) return [];

		const materials = createMaterialVariations(originalMesh.material, scene);
		const positions = generatePositions(vegetationAsset);

		for (let i = 0; i < positions.length; i++) {
			const pos = positions[i];
			const obj = originalMesh.clone('veg_' + i);

			obj.position = new Vector3(pos.x, vegetationAsset.yOffset, pos.z);
			obj.rotation.y = vegetationAsset.randomRotation ? Math.random() * Math.PI * 2 : 0;
			obj.scaling = new Vector3(pos.scale, pos.scale, pos.scale);
			obj.material = materials[Math.floor(Math.random() * materials.length)];
			
			objects.push(obj);
		}

		originalMesh.setEnabled(false);

	} catch(error) {
		Logger.errorAndThrow('Could not load vegetation', 'EnvironmentFactory', error);
	}
	return objects;
}

function createMaterialVariations(baseMaterial: any, scene: any){
	const materials = [];

	if (baseMaterial)
		materials.push(baseMaterial);

	const darkMaterial = baseMaterial?.clone("vegDark") || new StandardMaterial("vegetationDark", scene);
	darkMaterial.diffuseColor = new Color3(0.1, 0.3, 0.05);
	darkMaterial.specularColor = Color3.Black();
	materials.push(darkMaterial);
	
	const lightMaterial = baseMaterial?.clone("vegLight") || new StandardMaterial("vegetationLight", scene);
	lightMaterial.diffuseColor = new Color3(0.3, 0.45, 0.2);
	lightMaterial.specularColor = Color3.Black();
	materials.push(lightMaterial);

	return materials;
}

function generatePositions(config: VegetationAsset) {
	const positions = [];
	const fieldHalfWidth = GAME_CONFIG.fieldWidth / 2;
	const fieldHalfHeight = GAME_CONFIG.fieldHeight / 2;
	
	for (let side = -1; side <= 1; side += 2) {
		for (let layer = 0; layer < config.positioning.depthLayers; layer++) {
			const layerOffset = layer * 3;
			const objectsInLayer = layer === 0 ? config.count.sides : config.count.background;
			
			for (let i = 0; i < objectsInLayer; i++) {
				const z = (fieldHalfHeight * config.positioning.spreadMultiplier) * (i / (objectsInLayer - 1) - 0.5);
				const xOffset = Math.random() * 2;
				
				positions.push({
					x: side * (fieldHalfWidth + config.positioning.marginFromField + layerOffset + xOffset),
					z: z + (Math.random() - 0.5) * 2,
					scale: Math.max(config.scale.min, Math.min(config.scale.max, 
						config.scale.base + (Math.random() - 0.5) * config.scale.variation))
				});
			}
		}
	}
	
	for (let end = -1; end <= 1; end += 2) {
		for (let i = 0; i < config.count.behind; i++) {
			positions.push({
				x: (i / config.count.behind - 0.5) * GAME_CONFIG.fieldWidth * 1.3 + (Math.random() - 0.5) * 2,
				z: end * (fieldHalfHeight + config.positioning.marginFromField + 2 + Math.random() * 3),
				scale: Math.max(config.scale.min, Math.min(config.scale.max,
					config.scale.base + (Math.random() - 0.5) * config.scale.variation))
			});
		}
	}
	
	return positions;
}