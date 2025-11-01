import { Scene } from "@babylonjs/core";
import { AdvancedDynamicTexture } from "@babylonjs/gui";
import { GameMode } from '../../shared/constants.js';
import { ViewMode } from '../../utils/constants.js';
import { Logger } from '../../utils/LogManager.js';
import { GameConfig } from '../GameInitializer.js';
import { CardGame } from "../gui/CardGame.js";
import { Countdown } from "../gui/Countdown.js";
import { EndGame } from "../gui/EndGame.js";
import { VIEW_MODE_STYLES, createRect } from "../gui/GuiStyle.js";
import { Hud } from "../gui/Hud.js";
import { Lobby } from "../gui/Lobby.js";
import { MatchTree } from "../gui/MatchTree.js";
import { Pause } from "../gui/Pause.js";
import { SceneTransition } from "../gui/SceneTransition.js";
import { AnimationManager } from "./AnimationManager.js";
import { AudioManager } from "./AudioManager.js";

/**
 * Manages all GUI elements for the game
 */
export class GUIManager {
	private adt: AdvancedDynamicTexture | null = null;
	private isInitialized: boolean = false;
	private isTournament: boolean = false;
	countdown!: Countdown;
	matchTree!: MatchTree;
	hud!: Hud;
	endGame!: EndGame;
	pause!: Pause;
	lobby!: Lobby;
	curtain!: SceneTransition;
	cardGame!: CardGame;


	constructor(private scene: Scene, config: GameConfig, private animationManager: AnimationManager, private audioManager: AudioManager) {
		try {
			this.adt = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this.scene);
			this.adt!.layer!.layerMask = 0x20000000;
			this.adt.idealWidth = 1920;
			this.adt.idealHeight = 1080;
			this.adt.renderAtIdealSize = true;

			this.isTournament = config.isTournament;
			this.createViewModeDivider(config);
			this.countdown = new Countdown(this.adt, this.animationManager, audioManager);
			this.matchTree = new MatchTree(this.adt, this.animationManager);
			this.hud = new Hud(this.adt, this.animationManager,config);
			this.endGame = new EndGame(this.adt, this.animationManager);
			this.pause = new Pause(this.adt, this.animationManager, config, () => audioManager.toggleMusic(), () => audioManager.toggleEffects());
			this.lobby = new Lobby(this.adt, this.animationManager);
			this.curtain = new SceneTransition(this.adt, this.animationManager);
			this.cardGame = new CardGame(this.adt, animationManager, audioManager);
			
			this.isInitialized = true;
		} catch (error) {
			Logger.error('Error creating GUI', 'GUIManager', error);
			throw error;
		}
	}


	private createViewModeDivider(config: GameConfig): void {
		if (config.viewMode === ViewMode.MODE_3D && 
			(config.gameMode === GameMode.TWO_PLAYER_LOCAL || config.gameMode === GameMode.TOURNAMENT_LOCAL)) {
			const dividerLine = createRect("divider", VIEW_MODE_STYLES.dividerLine);
			this.adt!.addControl(dividerLine);
		}
	}

	setPauseVisible(visible: boolean, isSpectator: boolean): void {
		if (!this.isReady || !this.animationManager) return;

		this.pause.show(visible, isSpectator);
		if (this.isTournament && !isSpectator)
			this.matchTree.show(visible);
	}

	async showTournamentMatchWinner(winner: string, waitForSpace: boolean, isLastMatch: boolean): Promise<void> {
		if (!this.isReady || isLastMatch) return;
		
		await this.endGame.fadeBackground(true);
		await this.endGame.showPartialWinner(winner, waitForSpace);
		await this.endGame.hidePartial();
	}

	async showTournamentMatchLoser(isLastMatch: boolean): Promise<void> {
		if (!this.isReady || isLastMatch) return;
		
		await this.endGame.fadeBackground(true);
		await this.endGame.showPartialLoser();
	}

	

	async showWinner(winner: string): Promise<void> {
		if (!this.isReady) return;

		this.audioManager.playWinner();
		await this.endGame.showFinalWinner(winner);
	}

	isReady(): boolean {
		return this.isInitialized;
	}

	dispose(): void {
		if (!this.isReady()) return;
		
		try {
			this.adt?.dispose();
			this.adt = null;

			this.isInitialized = false;
			Logger.debug('Class disposed', 'GUIManager');
		} catch (error) {
			Logger.error('Error disposing GUI', 'GUIManager', error);
		}
	}

}