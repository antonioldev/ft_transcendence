declare var BABYLON: typeof import('@babylonjs/core'); //declare var BABYLON: any;

import { GAME_CONFIG } from '../shared/gameConfig.js';
import { Size, GameObjects } from '../shared/types.js';
import { ViewMode } from '../shared/constants.js';
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
} from '../core/utils.js';
import { MAP_ASSETS } from './sceneAssets.js';
import { createBushes } from './meshFactory.js';
import { createMaterial, createEnvironment } from './materialFactory.js';

export type LoadingProgressCallback = (progress: number) => void;

// Creates a camera for the given scene
function createCamera(scene: any, name: string, position: any, viewport: any, mode: ViewMode): any {

    let camera;
    if (mode === ViewMode.MODE_3D) {
        camera = new BABYLON.FreeCamera(name, position, scene);
        camera.setTarget(BABYLON.Vector3.Zero());
        camera.viewport = viewport;
    }
    
    if (mode === ViewMode.MODE_2D) {
        camera = new BABYLON.FreeCamera(name, position, scene); // position is new BABYLON.Vector3(0, 25, 0);
        camera.setTarget(new BABYLON.Vector3(3, 0, 0));
        camera.viewport = viewport; //
        camera.rotation.z = -(Math.PI / 2);
        camera.fov = 1.1;
        // camera.setTarget(new BABYLON.Vector3(0, 5, 0)); // TODO move the camera down
    }
    return camera;
}

// Creates a light source for the given scene
function createLight(scene: any, name: string, position: any): any {
    const light = new BABYLON.HemisphericLight(name, position, scene);
    light.intensity = 1.2;
    light.diffuse = new BABYLON.Color3(1, 1, 1);
    light.specular = new BABYLON.Color3(1, 1, 1);
    return light;
}

// Creates the ground for the game field
function createGround(scene: any, name: string, width: number, height: number, mode: ViewMode): any {

    const ground = BABYLON.MeshBuilder.CreateGround(name, { width, height }, scene);
    const color = mode === ViewMode.MODE_2D ? COLORS.field2D : COLORS.field3D;
    
    const groundTextureScale = { u: width / 10, v: height / 10 };
    ground.material = createMaterial(scene, name + "Material", color, mode, MAP_ASSETS.ground, groundTextureScale);
    return ground;
}

function createWalls(scene: any, name: string, fieldWidth: number, fieldHeight: number, wallHeight: number, wallThickness: number, mode: ViewMode): any[] {
   const walls: any[] = [];
   const color = mode === ViewMode.MODE_2D ? COLORS.walls2D : COLORS.walls3D;
   
   // Single texture scaling for all walls
   const wallTextureScale = {u: fieldWidth / 2, v: wallThickness};
   const material = createMaterial(scene, "wallMaterial", color, mode, MAP_ASSETS.walls, wallTextureScale);

   // Top wall
   const topWall = BABYLON.MeshBuilder.CreateBox("topWall", {width: fieldWidth, height: wallHeight, depth: wallThickness}, scene);
   topWall.position = new BABYLON.Vector3(0, wallHeight / 2, fieldHeight / 2 - (wallThickness / 2));
   topWall.material = material;
   walls.push(topWall);

   // Bottom wall
   const bottomWall = BABYLON.MeshBuilder.CreateBox("bottomWall", {width: fieldWidth - wallThickness, height: wallHeight, depth: wallThickness}, scene);
   bottomWall.position = new BABYLON.Vector3(0, wallHeight / 2, -(fieldHeight / 2) + (wallThickness / 2));
   bottomWall.material = material;
   walls.push(bottomWall);

   // Left wall
   const leftWall = BABYLON.MeshBuilder.CreateBox("leftWall", {width: fieldHeight, height: wallHeight, depth: wallThickness}, scene);
   leftWall.position = new BABYLON.Vector3(-(fieldWidth / 2), wallHeight / 2, 0);
   leftWall.rotation.y = Math.PI / 2;
   leftWall.material = material;
   walls.push(leftWall);

   // Right wall
   const rightWall = BABYLON.MeshBuilder.CreateBox("rightWall", {width: fieldHeight, height: wallHeight, depth: wallThickness}, scene);
   rightWall.position = new BABYLON.Vector3(fieldWidth / 2, wallHeight / 2, 0);
   rightWall.rotation.y = Math.PI / 2;
   rightWall.material = material;
   walls.push(rightWall);

   return walls;
}

// Creates a player object in the scene
function createPlayer(scene: any, name: string, position: any, size: Size, color: any, mode: ViewMode): any {
    
    // Capsule - Creation of the object
    const player = BABYLON.MeshBuilder.CreateCapsule(name, {radius: size.z / 2, height: size.x, tessellation: 16 }, scene);
    player.rotation.z = Math.PI / 2;
    player.position = position;

    // or box
    // const player = BABYLON.MeshBuilder.CreateBox(name, {width: size.x, height: size.y, depth: size.z}, scene);
    
    // Creation of material
    const playerScale = {u: size.x, v: size.z};
    player.material = createMaterial(scene, name + "Material", color, mode, MAP_ASSETS.paddle, playerScale);
     
    return player;
}

// Creates a ball object in the scene
function createBall(scene: any, name: string, position: any, mode: ViewMode): any {

    const ball = BABYLON.MeshBuilder.CreateSphere(name, {diameter: GAME_CONFIG.ballRadius * 2}, scene);
    ball.position = position;

    const color = mode === ViewMode.MODE_2D ? COLORS.ball2D : COLORS.ball3D;
    ball.material = createMaterial(scene, name + "Material", color, mode, MAP_ASSETS.ball);
    
    return ball;
}

export async function buildScene(
    scene: any, 
    engine: any, 
    mode: ViewMode, 
    onProgress?: LoadingProgressCallback
): Promise<GameObjects> {
    let cameras: any;
    let playerLeft: any;
    let playerRight: any;

    onProgress?.(10);
    const lights = createLight(scene, "light1", new BABYLON.Vector3(0, 10, 0));
    onProgress?.(20);
    const ground = createGround(scene, "ground", GAME_CONFIG.fieldWidth, GAME_CONFIG.fieldHeight, mode);
    onProgress?.(30);
    const walls = createWalls(scene, "walls", GAME_CONFIG.fieldWidth, GAME_CONFIG.fieldHeight, GAME_CONFIG.wallHeight, GAME_CONFIG.wallThickness, mode);
    onProgress?.(40);
    const ball = createBall(scene, "ball", getBallStartPosition(), mode);
    onProgress?.(50);
    
    if (mode === ViewMode.MODE_2D) {
        cameras = [createCamera(scene, "camera1", getCamera2DPosition(), get2DCameraViewport(), mode)];
        playerLeft = createPlayer(scene, "player1", getPlayerLeftPosition(), getPlayerSize(), COLORS.player1_2D, mode);
        playerRight = createPlayer(scene, "player2", getPlayerRightPosition(), getPlayerSize(), COLORS.player2_2D, mode);
        onProgress?.(80);
    } else {
        cameras = [
            createCamera(scene, "camera1", getCamera3DPlayer1Position(), get3DCamera1Viewport(), mode),
            createCamera(scene, "camera2", getCamera3DPlayer2Position(), get3DCamera2Viewport(), mode)
        ];
        onProgress?.(60);
        playerLeft = createPlayer(scene, "player1", getPlayerLeftPosition(), getPlayerSize(), COLORS.player1_3D, mode);
        playerRight = createPlayer(scene, "player2", getPlayerRightPosition(), getPlayerSize(), COLORS.player2_3D, mode);
        onProgress?.(70);
        createEnvironment(scene, mode, MAP_ASSETS.skybox);
        onProgress?.(75);
        const bushes = await createBushes(scene, mode);
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
