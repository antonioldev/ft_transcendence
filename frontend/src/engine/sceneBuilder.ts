declare var BABYLON: any;

import { 
    GAME_CONFIG,
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
} from '../core/gameConfig.js';

export interface GameObjects {
    players: {
        left: any;
        right: any;
    };
    ball: any;
    ground: any;
    walls: any;
    cameras: any[];
    lights: any[];
}

interface Position {
    x: number;
    y: number;
    z: number;
}

interface Size {
    x: number;
    y: number;
    z: number;
}

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

// Simple helper functions - no class needed
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

function createLight(scene: any, name: string, position: any): any {
    return new BABYLON.HemisphericLight(name, position, scene);
}

function createGround(scene: any, name: string, width: number, height: number, color: any, is2D: boolean): any {
    const ground = BABYLON.MeshBuilder.CreateGround(name, { width, height }, scene);
    ground.material = createMaterial(scene, name + "Material", color, is2D);
    return ground;
}

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

function createPlayer(scene: any, name: string, position: Position, size: Size, color: any, is2D: boolean): any {
    const player = BABYLON.MeshBuilder.CreateBox(name, {width: size.x, height: size.y, depth: size.z}, scene);
    player.material = createMaterial(scene, name + "Material", color, is2D);
    player.position = position;
    return player;
}

function createBall(scene: any, name: string, position: any, color: any, is2D: boolean): any {
    const ball = BABYLON.MeshBuilder.CreateSphere(name, {diameter: GAME_CONFIG.ballRadius * 2}, scene);
    ball.material = createMaterial(scene, name + "Material", color, is2D);
    ball.position = position;
    return ball;
}

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