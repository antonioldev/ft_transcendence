declare var BABYLON: typeof import('@babylonjs/core');

import { ViewMode } from '../../shared/constants.js';
import { TextureSet } from './sceneAssets.js';
import { Logger } from '../../core/LogManager.js';

function setTextureScale(textureScale: any, texture: any) {
    if (textureScale) {
        texture.uScale = textureScale.u;
        texture.vScale = textureScale.v;
    }
}

export function createMaterial(
    scene: any, 
    name: string, 
    color: any, 
    mode: ViewMode, 
    textureSet?: TextureSet,
    textureScale?: { u: number, v: number }
): any {
    const material = new BABYLON.StandardMaterial(name, scene);
    
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
            const diffuseTexture = new BABYLON.Texture(textureSet.diffuse, scene);
            material.diffuseTexture = diffuseTexture;
            setTextureScale(textureScale, diffuseTexture);

            if (textureSet.normal) {
                const normalTexture = new BABYLON.Texture(textureSet.normal, scene);
                material.bumpTexture = normalTexture;
                setTextureScale(textureScale, normalTexture);
            }
            
            if (textureSet.roughness) {
                const roughnessTexture = new BABYLON.Texture(textureSet.roughness, scene);
                material.specularTexture = roughnessTexture;
                setTextureScale(textureScale, roughnessTexture);
            }

        } catch (error) {
            Logger.warn ('Error creating textured material, using color fallback', 'materialFactory');
            // Textures will be null if they fail, use color from config file
            material.diffuseColor = color;
        }
    }
    
    return material;
}
