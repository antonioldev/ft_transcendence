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
		this.countdownContainer.isVisible = show;

		if (show && count !== undefined) {
			this.countdownText.text = count.toString();
			this.animationManager?.pulse(this.countdownText, Motion.F.xSlow);
			return;
		}
		this.countdownText.animations = [];
	}

	async finish(hideAfterMs = 350) {
		this.countdownText.text = "GO!";
		this.countdownText.animations = [];
		this.animationManager?.pulse(this.countdownText);

		await new Promise((r) => setTimeout(r, hideAfterMs));
		await this.animationManager?.fadeOut(this.countdownContainer);
		this.countdownContainer.isVisible = false;
	}

	dispose(): void {
		this.countdownText.dispose();
		this.countdownContainer.dispose();
	}
}