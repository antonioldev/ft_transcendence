import { Vector3,  Color3, MeshBuilder, StandardMaterial, Scene, Mesh } from "@babylonjs/core";
import { GAME_CONFIG } from '../../../shared/gameConfig.js';
import { Size } from '../../../shared/types.js';
import { ViewMode } from '../../../shared/constants.js';
import { TextureSet, MAP_OBJECT_TYPE } from "../config/sceneTypes.js";
import { createMaterial, getStandardTextureScale } from "../rendering/materials.js";
import { COLORS } from '../../utils.js';

// Creates the ground for the game field
export function createGameField(scene: any, name: string, mode: ViewMode, texture?: TextureSet): any {

	const w = GAME_CONFIG.fieldWidth;
	const h = GAME_CONFIG.fieldHeight;
	const ground = MeshBuilder.CreateGround(name, { width : w, height : h}, scene);
	ground.position.y = 0.01;
	
	const color = mode === ViewMode.MODE_2D ? COLORS.field2D : COLORS.field3D;
	const groundTextureScale = getStandardTextureScale(w, h, MAP_OBJECT_TYPE.GROUND);
	ground.material = createMaterial(scene, name + "Material", color, mode, texture, groundTextureScale);

	ground.isPickable = false;
	ground.freezeWorldMatrix();
	ground.alwaysSelectAsActiveMesh = true;

	return ground;
}

// Creates a player object in the scene
export function createWalls(scene: any, name: string, mode: ViewMode, texture?: TextureSet, opts?: { themeObjects?: { props: any[]; actors: any[]; effects: any[] }, glow?: number }): any[] {
	const walls: any[] = [];
	const color = mode === ViewMode.MODE_2D ? COLORS.walls2D : COLORS.walls3D;
	
	const w = GAME_CONFIG.fieldWidth;
	const h = GAME_CONFIG.fieldHeight;
	const wall_h = GAME_CONFIG.wallHeight
	const wall_t = GAME_CONFIG.wallThickness; 

	// Single texture scaling for all walls
	const wallTextureScale = getStandardTextureScale(w, wall_h, MAP_OBJECT_TYPE.WALLS);
	const material = createMaterial(scene, name + "Material", color, mode, texture, wallTextureScale);
	
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

	if ((opts?.glow ?? 0) > 0) {
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

		opts?.themeObjects?.props.push(
			leftHigh, leftLow, 
			rightHigh, rightLow,
			topHigh, topLow,
			bottomHigh, bottomLow
		);
	}
	return walls;
}

export function createPlayer(scene: any, name: string, position: any, size: Size, color: any, mode: ViewMode, texture?: TextureSet): any {

	const player = MeshBuilder.CreateCapsule(name, {radius: size.z / 2, height: size.x, tessellation: 16 }, scene);
	player.rotation.z = Math.PI / 2;
	player.position = position;
	
	const playerScale = getStandardTextureScale(size.x, size.z, MAP_OBJECT_TYPE.PLAYER);
	player.material = createMaterial(scene, name + "Material", color, mode, texture, playerScale);
	 
	return player;
}

// Creates a ball object in the scene
export function createBall(scene: any, name: string, position: any, color: any, mode: ViewMode, texture?: TextureSet): any {

	const diameter = GAME_CONFIG.ballRadius * 2;
	const ball = MeshBuilder.CreateSphere(name, {diameter}, scene);
	ball.position = position;

	const ballScale = getStandardTextureScale(diameter, diameter, MAP_OBJECT_TYPE.BALL);
	ball.material = createMaterial(scene, name + "Material", color, mode, texture, ballScale);

	return ball;
}

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
