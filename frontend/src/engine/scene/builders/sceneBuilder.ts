import { GlowLayer, Scene } from "@babylonjs/core";
import { GameMode, ViewMode } from '../../../shared/constants.js';
import { GameObjects, Players, ThemeObject } from '../../../shared/types.js';
import { getBallStartPosition, getPlayerLeftPosition, getPlayerRightPosition, getPlayerSize, PlayerSide } from '../../utils.js';
import { MAP_CONFIGS } from "../config/mapConfigs.js";
import { MapAssetConfig } from "../config/sceneTypes.js";
import { createActor } from "../entities/animatedProps.js";
import { createBall, createGameField, createPlayer, createWalls, createWallLineGlowEffect } from '../entities/gameObjects.js';
import { createBallEffects, createPaddleCage, createPaddleGlow, createWallGlowEffect } from '../entities/gameObjectsEffects.js';
import { createStaticObject, createStaticObjects } from "../entities/staticProps.js";
import { createDustParticleSystem, createFog, createLensFlare, createRainParticles, createSmokeSprite, createSnow, createUnderwaterParticles, createStarsParticles } from '../rendering/effects.js';
import { createCameras, createGuiCamera } from "./camerasBuilder.js";
import { createSky, createLight, createTerrain } from './enviromentBuilder.js';

export type LoadingProgressCallback = (progress: number) => void;

export async function buildScene(
	scene: Scene,
	gameMode: GameMode,
	viewMode: ViewMode,
	onProgress?: LoadingProgressCallback
): Promise<{ gameObjects: GameObjects; themeObjects: ThemeObject }> {
	onProgress?.(0);
    let themeObjects: ThemeObject = { props: [], actors: [], effects: [] };

	const map_asset = viewMode === ViewMode.MODE_2D 
		? MAP_CONFIGS.map : MAP_CONFIGS.map0
    
    const coreObjects = await buildCoreGameObjects(scene, gameMode, viewMode, map_asset);
    onProgress?.(20);
    const powerUpEffects = createPowerUpEffects(scene, coreObjects.players, coreObjects.balls);
    onProgress?.(40);
    await buildThematicEnvironment(scene, map_asset, themeObjects, onProgress);

	onProgress?.(100);
	await scene.whenReadyAsync();
    
    return {
        gameObjects: {
            ...coreObjects,
            effects: powerUpEffects
        },
        themeObjects
    };
}

async function buildCoreGameObjects(scene: Scene, gameMode: GameMode, viewMode: ViewMode, map_asset: MapAssetConfig): Promise<any> {
	let cameras: any[];
	let players: Players = { left: undefined, right: undefined };
	const balls: any[] = [];

	const lights = createLight(scene, "light1", viewMode, map_asset.light);
	const gameField = createGameField(scene, "ground", viewMode, map_asset);
	const walls = createWalls(scene, "walls", viewMode, map_asset.walls);
	
	for (let i = 0; i < 3; i++){
		const ball = createBall(scene, `ball${i}`, getBallStartPosition(), viewMode, map_asset.ball);
		balls.push(ball);
	}
	
	cameras = createCameras(scene, "camera", viewMode, gameMode);
	const guiCamera = createGuiCamera(scene, "guiCamera");

	if (viewMode === ViewMode.MODE_2D) {
		const allCameras = [...cameras, guiCamera];
		scene.activeCameras = allCameras;
	}

	players.left = createPlayer(scene, "player1", getPlayerLeftPosition(), getPlayerSize(), viewMode, map_asset.paddle);
	players.right = createPlayer(scene, "player2", getPlayerRightPosition(), getPlayerSize(), viewMode, map_asset.paddle);
	
	return { lights, gameField, walls, balls, players, cameras, guiCamera };
}

async function createPowerUpEffects(scene: Scene, players: Players, balls: any): Promise<any> {

	const ballsGlow: any[] = [];
	const ballsFreeze: any[] = [];

	for (let i = 0; i < 3; i++){
		const { glow, freeze } = createBallEffects(scene, balls[i], i);
		ballsGlow.push(glow);
		ballsFreeze.push(freeze);
	}

	const leftPlayerGlow = createPaddleGlow(scene, "leftGlow", getPlayerSize(), players.left);
	const rightPlayerGlow = createPaddleGlow(scene, "rightGlow", getPlayerSize(), players.right);
	const leftPlayerCage = createPaddleCage(scene, "leftCage", getPlayerSize(), players.left);
	const rightPlayerCage = createPaddleCage(scene, "rightCage", getPlayerSize(), players.right);
	const leftShield = createWallGlowEffect(scene, "leftShield", PlayerSide.LEFT);
	const rightShield = createWallGlowEffect(scene, "rightShield", PlayerSide.RIGHT);

	return {ballsGlow, ballsFreeze, leftPlayerGlow, rightPlayerGlow, leftPlayerCage, rightPlayerCage, leftShield, rightShield };
	
}

async function buildThematicEnvironment(
	scene: Scene,
	map_asset: MapAssetConfig,
	themeObjects: ThemeObject,
	onProgress?: LoadingProgressCallback
): Promise<void> {
	createSky(scene, map_asset.skybox);
	if (map_asset.terrain)
		createTerrain(scene, "terrain", map_asset.terrain, map_asset);

	onProgress?.(60);

	if (map_asset === MAP_CONFIGS.map0 || map_asset === MAP_CONFIGS.map4 || map_asset === MAP_CONFIGS.map6) {
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
				const actor = await createActor(scene, actorConfig, i);
				if (actor) {
					themeObjects?.actors.push(actor);
				}
			} catch (error) {
				console.error(`Failed to create actor ${i}:`, error);
			}
		}
	}

	onProgress?.(90);
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

	if (map_asset.particleType === 'lensFlare') {
		const lensFlare = createLensFlare(scene);
		themeObjects.effects.push(lensFlare);
	}

	if (map_asset.particleType === 'smoke') {
		const smoke = createSmokeSprite(scene);
		themeObjects.effects.push(smoke);
	}

	if (map_asset.particleType === 'stars') {
		const stars = createStarsParticles(scene);
		themeObjects.effects.push(stars);
	}

	if (map_asset.fogColor)
		createFog(scene, map_asset.fogColor, map_asset.fogIntensity);

	if (map_asset === MAP_CONFIGS.map0)
		createWallLineGlowEffect(scene, themeObjects);
		
	if (map_asset.particleType === 'rain') {
		const rain = createRainParticles(scene);
		themeObjects?.effects.push(rain);
	}

	const glow = new GlowLayer("glow", scene);
	glow.intensity = map_asset.glow ?? 0;
	themeObjects?.effects.push(glow);
}
