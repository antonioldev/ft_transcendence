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
} from '../core/utils.js'

export type LoadingProgressCallback = (progress: number) => void;

// Creates a material for the given scene
function createMaterial(scene: any, name: string, color: any, mode: ViewMode): any {
    const material = new BABYLON.StandardMaterial(name, scene);
    
    if (mode === ViewMode.MODE_2D) {
        material.emissiveColor = color;
        material.disableLighting = true;
    } else {
        material.diffuseColor = color;
    }
    return material;
}

// Creates a camera for the given scene
function createCamera(scene: any, name: string, position: any, viewport: any, mode: ViewMode): any {
    const camera = new BABYLON.FreeCamera(name, position, scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.viewport = viewport;
    if (mode === ViewMode.MODE_2D) {
         camera.rotation.z = -(Math.PI / 2);
         camera.fov = 1.1;
    }
    return camera;
}

// Creates a light source for the given scene
function createLight(scene: any, name: string, position: any): any {
    const light = new BABYLON.HemisphericLight(name, position, scene);
    return light;
}

function createTexturedMaterial(scene: any, name: string): any {
    const material = new BABYLON.StandardMaterial(name, scene);
    
    // Just the diffuse texture - nothing else
    material.diffuseTexture = new BABYLON.Texture("assets/textures/hearth/ground/brown_mud_leaves_01_diff_1k.jpg", scene);
    material.bumpTexture = new BABYLON.Texture("assets/textures/hearth/ground/brown_mud_leaves_01_nor_dx_1k.jpg", scene);
    
    // material.diffuseTexture.uScale = 2.0;
    // material.diffuseTexture.vScale = 2.0;
    // material.bumpTexture.uScale = 2.0;
    // material.bumpTexture.vScale = 2.0;
    return material; // TODO how to include texture
}

// Creates the ground for the game field
function createGround(scene: any, name: string, width: number, height: number, mode: ViewMode): any {
    const ground = BABYLON.MeshBuilder.CreateGround(name, { width, height }, scene);
    const color = mode === ViewMode.MODE_2D ? COLORS.field2D : COLORS.field3D;
    ground.material = createMaterial(scene, name + "Material", color, mode);
    // ground.material = createTexturedMaterial(scene, name + "Material");
    return ground;
}


// Creates the walls surrounding the game field
function createWalls(scene: any, name: string, fieldWidth: number, fieldHeight: number, wallHeight: number, wallThickness: number, mode: ViewMode): any[] {
    const walls: any[] = [];
    const color = mode === ViewMode.MODE_2D ? COLORS.walls2D : COLORS.walls3D;
    const material = createMaterial(scene, name + "Material", color, mode);

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
function createPlayer(scene: any, name: string, position: any, size: Size, color: any, mode: ViewMode): any {
    const player = BABYLON.MeshBuilder.CreateBox(name, {width: size.x, height: size.y, depth: size.z}, scene);
    player.material = createMaterial(scene, name + "Material", color, mode);
    player.position = position;
    return player;
}

// Creates a ball object in the scene
function createBall(scene: any, name: string, position: any, mode: ViewMode): any {
    const ball = BABYLON.MeshBuilder.CreateSphere(name, {diameter: GAME_CONFIG.ballRadius * 2}, scene);
    const color = mode === ViewMode.MODE_2D ? COLORS.ball2D : COLORS.ball3D;
    ball.material = createMaterial(scene, name + "Material", color, mode);
    ball.position = position;
    return ball;
}

function createHDRIEnvironment(scene: any): void {
    // Load the HDRI texture
    const hdrTexture = new BABYLON.HDRCubeTexture("assets/test.hdr", scene, 1024);
    // Set as environment texture (skybox + reflections)
    scene.environmentTexture = hdrTexture;
    
    // Optional: Create visible skybox
    scene.createDefaultSkybox(hdrTexture, true, 1000);
}

export async function buildScene(
    scene: any, engine: any, mode: ViewMode, onProgress?: LoadingProgressCallback): Promise<GameObjects> {
    let cameras: any;
    let playerLeft: any;
    let playerRight: any;

    onProgress?.(10);
    
    const lights = createLight(scene, "light1", new BABYLON.Vector3(0, 10, 0)); // TODO testing light
    // const lights = [
    //     new BABYLON.DirectionalLight("light1", new BABYLON.Vector3(-1, -0.5, 0), scene),
    //     new BABYLON.DirectionalLight("light2", new BABYLON.Vector3(1, -0.5, 0), scene)];
    const ground = createGround(scene, "ground", GAME_CONFIG.fieldWidth, GAME_CONFIG.fieldHeight, mode);
    const walls = createWalls(scene, "walls", GAME_CONFIG.fieldWidth, GAME_CONFIG.fieldHeight, GAME_CONFIG.wallHeight, GAME_CONFIG.wallThickness, mode);
    const ball = createBall(scene, "ball", getBallStartPosition(), mode);
    onProgress?.(50);
    if (mode === ViewMode.MODE_2D)
    {
        cameras = createCamera(scene, "camera1", getCamera2DPosition(), get2DCameraViewport(), mode);
        scene.activeCamera = cameras;
        playerLeft = createPlayer(scene, "player1", getPlayerLeftPosition(), getPlayerSize(), COLORS.player1_2D, mode);
        playerRight = createPlayer(scene, "player2", getPlayerRightPosition(), getPlayerSize(), COLORS.player2_2D, mode);
    } else {
        cameras = [
            createCamera(scene, "camera1", getCamera3DPlayer1Position(), get3DCamera1Viewport(), mode),
            createCamera(scene, "camera2", getCamera3DPlayer2Position(), get3DCamera2Viewport(), mode)
        ];
        scene.activeCameras = [cameras[0], cameras[1]];
        playerLeft = createPlayer(scene, "player1", getPlayerLeftPosition(), getPlayerSize(), COLORS.player1_3D, mode);
        playerRight = createPlayer(scene, "player2", getPlayerRightPosition(), getPlayerSize(), COLORS.player2_3D, mode);
        createHDRIEnvironment(scene);
    }
    onProgress?.(90);
    return {
        players: { left: playerLeft, right: playerRight },
        ball,
        ground,
        walls,
        cameras,
        lights
    };
}
