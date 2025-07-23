declare var BABYLON: typeof import('@babylonjs/core');

import { ViewMode } from '../shared/constants.js';
import { MapAssetConfig, TextureSet } from './sceneAssets.js';

/**
 * Creates a basic color material (used for elements that should never have textures)
 */
export function createColorMaterial(scene: any, name: string, color: any, mode: ViewMode): any {
    const material = new BABYLON.StandardMaterial(name, scene);
    
    if (mode === ViewMode.MODE_2D) {
        material.emissiveColor = color;
        material.disableLighting = true;
    } else {
        material.diffuseColor = color;
    }
    return material;
}

/**
 * Creates a material with optional textures and color fallback
 * Can accept either individual paths or a TextureSet object
 */
export function createMaterial(
    scene: any, 
    name: string, 
    color: any, 
    mode: ViewMode, 
    textureSet?: TextureSet | string, // Can be TextureSet object or single diffuse path
    normalPath?: string,
    roughnessPath?: string
): any {
    const material = new BABYLON.StandardMaterial(name, scene);
    
    // Always set color as fallback
    if (mode === ViewMode.MODE_2D) {
        material.emissiveColor = color;
        material.disableLighting = true;
    } else {
        material.diffuseColor = color;
    }
    
    // Only add textures for 3D mode
    if (mode === ViewMode.MODE_3D) {
        // Handle TextureSet object or individual paths
        let diffusePath: string | undefined;
        let normalTexPath: string | undefined;
        let roughnessTexPath: string | undefined;
        
        if (typeof textureSet === 'object' && textureSet) {
            // TextureSet object provided
            diffusePath = textureSet.diffuse;
            normalTexPath = textureSet.normal;
            roughnessTexPath = textureSet.roughness;
        } else if (typeof textureSet === 'string') {
            // Individual paths provided (backward compatibility)
            diffusePath = textureSet;
            normalTexPath = normalPath;
            roughnessTexPath = roughnessPath;
        }
        
        if (diffusePath) {
            try {
                // Diffuse texture (base color)
                material.diffuseTexture = new BABYLON.Texture(diffusePath, scene);
                
                // Normal map (surface detail)
                if (normalTexPath)
                    material.bumpTexture = new BABYLON.Texture(normalTexPath, scene);
                
                // Roughness map (controls shininess/reflection)
                if (roughnessTexPath)
                    material.specularTexture = new BABYLON.Texture(roughnessTexPath, scene);
                
            } catch (error) {
                console.warn(`Error creating textured material: ${error}, using color fallback`);
                // Textures will be null if they fail, color fallback already set above
            }
        }
    }
    
    return material;
}

// Creates HDRI environment with fallback to default environment
export function createEnvironment(scene: any, mode: ViewMode, skyboxPath?: string): void {
    // Only create environment for 3D mode
    if (mode !== ViewMode.MODE_3D) return;
    
    try {
        const hdrPath = skyboxPath || "assets/test.hdr";
        const hdrTexture = new BABYLON.HDRCubeTexture(hdrPath, scene, 1024);
        
        // Set as environment texture (skybox + reflections)
        scene.environmentTexture = hdrTexture;
        
        // Create visible skybox
        scene.createDefaultSkybox(hdrTexture, true, 1000);
        
    } catch (error) {
        console.warn(`Error creating HDRI environment: ${error}, using default environment`);
        createDefaultEnvironmentFallback(scene);
    }
}

// Helper function to create default environment fallback
function createDefaultEnvironmentFallback(scene: any): void {
    scene.createDefaultEnvironment({ 
        createGround: false, 
        createSkybox: true,
        skyboxSize: 1000
    });
}