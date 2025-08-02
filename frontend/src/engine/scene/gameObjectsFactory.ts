declare var BABYLON: typeof import('@babylonjs/core'); //declare var BABYLON: any;

import { GAME_CONFIG } from '../../shared/gameConfig.js';
import { Size} from '../../shared/types.js';
import { ViewMode, GameMode } from '../../shared/constants.js';
import { TextureSet, MAP_OBJECT_TYPE } from './sceneAssets.js';
import { createMaterial, getStandardTextureScale } from './materialFactory.js';
import { COLORS, getSoloCameraViewport, get3DCamera1Viewport, get3DCamera2Viewport, getCamera2DPosition } from '../utils.js';

// Creates a camera for the given scene
export function createCameras(scene: any, name: string, viewMode: ViewMode, gameMode: GameMode): any {
    let cameras = [];

    const position = getCamera2DPosition();
    if (viewMode === ViewMode.MODE_2D) {
        const camera = new BABYLON.FreeCamera(name  + "1", position, scene);
        camera.setTarget(new BABYLON.Vector3(3, 0, 0));
        camera.viewport = getSoloCameraViewport();
        camera.rotation.z = -(Math.PI / 2);
        camera.fov = 1.1;
        cameras.push(camera);
    } else {
        if (gameMode === GameMode.SINGLE_PLAYER) {
            const camera = new BABYLON.FreeCamera(name  + "1", position, scene);
            camera.setTarget(BABYLON.Vector3.Zero());
            camera.viewport = getSoloCameraViewport();
            cameras.push(camera);
        } else {
            const camera1 = new BABYLON.FreeCamera(name + "1", position, scene);
            camera1.setTarget(BABYLON.Vector3.Zero());

            const camera2 = new BABYLON.FreeCamera(name + "2", position, scene);
            camera2.setTarget(BABYLON.Vector3.Zero());

            if (gameMode === GameMode.TOURNAMENT_LOCAL || gameMode === GameMode.TWO_PLAYER_LOCAL) {
                camera1.viewport = get3DCamera1Viewport();
                camera2.viewport = get3DCamera2Viewport();
            } else {
                camera1.viewport = getSoloCameraViewport()
                camera2.viewport = getSoloCameraViewport()
            }
            cameras.push(camera1, camera2);
        }
    }

    return cameras;
}

export function createGuiCamera(scene: any, name: string) {
    let camera;
    camera = new BABYLON.FreeCamera(name, BABYLON.Vector3.Zero(), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.viewport = new BABYLON.Viewport(0, 0, 1, 1);
    camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
    camera.orthoTop = 1;
    camera.orthoBottom = -1;
    camera.orthoLeft = -1;
    camera.orthoRight = 1;
    camera.layerMask = 0x20000000;

    return camera;
}

// Creates a light source for the given scene
export function createLight(scene: any, name: string, position: any): any {
    const light = new BABYLON.HemisphericLight(name, position, scene);
    light.intensity = 1.2;
    light.diffuse = new BABYLON.Color3(1, 1, 1);
    light.specular = new BABYLON.Color3(1, 1, 1);
    return light;
}

// Creates the ground for the game field
export function createGameField(scene: any, name: string, mode: ViewMode, texture?: TextureSet): any {

    const w = GAME_CONFIG.fieldWidth;
    const h = GAME_CONFIG.fieldHeight;
    const ground = BABYLON.MeshBuilder.CreateGround(name, { width : w, height : h}, scene);
    
    const color = mode === ViewMode.MODE_2D ? COLORS.field2D : COLORS.field3D;
    const groundTextureScale = getStandardTextureScale(w, h, MAP_OBJECT_TYPE.GROUND);
    ground.material = createMaterial(scene, name + "Material", color, mode, texture, groundTextureScale);

    return ground;
}

export function createWalls(scene: any, name: string, mode: ViewMode, texture?: TextureSet): any[] {
    const walls: any[] = [];
    const color = mode === ViewMode.MODE_2D ? COLORS.walls2D : COLORS.walls3D;
    
    const w = GAME_CONFIG.fieldWidth;
    const h = GAME_CONFIG.fieldHeight;
    const wall_h = GAME_CONFIG.wallHeight
    const wall_t = GAME_CONFIG.wallThickness; 

    // Single texture scaling for all walls
    const wallTextureScale = getStandardTextureScale(w, wall_h, MAP_OBJECT_TYPE.WALLS);
    const material = createMaterial(scene, name + "Material", color, mode, texture, wallTextureScale);

    // Top wall
    const topWall = BABYLON.MeshBuilder.CreateBox("topWall", {width: w, height: wall_h, depth: wall_t}, scene);
    topWall.position = new BABYLON.Vector3(0, wall_h / 2, h / 2 - (wall_t / 2));
    topWall.material = material;
    walls.push(topWall);

    // Bottom wall
    const bottomWall = BABYLON.MeshBuilder.CreateBox("bottomWall", {width: w - wall_t, height: wall_h, depth: wall_t}, scene);
    bottomWall.position = new BABYLON.Vector3(0, wall_h / 2, - (h / 2) + (wall_t / 2));
    bottomWall.material = material;
    walls.push(bottomWall);

    // Left wall
    const leftWall = BABYLON.MeshBuilder.CreateBox("leftWall", {width: h, height: wall_h, depth: wall_t}, scene);
    leftWall.position = new BABYLON.Vector3(-(w / 2), wall_h / 2, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.material = material;
    walls.push(leftWall);

    // Right wall
    const rightWall = BABYLON.MeshBuilder.CreateBox("rightWall", {width: h, height: wall_h, depth: wall_t}, scene);
    rightWall.position = new BABYLON.Vector3(w / 2, wall_h / 2, 0);
    rightWall.rotation.y = Math.PI / 2;
    rightWall.material = material;
    walls.push(rightWall);

    return walls;
}

// Creates a player object in the scene
export function createPlayer(scene: any, name: string, position: any, size: Size, color: any, mode: ViewMode, texture?: TextureSet): any {
    
    // Capsule - Creation of the object
    const player = BABYLON.MeshBuilder.CreateCapsule(name, {radius: size.z / 2, height: size.x, tessellation: 16 }, scene);
    player.rotation.z = Math.PI / 2;
    player.position = position;

    // or box
    // const player = BABYLON.MeshBuilder.CreateBox(name, {width: size.x, height: size.y, depth: size.z}, scene);
    
    // Creation of material
    const playerScale = getStandardTextureScale(size.x, size.z, MAP_OBJECT_TYPE.PLAYER);
    player.material = createMaterial(scene, name + "Material", color, mode, texture, playerScale);
     
    return player;
}

// Creates a ball object in the scene
export function createBall(scene: any, name: string, position: any, color: any, mode: ViewMode, texture?: TextureSet): any {

    const diameter = GAME_CONFIG.ballRadius * 2;
    const ball = BABYLON.MeshBuilder.CreateSphere(name, {diameter}, scene);
    ball.position = position;

    const playerScale = getStandardTextureScale(diameter, diameter, MAP_OBJECT_TYPE.PLAYER);
    ball.material = createMaterial(scene, name + "Material", color, mode, texture);

    return ball;
}