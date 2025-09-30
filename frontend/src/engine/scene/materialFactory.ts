import { ViewMode } from '../../shared/constants.js';
import { TextureSet, TEXTURE_SCALING, MAP_OBJECT_TYPE } from './sceneAssets.js';
import { Color3, Scene, StandardMaterial, Texture} from "@babylonjs/core";

const createdMaterials = new Set<StandardMaterial>();
const createdTextures = new Set<Texture>();

function setTextureScale(textureScale: any, texture: Texture) {
	if (textureScale) {
		texture.uScale = textureScale.u;
		texture.vScale = textureScale.v;
	}
}

export function getStandardTextureScale(
	width: number, 
	height: number, 
	objectType: MAP_OBJECT_TYPE
): { u: number, v: number } {
	const divisor = TEXTURE_SCALING.standardDivisor;
	const multiplier = TEXTURE_SCALING.multipliers[objectType];

	return {
		u: (width / divisor) * multiplier,
		v: (height / divisor) * multiplier
	};
}

export function createMaterial(
	scene: Scene, 
	name: string, 
	color: Color3, 
	mode: ViewMode, 
	textureSet?: TextureSet,
	textureScale?: { u: number, v: number }
): StandardMaterial {
	const material = new StandardMaterial(name, scene);
	createdMaterials.add(material);

	material.onDisposeObservable.add(() => {
		createdMaterials.delete(material);
	});
	
	// Color effect for 2D mode (without lighting)
	if (mode === ViewMode.MODE_2D) {
		material.emissiveColor = color;
		material.disableLighting = true;
		return material;
	} 
	
	// Only add textures for 3D mode, use colors if failing.
	// If textureScale is passed, it set how many times the texture will be scaled
	if (mode === ViewMode.MODE_3D && textureSet) {
		try {
			const diffuseTexture = new Texture(textureSet.diffuse, scene);
			createdTextures.add(diffuseTexture);
			diffuseTexture.onDisposeObservable.add(() => {
				createdTextures.delete(diffuseTexture);
			});
			material.diffuseTexture = diffuseTexture;
			setTextureScale(textureScale, diffuseTexture);

			if (textureSet.normal) {
				const normalTexture = new Texture(textureSet.normal, scene);
				createdTextures.add(normalTexture);
				normalTexture.onDisposeObservable.add(() => {
					createdTextures.delete(normalTexture);
				});

				material.bumpTexture = normalTexture;
				setTextureScale(textureScale, normalTexture);
			}
			
			if (textureSet.roughness) {
				const roughnessTexture = new Texture(textureSet.roughness, scene);
				createdTextures.add(roughnessTexture);
				roughnessTexture.onDisposeObservable.add(() => {
					createdTextures.delete(roughnessTexture);
				});
				material.specularTexture = roughnessTexture;
				setTextureScale(textureScale, roughnessTexture);
			}

		} catch (error) {
			// Textures will be null if they fail, use color from config file
			material.diffuseColor = color;
		}
	}
	
	return material;
}

export function disposeMaterialResources(): void { // TODO
	try {
		createdTextures.forEach(texture => {
			texture.dispose();
		});
		createdTextures.clear();

		createdMaterials.forEach(material => {
			material.dispose();
		});
		createdMaterials.clear();
	} catch (error) {
		console.warn('Error disposing material resources:', error);
	}
}
