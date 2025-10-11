import { Scene, GlowLayer } from "@babylonjs/core";
import { createGameField, createWalls, createPlayer, createBall } from '../entities/gameObjects.js';
import { GameObjects, ThemeObject } from '../../../shared/types.js';
import { createCameras, createGuiCamera } from "./camerasBuilder.js";
import { GameMode, ViewMode } from '../../../shared/constants.js';
import { getPlayerSize, getPlayerLeftPosition, getPlayerRightPosition, getBallStartPosition, PlayerSide } from '../../utils.js';
import { createEnvironment, createTerrain, createLight } from './enviromentBuilder.js';
import { createFog, createRainParticles, createUnderwaterParticles, createDustParticleSystem, createSnow} from '../rendering/effects.js'
import { createStaticObjects, createStaticObject } from "../entities/staticProps.js";
import { createActor } from "../entities/animatedProps.js";
import { MAP_CONFIGS } from "../config/mapConfigs.js";
import { createPaddleGlowEffect, createPaddleCage, createBallGlowEffect, createBallCage, createWallLineGlowEffect, createWallGlowEffect } from "../entities/gameObjects.js";
import { MapAssetConfig } from "../config/sceneTypes.js";

export type LoadingProgressCallback = (progress: number) => void;

export async function buildScene (
	scene: Scene,
	gameMode: GameMode,
	viewMode: ViewMode,
	onProgress?: LoadingProgressCallback
): Promise<{ gameObjects: GameObjects; themeObjects: ThemeObject }> {
	let cameras: any[];
	let playerLeft: any;
	let playerRight: any;
	const balls: any[] = [];
	const ballsGlow: any[] = [];
	const ballsFreeze: any[] = [];
	let themeObjects: ThemeObject = { props: [], actors: [], effects: [] };

	const map_asset = viewMode === ViewMode.MODE_2D 
		? MAP_CONFIGS.map : MAP_CONFIGS.map4

	const lights = createLight(scene, "light1", viewMode, map_asset.light);
	const gameField = createGameField(scene, "ground", viewMode, map_asset.ground);
	const walls = createWalls(scene, "walls", viewMode, map_asset.walls);
	onProgress?.(20);
	
	for (let i = 0; i < 3; i++){
		const ball = createBall(scene, `ball${i}`, getBallStartPosition(), viewMode, map_asset.ball);
		balls.push(ball);
		const { glow, freeze } = createBallEffects(scene, ball, i);
		ballsGlow.push(glow);
		ballsFreeze.push(freeze);
	}
	
	cameras = createCameras(scene, "camera", viewMode, gameMode);
	const guiCamera = createGuiCamera(scene, "guiCamera");

	if (viewMode === ViewMode.MODE_2D) {
		const allCameras = [...cameras, guiCamera];
		scene.activeCameras = allCameras;
	}

	onProgress?.(40);
	playerLeft = createPlayer(scene, "player1", getPlayerLeftPosition(), getPlayerSize(), viewMode, map_asset.paddle);
	playerRight = createPlayer(scene, "player2", getPlayerRightPosition(), getPlayerSize(), viewMode, map_asset.paddle);

	const leftPlayerGlow = createPaddleGlowEffect(scene, "leftGlow", getPlayerSize(), playerLeft);
	const rightPlayerGlow = createPaddleGlowEffect(scene, "rightGlow", getPlayerSize(), playerRight);
	const leftPlayerCage = createPaddleCage(scene, "leftCage", getPlayerSize(), playerLeft);
	const rightPlayerCage = createPaddleCage(scene, "rightCage", getPlayerSize(), playerRight);
	const leftShield = createWallGlowEffect(scene, "leftShield", PlayerSide.LEFT);
	const rightShield = createWallGlowEffect(scene, "rightShield", PlayerSide.RIGHT);

	onProgress?.(60);
	if (viewMode === ViewMode.MODE_3D)
		await build3DThemeObjects(scene, map_asset, themeObjects, onProgress);


	const glow = new GlowLayer("glow", scene);
	glow.intensity = map_asset.glow ?? 0;
	themeObjects?.effects.push(glow);

	onProgress?.(100);
	await scene.whenReadyAsync();

	return {
		gameObjects: {
			players: { left: playerLeft, right: playerRight },
			balls,
			gameField,
			walls,
			cameras,
			guiCamera,
			lights,
			effects: { leftGlow: leftPlayerGlow, rightGlow: rightPlayerGlow, leftCage: leftPlayerCage, rightCage: rightPlayerCage,
				balls: ballsGlow, ballsFreeze: ballsFreeze,
				shieldLeft: leftShield, shieldRight: rightShield }
		},
		themeObjects
	};
}

function createBallEffects(scene: Scene, ball: any, index: number) {
	const ballGlow = createBallGlowEffect(scene, `ball${index}Glow`);
	ballGlow.parent = ball;
	
	const ballFreeze = createBallCage(scene, `ball${index}Glow`);
	ballFreeze.parent = ball;
	
	return { glow: ballGlow, freeze: ballFreeze };
}

async function build3DThemeObjects(
	scene: Scene,
	map_asset: MapAssetConfig,
	themeObjects: ThemeObject,
	onProgress?: LoadingProgressCallback
): Promise<void> {
	createEnvironment(scene, map_asset.skybox);
	if (map_asset.terrain)
		createTerrain(scene, "terrain", map_asset.terrain);

	if (map_asset === MAP_CONFIGS.map0 || map_asset === MAP_CONFIGS.map4) {
		for (const propData of map_asset.staticObjects) {
			const mesh = await createStaticObject(scene, propData); 
			themeObjects?.props.push(mesh);
		}
	} else {
		const staticMeshes = await createStaticObjects(scene, map_asset.staticObjects);
		themeObjects?.props.push(...staticMeshes);
	}

	onProgress?.(80);
	for (const actorConfig of map_asset.actors) {
		for (let i = 0; i < actorConfig.count; i++) {
			try {
				const actor = await createActor(scene, actorConfig);
				if (actor) {
					themeObjects?.actors.push(actor);
				}
			} catch (error) {
				console.error(`Failed to create actor ${i}:`, error);
			}
		}
	}


	if (map_asset.particleType === 'underwater'){
		const bubble = createUnderwaterParticles(scene);
		themeObjects?.effects.push(bubble);
	}
		
	if (map_asset.particleType === 'dust'){
		const dust = createDustParticleSystem(scene);
		themeObjects?.effects.push(dust);
	}

	if (map_asset.particleType === 'snow') {
		const snow = createSnow(scene);
		themeObjects.effects.push(snow);
	}

	if (map_asset.fogColor)
		createFog(scene, map_asset.fogColor, map_asset.fogIntensity);

	if (map_asset.glow > 0.5)
		createWallLineGlowEffect(scene, themeObjects);
		
	if (map_asset.particleType === 'rain') {
		const rain = createRainParticles(scene);
		themeObjects?.effects.push(rain);
	}
}