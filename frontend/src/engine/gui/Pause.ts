import { AdvancedDynamicTexture, Rectangle, TextBlock, Grid, Image} from "@babylonjs/gui";
import { getCurrentTranslation } from '../../translations/translations.js';
import { AnimationManager, Motion } from "../services/AnimationManager.js";
import { H_LEFT, PAUSE_MENU_STYLES, createRect, createTextBlock, createGrid, createImage} from "./GuiStyle.js";
import { GameConfig } from "../GameConfig.js";
import { Translation } from "../../translations/Translation.js";
import { ViewMode } from "../../shared/constants.js";
import { GAME_CONFIG } from "../../shared/gameConfig.js";

export class Pause {
	private pauseOverlay!: Rectangle;
	private pauseGrid!: Grid;
	private pauseTitle!: TextBlock;
	private pauseInstruction!: TextBlock;
	private gameInstructions!: TextBlock;
	private pauseHint!: TextBlock;
	private muteIcon?: Image;

	constructor(private adt: AdvancedDynamicTexture, private animationManager: AnimationManager, config: GameConfig, private onToggleMute?: () => boolean) {
		const t = getCurrentTranslation();

		this.pauseOverlay = createRect("pauseOverlay", PAUSE_MENU_STYLES.pauseOverlay);
		this.adt.addControl(this.pauseOverlay);

		this.pauseGrid = createGrid("pauseGrid", PAUSE_MENU_STYLES.pauseGrid);
		if (config.isTournament) {
			this.pauseGrid.width = "50%";
			this.pauseGrid.horizontalAlignment = H_LEFT;
		}
		this.pauseOverlay.addControl(this.pauseGrid);

		this.pauseGrid.addRowDefinition(PAUSE_MENU_STYLES.gridRows.title, false);
		this.pauseGrid.addRowDefinition(PAUSE_MENU_STYLES.gridRows.gameInstructions, false);
		this.pauseGrid.addRowDefinition(PAUSE_MENU_STYLES.gridRows.exitInstruction, false);
		this.pauseGrid.addRowDefinition(PAUSE_MENU_STYLES.gridRows.hint, false);
		this.pauseGrid.addRowDefinition(PAUSE_MENU_STYLES.gridRows.muteIcon, false);

		this.pauseTitle = createTextBlock( "pauseTitle", PAUSE_MENU_STYLES.pauseTitle, t.gamePaused);
		this.pauseGrid.addControl(this.pauseTitle, 0, 0);

		const instructionsText = this.getGameInstructions(t, config);
		this.gameInstructions = createTextBlock("gameInstructions", PAUSE_MENU_STYLES.gameInstruction, instructionsText);
		this.pauseGrid.addControl(this.gameInstructions, 1, 0);

		this.pauseInstruction = createTextBlock( "pauseInstruction", PAUSE_MENU_STYLES.pauseInstruction, t.exitGame);
		this.pauseGrid.addControl(this.pauseInstruction, 2, 0);

		this.pauseHint = createTextBlock( "pauseHint", PAUSE_MENU_STYLES.pauseHint, t.pauseControls);
		this.pauseGrid.addControl(this.pauseHint, 3, 0);

		this.muteIcon = createImage( "muteIcon", PAUSE_MENU_STYLES.muteIcon, "assets/icons/sound_on.png");
		this.muteIcon.onPointerClickObservable.add(() => {
			this.animateMuteIcon();
			if (this.onToggleMute) {
				const isMuted = this.onToggleMute();
				if (this.muteIcon)
					this.muteIcon.source = isMuted ? "assets/icons/sound_off.png" : "assets/icons/sound_on.png";
			}
		});
		this.pauseGrid.addControl(this.muteIcon, 4, 0);
	}

	private async animateMuteIcon(): Promise<void> {
		if (!this.muteIcon) return;
		await this.animationManager?.scale(this.muteIcon, 1, 0.9, Motion.F.xFast, true);
	}

	private getGameInstructions(t: Translation, config: GameConfig): string {
		const viewModeText = config.viewMode === ViewMode.MODE_2D ? "2D VIEW" : "3D VIEW";
		let instructions = `🎮 CONTROLS (${viewModeText})\n\n`;

		// Movement controls section
		if (config.isLocalMultiplayer) {
			if (config.viewMode === ViewMode.MODE_2D) {
				instructions += "🚀 MOVEMENT:\n";
				instructions += "   P1: W (Up) / S (Down)\n";
				instructions += "   P2: ↑ (Up) / ↓ (Down)\n\n";
			} else {
				instructions += "🚀 MOVEMENT:\n";
				instructions += "   P1: A (Left) / D (Right)\n";
				instructions += "   P2: ← (Left) / → (Right)\n\n";
			}
		} else {
			if (config.viewMode === ViewMode.MODE_2D) {
				instructions += "🚀 MOVEMENT:\n";
				instructions += "   Use: ↑ (Up) / ↓ (Down)\n\n";
			} else {
				instructions += "🚀 MOVEMENT:\n";
				instructions += "   Use: ← (Left) / → (Right)\n\n";
			}
		}

		// Power-up controls section
		instructions += "⚡ POWER-UPS:\n";
		if (config.isLocalMultiplayer) {
			instructions += "   Player 1: C / V / B\n";
			instructions += "   Player 2: I / O / P\n\n";
		} else {
			instructions += "   Activate: 1 / 2 / 3\n\n";
		}

		// Game objective
		const points = GAME_CONFIG.scoreToWin;
		instructions += "🎯 OBJECTIVE:\n";
		instructions += `   Score ${points} points by hitting\nthe ball past your opponent!`;

		return instructions;
	}

	show(show: boolean): void {
		if (show) {
			if(!this.pauseOverlay.isVisible) {
				this.pauseOverlay.isVisible = true;
				this.pauseOverlay.alpha = 0;
				this.pauseOverlay.thickness = 0;

				this.animationManager.fadeInWithBorder(this.pauseOverlay, Motion.F.base, 0, 4);
			}
		} else {
			if (this.pauseOverlay.isVisible) {
				this.animationManager.fadeOutWithBorder(this.pauseOverlay, Motion.F.fast, 4, 0).then(() => {
					this.pauseOverlay.isVisible = false;
					this.pauseOverlay.alpha = 0;
					this.pauseOverlay.thickness = 0;
				});
			}
		}
	}

	dispose(): void {
		this.muteIcon?.onPointerClickObservable.clear();
		this.muteIcon?.dispose()
		this.pauseHint.dispose();
		this.pauseInstruction.dispose();
		this.pauseTitle.dispose();
		this.pauseGrid.dispose();
		this.pauseOverlay.dispose();
	}
}