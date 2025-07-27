declare var BABYLON: typeof import('@babylonjs/core'); //declare var BABYLON: any;

import { createCamera, createLight, createGround, createWalls, createPlayer, createBall} from './gameObjectsFactory.js';
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
import { createEnvironment, createVegetation } from './environmentFactory.js';

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

    onProgress?.(10);
    const lights = createLight(scene, "light1", new BABYLON.Vector3(0, 10, 0));
    onProgress?.(20);
    const ground = createGround(scene, "ground", GAME_CONFIG.fieldWidth, GAME_CONFIG.fieldHeight, mode, map_asset.textures.ground);
    onProgress?.(30);
    const walls = createWalls(scene, "walls", GAME_CONFIG.fieldWidth, GAME_CONFIG.fieldHeight, GAME_CONFIG.wallHeight, GAME_CONFIG.wallThickness, mode, map_asset.textures.walls);
    onProgress?.(40);
    const ball = createBall(scene, "ball", getBallStartPosition(), mode, map_asset.textures.ball);
    onProgress?.(50);
    
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
        onProgress?.(60);
        playerLeft = createPlayer(scene, "player1", getPlayerLeftPosition(), getPlayerSize(), COLORS.player1_3D, mode, map_asset.textures.paddle);
        playerRight = createPlayer(scene, "player2", getPlayerRightPosition(), getPlayerSize(), COLORS.player2_3D, mode, map_asset.textures.paddle);
        onProgress?.(70);
        createEnvironment(scene, mode, map_asset.environment.skybox);
        onProgress?.(75);
        const trees = await createVegetation(scene, mode, map_asset.vegetation.tree);
        const bushes = await createVegetation(scene, mode, map_asset.vegetation.bush);
        onProgress?.(80);
    }
    await scene.whenReadyAsync();
    onProgress?.(90);
    // Create GUI camera for both modes
    const guiCamera = createCamera(scene, "guiCamera", BABYLON.Vector3.Zero(), new BABYLON.Viewport(0, 0, 1, 1), mode);
    guiCamera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
    guiCamera.orthoTop = 1;
    guiCamera.orthoBottom = -1;
    guiCamera.orthoLeft = -1;
    guiCamera.orthoRight = 1;
    guiCamera.layerMask = 0x20000000;
    cameras.push(guiCamera);
    scene.activeCameras = cameras;
    onProgress?.(100);
    console.log('Scene building complete!');
    return {
        players: { left: playerLeft, right: playerRight },
        ball,
        ground,
        walls,
        cameras,
        lights
    };
}


