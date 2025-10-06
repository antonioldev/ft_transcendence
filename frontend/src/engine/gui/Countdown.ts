import { AdvancedDynamicTexture, Rectangle, TextBlock} from "@babylonjs/gui";
import { AnimationManager, Motion } from "../services/AnimationManager.js";
import { COUNTDOWN_STYLES, createRect, createTextBlock,} from "./GuiStyle.js";
import { AudioManager } from "../services/AudioManager.js";

export class Countdown {
	private countdownText!: TextBlock;
	private countdownContainer!: Rectangle;
	private leftPlayer!: TextBlock;
	private rightPlayer!: TextBlock;
	private readyText!: TextBlock;
	private vsText!: TextBlock;

	constructor(private adt: AdvancedDynamicTexture, private animationManager: AnimationManager, private audioManager: AudioManager) {
		this.countdownContainer = createRect("countdownContainer", COUNTDOWN_STYLES.countdownContainer);
		this.countdownText = createTextBlock("5", COUNTDOWN_STYLES.countdownText, "5");
		this.countdownContainer.addControl(this.countdownText);
		this.adt.addControl(this.countdownContainer);

		this.leftPlayer = createTextBlock("nameLeft", COUNTDOWN_STYLES.namePlayerLeft, "");
		this.rightPlayer = createTextBlock("nameRight", COUNTDOWN_STYLES.namePlayerRight, "");
		this.readyText = createTextBlock("readyText", COUNTDOWN_STYLES.readyText, "READY?");
		this.vsText = createTextBlock("vsText", COUNTDOWN_STYLES.vsText, "VS");

		this.adt.addControl(this.leftPlayer);
		this.adt.addControl(this.rightPlayer);
		this.adt.addControl(this.readyText);
		this.adt.addControl(this.vsText);
	}

	async showPlayersName(left: string, right: string): Promise<void> {
		this.readyText.isVisible = true;
		await this.animationManager.zoomIn(this.readyText, Motion.F.base);
		await new Promise(r => setTimeout(r, 400));
		await this.animationManager.zoomOut(this.readyText, Motion.F.base);
		this.readyText.isVisible = false;

		this.leftPlayer.text = `◀  ${left}`;
		this.leftPlayer.isVisible = true;
		this.audioManager.playEntrance();
		await this.animationManager.slideFromDirection(this.leftPlayer, 'left', 'in', 500, Motion.F.base, true);
		this.animationManager.glow(this.leftPlayer, Motion.F.breath);

		this.vsText.isVisible = true;
		await this.animationManager.zoomIn(this.vsText, Motion.F.base);
		this.animationManager.glow(this.vsText, Motion.F.breath);

		this.rightPlayer.text = `${right}  ▶`;
		this.rightPlayer.isVisible = true;
		this.audioManager.playEntrance();
		await this.animationManager.slideFromDirection(this.rightPlayer, 'right', 'in', 500, Motion.F.base, true);
		this.animationManager.glow(this.rightPlayer, Motion.F.breath);

		await new Promise(r => setTimeout(r, 1200));
	}

	async hidePlayersName(): Promise<void> {
		this.animationManager.slideFromDirection(this.leftPlayer, 'left', 'out', 400, Motion.F.base);
			this.animationManager.slideFromDirection(this.rightPlayer, 'right', 'out', 400, Motion.F.base);
			this.animationManager.fade(this.vsText, 'out', Motion.F.xFast);
	}

	async show(count: number): Promise<void> {

		if (!this.countdownContainer.isVisible)
			this.countdownContainer.isVisible = true;

		this.countdownText.text = count.toString();
		await this.animationManager?.scale(this.countdownText, 1, 1.8, Motion.F.xSlow, true, false);
	}

	async finish(): Promise<void> {
		this.countdownText.text = "GO!";
		this.countdownText.animations = [];

		await Promise.all ([
			this.animationManager.scale(this.countdownText, 1, 5, Motion.F.xSlow),
			this.animationManager.slideFromDirection(this.countdownContainer, 'up', 'out', 600, Motion.F.xSlow)
		]);
		
		this.countdownText.scaleX = 1;
		this.countdownText.scaleY = 1;
		this.countdownContainer.topInPixels = 0;
		this.countdownContainer.alpha = 1;
		this.countdownContainer.isVisible = false;
	}
}