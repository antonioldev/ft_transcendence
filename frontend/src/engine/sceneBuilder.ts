// This file contains utility functions to build 2D and 3D game scenes using the BABYLON.js library.
// It includes methods to create materials, cameras, lights, ground, walls, players, and balls for the game.

declare var BABYLON: any;

import { GAME_CONFIG } from '../shared/gameConfig.js';

import { Position, Size, GameObjects } from '../shared/types.js';

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
} from '../core/utils.js'

// Creates a material for the given scene
function createMaterial(scene: any, name: string, color: any, is2D: boolean): any {
    const material = new BABYLON.StandardMaterial(name, scene);
    
    if (is2D) {
        material.emissiveColor = color;
        material.disableLighting = true;
    } else {
        material.diffuseColor = color;
    }
    return material;
}

// Creates a camera for the given scene
function createCamera(scene: any, name: string, position: any, viewport: any, is2D: boolean): any {
    const camera = new BABYLON.FreeCamera(name, position, scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.viewport = viewport;
    if (is2D) {
         camera.rotation.z = -(Math.PI / 2);
         camera.fov = 1.1;
    }
    return camera;
}

// Creates a light source for the given scene
function createLight(scene: any, name: string, position: any): any {
    return new BABYLON.HemisphericLight(name, position, scene);
}

// Creates the ground for the game field
function createGround(scene: any, name: string, width: number, height: number, color: any, is2D: boolean): any {
    const ground = BABYLON.MeshBuilder.CreateGround(name, { width, height }, scene);
    ground.material = createMaterial(scene, name + "Material", color, is2D);
    return ground;
}

// Creates the walls surrounding the game field
function createWalls(scene: any, name: string, fieldWidth: number, fieldHeight: number, wallHeight: number, wallThickness: number, color: any, is2D: boolean): any[] {
    const walls: any[] = [];
    const material = createMaterial(scene, name + "Material", color, is2D);

    // Top wall
    const topWall = BABYLON.MeshBuilder.CreateBox("topWall", {width: fieldWidth, height: wallHeight, depth: wallThickness}, scene);
    topWall.position = new BABYLON.Vector3(0, wallHeight / 2, fieldHeight / 2);
    topWall.material = material;
    walls.push(topWall);

    // Bottom wall
    const bottomWall = BABYLON.MeshBuilder.CreateBox("bottomWall", {width: fieldWidth, height: wallHeight, depth: wallThickness}, scene);
    bottomWall.position = new BABYLON.Vector3(0, wallHeight / 2, -(fieldHeight / 2));
    bottomWall.material = material;
    walls.push(bottomWall);

    // Left wall
    const leftWall = BABYLON.MeshBuilder.CreateBox("leftWall", {width: wallThickness, height: wallHeight, depth: fieldHeight + 1}, scene);
    leftWall.position = new BABYLON.Vector3(-(fieldWidth / 2), wallHeight / 2, 0);
    leftWall.material = material;
    walls.push(leftWall);

    // Right wall
    const rightWall = BABYLON.MeshBuilder.CreateBox("rightWall", {width: wallThickness, height: wallHeight, depth: fieldHeight + 1}, scene);
    rightWall.position = new BABYLON.Vector3(fieldWidth / 2, wallHeight / 2, 0);
    rightWall.material = material;
    walls.push(rightWall);

    return walls;
}

// Creates a player object in the scene
function createPlayer(scene: any, name: string, position: Position, size: Size, color: any, is2D: boolean): any {
    const player = BABYLON.MeshBuilder.CreateBox(name, {width: size.x, height: size.y, depth: size.z}, scene);
    player.material = createMaterial(scene, name + "Material", color, is2D);
    player.position = position;
    return player;
}

// Creates a ball object in the scene
function createBall(scene: any, name: string, position: any, color: any, is2D: boolean): any {
    const ball = BABYLON.MeshBuilder.CreateSphere(name, {diameter: GAME_CONFIG.ballRadius * 2}, scene);
    ball.material = createMaterial(scene, name + "Material", color, is2D);
    ball.position = position;
    return ball;
}

// Builds and returns the 2D game scene
export function build2DScene(scene: any, engine: any): GameObjects {
    //scene.clearColor = BABYLON.Color3.Black();

    const camera = createCamera(scene, "camera1", getCamera2DPosition(), get2DCameraViewport(), true);
    scene.activeCamera = camera;

    const light = createLight(scene, "light1", new BABYLON.Vector3(0, 1, 0));
    
    const ground = createGround(scene, "ground", GAME_CONFIG.fieldWidth, GAME_CONFIG.fieldHeight, COLORS.field2D, true);

    const walls = createWalls(scene, "walls", GAME_CONFIG.fieldWidth, GAME_CONFIG.fieldHeight, GAME_CONFIG.wallHeight, GAME_CONFIG.wallThickness, COLORS.walls2D, true);
    
    const playerLeft = createPlayer(scene, "player1", getPlayerLeftPosition(), getPlayerSize(), COLORS.player1_2D, true);
    
    const playerRight = createPlayer(scene, "player2", getPlayerRightPosition(), getPlayerSize(), COLORS.player2_2D, true);
    
    const ball = createBall(scene, "ball", getBallStartPosition(), COLORS.ball2D, true);

    return {
        players: { left: playerLeft, right: playerRight },
        ball,
        ground,
        walls,
        cameras: [camera],
        lights: [light]
    };
}

// Builds and returns the 3D game scene
export function build3DScene(scene: any, engine: any): GameObjects {
    const camera1 = createCamera(scene, "camera1", getCamera3DPlayer1Position(), get3DCamera1Viewport(), false);
    const camera2 = createCamera(scene, "camera2", getCamera3DPlayer2Position(), get3DCamera2Viewport(), false);

    scene.activeCameras = [camera1, camera2];

    const light = createLight(scene, "light1", new BABYLON.Vector3(1, 1, 0));

    const ground = createGround(scene, "ground", GAME_CONFIG.fieldWidth, GAME_CONFIG.fieldHeight, COLORS.field3D, false);

    const walls = createWalls(scene, "walls", GAME_CONFIG.fieldWidth, GAME_CONFIG.fieldHeight, GAME_CONFIG.wallHeight, GAME_CONFIG.wallThickness, COLORS.walls3D, false);
        
    const playerLeft = createPlayer(scene, "player1", getPlayerLeftPosition(), getPlayerSize(), COLORS.player1_3D, false);
        
    const playerRight = createPlayer(scene, "player2", getPlayerRightPosition(), getPlayerSize(), COLORS.player2_3D, false);

    const ball = createBall(scene, "ball", getBallStartPosition(), COLORS.ball3D, false);

    return {
        players: { left: playerLeft, right: playerRight },
        ball,
        ground,
        walls,
        cameras: [camera1, camera2],
        lights: [light]
    };
}