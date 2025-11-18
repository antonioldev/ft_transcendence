import { Engine, Scene } from "@babylonjs/core";
import { Direction } from "../shared/constants.js";
import type { Powerup } from '../shared/types.js';
import { PlayerSide } from "../utils/constants.js";
import type { GameObjects, PlayerState } from "../utils/types.js";
import { KeyboardMode } from "./../utils/constants.js";
import type { GameConfig } from './GameInitializer.js';
import { AnimationManager, Motion } from "./services/AnimationManager";
import { AudioManager } from "./services/AudioManager";
import { GUIManager } from "./services/GuiManager";
import { KeyboardManager } from "./services/KeybordManager";
import { PowerupManager } from "./services/PowerUpManager";
import { RenderManager } from "./services/RenderManager";
import { uiManager } from "../ui/UIManager.js";

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
		}
	) {
		this.animation = new AnimationManager(scene);
		this.audio = new AudioManager(scene, config);
		this.gui = new GUIManager(scene, config, this.animation, this.audio);
		this.powerup = new PowerupManager(players, this.animation, this.gui, gameObjects);
		this.input = new KeyboardManager(scene, config, gameObjects, players, callbacks);
		this.render = new RenderManager(engine, scene, gameObjects);
	}

	async start(): Promise<void> {
		await this.audio.initialize();
		this.render.startRendering();
		await this.playCurtains();
	}

	async playCurtains(speed: number = Motion.F.base): Promise<void> {
		await this.gui.curtain.show(speed);
		await this.gui.curtain.hide(speed);
	}

	// updateGameLoop(viewMode: ViewMode, spectator: boolean): void {
	// 	this.input?.update();
		// if (!spectator)
			// this.render?.updateCamerasAngle(viewMode);
	// }

	updatePowerups(leftPowerups: Powerup[], rightPowerups: Powerup[]): void {
		this.powerup?.handleUpdates(PlayerSide.LEFT, leftPowerups);
		this.powerup?.handleUpdates(PlayerSide.RIGHT, rightPowerups);
	}

//COUNTDOWN CALLS
	startCountdownSequence(): void {
		this.gui.lobby.hide();
		this.gui.cardGame.hide();
		this.gui.hud.show(true);
	}

	async showPlayerIntroduction(controlledSides: PlayerSide[], isSpectator: boolean): Promise<void> {
		const playerLeft = this.players.get(PlayerSide.LEFT)?.name!;
		const playerRight = this.players.get(PlayerSide.RIGHT)?.name!;
		
		this.audio.restoreMusicVolume();
		
		await Promise.all([
			this.gui.countdown.showPlayersName(playerLeft, playerRight),
			this.animation.startCameraAnimations(
				this.gameObjects.cameras,
				this.config.viewMode,
				controlledSides,
				this.config.isLocalMultiplayer,
				isSpectator
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
	updatePlayerAssignment(leftPlayerName: string, rightPlayerName: string, controlledSides: PlayerSide[]): void {
		const leftIsControlled = controlledSides.includes(PlayerSide.LEFT);
		const rightIsControlled = controlledSides.includes(PlayerSide.RIGHT);

		this.gui.hud.updatePlayerNames(leftPlayerName, rightPlayerName);
		this.input.assignLocalControls();
		this.render.updateActiveCameras(this.config.viewMode, controlledSides, this.config.isLocalMultiplayer);
		this.gui.hud.updateControlVisibility(leftIsControlled, rightIsControlled);
	}

	updateRally(rallyCount: number): void {
		this.gui.hud.updateRally(rallyCount);
		this.audio.updateMusicSpeed(rallyCount);
	}

	updateScore(leftScore: number, rightScore: number): void {
		this.gui.hud.updateScores(leftScore, rightScore);
		this.gui.hud.updateRally(1);
		this.audio.playScore();
	}

	handlePause(isPaused: boolean, isSpectator: boolean): void {
		this.gui.setPauseVisible(isPaused);

		if (isPaused) {
			if (!isSpectator) 
				this.input.setMode(KeyboardMode.PAUSED);
			this.audio.pauseGameMusic();
		} else {
			if (!isSpectator) 
				this.input.setMode(KeyboardMode.NORMAL);
			this.audio.resumeGameMusic();
		}
	}

	updateTournamentRound(message: any): boolean {
		if (!message) return false;
		
		const roundIndex = message.round_index;
		const roundTotal = message.round_total;
		const matchIndex = message.match_index;
		const leftPlayer = message.left ?? null;
		const rightPlayer = message.right ?? null;
		const matchTotal = message.match_total ?? undefined;
		
		this.gui.pause.alignLeft();
		this.gui.matchTree.insert(
			roundIndex,
			roundTotal,
			matchIndex,
			leftPlayer,
			rightPlayer,
			matchTotal
		);
		
		return roundIndex === roundTotal;
	}

	updateTournamentGame(message: any): void {
		if (!message) return;
		
		this.gui.matchTree.update(
			message.winner,
			message.round_index,
			message.match_index
		);
	}

	updateTournamentLobby(message: any): void {
		if (!message) return;
		uiManager.setLoadingScreenVisible(false);
		const names: string[] = message.lobby ?? [""];

		this.gui.lobby.show(names);
	}

//END GAME CALLS
	resetGuiForNextMatch(): void {
		this.powerup?.resetPowerupStates();
		this.gui?.hud.resetPowerupVisuals();
		this.gui?.hud.updateScores(0, 0);
	}

	async showMatchEndForLoser(isLastMatch: boolean): Promise<boolean> {
		this.audio.lowerMusicVolume();
		this.gui.setPauseVisible(false);
		this.audio.playLoser();
		await this.gui.showTournamentMatchLoser(isLastMatch);
		this.gui.pause.show(false);
		const wantsToSpectate = await this.input.waitForSpectatorChoice();
		if (wantsToSpectate)
			this.gui.hud.setSpectatorMode();
		await this.gui.endGame.hidePartial();
		return wantsToSpectate;
	}

	async showMatchEndForWinner(winner: string, waitForSpace: boolean, showCardGame: boolean, isLastMatch: boolean): Promise<void> {
		this.gui.hud.show(false);
		this.audio.lowerMusicVolume();
		this.gui.setPauseVisible(false);
		await this.gui.showTournamentMatchWinner(winner, waitForSpace, isLastMatch);
		
		if (!isLastMatch && showCardGame)
			this.gui.cardGame.show();
	}

	async handleSessionEnd(winner: string): Promise<void> {
		this.render.startRendering();
		this.audio.lowerMusicVolume();
		this.gui.setPauseVisible(false);
		this.gui.cardGame.hide();
		await this.gui.showWinner(winner);
		this.audio.stopGameMusic();
	}

	dispose(): void {
		this.input?.dispose();
		this.gui?.dispose();
		this.render?.dispose();
		this.animation?.dispose();
		this.audio?.dispose();
	}
}