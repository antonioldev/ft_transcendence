import { Engine, Scene } from "@babylonjs/core";
import { GameObjects } from '../shared/types.js';
import { GameConfig } from './GameConfig.js';
import { Particles, clearAllFireworkTimers } from "./scene/rendering/fireworks";
import { AnimationManager } from "./services/AnimationManager";
import { AudioManager } from "./services/AudioManager";
import { GUIManager } from "./services/GuiManager";
import { KeyboardManager } from "./services/KeybordManager";
import { PowerupManager } from "./services/PowerUpManager";
import { RenderManager } from "./services/RenderManager";
import { PlayerSide, PlayerState } from "./utils.js";

export class GameServices {
	audio: AudioManager;
	render: RenderManager;
	input: KeyboardManager;
	gui: GUIManager;
	particles: Particles;
	animation: AnimationManager;
	powerup: PowerupManager;

	constructor(
		engine: Engine,
		scene: Scene,
		config: GameConfig,
		gameObjects: GameObjects,
		players: Map<PlayerSide, PlayerState>,
	) {
		this.animation = new AnimationManager(scene);
		this.audio = new AudioManager(scene, config);
		this.gui = new GUIManager(scene, config, this.animation, this.audio);
		this.particles = new Particles();
		this.powerup = new PowerupManager(players, this.animation, this.gui, gameObjects);
		this.input = new KeyboardManager(scene, config, gameObjects, players, this.powerup, this.gui);
		this.render = new RenderManager(engine, scene, this.animation, gameObjects);
	}

	async initialize(): Promise<void> {
		await this.audio.initialize();
	}

	dispose(): void {
		this.input?.dispose();
		this.gui?.dispose();
		this.render?.dispose();
		clearAllFireworkTimers();
		this.particles?.dispose();
		this.animation?.dispose();
		this.audio?.dispose();
	}
}