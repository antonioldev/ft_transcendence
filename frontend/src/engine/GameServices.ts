import { AudioManager } from "./services/AudioManager";
import { RenderManager } from "./services/RenderManager";
import { KeyboardManager } from "./services/KeybordManager";
import { GUIManager } from "./services/GuiManager";
import { Particles, clearAllFireworkTimers } from "./scene/fireworks";
import { AnimationManager } from "./services/AnimationManager";
import { PowerupManager } from "./services/PowerUpManager";
import { Engine, Scene} from "@babylonjs/core";
import { GameConfig } from './GameConfig.js';
import { GameObjects } from '../shared/types.js';
import { PlayerSide, PlayerState } from "./utils.js"

export interface IGameServices {
	audio: AudioManager;
	render: RenderManager;
	input: KeyboardManager;
	gui: GUIManager;
	particles: Particles;
	animation: AnimationManager;
	powerup: PowerupManager;
}

export class GameServices implements IGameServices {
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
		this.audio = new AudioManager(scene);
		this.gui = new GUIManager(scene, config, this.animation, this.audio);
		this.particles = new Particles();
		this.powerup = new PowerupManager(players, this.animation, this.gui, gameObjects);
		this.input = new KeyboardManager(scene, config, gameObjects, players, this.powerup, this.gui);//, gameCallbacks);
		this.render = new RenderManager(engine, scene, this.gui, this.animation, gameObjects);
	}

	async initialize(): Promise<void> {
		await this.audio.initialize();
	}

	dispose(): void {
		this.render?.stopRendering();
		this.input?.dispose();
		this.powerup?.dispose();
		this.gui?.dispose();
		this.render?.dispose();
		clearAllFireworkTimers();
		this.particles?.dispose();
		this.animation?.dispose();
		this.audio?.dispose();
	}
}