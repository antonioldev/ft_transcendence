import { FreeCamera, GlowLayer, Mesh, Scene } from "@babylonjs/core";
import { GameMode } from '../../../shared/constants.js';
import { ViewMode } from '../../../utils/constants.js';
import { Effects, GameObjects, Players, ThemeObject } from '../../../utils/types.js';
import { Logger } from '../../../utils/LogManager.js';
import { GameConfig } from '../../GameInitializer.js';
import { getBallStartPosition, getPlayerLeftPosition, getPlayerRightPosition, getPlayerSize } from '../../utils/utils.js';
import { ParticleEffectType } from "../config/effectSceneConfig.js";
import { PlayerSide } from "../../../utils/constants.js";
import { MAP_CONFIGS } from "../config/mapConfigs.js";
import { MapAssetConfig } from "../config/sceneTypes.js";
import { createActor } from "../entities/animatedProps.js";
import { createBall, createGameField, createPlayer, createWallLineGlowEffect, createWalls } from '../entities/gameObjects.js';
import { createBallEffects, createPaddleCage, createPaddleGlow, createWallGlowEffect } from '../entities/gameObjectsEffects.js';
import { createStaticObject, createStaticObjects } from "../entities/staticProps.js";
import { createCameras, createGuiCamera } from "./camerasBuilder.js";
import { createFireworks, createFog, createLensFlare, createParticleSystem, createSmokeSprite } from './effectsBuilder.js';
import { createLight, createSky, createTerrain } from './enviromentBuilder.js';
import { CoreGameObjects } from "../../../utils/types.js";

export type LoadingProgressCallback = (progress: number) => void;

export async function buildScene(
	scene: Scene,
	config: GameConfig,
	onProgress?: LoadingProgressCallback
): Promise<{ gameObjects: GameObjects; themeObjects: ThemeObject }> {
	onProgress?.(0);

	const viewMode = config.viewMode;
	const gameMode = config.gameMode;
	let themeObjects: ThemeObject = { props: [], actors: [], effects: [] };

	const map_asset = getMap(viewMode, config.scene3D);
	
	const coreObjects = await buildCoreGameObjects(scene, gameMode, viewMode, map_asset);
	onProgress?.(20);
	const powerUpEffects = await createPowerUpEffects(scene, coreObjects.players, coreObjects.balls);
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

function getMap(viewMode: ViewMode, scene3D: string): MapAssetConfig {
	if (viewMode === ViewMode.MODE_2D)
		return MAP_CONFIGS.map;

	if (scene3D === 'random') {
		const randomIndex = Math.floor(Math.random() * 7);
		return MAP_CONFIGS[`map${randomIndex}`];
	}

	return MAP_CONFIGS[scene3D];
}

async function buildCoreGameObjects(scene: Scene, gameMode: GameMode, viewMode: ViewMode, map_asset: MapAssetConfig): Promise<CoreGameObjects> {
	let cameras: FreeCamera[];
	const balls: Mesh[] = [];

	const lights = createLight(scene, "light1", viewMode, map_asset);
	const gameField = createGameField(scene, "ground", viewMode, map_asset);
	const walls = createWalls(scene, "walls", viewMode, map_asset.walls);
	
	for (let i = 0; i < 3; i++){
		const ball = createBall(scene, `ball${i}`, getBallStartPosition(), viewMode, map_asset.ball);
		balls.push(ball);
	}
	
	cameras = createCameras(scene, "camera", viewMode, gameMode);
	const guiCamera = createGuiCamera(scene, "guiCamera");

	const isLocalMultiplayer = gameMode === GameMode.TOURNAMENT_LOCAL || gameMode === GameMode.TWO_PLAYER_LOCAL;
	if (viewMode === ViewMode.MODE_2D || isLocalMultiplayer) {
		const allCameras = [...cameras, guiCamera];
		scene.activeCameras = allCameras;
	}

	const playerLeft = createPlayer(scene, "player1", getPlayerLeftPosition(), getPlayerSize(), viewMode, map_asset.paddle);
	const playerRight = createPlayer(scene, "player2", getPlayerRightPosition(), getPlayerSize(), viewMode, map_asset.paddle);
	const players: Players = { left: playerLeft, right: playerRight };
	
	return { lights, gameField, walls, balls, players, cameras, guiCamera };
}

async function createPowerUpEffects(scene: Scene, players: Players, balls: Mesh[]): Promise<Effects> {

	const ballsGlow: any[] = [];
	const ballsFreeze: any[] = [];

	for (let i = 0; i < 3; i++){
		const { glow, freeze } = createBallEffects(scene, balls[i], i);
		ballsGlow.push(glow);
		ballsFreeze.push(freeze);
	}

	const leftGlow = createPaddleGlow(scene, "leftGlow", getPlayerSize(), players.left);
	const rightGlow = createPaddleGlow(scene, "rightGlow", getPlayerSize(), players.right);
	const leftCage = createPaddleCage(scene, "leftCage", getPlayerSize(), players.left);
	const rightCage = createPaddleCage(scene, "rightCage", getPlayerSize(), players.right);
	const leftShield = createWallGlowEffect(scene, "leftShield", PlayerSide.LEFT);
	const rightShield = createWallGlowEffect(scene, "rightShield", PlayerSide.RIGHT);

	 const effects: Effects = {
		leftGlow, rightGlow,
		leftCage, rightCage,
		ballsGlow, ballsFreeze,
		leftShield, rightShield
	};
	return effects;
}

async function buildThematicEnvironment(
	scene: Scene,
	map_asset: MapAssetConfig,
	themeObjects: ThemeObject,
	onProgress?: LoadingProgressCallback
): Promise<void> {
	await createSky(scene, map_asset.skybox);
	if (map_asset.terrain)
		createTerrain(scene, "terrain", map_asset.terrain, map_asset);

	onProgress?.(60);

	if (map_asset === MAP_CONFIGS.map0 || map_asset === MAP_CONFIGS.map1 || map_asset === MAP_CONFIGS.map4 || map_asset === MAP_CONFIGS.map6) {
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
				Logger.error(`Failed to create actor ${i}`, 'SceneBuilder', error);
			}
		}
	}

	onProgress?.(90);
	const particleType = map_asset.particleType;
	if (particleType) {
		let effect = null;

		switch(particleType) {
			case ParticleEffectType.LENS: 
				effect = createLensFlare(scene); 
				break;
			case ParticleEffectType.SMOKE: 
				effect = createSmokeSprite(scene); 
				break;
			case ParticleEffectType.UNDERWATER:
			case ParticleEffectType.DUST:
			case ParticleEffectType.SNOW:
			case ParticleEffectType.STARS:
			case ParticleEffectType.RAIN:
				effect = createParticleSystem(scene, particleType);
				break;
		}

		if (effect)
			themeObjects.effects.push(effect);
	}

	const fireworkSystems = createFireworks(scene);
		themeObjects.effects.push(...fireworkSystems)

	if (map_asset.fogColor)
		createFog(scene, map_asset.fogColor, map_asset.fogIntensity);

	if (map_asset === MAP_CONFIGS.map0)
		createWallLineGlowEffect(scene, themeObjects);

	const glow = new GlowLayer("glow", scene);
	glow.intensity = map_asset.glow ?? 0;
	themeObjects?.effects.push(glow);
}
