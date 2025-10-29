import { Engine, Scene } from "@babylonjs/core";
import { GameObjects } from '../shared/types.js';
import { GameConfig } from './GameConfig.js';
import { AnimationManager } from "./services/AnimationManager";
import { AudioManager } from "./services/AudioManager";
import { GUIManager } from "./services/GuiManager";
import { KeyboardManager } from "./services/KeybordManager";
import { PowerupManager } from "./services/PowerUpManager";
import { RenderManager } from "./services/RenderManager";
import { PlayerSide, PlayerState } from "./utils.js";
import { Direction } from "../shared/constants.js";

export class GameServices {
	audio: AudioManager;
	render: RenderManager;
	input: KeyboardManager;
	gui: GUIManager;
	animation: AnimationManager;
	powerup: PowerupManager;

	constructor(
		engine: Engine,
		scene: Scene,
		private config: GameConfig,
		private gameObjects: GameObjects,
		private players: Map<PlayerSide, PlayerState>,
		callbacks: {
			onPauseToggle: () => void;
			onExitToMenu: () => void;
			onSwitchGame: (direction: Direction) => void;
			onToggleMatchTree: () => void;
			// onSpectatorChoice: (choice: boolean) => void;
		}
	) {
		this.animation = new AnimationManager(scene);
		this.audio = new AudioManager(scene, config);
		this.gui = new GUIManager(scene, config, this.animation, this.audio);
		this.powerup = new PowerupManager(players, this.animation, this.gui, gameObjects);
		this.input = new KeyboardManager(scene, config, gameObjects, players, this.powerup, callbacks);
		this.render = new RenderManager(engine, scene, gameObjects);
	}



	async initialize(): Promise<void> {
		await this.audio.initialize();
	}

//COUNTDOWN CALLS
	startCountdownSequence(): void {
        this.gui.lobby.hide();
        this.gui.cardGame.hide();
    }

    async showPlayerIntroduction(controlledSides: PlayerSide[]): Promise<void> {
		const playerLeft = this.players.get(PlayerSide.LEFT)?.name!;
		const playerRight = this.players.get(PlayerSide.RIGHT)?.name!;
		
		this.audio.restoreMusicVolume();
		
		await Promise.all([
			this.gui.countdown.showPlayersName(playerLeft, playerRight),
			this.animation.startCameraAnimations(
				this.gameObjects.cameras,
				this.config.viewMode,
				controlledSides,
				this.config.isLocalMultiplayer
			)
		]);
	}

	hidePlayerIntroduction(): void {
		this.gui.countdown.hidePlayersName();
	}

	showCountdownNumber(count: number): void {
		this.gui.countdown.show(count);
		this.audio.playCountdown();
	}

	finishCountdown(): void {
		this.audio.startGameMusic();
		this.animation.stopCameraAnimations();
		this.gui.countdown.finish();
	}

//GAMEPLAY CALLS
	updateRally(rallyCount: number): void {
		this.gui.hud.updateRally(rallyCount);
		this.audio.playPaddleHit();
		this.audio.updateMusicSpeed(rallyCount);
	}

	updateScore(leftScore: number, rightScore: number): void {
		this.gui.hud.updateScores(leftScore, rightScore);
		this.gui.hud.updateRally(0);
		this.audio.playScore();
	}

//END GAME CALLS
	async showMatchEndForLoser(): Promise<boolean> {
		this.audio.lowerMusicVolume();
		this.gui.setPauseVisible(false, true);
		await this.gui.showTournamentMatchLoser();
		const wantsToSpectate = await this.input.waitForSpectatorChoice();
		if (wantsToSpectate)
			this.gui.hud.setSpectatorMode();
		return wantsToSpectate;
	}

	async showMatchEndForWinner(winner: string, waitForSpace: boolean, showCardGame: boolean): Promise<void> {
		this.audio.lowerMusicVolume();
		this.gui.setPauseVisible(false, false);
		await this.gui.showTournamentMatchWinner(winner, waitForSpace);
		
		if (!this.gui.isLastMatch && showCardGame)
			this.gui.cardGame.show();
	}


	dispose(): void {
		this.input?.dispose();
		this.gui?.dispose();
		this.render?.dispose();
		this.animation?.dispose();
		this.audio?.dispose();
	}
}