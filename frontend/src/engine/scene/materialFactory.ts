import { ViewMode } from '../../shared/constants.js';
import { TextureSet, TEXTURE_SCALING, MAP_OBJECT_TYPE } from './sceneAssets.js';
import { Color3, Scene, StandardMaterial, Texture} from "@babylonjs/core";

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
			material.diffuseTexture = diffuseTexture;
			setTextureScale(textureScale, diffuseTexture);

			if (textureSet.normal) {
				const normalTexture = new Texture(textureSet.normal, scene);
				material.bumpTexture = normalTexture;
				setTextureScale(textureScale, normalTexture);
			}
			
			if (textureSet.roughness) {
				const roughnessTexture = new Texture(textureSet.roughness, scene);
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
