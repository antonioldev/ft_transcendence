import { AdvancedDynamicTexture, TextBlock} from "@babylonjs/gui";
import { Scene} from "@babylonjs/core";
import { Logger } from '../../utils/LogManager.js';
import { GameConfig } from '../GameConfig.js';
import { GameMode, ViewMode } from '../../shared/constants.js';
import { AnimationManager } from "./AnimationManager.js";
import { AudioManager } from "./AudioManager.js";
import { VIEW_MODE_STYLES, createRect} from "../gui/GuiStyle.js";
import { Countdown } from "../gui/Countdown.js";
import { PowerUp } from "../gui/PowerUp.js";
import { MatchTree } from "../gui/MatchTree.js"
import { Hud } from "../gui/Hud.js";
import { EndGame } from "../gui/EndGame.js";
import { Pause } from "../gui/Pause.js"
import { Lobby } from "../gui/Lobby.js";

/**
 * Manages all GUI elements for the game
 */
export class GUIManager {
	private adt: AdvancedDynamicTexture | null = null;
	private isInitialized: boolean = false;
	private isTournament: boolean = false;
	countdown!: Countdown;
	powerUp!: PowerUp;
	matchTree!: MatchTree;
	hud!: Hud;
	endGame!: EndGame;
	pause!: Pause;
	lobby!: Lobby;

	constructor(private scene: Scene, config: GameConfig, private animationManager: AnimationManager, audioManager: AudioManager) {
		try {
			this.adt = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this.scene);
			this.adt!.layer!.layerMask = 0x20000000;
			this.isTournament = config.isTournament;

			this.countdown = new Countdown(this.adt, this.animationManager);
			this.powerUp = new PowerUp(this.adt, this.animationManager, config);
			this.matchTree = new MatchTree(this.adt, this.animationManager);
			this.hud = new Hud(this.adt, this.animationManager,config);
			this.endGame = new EndGame(this.adt, this.animationManager);
			this.pause = new Pause(this.adt, this.animationManager, config.isTournament, () => audioManager.toggleMute());
			this.lobby = new Lobby(this.adt, this.animationManager);

			this.createViewModeDivider(config);
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

	setPauseVisible(visible: boolean): void {
		if (!this.isReady || !this.animationManager) return;

		this.pause.show(visible);
		if (this.isTournament)
			this.matchTree.show(visible);
	}

	async animateBackground(show: boolean): Promise<void> {
		if (!this.isReady) return;
		if (show) {
			this.hud.show(false);
			await this.endGame.fadeBackground(true);
		} else {
			await this.endGame.fadeBackground(false);
			this.hud.show(true);
		}
	}

	// async showPartialWinner(winner: string): Promise<void> {
	// 	if (!this.isReady) return;
	// 	this.powerUp.show(false);
	// 	await this.endGame.showPartial(winner);
	// }

	// async hidePartialWinner(): Promise<void> {
	// 	if (!this.isReady) return;
	// 	await this.endGame.hidePartial();
	// }

	async showTournamentMatchWinner(winner: string): Promise<void> {
		if (!this.isReady) return;
		
		await this.animateBackground(true);
		// await this.showPartialWinner(winner);
		this.powerUp.show(false);
		await this.endGame.showPartial(winner);
		await this.endGame.waitForSpaceToContinue(2000);
		// await this.hidePartialWinner();
		await this.endGame.hidePartial();
	}

	async showTournamentMatchLoser(): Promise<void> {
		if (!this.isReady) return;
		
		await this.animateBackground(true);
		this.powerUp.show(false);
		await this.endGame.showPartialLoser(); // New method for showing loss
		await this.endGame.hidePartial();
	}

	async showWinner(winner: string): Promise<void> {
		if (!this.isReady) return;
		this.hud.show(false);
		this.powerUp.show(false);
		await this.endGame.showFinal(winner);
		this.hud.show(true);
	}

	updateControlVisibility(player1: boolean, player2: boolean): void {
		if (!this.isReady) return;
		const p1 = this.adt?.getControlByName("PlayerControls_p1") as TextBlock | null;
		const p2 = this.adt?.getControlByName("PlayerControls_p2") as TextBlock | null;

		if (p1) p1.color = player1 ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0)";
		if (p2) p2.color = player2 ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0)";
		this.powerUp.show(true);
	}

	updateTournamentRound(message: any): void {
		this.matchTree.insert(
			message.round_index,
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
	
	// Check if gui is initialised
	isReady(): boolean {
		return this.isInitialized;
	}

	// Clean up all GUI resources
	dispose(): void {
		if (!this.isReady()) return;
		
		try {
			this.lobby.dispose();
			this.countdown.dispose();
			this.powerUp.dispose();
			this.matchTree.dispose();
			this.hud.dispose();
			this.endGame.dispose();
			this.pause.dispose();

			this.adt?.dispose();
			this.adt = null;

			this.isInitialized = false;
			Logger.debug('Class disposed', 'GUIManager');
		} catch (error) {
			Logger.error('Error disposing GUI', 'GUIManager', error);
		}
	}

}