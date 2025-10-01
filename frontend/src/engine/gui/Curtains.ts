import { AdvancedDynamicTexture, Rectangle } from "@babylonjs/gui";
import { AnimationManager, Motion } from "../services/AnimationManager.js";
import { createRect, CURTAIN_STYLES } from "./GuiStyle.js";

export class TransitionEffect {
	private leftPaddle!: Rectangle;
	private rightPaddle!: Rectangle;
	private leftBackground!: Rectangle;
	private rightBackground!: Rectangle;
	
	constructor(private adt: AdvancedDynamicTexture, private animationManager: AnimationManager) {
		const { width } = this.adt.getSize();
		
		this.leftBackground = createRect("leftBackground", CURTAIN_STYLES.leftBackground);
		this.rightBackground = createRect("rightBackground", CURTAIN_STYLES.rightBackground);

		this.leftPaddle = createRect("leftPaddle", CURTAIN_STYLES.leftPaddle);
		this.rightPaddle = createRect("rightPaddle", CURTAIN_STYLES.rightPaddle);

		this.adt.addControl(this.leftBackground);
		this.adt.addControl(this.rightBackground);
		this.adt.addControl(this.leftPaddle);
		this.adt.addControl(this.rightPaddle);
		
		this.leftBackground.leftInPixels = -width;
		this.rightBackground.leftInPixels = width;
		this.leftPaddle.leftInPixels = -80;
		this.rightPaddle.leftInPixels = width;
	}

	async start(): Promise<void> {

		this.leftPaddle.isVisible = true;
		this.rightPaddle.isVisible = true;
		this.leftBackground.isVisible = true;
		this.rightBackground.isVisible = true;
		
		const { width } = this.adt.getSize();
		
		this.leftBackground.leftInPixels = 0;
		this.rightBackground.leftInPixels = width / 2;
		this.leftPaddle.leftInPixels = width / 2 - 40;
		this.rightPaddle.leftInPixels = width / 2 - 40;
		
		await Promise.all([
			this.animationManager.slideFromDirection(this.leftBackground, 'right', 'in', width / 2, Motion.F.fast),
			this.animationManager.slideFromDirection(this.rightBackground, 'left', 'in', width / 2, Motion.F.fast),
			this.animationManager.slideFromDirection(this.leftPaddle, 'right', 'in', width / 2 + 40, Motion.F.fast),
			this.animationManager.slideFromDirection(this.rightPaddle, 'left', 'in', width / 2 + 40, Motion.F.fast)
		]);
	}

	async stop(): Promise<void> {
		const { width } = this.adt.getSize();
		
		await Promise.all([
			// Slide elements back to off-screen positions
			this.animationManager.slideFromDirection(this.leftPaddle, 'left', 'out', width / 2 + 40, Motion.F.fast),
			this.animationManager.slideFromDirection(this.rightPaddle, 'right', 'out', width / 2 + 40, Motion.F.fast),
			this.animationManager.slideFromDirection(this.leftBackground, 'left', 'out', width / 2, Motion.F.fast),
			this.animationManager.slideFromDirection(this.rightBackground, 'right', 'out', width / 2, Motion.F.fast)
		]);
		
		this.leftPaddle.isVisible = false;
		this.rightPaddle.isVisible = false;
		this.leftBackground.isVisible = false;
		this.rightBackground.isVisible = false;
		
		this.resetPositions();
	}

	private resetPositions(): void {
		const { width } = this.adt.getSize();
		
		this.leftPaddle.leftInPixels = -80;
		this.rightPaddle.leftInPixels = width;
		this.leftBackground.leftInPixels = -width;
		this.rightBackground.leftInPixels = width;
	}
	
	dispose(): void {
		this.leftPaddle.dispose();
		this.rightPaddle.dispose();
		this.leftBackground.dispose();
		this.rightBackground.dispose();
	}
}

