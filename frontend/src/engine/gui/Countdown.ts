import { AdvancedDynamicTexture, Rectangle, TextBlock} from "@babylonjs/gui";
import { AnimationManager, Motion } from "../services/AnimationManager.js";
import { COUNTDOWN_STYLES, createRect, createTextBlock,} from "./GuiStyle.js";


export class Countdown {
	private countdownText!: TextBlock;
	private countdownContainer!: Rectangle;

	constructor(private adt: AdvancedDynamicTexture, private animationManager: AnimationManager) {
		this.countdownContainer = createRect("countdownContainer", COUNTDOWN_STYLES.countdownContainer);

		this.countdownText = createTextBlock("5", COUNTDOWN_STYLES.countdownText, "5");

		this.countdownContainer.addControl(this.countdownText);
		this.adt!.addControl(this.countdownContainer);

	}

	set(show: boolean, count?: number): void {
		if (show && !this.countdownContainer.isVisible) {
			this.countdownContainer.isVisible = true;
		} else if (!show && this.countdownContainer.isVisible) {
			this.countdownContainer.isVisible = false;
			// return;
		}

		if (show && count !== undefined) {
			this.countdownText.text = count.toString();
			this.animationManager?.scale(this.countdownText, 1, 1.8, Motion.F.xSlow, true, false);
			return;
		}
		this.countdownText.animations = [];
	}

	async finishCountdown() {
		this.countdownText.text = "GO!";
		this.countdownText.animations = [];

		await this.animationManager.scale(this.countdownText, 3, Motion.F.base)
		await this.animationManager?.slideFromDirection(this.countdownText, 'up', 'out', 400, Motion.F.base);

		this.countdownText.scaleX = 1;
		this.countdownText.scaleY = 1;
		this.countdownText.topInPixels = 0;
		this.countdownText.alpha = 1;
		this.countdownContainer.isVisible = false;
	}

	dispose(): void {
		this.countdownText.dispose();
		this.countdownContainer.dispose();
	}
}