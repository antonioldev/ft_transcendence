// declare var BABYLON: typeof import('@babylonjs/core');
// import "@babylonjs/loaders/OBJ/objFileLoader";

// import { ViewMode } from '../shared/constants.js';
// import { GAME_CONFIG } from '../shared/gameConfig.js';
// import { Logger } from '../core/LogManager.js';

// // Simple function to create bushes
// export async function createBushes(scene: any, mode: ViewMode): Promise<any[]> {
//     if (mode !== ViewMode.MODE_3D) return [];
    
//     const bushes: any[] = [];
    
//     try {
//         // Load the bush model
//         const result = await BABYLON.SceneLoader.ImportMeshAsync("", "assets/model/map1/Bush/", "Bush1.obj", scene);
//         const originalBush = result.meshes[0] as any;
        
//         if (!originalBush) return [];
        
//         originalBush.setEnabled(false); // Hide original
        
//         // Create 6 bushes around the field
//         for (let i = 0; i < 6; i++) {
//             const bush = originalBush.createInstance("bush" + i);
            
//             // Use game config field dimensions
//             const fieldMargin = 5; // Distance outside the field
//             const extraRange = 8; // Additional random range
            
//             let x = (Math.random() - 0.5) * (GAME_CONFIG.fieldWidth + extraRange);
//             let z = (Math.random() - 0.5) * (GAME_CONFIG.fieldHeight + extraRange);
            
//             // Make sure they're outside the playing field boundaries
//             if (Math.abs(x) < GAME_CONFIG.fieldWidth / 2 + fieldMargin && 
//                 Math.abs(z) < GAME_CONFIG.fieldHeight / 2 + fieldMargin) {
//                 // Push to sides if too close to field
//                 x = x > 0 ? GAME_CONFIG.fieldWidth / 2 + fieldMargin : -(GAME_CONFIG.fieldWidth / 2 + fieldMargin);
//             }
            
//             bush.position = new BABYLON.Vector3(x, 0, z);
//             bush.rotation.y = Math.random() * Math.PI * 2;
            
//             bushes.push(bush);
//         }
        
//         Logger.info(`Created ${bushes.length} bushes around field (${GAME_CONFIG.fieldWidth}x${GAME_CONFIG.fieldHeight})`, 'meshFactory');
        
//     } catch (error) {
//         Logger.warn('Could not load bushes', 'meshFactory', error);
//     }
    
//     return bushes;
// }

declare var BABYLON: typeof import('@babylonjs/core');

import { ViewMode } from '../shared/constants.js';
import { GAME_CONFIG } from '../shared/gameConfig.js';
import { Logger } from '../core/LogManager.js';

export async function createBushes(scene: any, mode: ViewMode): Promise<any[]> {
    try {
        console.log("Testing file path...");
        const result = await BABYLON.SceneLoader.ImportMeshAsync("", "assets/model/map1/Bush/", "Bush1.obj", scene);
        console.log("SUCCESS - files loaded");
    } catch (error) {
        console.log("FAILED - check file path:", error);
    }
    return [];
}