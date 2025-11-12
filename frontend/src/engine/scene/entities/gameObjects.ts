import { Color3, GroundMesh, Mesh, MeshBuilder, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import { GridMaterial } from "@babylonjs/materials";
import { ViewMode } from '../../../utils/constants.js';
import { GAME_CONFIG } from '../../../shared/gameConfig.js';
import type { Size } from '../../../shared/types.js';
import { MAP_OBJECT_TYPE } from "../config/sceneConst.js";
import type { MapAssetConfig, TextureSet, ThemeObject } from "../config/sceneTypes.js";
import { createMaterial, getStandardTextureScale } from "../builders/materialsBuilder.js";
import { MAP_CONFIGS } from "../config/mapConfigs.js";

// Creates the ground for the game field
export function createGameField(scene: Scene, name: string, mode: ViewMode, map_asset: MapAssetConfig): GroundMesh {

	const w = GAME_CONFIG.fieldWidth;
	const h = GAME_CONFIG.fieldHeight;
	const ground = MeshBuilder.CreateGround(name, { width : w, height : h}, scene);
	ground.position.y = 0.01;


	const texture = map_asset.ground;
	if (map_asset === MAP_CONFIGS.map6) {
		const material = new GridMaterial(name + "Material");
		material.opacity = 0.9;
		material.backFaceCulling = false;
		material.lineColor = new Color3(1, 0.2, 0);
		ground.material = material;
	} else {
		const groundTextureScale = getStandardTextureScale(w, h, MAP_OBJECT_TYPE.GROUND);
		ground.material = createMaterial(scene, name + "Material", mode, texture, groundTextureScale);
	}

	ground.isPickable = false;
	ground.freezeWorldMatrix();
	ground.alwaysSelectAsActiveMesh = true;

	return ground;
}

// Creates a player object in the scene
export function createWalls(scene: Scene, name: string, mode: ViewMode, texture: TextureSet): Mesh[] {
	const walls: Mesh[] = [];

	const w = GAME_CONFIG.fieldWidth;
	const h = GAME_CONFIG.fieldHeight;
	const wall_h = GAME_CONFIG.wallHeight
	const wall_t = GAME_CONFIG.wallThickness; 

	const wallTextureScale = getStandardTextureScale(w, wall_h, MAP_OBJECT_TYPE.WALLS);
	const material = createMaterial(scene, name + "Material", mode, texture, wallTextureScale);
	
	if (mode === ViewMode.MODE_3D && (!texture || texture.diffuse === null))
		material.alpha = 0;

	// Top wall
	const topWall = MeshBuilder.CreateBox("topWall", {width: w, height: wall_h, depth: wall_t}, scene);
	topWall.position = new Vector3(0, wall_h / 2, h / 2 - (wall_t / 2));
	topWall.material = material;
	topWall.isPickable = false;
	topWall.freezeWorldMatrix();
	topWall.alwaysSelectAsActiveMesh = true;
	walls.push(topWall);

	// Bottom wall
	const bottomWall = MeshBuilder.CreateBox("bottomWall", {width: w - wall_t, height: wall_h, depth: wall_t}, scene);
	bottomWall.position = new Vector3(0, wall_h / 2, - (h / 2) + (wall_t / 2));
	bottomWall.material = material;
	bottomWall.isPickable = false;
	bottomWall.freezeWorldMatrix();
	bottomWall.alwaysSelectAsActiveMesh = true;
	walls.push(bottomWall);

	// Left wall
	const leftWall = MeshBuilder.CreateBox("leftWall", {width: h, height: wall_h, depth: wall_t}, scene);
	leftWall.position = new Vector3(-(w / 2), wall_h / 2, 0);
	leftWall.rotation.y = Math.PI / 2;
	leftWall.material = material;
	leftWall.isPickable = false;
	leftWall.freezeWorldMatrix();
	leftWall.alwaysSelectAsActiveMesh = true;
	walls.push(leftWall);

	// Right wall
	const rightWall = MeshBuilder.CreateBox("rightWall", {width: h, height: wall_h, depth: wall_t}, scene);
	rightWall.position = new Vector3(w / 2, wall_h / 2, 0);
	rightWall.rotation.y = Math.PI / 2;
	rightWall.material = material;
	rightWall.isPickable = false;
	rightWall.freezeWorldMatrix();
	rightWall.alwaysSelectAsActiveMesh = true;
	walls.push(rightWall);

	return walls;
}

export function createPlayer(scene: Scene, name: string, position: Vector3, size: Size, mode: ViewMode, texture: TextureSet): Mesh {

	const player = MeshBuilder.CreateCapsule(name, {radius: size.z / 2, height: size.x, tessellation: 16 }, scene);
	player.rotation.z = Math.PI / 2;
	player.position = position;
	
	const playerScale = getStandardTextureScale(size.x, size.z, MAP_OBJECT_TYPE.PLAYER);
	player.material = createMaterial(scene, name + "Material", mode, texture, playerScale);
	 
	return player;
}

// Creates a ball object in the scene
export function createBall(scene: Scene, name: string, position: Vector3, mode: ViewMode, texture: TextureSet): Mesh {

	const diameter = GAME_CONFIG.ballRadius * 2;
	const ball = MeshBuilder.CreateSphere(name, {diameter}, scene);
	ball.position = position;
	ball.visibility = 0;

	const ballScale = getStandardTextureScale(diameter, diameter, MAP_OBJECT_TYPE.BALL);
	ball.material = createMaterial(scene, name + "Material", mode, texture, ballScale);

	return ball;
}

function makeLine(name: string, width: number, pos: Vector3, scene: Scene, material: StandardMaterial, rotateY: number): Mesh {
	const height = 0.04;
	const plane = MeshBuilder.CreatePlane(name, { width, height, sideOrientation: Mesh.DOUBLESIDE }, scene);
	plane.isPickable = false;
	plane.position = pos;
	plane.rotation.x = 0;
	plane.rotation.y = rotateY;
	plane.material = material;

	return plane;
}

export function createWallLineGlowEffect(scene: Scene, themeObjects: ThemeObject ): void {
	const w = GAME_CONFIG.fieldWidth;
	const h = GAME_CONFIG.fieldHeight;
	const wall_h = GAME_CONFIG.wallHeight
	const wall_t = GAME_CONFIG.wallThickness; 

	const whiteGlowMat = new StandardMaterial("whiteGlowMat", scene);
	whiteGlowMat.disableLighting = true;
	whiteGlowMat.diffuseColor = Color3.Black();
	whiteGlowMat.emissiveColor = Color3.FromHexString("#00ffff");
	whiteGlowMat.fogEnabled = false;

	const eps = 0.01;

	const zLen = h * 0.98;
	const xLen = w * 0.98;
	const yHigh = wall_h * 0.75;
	const yLow  = wall_h * 0.35;

	const xLeftInner  = -(w / 2) + (wall_t / 2) + eps;
	const xRightInner =  (w / 2) - (wall_t / 2) - eps;
	const zTopInner   =  (h / 2) - (wall_t / 2) - eps;
	const zBottomInner = -(h / 2) + (wall_t / 2) + eps;

	const leftHigh = makeLine("leftGlowHigh", zLen, new Vector3(xLeftInner, yHigh, 0), scene, whiteGlowMat, -Math.PI / 2);
	const leftLow = makeLine("leftGlowLow", zLen, new Vector3(xLeftInner, yLow, 0), scene, whiteGlowMat, -Math.PI / 2);

	const rightHigh = makeLine("rightGlowHigh", zLen, new Vector3(xRightInner, yHigh, 0), scene, whiteGlowMat, Math.PI / 2);
	const rightLow = makeLine("rightGlowLow", zLen, new Vector3(xRightInner, yLow, 0), scene, whiteGlowMat, Math.PI / 2);

	const topHigh = makeLine("topGlowHigh", xLen, new Vector3(0, yHigh, zTopInner), scene, whiteGlowMat, 0);
	const topLow = makeLine("topGlowLow", xLen, new Vector3(0, yLow, zTopInner), scene, whiteGlowMat, 0);

	const bottomHigh = makeLine("bottomGlowHigh", xLen, new Vector3(0, yHigh, zBottomInner), scene, whiteGlowMat, Math.PI);
	const bottomLow = makeLine("bottomGlowLow", xLen, new Vector3(0, yLow, zBottomInner), scene, whiteGlowMat, Math.PI);

	themeObjects?.props.push(
		leftHigh, leftLow,
		rightHigh, rightLow,
		topHigh, topLow,
		bottomHigh, bottomLow
	);
}
