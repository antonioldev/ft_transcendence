import { AdvancedDynamicTexture, Rectangle } from "@babylonjs/gui";
import { AnimationManager, Motion } from "../services/AnimationManager.js";
import { createRect, CURTAIN_STYLES } from "./GuiStyle.js";

export class SceneTransition {
	private leftPaddle!: Rectangle;
	// private rightPaddle!: Rectangle;
	private leftBackground!: Rectangle;
	// private rightBackground!: Rectangle;
	private isActive: boolean = false;

	constructor(private adt: AdvancedDynamicTexture, private animationManager: AnimationManager) {
		this.leftBackground = createRect("leftBackground", CURTAIN_STYLES.leftBackground);
		// this.rightBackground = createRect("rightBackground", CURTAIN_STYLES.rightBackground);

		this.leftBackground = createRect("leftBackground", CURTAIN_STYLES.leftBackground);
		
		this.leftPaddle = createRect("leftPaddle", CURTAIN_STYLES.leftPaddle);
		// this.rightPaddle = createRect("rightPaddle", CURTAIN_STYLES.rightPaddle);

		this.leftBackground.addControl(this.leftPaddle);
		// this.rightBackground.addControl(this.rightPaddle);

		this.adt.addControl(this.leftBackground);
		// this.adt.addControl(this.rightBackground);
	}

	private async show(): Promise<void> {
		if (this.isActive) return;
		this.isActive = true;
		
		await this.animationManager.slideCurtain(this.leftBackground, 'in', Motion.F.base);
	}

	private async hide(): Promise<void> {
		if (!this.isActive) return;

		await new Promise(resolve => setTimeout(resolve, 400));
		this.isActive = false;
		
		await this.animationManager.slideCurtain(this.leftBackground, 'out', Motion.F.base);

	}

	async play(): Promise<void> {
		await this.show();
		await this.hide();
	}

}

