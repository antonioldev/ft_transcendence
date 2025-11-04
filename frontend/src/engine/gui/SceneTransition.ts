import { AdvancedDynamicTexture, Rectangle } from "@babylonjs/gui";
import { AnimationManager, Motion } from "../services/AnimationManager.js";
import { createRect, CURTAIN_STYLES, H_LEFT, H_RIGHT } from "./GuiStyle.js";

export class SceneTransition {
	private leftPaddle!: Rectangle;
	private rightPaddle!: Rectangle;
	private leftBackground!: Rectangle;
	private rightBackground!: Rectangle;
	private isActive: boolean = false;

	constructor(private adt: AdvancedDynamicTexture, private animationManager: AnimationManager) {
		this.leftBackground = createRect("leftBackground", CURTAIN_STYLES.background);
		this.rightBackground = createRect("rightBackground", CURTAIN_STYLES.background);
		this.rightBackground.horizontalAlignment = H_RIGHT;

		
		this.leftPaddle = createRect("leftPaddle", CURTAIN_STYLES.paddle);
		this.rightPaddle = createRect("rightPaddle", CURTAIN_STYLES.paddle);
		this.rightPaddle.horizontalAlignment = H_LEFT;

		this.leftBackground.addControl(this.leftPaddle);
		this.rightBackground.addControl(this.rightPaddle);

		this.adt.addControl(this.leftBackground);
		this.adt.addControl(this.rightBackground);
	}

	async show(speed: number = Motion.F.base): Promise<void> {
		if (this.isActive) return;
		this.isActive = true;
		
		await Promise.all([
			this.animationManager.slideCurtain(this.leftBackground, true, 'in', speed),
			this.animationManager.slideCurtain(this.rightBackground, false, 'in', speed)
		]);
	}

	async hide(speed: number = Motion.F.slow): Promise<void> {
		if (!this.isActive) return;

		await new Promise(resolve => setTimeout(resolve, 100));
		this.isActive = false;
		
		await Promise.all([
			this.animationManager.slideCurtain(this.leftBackground, true, 'out', speed),
			this.animationManager.slideCurtain(this.rightBackground, false, 'out', speed)
		]);
	}
}

