import { ViewMode } from '../../../shared/constants.js';
import { TextureSet, MAP_OBJECT_TYPE } from '../config/sceneTypes.js';
import { TEXTURE_SCALING } from '../config/mapConfigs.js';
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
	mode: ViewMode, 
	textureSet: TextureSet,
	textureScale?: { u: number, v: number }
): StandardMaterial {
	const material = new StandardMaterial(name, scene);
	
	if (mode === ViewMode.MODE_2D) {
		material.emissiveColor = Color3.FromHexString(textureSet.color);
		material.disableLighting = true;
	} else if (textureSet && textureSet.diffuse === null) {
		material.emissiveColor  = Color3.FromHexString(textureSet.color);
	} else if (mode === ViewMode.MODE_3D && textureSet) {
		try {
			const diffuseTexture = new Texture(textureSet.diffuse, scene);
			const normalTexture = new Texture(textureSet.normal, scene);
			const roughnessTexture = new Texture(textureSet.roughness, scene);

			material.diffuseTexture = diffuseTexture;
			setTextureScale(textureScale, diffuseTexture);
				
			material.bumpTexture = normalTexture;
			setTextureScale(textureScale, normalTexture);
			
			material.specularTexture = roughnessTexture;
			setTextureScale(textureScale, roughnessTexture);
		} catch (error) {
			material.diffuseColor = Color3.FromHexString(textureSet.color);
		}
	}

	return material;
}

export function disposeMaterialResources(): void {
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
