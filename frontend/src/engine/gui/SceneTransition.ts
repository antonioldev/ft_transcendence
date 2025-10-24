import { AdvancedDynamicTexture, Rectangle } from "@babylonjs/gui";
import { getCurrentTranslation } from "../../translations/translations.js";
import { AnimationManager, Motion } from "../services/AnimationManager.js";
import { createRect, createTextBlock, CURTAIN_STYLES } from "./GuiStyle.js";

export class SceneTransition {
	private leftPaddle!: Rectangle;
	private rightPaddle!: Rectangle;
	private leftBackground!: Rectangle;
	private rightBackground!: Rectangle;
	private isActive: boolean = false;
	private spectatorWaitingRect!: Rectangle;

	constructor(private adt: AdvancedDynamicTexture, private animationManager: AnimationManager) {
		const { width } = this.adt.getSize();
		

		const t = getCurrentTranslation();

		this.leftBackground = createRect("leftBackground", CURTAIN_STYLES.leftBackground);
		this.rightBackground = createRect("rightBackground", CURTAIN_STYLES.rightBackground);

		this.leftPaddle = createRect("leftPaddle", CURTAIN_STYLES.leftPaddle);
		this.rightPaddle = createRect("rightPaddle", CURTAIN_STYLES.rightPaddle);

		this.leftBackground.addControl(this.leftPaddle);
    	this.rightBackground.addControl(this.rightPaddle);

		this.adt.addControl(this.leftBackground);
		this.adt.addControl(this.rightBackground);
		// this.adt.addControl(this.leftPaddle);
		// this.adt.addControl(this.rightPaddle);
		
		// this.leftPaddle.leftInPixels = -80;
		// this.rightPaddle.leftInPixels = width;
		this.leftBackground.leftInPixels = -width;
		this.rightBackground.leftInPixels = width;

		this.spectatorWaitingRect = createRect("spectatorWaitingBox", CURTAIN_STYLES.spectatorWaitingBox);
		const spectatorWaitingText = createTextBlock("spectatorWaitingText", CURTAIN_STYLES.spectatorWaitingText, t.spectatorWaitingmessage);
		this.spectatorWaitingRect.addControl(spectatorWaitingText);
		this.adt.addControl(this.spectatorWaitingRect);
	}

	async show(isSpectator: boolean = false): Promise<void> {
		this.isActive = true;

		// this.leftPaddle.isVisible = true;
		// this.rightPaddle.isVisible = true;
		this.leftBackground.isVisible = true;
		this.rightBackground.isVisible = true;
		
		const { width } = this.adt.getSize();
		
		// this.leftBackground.leftInPixels = 0;
		this.leftBackground.leftInPixels = -width / 2;
		this.rightBackground.leftInPixels = width;
		// this.leftPaddle.leftInPixels = width / 2 - 40;
		// this.rightPaddle.leftInPixels = width / 2 - 40;
		
		await Promise.all([
			this.animationManager.slideFromDirection(this.leftBackground, 'right', 'in', width / 2, Motion.F.base, false),
			this.animationManager.slideFromDirection(this.rightBackground, 'left', 'in', width / 2, Motion.F.base, false),
			// this.animationManager.slideFromDirection(this.leftPaddle, 'right', 'in', width / 2 + 40, Motion.F.base),
			// this.animationManager.slideFromDirection(this.rightPaddle, 'left', 'in', width / 2 + 40, Motion.F.base)
		]);

		if(isSpectator)
			this.spectatorWaitingRect.isVisible = true;
	}

	async hide(): Promise<void> {
		if (!this.isActive) return;
		console.log('HIDE START - positions:', this.leftPaddle.leftInPixels, this.rightPaddle.leftInPixels);

		await new Promise(resolve => setTimeout(resolve, 400));
		this.isActive = false;
		const { width } = this.adt.getSize();
		
		await Promise.all([
			// this.animationManager.slideFromDirection(this.leftPaddle, 'left', 'out', width / 2 + 40, Motion.F.fast),
			// this.animationManager.slideFromDirection(this.rightPaddle, 'right', 'out', width / 2 + 40, Motion.F.fast),
			this.animationManager.slideFromDirection(this.leftBackground, 'left', 'out', width / 2, Motion.F.fast),
			this.animationManager.slideFromDirection(this.rightBackground, 'right', 'out', width / 2, Motion.F.fast)
		]);
		this.spectatorWaitingRect.isVisible = false;
		// this.leftPaddle.isVisible = false;
		// this.rightPaddle.isVisible = false;
		this.leftBackground.isVisible = false;
		this.rightBackground.isVisible = false;
		
		this.resetPositions();
		console.log('HIDE END - positions:', this.leftPaddle.leftInPixels, this.rightPaddle.leftInPixels);
	}

	async play(): Promise<void> {
		await this.show();
		await this.hide();
	}

	private resetPositions(): void {
		const { width } = this.adt.getSize();
		
		// this.leftPaddle.leftInPixels = -80;
		// this.rightPaddle.leftInPixels = width;

		this.leftBackground.leftInPixels = -width / 2;
		this.rightBackground.leftInPixels = width;

		// this.leftBackground.leftInPixels = -width;
		// this.rightBackground.leftInPixels = width;
	}
}

