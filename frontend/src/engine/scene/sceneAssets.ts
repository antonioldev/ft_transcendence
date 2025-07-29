import { GAME_CONFIG } from "../../shared/gameConfig.js";



export type VegetationAsset = {
    path: string;
    count: {
        sides: number;
        background: number;
        behind: number;
    };
    positioning: {
        marginFromField: number;
        depthLayers: number;
        spreadMultiplier: number;
    };
    scale: {
        base: number;
        variation: number;
        min: number;
        max: number;
    };
    yOffset: number;
    randomRotation: boolean;
};

export const MAP_ASSETS: Record<string, MapAssetConfig> = {
   map1: {
       textures: {
           ground: {
               diffuse: "assets/textures/map1/ground/floor_diff_1k.jpg",
               normal: "assets/textures/map1/ground/floor_nor_gl_1k.jpg", 
               roughness: "assets/textures/map1/ground/floor_rough_1k.jpg"
           },
           walls: {
               diffuse: "assets/textures/map1/wall/wall_diff_1k.jpg",
               normal: "assets/textures/map1/wall/wall_nor_gl_1k.jpg",
               roughness: "assets/textures/map1/wall/wall_rough_1k.jpg"
           },
           ball: {
               diffuse: "assets/textures/map1/ball/ball_diff_1k.jpg",
               normal: "assets/textures/map1/ball/ball_nor_gl_1k.jpg",
               roughness: "assets/textures/map1/ball/ball_rough_1k.jpg"
           },
           paddle: {
               diffuse: "assets/textures/map1/paddle/paddle_diff_1k.jpg",
               normal: "assets/textures/map1/paddle/paddle_nor_gl_1k.jpg",
               roughness: "assets/textures/map1/paddle/paddle_rough_1k.jpg"
           },
           terrain: {
               diffuse: "assets/textures/map1/terrain/terrain_diff_1k.jpg",
               normal: "assets/textures/map1/terrain/terrain_nor_gl_1k.jpg",
               roughness: "assets/textures/map1/terrain/terrain_rough_1k.jpg",
               height: "assets/textures/map1/terrain/terrain_height2.png"
           }
       },
        vegetation: {
            bush: {
                path: "assets/model/map1/Bush/Bush1.obj",
                count: { sides: 45, background: 12, behind: 15 }, // TODO try to push
                positioning: { 
                    marginFromField: GAME_CONFIG.fieldWidth * 0.05,
                    depthLayers: 2, 
                    spreadMultiplier: GAME_CONFIG.fieldHeight / GAME_CONFIG.fieldWidth * 1.1
                },
                scale: { 
                    base: GAME_CONFIG.fieldWidth * 0.06,
                    variation: GAME_CONFIG.fieldWidth * 0.025, 
                    min: GAME_CONFIG.fieldWidth * 0.04, 
                    max: GAME_CONFIG.fieldWidth * 0.09 
                },
                yOffset: -GAME_CONFIG.fieldWidth * 0.06,
                randomRotation: true
            },
            tree: {
                path: "assets/model/map1/Tree/Tree.glb",
                count: { sides: 12, background: 12, behind: 12 },
                positioning: { 
                    marginFromField: GAME_CONFIG.fieldWidth * 0.4,
                    depthLayers: 2, 
                    spreadMultiplier: GAME_CONFIG.fieldHeight / GAME_CONFIG.fieldWidth * 1.1
                },
                scale: { 
                    base: GAME_CONFIG.fieldWidth * 0.125,
                    variation: GAME_CONFIG.fieldWidth * 0.04, 
                    min: GAME_CONFIG.fieldWidth * 0.1, 
                    max: GAME_CONFIG.fieldWidth * 0.175 
                },
                yOffset: -GAME_CONFIG.fieldWidth * 0.075,
                randomRotation: true
            }
        },
       environment: {
           skybox: "assets/textures/map1/sky/sky.hdr"
       }}
//    },
//    map2: {
//        textures: {
//            ground: { diffuse: "", normal: "", roughness: "" },
//            walls: { diffuse: "", normal: "", roughness: "" },
//            ball: { diffuse: "", normal: "", roughness: "" },
//            paddle: { diffuse: "", normal: "", roughness: "" }
//        },
//         vegetation: {
//             bush: {
//                 path: "",
//                 count: { sides: 12, background: 10, behind: 10 },
//                 positioning: { marginFromField: 3, depthLayers: 3, spreadMultiplier: 1.4 },
//                 scale: { base: 1.0, variation: 0.4, min: 0.7, max: 1.5 },
//                 yOffset: -0.6,
//                 randomRotation: true
//             },
//             tree: {
//                 path: "",
//                 count: { sides: 6, background: 4, behind: 5 },
//                 positioning: { marginFromField: 10, depthLayers: 2, spreadMultiplier: 2.0 },
//                 scale: { base: 3.0, variation: 1.0, min: 2.5, max: 4.0 },
//                 yOffset: -2.0,
//                 randomRotation: true
//             }
//         },
//        environment: {
//            skybox: ""
//        }
//    }
};

export type TextureSet = {
   diffuse: string;
   normal: string;
   roughness: string;
   height?: string;
};

export type MapAssetConfig = {
    textures: {
        ground: TextureSet;
        walls: TextureSet;
        ball: TextureSet;
        paddle: TextureSet;
        terrain: TextureSet;
    };
    vegetation: {
        bush: VegetationAsset;
        tree: VegetationAsset;
    };
    environment: {
        skybox: string;
    };
};

export enum  MAP_OBJECT_TYPE {
    GROUND,
    WALLS,
    TERRAIN,
    PLAYER,
    BALL
}

export const TEXTURE_SCALING = {
    standardDivisor: 10,

    multipliers: {
        [MAP_OBJECT_TYPE.GROUND]: 1.0,
        [MAP_OBJECT_TYPE.WALLS]: 1.0,
        [MAP_OBJECT_TYPE.TERRAIN]: 1.0,
        [MAP_OBJECT_TYPE.PLAYER]: 5.0,
        [MAP_OBJECT_TYPE.BALL]: 8.0
    }
};