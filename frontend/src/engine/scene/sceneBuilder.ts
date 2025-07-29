declare var BABYLON: typeof import('@babylonjs/core'); //declare var BABYLON: any;

import { createCamera, createGuiCamera, createLight, createGameField, createWalls, createPlayer, createBall} from './gameObjectsFactory.js';
import { GAME_CONFIG } from '../../shared/gameConfig.js';
import { GameObjects } from '../../shared/types.js';
import { ViewMode } from '../../shared/constants.js';
import {
    COLORS,
    getPlayerSize,
    getPlayerLeftPosition,
    getPlayerRightPosition,
    getBallStartPosition,
    getCamera2DPosition,
    getCamera3DPlayer1Position,
    getCamera3DPlayer2Position,
    get2DCameraViewport,
    get3DCamera1Viewport,
    get3DCamera2Viewport
} from '../../core/utils.js';
import { MAP_ASSETS } from './sceneAssets.js';
import { createEnvironment, createTerrain, createVegetation } from './environmentFactory.js';

export type LoadingProgressCallback = (progress: number) => void;

export async function buildScene(
    scene: any, 
    engine: any, 
    mode: ViewMode, 
    onProgress?: LoadingProgressCallback
): Promise<GameObjects> {
    let cameras: any;
    let playerLeft: any;
    let playerRight: any;

    let map_asset = MAP_ASSETS.map1;

    onProgress?.(5);
    const lights = createLight(scene, "light1", new BABYLON.Vector3(0, 10, 0));
    onProgress?.(15);
    const gameField = createGameField(scene, "ground", GAME_CONFIG.fieldWidth, GAME_CONFIG.fieldHeight, mode, map_asset.textures.ground);
    onProgress?.(25);
    const walls = createWalls(scene, "walls", GAME_CONFIG.fieldWidth, GAME_CONFIG.fieldHeight, GAME_CONFIG.wallHeight, GAME_CONFIG.wallThickness, mode, map_asset.textures.walls);
    onProgress?.(30);
    const ball = createBall(scene, "ball", getBallStartPosition(), mode, map_asset.textures.ball);
    onProgress?.(40);
    
    if (mode === ViewMode.MODE_2D) {
        cameras = [createCamera(scene, "camera1", getCamera2DPosition(), get2DCameraViewport(), mode)];
        playerLeft = createPlayer(scene, "player1", getPlayerLeftPosition(), getPlayerSize(), COLORS.player1_2D, mode, map_asset.textures.paddle);
        playerRight = createPlayer(scene, "player2", getPlayerRightPosition(), getPlayerSize(), COLORS.player2_2D, mode, map_asset.textures.paddle);
        onProgress?.(80);
    } else {
        cameras = [
            createCamera(scene, "camera1", getCamera3DPlayer1Position(), get3DCamera1Viewport(), mode),
            createCamera(scene, "camera2", getCamera3DPlayer2Position(), get3DCamera2Viewport(), mode)
        ];
        onProgress?.(50);
//here  
        const terrain = createTerrain(scene, "terrain", mode, map_asset.textures.terrain)
        onProgress?.(60);
        playerLeft = createPlayer(scene, "player1", getPlayerLeftPosition(), getPlayerSize(), COLORS.player1_3D, mode, map_asset.textures.paddle);
        playerRight = createPlayer(scene, "player2", getPlayerRightPosition(), getPlayerSize(), COLORS.player2_3D, mode, map_asset.textures.paddle);
        onProgress?.(70);
        createEnvironment(scene, mode, map_asset.environment.skybox);
        onProgress?.(80);
        const trees = await createVegetation(scene, mode, map_asset.vegetation.tree);
        const bushes = await createVegetation(scene, mode, map_asset.vegetation.bush);
        onProgress?.(90);
    }
    await scene.whenReadyAsync();
    onProgress?.(95);
    const guiCamera = createGuiCamera(scene, "guiCamera", BABYLON.Vector3.Zero(), new BABYLON.Viewport(0, 0, 1, 1));
    cameras.push(guiCamera);
    scene.activeCameras = cameras;
    onProgress?.(100);
    console.log('Scene building complete!');
    return {
        players: { left: playerLeft, right: playerRight },
        ball,
        gameField,
        walls,
        cameras,
        lights
    };
}


