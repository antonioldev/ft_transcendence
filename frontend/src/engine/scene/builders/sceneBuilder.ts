import { Vector3, Scene, GlowLayer } from "@babylonjs/core";
import { createGameField, createWalls, createPlayer, createBall } from '../entities/gameObjects.js';
import { createLight } from "../rendering/lights.js";
import { GameObjects } from '../../../shared/types.js';
import { createCameras, createGuiCamera } from "./camerasBuilder.js";
import { GameMode, ViewMode } from '../../../shared/constants.js';
import { COLORS, getPlayerSize, getPlayerLeftPosition, getPlayerRightPosition, getBallStartPosition } from '../../utils.js';
import { createEnvironment, createTerrain } from './enviromentBuilder.js';
import { createFog, createRainParticles, createUnderwaterParticles, createDustParticleSystem} from '../rendering/effects.js'
import { createStaticObjects, createStaticObject } from "../entities/staticProps.js";
import { createActor } from "../entities/animatedProps.js";
import { MAP_CONFIGS } from "../config/mapConfigs.js";

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
	onProgress?: LoadingProgressCallback,
	themeObjects?: { props: any[]; actors: any[]; effects: any[] }
): Promise<GameObjects> {
	let cameras: any[];
	let playerLeft: any;
	let playerRight: any;

	let map_asset = MAP_CONFIGS.map2;

	onProgress?.(5);
	const lights = createLight(scene, "light1", new Vector3(100, 400, 0), map_asset.light);
	onProgress?.(10);
	const gameField = createGameField(scene, "ground", viewMode, map_asset.ground);
	onProgress?.(15);
	const walls = createWalls(scene, "walls", viewMode, map_asset.walls, { themeObjects, glow: map_asset.glow ?? 0 });
	onProgress?.(20);
	const balls: any[] = [];
	for (let i = 0; i < 3; i++){
		const ball = createBall(scene, `ball${i}`, getBallStartPosition(), COLORS.ball3D, viewMode, map_asset.ball);
		ball.visibility = 0;
		balls.push(ball);
	}
	onProgress?.(25);
	
	cameras = createCameras(scene, "camera", viewMode, gameMode);
	onProgress?.(30);
	createTerrain(scene, "terrain", viewMode, map_asset.terrain);
	onProgress?.(40);
	playerLeft = createPlayer(scene, "player1", getPlayerLeftPosition(), getPlayerSize(), COLORS.player1_3D, viewMode, map_asset.paddle);
	playerRight = createPlayer(scene, "player2", getPlayerRightPosition(), getPlayerSize(), COLORS.player2_3D, viewMode, map_asset.paddle);
	onProgress?.(50);
	createEnvironment(scene, map_asset.skybox);
	onProgress?.(60);

	if (map_asset === MAP_CONFIGS.map0) {
		for (const propData of map_asset.staticObjects) {
			const mesh = await createStaticObject(scene, propData); 
			themeObjects?.props.push(mesh);
		}
	} else {
		const staticMeshes = await createStaticObjects(scene, map_asset.staticObjects);
		themeObjects?.props.push(...staticMeshes);
}


	for (const actorConfig of map_asset.actors) {
		for (let i = 0; i < actorConfig.count; i++) {
			try {
				const actor = await createActor(scene, actorConfig);
				if (actor) {
					themeObjects?.actors.push(actor);
					console.log(`Actor ${i} created successfully`);
				}
			} catch (error) {
				console.error(`Failed to create actor ${i}:`, error);
			}
		}
	}

	onProgress?.(70);
	if (map_asset.particleType === 'underwater'){
		const bubble = createUnderwaterParticles(scene);
		themeObjects?.effects.push(bubble);
	}
		
	if (map_asset.particleType === 'dust'){
		const dust = createDustParticleSystem(scene);
		themeObjects?.effects.push(dust);
	}
	onProgress?.(75);
	if (map_asset.fogColor)
		createFog(scene, map_asset.fogColor);

		
	if (map_asset.rain) {
		const rain = createRainParticles(scene, map_asset.rain);
		themeObjects?.effects.push(rain);
	}

	onProgress?.(80);
	const glow = new GlowLayer("glow", scene);
	glow.intensity = map_asset.glow ?? 0;
	themeObjects?.effects.push(glow);

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
