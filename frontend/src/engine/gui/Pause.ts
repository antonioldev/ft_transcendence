import { AdvancedDynamicTexture, Rectangle, TextBlock, Grid, Image} from "@babylonjs/gui";
import { getCurrentTranslation } from '../../translations/translations.js';
import { AnimationManager, Motion } from "../AnimationManager.js";
import {
  H_LEFT,
  PAUSE_MENU_STYLES,
  createRect,
  createTextBlock,
  createGrid,
  createImage,
} from "./GuiStyle.js";

export class Pause {
	private pauseOverlay!: Rectangle;
	private pauseGrid!: Grid;
	private pauseTitle!: TextBlock;
	private pauseInstruction!: TextBlock;
	private pauseHint!: TextBlock;
	private muteIcon?: Image;
	// private toggleMuteCallback?: () => boolean;

	constructor(private adt: AdvancedDynamicTexture, private animationManager: AnimationManager, isTournament: boolean, private onToggleMute?: () => boolean) {
		const t = getCurrentTranslation();

		this.pauseOverlay = createRect("pauseOverlay", PAUSE_MENU_STYLES.pauseOverlay);
		this.adt.addControl(this.pauseOverlay);

		this.pauseGrid = createGrid("pauseGrid", PAUSE_MENU_STYLES.pauseGrid);
		if (isTournament) {
			this.pauseGrid.width = "50%";
			this.pauseGrid.horizontalAlignment = H_LEFT;
		}
		this.pauseOverlay.addControl(this.pauseGrid);

		this.pauseGrid.addRowDefinition(PAUSE_MENU_STYLES.gridRows.title, false);
		this.pauseGrid.addRowDefinition(PAUSE_MENU_STYLES.gridRows.instruction, false);
		this.pauseGrid.addRowDefinition(PAUSE_MENU_STYLES.gridRows.hint, false);
		this.pauseGrid.addRowDefinition(PAUSE_MENU_STYLES.gridRows.muteIcon, false);

		this.pauseTitle = createTextBlock( "pauseTitle", PAUSE_MENU_STYLES.pauseTitle, t.gamePaused);
		this.pauseGrid.addControl(this.pauseTitle, 0, 0);

		this.pauseInstruction = createTextBlock( "pauseInstruction", PAUSE_MENU_STYLES.pauseInstruction, t.exitGame);
		this.pauseGrid.addControl(this.pauseInstruction, 1, 0);

		this.pauseHint = createTextBlock( "pauseHint", PAUSE_MENU_STYLES.pauseHint, t.pauseControls);
		this.pauseGrid.addControl(this.pauseHint, 2, 0);

		this.muteIcon = createImage( "muteIcon", PAUSE_MENU_STYLES.muteIcon, "assets/icons/sound_on.png");
		this.muteIcon.onPointerClickObservable.add(() => {
			this.animateMuteIcon();
			if (this.onToggleMute) {
				const isMuted = this.onToggleMute();
				if (this.muteIcon)
					this.muteIcon.source = isMuted ? "assets/icons/sound_off.png" : "assets/icons/sound_on.png";
			}
		});
		this.pauseGrid.addControl(this.muteIcon, 3, 0);
	}

	private async animateMuteIcon(): Promise<void> {
		if (!this.muteIcon) return;
		await this.animationManager?.pop(this.muteIcon, Motion.F.xFast, 0.9);
	}

	show(show: boolean): void {
		if (show) {
			this.pauseOverlay.isVisible = true;
			this.pauseOverlay.alpha = 0;
			this.pauseOverlay.thickness = 0;

			const frames = Motion.F.base;
			this.pauseOverlay.animations = [
			this.animationManager.createFloat("alpha", 0, 1, frames, false, Motion.ease.quadOut()),
			this.animationManager.createFloat("thickness", 0, 4, frames, false, Motion.ease.quadOut()),
			];
			this.animationManager.play(this.pauseOverlay, frames, false);
		} else {
			const frames = Motion.F.fast;
			this.pauseOverlay.animations = [
			this.animationManager.createFloat("alpha", 1, 0, frames, false, Motion.ease.quadOut()),
			this.animationManager.createFloat("thickness", 4, 0, frames, false, Motion.ease.quadOut()),
			];
			this.animationManager.play(this.pauseOverlay, frames, false).then(() => {
			this.pauseOverlay.isVisible = false;
			this.pauseOverlay.alpha = 0;
			this.pauseOverlay.thickness = 0;
			});
		}
	}

	dispose(): void {
		this.muteIcon?.dispose()
		this.pauseHint.dispose();
		this.pauseInstruction.dispose();
		this.pauseTitle.dispose();
		this.pauseGrid.dispose();
		this.pauseOverlay.dispose();
	}
}