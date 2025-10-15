import { Color3, Color4, Material, Mesh, MeshBuilder, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import { GAME_CONFIG } from '../../../shared/gameConfig.js';
import { PlayerSide } from '../../utils.js';

export function createPaddleGlow(scene: Scene, name: string, size: Vector3, parent: any): any {
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

export function createBallEffects(scene: Scene, ball: any, index: number) {
	const ballGlow = createBallGlow(scene, `ball${index}Glow`);
	ballGlow.parent = ball;
	
	const ballFreeze = createBallCage(scene, `ball${index}Glow`);
	ballFreeze.parent = ball;
	
	return { glow: ballGlow, freeze: ballFreeze };
}

function createBallCage(scene: Scene, name: string): Mesh {
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

function createBallGlow(scene: Scene, name: string): any {

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

