import { Vector3, Scene } from "@babylonjs/core";
import { createCameras, createGuiCamera, createLight, createGameField, createWalls, createPlayer, createBall } from './gameObjectsFactory.js';
import { GameObjects } from '../../shared/types.js';
import { GameMode, ViewMode } from '../../shared/constants.js';
import { COLORS, getPlayerSize, getPlayerLeftPosition, getPlayerRightPosition, getBallStartPosition } from '../utils.js';
import { MAP_ASSETS } from './sceneAssets.js';
import { createEnvironment, createTerrain, createVegetation } from './environmentFactory.js';

export type LoadingProgressCallback = (progress: number) => void;

export async function buildScene2D(
	scene: Scene,
	gameMode: GameMode,
	viewMode: ViewMode,
	onProgress?: LoadingProgressCallback
): Promise<GameObjects> {
	let cameras: any[];
	let playerLeft: any;
	let playerRight: any;

	onProgress?.(5);
	const lights = createLight(scene, "light1", new Vector3(0, 10, 0));
	onProgress?.(15);
	const gameField = createGameField(scene, "ground", viewMode, undefined);
	onProgress?.(25);
	const walls = createWalls(scene, "walls", viewMode, undefined);
	onProgress?.(30);
	const balls: any[] = [];
	for (let i = 0; i < 3; i++){
		const ball = createBall(scene, `ball${i}`, getBallStartPosition(), COLORS.ball2D, viewMode, undefined);
		ball.visibility = 0;
		balls.push(ball);
	}
	onProgress?.(40);
	
	cameras = createCameras(scene, "camera", viewMode, gameMode);
	playerLeft = createPlayer(scene, "player1", getPlayerLeftPosition(), getPlayerSize(), COLORS.player1_2D, viewMode, undefined);
	playerRight = createPlayer(scene, "player2", getPlayerRightPosition(), getPlayerSize(), COLORS.player2_2D, viewMode, undefined);
	onProgress?.(80);
	await scene.whenReadyAsync();
	onProgress?.(95);
	const guiCamera = createGuiCamera(scene, "guiCamera");
	const allCameras = [...cameras, guiCamera];
	scene.activeCameras = allCameras;
	onProgress?.(100);
	return {
		players: { left: playerLeft, right: playerRight },
		balls,
		gameField,
		walls,
		cameras,
		guiCamera,
		lights
	};
}

export async function buildScene3D(
	scene: Scene,
	gameMode: GameMode,
	viewMode: ViewMode, 
	onProgress?: LoadingProgressCallback
): Promise<GameObjects> {
	let cameras: any[];
	let playerLeft: any;
	let playerRight: any;

	let map_asset = MAP_ASSETS.map1;

	onProgress?.(5);
	const lights = createLight(scene, "light1", new Vector3(0, 10, 0));
	onProgress?.(15);
	const gameField = createGameField(scene, "ground", viewMode, map_asset.textures.ground);
	onProgress?.(25);
	const walls = createWalls(scene, "walls", viewMode, map_asset.textures.walls);
	onProgress?.(30);
	const balls: any[] = [];
	for (let i = 0; i < 3; i++){
		const ball = createBall(scene, `ball${i}`, getBallStartPosition(), COLORS.ball3D, viewMode, map_asset.textures.ball);
		ball.visibility = 0;
		balls.push(ball);
	}
	// const ball = createBall(scene, "ball", getBallStartPosition(), COLORS.ball3D, viewMode, map_asset.textures.ball);
	onProgress?.(40);
	
	cameras = createCameras(scene, "camera", viewMode, gameMode);
	onProgress?.(50);
	createTerrain(scene, "terrain", viewMode, map_asset.textures.terrain);
	onProgress?.(60);
	playerLeft = createPlayer(scene, "player1", getPlayerLeftPosition(), getPlayerSize(), COLORS.player1_3D, viewMode, map_asset.textures.paddle);
	playerRight = createPlayer(scene, "player2", getPlayerRightPosition(), getPlayerSize(), COLORS.player2_3D, viewMode, map_asset.textures.paddle);
	onProgress?.(70);
	createEnvironment(scene, map_asset.environment.skybox);
	onProgress?.(80);
	
	await createVegetation(scene, map_asset.vegetation.tree);
	await createVegetation(scene, map_asset.vegetation.bush);
	onProgress?.(90);
	await scene.whenReadyAsync();
	onProgress?.(95);
	const guiCamera = createGuiCamera(scene, "guiCamera");

	onProgress?.(100);
	return {
		players: { left: playerLeft, right: playerRight },
		balls,
		gameField,
		walls,
		cameras,
		guiCamera,
		lights
	};
}

