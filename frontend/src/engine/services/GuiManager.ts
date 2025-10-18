import { Scene } from "@babylonjs/core";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import { GameMode, ViewMode } from '../../shared/constants.js';
import { Logger } from '../../utils/LogManager.js';
import { GameConfig } from '../GameConfig.js';
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
	private isLastMatch: boolean = false;
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

	async showTournamentMatchWinner(winner: string, waitForSpace: boolean): Promise<void> {
		if (!this.isReady || this.isLastMatch) return;
		
		this.hud.show(false);
		await this.endGame.fadeBackground(true);
		await this.endGame.showPartialWinner(winner, waitForSpace);
		await this.endGame.hidePartial();
	}

	async showTournamentMatchLoser(): Promise<void> {
		if (!this.isReady || this.isLastMatch) return;
		
		this.hud.show(false);
		await this.endGame.fadeBackground(true);
		this.audioManager.playLoser();
		await this.endGame.showPartialLoser();
	}

	

	async showWinner(winner: string): Promise<void> {
		if (!this.isReady) return;

		this.hud.show(false);
		this.audioManager.playWinner();
		await this.endGame.showFinalWinner(winner);
		this.hud.show(true);
	}

	updateControlVisibility(player1: boolean, player2: boolean): void {
		if (!this.isReady) return;
		const p1 = this.adt?.getControlByName("PlayerControls_p1") as TextBlock | null;
		const p2 = this.adt?.getControlByName("PlayerControls_p2") as TextBlock | null;

		if (p1) p1.color = player1 ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0)";
		if (p2) p2.color = player2 ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0)";
	}

	updateTournamentRound(message: any): void {
		console.error("test");
		if (message.round_index === message.round_total)
			this.isLastMatch = true;
		this.matchTree.insert(
			message.round_index,
			message.round_total,
			message.match_index,
			message.left ?? null,
			message.right ?? null,
			message.match_total ?? undefined
		);
	}

	updateTournamentGame(message: any): void {
		if (message.winner !== undefined)
			this.matchTree.update(
				message.winner,
				message.round_index,
				message.match_index
			)
	}

	updateTournamentLobby(message: any): void {
		const names: string[] = message.lobby ?? [""];
		this.lobby.show(names);
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