import { Color3, Color4, Material, Mesh, MeshBuilder, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import { ViewMode } from '../../../shared/constants.js';
import { GAME_CONFIG } from '../../../shared/gameConfig.js';
import { Size } from '../../../shared/types.js';
import { PlayerSide } from '../../utils.js';
import { MAP_OBJECT_TYPE, TextureSet } from "../config/sceneTypes.js";
import { createMaterial, getStandardTextureScale } from "../rendering/materials.js";

// Creates the ground for the game field
export function createGameField(scene: any, name: string, mode: ViewMode, texture: TextureSet): any {

	const w = GAME_CONFIG.fieldWidth;
	const h = GAME_CONFIG.fieldHeight;
	const ground = MeshBuilder.CreateGround(name, { width : w, height : h}, scene);
	ground.position.y = 0.01;
	
	const groundTextureScale = getStandardTextureScale(w, h, MAP_OBJECT_TYPE.GROUND);
	ground.material = createMaterial(scene, name + "Material", mode, texture, groundTextureScale);

	ground.isPickable = false;
	ground.freezeWorldMatrix();
	ground.alwaysSelectAsActiveMesh = true;

	return ground;
}

// Creates a player object in the scene
export function createWalls(scene: any, name: string, mode: ViewMode, texture: TextureSet): any[] {
	const walls: any[] = [];

	const w = GAME_CONFIG.fieldWidth;
	const h = GAME_CONFIG.fieldHeight;
	const wall_h = GAME_CONFIG.wallHeight
	const wall_t = GAME_CONFIG.wallThickness; 

	// Single texture scaling for all walls
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

export function createPlayer(scene: any, name: string, position: any, size: Size, mode: ViewMode, texture: TextureSet): any {

	const player = MeshBuilder.CreateCapsule(name, {radius: size.z / 2, height: size.x, tessellation: 16 }, scene);
	player.rotation.z = Math.PI / 2;
	player.position = position;
	
	const playerScale = getStandardTextureScale(size.x, size.z, MAP_OBJECT_TYPE.PLAYER);
	player.material = createMaterial(scene, name + "Material", mode, texture, playerScale);
	 
	return player;
}

// Creates a ball object in the scene
export function createBall(scene: any, name: string, position: any, mode: ViewMode, texture: TextureSet): any {

	const diameter = GAME_CONFIG.ballRadius * 2;
	const ball = MeshBuilder.CreateSphere(name, {diameter}, scene);
	ball.position = position;
	ball.visibility = 0;

	const ballScale = getStandardTextureScale(diameter, diameter, MAP_OBJECT_TYPE.BALL);
	ball.material = createMaterial(scene, name + "Material", mode, texture, ballScale);

	return ball;
}


// CReate children of objects to visualize the powerup
export function makeLine(
	name: string,
	width: number,
	height: number,
	pos: Vector3,
	scene: Scene,
	opts?: {
		rotateX?: number;
		rotateY?: number;
		rotateZ?: number;
		material?: StandardMaterial;
	}
	) {
	const plane = MeshBuilder.CreatePlane(name, { width, height, sideOrientation: Mesh.DOUBLESIDE }, scene);
	plane.isPickable = false;
	plane.position = pos;

	// defaults: keep old behavior (ground line)
	plane.rotation.x = opts?.rotateX ?? Math.PI / 2;
	if (opts?.rotateY !== undefined) plane.rotation.y = opts.rotateY;
	if (opts?.rotateZ !== undefined) plane.rotation.z = opts.rotateZ;

	const mat = opts?.material ?? new StandardMaterial(`${name}_mat`, scene);
	if (!opts?.material) {
		mat.diffuseColor = Color3.Black();
		mat.emissiveColor = Color3.FromHexString("#00ffff");
		mat.disableLighting = true;
	}
	plane.material = mat;

	return plane;
}

export function createWallLineGlowEffect(scene: Scene, themeObjects: { props: any[]; actors: any[]; effects: any[] } ): any {
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
	const lineThickness = Math.max(0.02 * wall_h, 0.04);
	const yHigh = wall_h * 0.75;
	const yLow  = wall_h * 0.35;

	const xLeftInner  = -(w / 2) + (wall_t / 2) + eps;
	const xRightInner =  (w / 2) - (wall_t / 2) - eps;
	const zTopInner   =  (h / 2) - (wall_t / 2) - eps;
	const zBottomInner = -(h / 2) + (wall_t / 2) + eps;

	const leftHigh = makeLine("leftGlowHigh", zLen, lineThickness, new Vector3(xLeftInner, yHigh, 0), scene, {
		rotateX: 0, rotateY: -Math.PI / 2, material: whiteGlowMat});
	const leftLow = makeLine("leftGlowLow", zLen, lineThickness, new Vector3(xLeftInner, yLow, 0), scene, {
		rotateX: 0, rotateY: -Math.PI / 2, material: whiteGlowMat});

	const rightHigh = makeLine("rightGlowHigh", zLen, lineThickness, new Vector3(xRightInner, yHigh, 0), scene, {
		rotateX: 0, rotateY:  Math.PI / 2, material: whiteGlowMat});
	const rightLow = makeLine("rightGlowLow", zLen, lineThickness, new Vector3(xRightInner, yLow, 0), scene, {
		rotateX: 0, rotateY:  Math.PI / 2, material: whiteGlowMat});

	const topHigh = makeLine("topGlowHigh", xLen, lineThickness, new Vector3(0, yHigh, zTopInner), scene, {
		rotateX: 0, rotateY: 0, material: whiteGlowMat});
	const topLow = makeLine("topGlowLow", xLen, lineThickness, new Vector3(0, yLow, zTopInner), scene, {
		rotateX: 0, rotateY: 0, material: whiteGlowMat});

	const bottomHigh = makeLine("bottomGlowHigh", xLen, lineThickness, new Vector3(0, yHigh, zBottomInner), scene, {
		rotateX: 0, rotateY: Math.PI, material: whiteGlowMat});
	const bottomLow = makeLine("bottomGlowLow", xLen, lineThickness, new Vector3(0, yLow, zBottomInner), scene, {
		rotateX: 0, rotateY: Math.PI, material: whiteGlowMat});

	themeObjects?.props.push(
		leftHigh, leftLow, 
		rightHigh, rightLow,
		topHigh, topLow,
		bottomHigh, bottomLow
	);
}

export function createPaddleGlowEffect(scene: Scene, name: string, size: Vector3, parent: any): any {
	const radius = (size.z / 2) * 1.01;
	const height = size.x * 1.01;

	const material = new StandardMaterial(name + "Material", scene);
	material.diffuseColor = Color3.Black();
	material.emissiveColor = Color3.White();
	material.alpha = 0.3;
	material.disableLighting = true;

	const shell = MeshBuilder.CreateCapsule(name, {radius: radius, height: height, tessellation: 16}, scene );
	shell.material = material;
	shell.isPickable = false;
	shell.visibility = 0;

	shell.parent = parent;

	return shell;
}

export function createPaddleCage(scene: Scene, name: string, size: Vector3, parent: any): any {
	const cageRadius = (size.z / 2) * 1.1;
	const cageHeight = size.x * 1;

	const cage = MeshBuilder.CreateCapsule(name, {
		radius: cageRadius,
		height: cageHeight,
		tessellation: 16
	}, scene);

	const material = new StandardMaterial(name + "Material", scene);
	material.emissiveColor = Color3.White();
	material.alpha = 0.3;
	material.disableLighting = true;
	material.transparencyMode = Material.MATERIAL_ALPHABLEND;
	
	cage.enableEdgesRendering();
	cage.edgesWidth = 2.0;
	cage.edgesColor = new Color4(1, 1, 1, 1);
	
	cage.material = material;
	cage.isPickable = false;
	cage.visibility = 0;
	cage.parent = parent;

	return cage;
}

export function createBallGlowEffect(scene: Scene, name: string): any {

	const diameter = (GAME_CONFIG.ballRadius * 2) * 1.2;
	const cage = MeshBuilder.CreateSphere(name, {diameter}, scene);

	const material = new StandardMaterial(name + "Material", scene);
	material.diffuseColor = Color3.Black();
	material.emissiveColor = Color3.White();
	material.alpha = 0.4;
	material.disableLighting = true;
	
	cage.material = material;
	cage.isPickable = false;
	cage.visibility = 0;
	
	return cage;
}

export function createBallCage(scene: Scene, name: string): Mesh {
	const cageSize = GAME_CONFIG.ballRadius;
	
	const cage = MeshBuilder.CreatePolyhedron(name, {
		type: 2,
		size: cageSize
	}, scene);
	
	const material = new StandardMaterial(name + "Material", scene);
	material.diffuseColor = Color3.Black();
	material.emissiveColor = Color3.FromHexString("#87CEEB");
	material.alpha = 0.4;
	material.wireframe = true;
	material.disableLighting = true;
	
	cage.material = material;
	cage.isPickable = false;
	cage.visibility = 0;
	
	return cage;
}


export function createWallGlowEffect(scene: Scene, name: string, side: PlayerSide): any {

	const w = GAME_CONFIG.fieldWidth * 0.95;
	const wall_h = GAME_CONFIG.wallHeight * 0.95;
	const wall_t = GAME_CONFIG.wallThickness / 2;

	const shield = MeshBuilder.CreateBox(name, {width: w, height: wall_h, depth: wall_t}, scene);
	shield.position.z = side === PlayerSide.LEFT? 0.5 : -0.5;

	const material = new StandardMaterial(name + "Material", scene);
	material.diffuseColor = Color3.Black();
	material.emissiveColor = Color3.White();
	material.alpha = 0.3;
	material.disableLighting = true;
	
	shield.material = material;
	shield.isPickable = false;
	shield.visibility = 0;

	const wallName = side === PlayerSide.LEFT
		? "bottomWall" : "topWall";
	const parent = scene.getMeshByName(wallName);
	shield.parent = parent;
	
	return shield;
}

