declare var BABYLON: typeof import('@babylonjs/core');

import { ViewMode } from '../../shared/constants.js';
import { GAME_CONFIG } from '../../shared/gameConfig.js';
import { Logger } from '../../core/LogManager.js';
import { VegetationAsset } from './sceneAssets.js';
// import { ModelAsset } from './sceneAssets.js';

// Creates HDRI environment with fallback to default environment
export function createEnvironment(scene: any, mode: ViewMode, path?: string): void {
    // Only create environment for 3D mode
    if (mode !== ViewMode.MODE_3D) return;
    
    if (!path) return;
    try {
        const hdrTexture = new BABYLON.HDRCubeTexture(path, scene, 1024);
        
        // Set as environment texture (skybox + reflections)
        scene.environmentTexture = hdrTexture;
        
        // Create visible skybox
        scene.createDefaultSkybox(hdrTexture, true, 1000);
        
    } catch (error) {
        Logger.warn('Error creating HDRI environment, using default environment', 'MaterialFactory');
    }
}

export async function createVegetation(
    scene: any,
    mode: ViewMode,
    vegetationAsset: VegetationAsset
): Promise<any[]> {
    if (mode != ViewMode.MODE_3D) return [];
    if (!vegetationAsset?.path) return [];

    const objects: any[] = []

    try {
        Logger.info("Loading vegetation from:", vegetationAsset.path);
        const mesh = await BABYLON.SceneLoader.ImportMeshAsync("", "", vegetationAsset.path, scene);
        const originalMesh = mesh.meshes[0] as any;

        if (!originalMesh) return [];

        const materials = createMaterialVariations(originalMesh.material, scene);
        const positions = generatePositions(vegetationAsset);

        for (let i = 0; i < positions.length; i++) {
            const pos = positions[i];
            const obj = originalMesh.clone('veg_' + i);

            obj.position = new BABYLON.Vector3(pos.x, vegetationAsset.yOffset, pos.z);
            obj.rotation.y = vegetationAsset.randomRotation ? Math.random() * Math.PI * 2 : 0;
            obj.scaling = new BABYLON.Vector3(pos.scale, pos.scale, pos.scale);
            obj.material = materials[Math.floor(Math.random() * materials.length)];
            
            objects.push(obj);
        }

        originalMesh.setEnabled(false);
        Logger.info(`Created ${objects.length} vegetation objects`, 'EnvironmentFactory');

    } catch(error) {
        Logger.warn('Could not load vegetation', 'EnvironmentFactory', error);
    }
    return objects;
}

function createMaterialVariations(baseMaterial: any, scene: any){
    const materials = [];

    if (baseMaterial)
        materials.push(baseMaterial);

    const darkMaterial = baseMaterial?.clone("vegDark") || new BABYLON.StandardMaterial("vegetationDark", scene);
    darkMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.3, 0.05);
    materials.push(darkMaterial);
    
    const lightMaterial = baseMaterial?.clone("vegLight") || new BABYLON.StandardMaterial("vegetationLight", scene);
    lightMaterial.diffuseColor = new BABYLON.Color3(0.35, 0.6, 0.25);
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