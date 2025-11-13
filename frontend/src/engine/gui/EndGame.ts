import { KeyboardEventTypes, KeyboardInfo } from "@babylonjs/core";
import { AdvancedDynamicTexture, Rectangle, TextBlock, Image } from "@babylonjs/gui";
import { getCurrentTranslation } from '../../translations/translations.js';
import { COLORS, Z_INDEX } from "./GuiStyle";
import { AnimationManager, Motion } from "../services/AnimationManager.js";
import { END_GAME_STYLES, createGrid, createRect, createTextBlock } from "./GuiStyle.js";
import { PARTIAL_GUI_SPARKLES, PARTIAL_GUI_SPARKLES_LOSER } from "../scene/config/particleGuiConfig.js";
import type { SparkleDetails } from "../scene/config/particleGuiConfig.js";
import { randomFromRange, randomFromArray } from "../utils/utils.js";

export class EndGame {
	private overlay!: Rectangle;
	private winnerLabel!: TextBlock;
	private winnerName!: TextBlock;
	private continueText!: TextBlock;
	private timerText!: TextBlock;
	private spectatorTimerInterval: ReturnType<typeof setInterval> | null = null;

	constructor(private adt: AdvancedDynamicTexture, private animationManager: AnimationManager) {
		const t = getCurrentTranslation();

		this.overlay = createRect("endGameOverlay", END_GAME_STYLES.overlay);
		this.adt!.addControl(this.overlay);

		const centerGrid = createGrid("winnerGrid", END_GAME_STYLES.winnerGrid);
		this.overlay.addControl(centerGrid);

		centerGrid.addRowDefinition(END_GAME_STYLES.gridRows.label, true);
		centerGrid.addRowDefinition(END_GAME_STYLES.gridRows.name, true);
		centerGrid.addRowDefinition(END_GAME_STYLES.gridRows.continue, true);
		centerGrid.addRowDefinition(END_GAME_STYLES.gridRows.timer, true);

		this.winnerLabel = createTextBlock("winnerLabel", END_GAME_STYLES.winnerLabel, t.winner);
		centerGrid.addControl(this.winnerLabel, 0, 0);
		
		this.winnerName = createTextBlock("winnerName", END_GAME_STYLES.winnerName, "");
		centerGrid.addControl(this.winnerName, 1, 0);

		this.continueText = createTextBlock("continueText", END_GAME_STYLES.continueText, t.continue);
		centerGrid.addControl(this.continueText, 2, 0);

		this.timerText = createTextBlock("timerText", END_GAME_STYLES.continueText, "10");
		centerGrid.addControl(this.timerText, 3, 0);
	}


	async fadeBackground(show: boolean): Promise<void> {
		if (show && !this.overlay.isVisible) {
			this.overlay.isVisible = true;
			await this.animationManager?.fade(this.overlay, 'in', Motion.F.slow);
		} else if (!show && this.overlay.isVisible) {
			await this.animationManager?.fade(this.overlay, 'out', Motion.F.fast);
			this.overlay.isVisible = false;
		}
	}

	private configureDisplay(mode: 'winner' | 'loser' | 'champion'): void {
		const t = getCurrentTranslation();

		this.winnerLabel.isVisible = true;
		this.winnerName.isVisible = true;
		this.continueText.isVisible = false;
		this.timerText.isVisible = false;

		this.winnerName.color = END_GAME_STYLES.winnerName.color;
		this.winnerLabel.color = END_GAME_STYLES.winnerLabel.color;
		
		switch (mode) {
			case 'winner':
				this.winnerLabel.text = t.winner;
				this.winnerName.fontSizeInPixels = END_GAME_STYLES.winnerName.fontSizeInPixels;
				break;
				
			case 'loser':
				this.winnerLabel.text = "Match Ended";
				this.winnerName.text = "GAME OVER";
				this.winnerName.color = "rgba(255, 0, 0, 1)";
				this.winnerName.fontSizeInPixels = END_GAME_STYLES.winnerName.fontSizeInPixels;
				break;
				
			case 'champion':
				this.winnerLabel.text = "🏆 CHAMPION 🏆";
				this.winnerLabel.color = COLORS.GOLD;
				this.winnerLabel.shadowColor = COLORS.WHITE;
				this.winnerLabel.fontSizeInPixels = 100;
				
				this.winnerName.color = COLORS.GOLD;
				this.winnerName.shadowColor = COLORS.WHITE;
				this.winnerName.fontSizeInPixels = 120;
				break;
		}
	}

	private createSparkleElement(config: SparkleDetails): Image {
		const sparkle = new Image("sparkle", config.asset);
		sparkle.stretch = Image.STRETCH_UNIFORM;
	
		const size = randomFromRange(config.size.min, config.size.max);
		sparkle.widthInPixels = size;
		sparkle.heightInPixels = size;
	
		sparkle.color = randomFromArray(config.colors);

		sparkle.top = `${randomFromRange(-config.spread.y / 2, config.spread.y / 2)}%`;
		
		sparkle.left = `${randomFromRange(-config.spread.x / 2, config.spread.x / 2)}%`;
	
		sparkle.alpha = 0;
		sparkle.scaleX = 0;
		sparkle.scaleY = 0;
	
		sparkle.zIndex = Z_INDEX.ENDGAME;
	
		return sparkle;
	}
	
	private animateSparkle(sparkle: Image, animationManager: AnimationManager, delay: number, duration: number, winner: boolean): void {
		setTimeout(() => {
			animationManager.zoom(sparkle, 'in', 8).then(() => {
			
				if (winner) {
					animationManager.twinkle(sparkle, 20);
					setTimeout(() => {
						sparkle.animations = [];
						animationManager.fade(sparkle, 'out', 12).then(() => sparkle.dispose());
					}, duration - 500);
				} else {
					setTimeout(() => {
						const fallDistance = 200 + Math.random() * 300;
						const fallDuration = 40 + Math.random() * 20;
						animationManager.fall(sparkle, fallDistance, fallDuration).then(() => sparkle.dispose());
					}, duration - 300);
				}
			});
		}, delay);
	}
	
	private spawnGUISparkles(
		advancedTexture: AdvancedDynamicTexture, 
		animationManager: AnimationManager,
		winner: boolean
	): void {
		const config = winner ? PARTIAL_GUI_SPARKLES : PARTIAL_GUI_SPARKLES_LOSER;
		for (let i = 0; i < config.count; i++) {
			const sparkle = this.createSparkleElement(config);
			advancedTexture.addControl(sparkle);
			const delay = Math.random() * (winner ? 800 : 100);
			this.animateSparkle(sparkle, animationManager, delay, config.duration, winner);
		}
	}

	async showPartialWinner(name: string, waitForSpace: boolean = true, duration: number = 2000): Promise<void> {
		if (!this.adt) return;

		this.configureDisplay('winner');
		this.winnerName.text = name;
		
		this.overlay.isVisible = true;
		this.overlay.isPointerBlocker = true;

		this.spawnGUISparkles(this.adt, this.animationManager, true);

		await this.animationManager?.slideFromDirection(this.winnerLabel, 'up', 'in', 200, Motion.F.base);
		await new Promise(r => setTimeout(r, 60));
		await this.animationManager?.slideFromDirection(this.winnerName, 'down', 'in', 50, Motion.F.slow);
		this.animationManager?.scale(this.winnerName, 1, 1.5, Motion.F.breath, true, true);

		await new Promise(r => setTimeout(r, 180));

		const scene = this.adt.getScene();

		await new Promise<void>(res => setTimeout(res, duration));
		if (waitForSpace) {
			this.continueText.isVisible = true;
			this.animationManager?.twinkle(this.continueText, Motion.F.slow);

			return new Promise<void>((resolve) => {
				const sub = scene?.onKeyboardObservable.add((kbInfo: KeyboardInfo) => {
					if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
						const e = kbInfo.event as KeyboardEvent;
						if (e.code === "Space" || e.key === " ") {
							scene.onKeyboardObservable.remove(sub);
							this.continueText.isVisible = false;
							this.winnerLabel.isVisible = false;
							this.winnerName.isVisible = false;
							resolve();
						}
					}
				}) ?? null;
			});
		}
		return Promise.resolve();
	}

	async showPartialLoser(): Promise<void> {
		if (!this.adt) return;

		this.configureDisplay('loser');
		
		this.overlay.isVisible = true;
		this.overlay.isPointerBlocker = true;

		this.spawnGUISparkles(this.adt, this.animationManager, false);

		await this.animationManager?.slideFromDirection(this.winnerLabel, 'up', 'in', 200, Motion.F.slow);
		await new Promise(r => setTimeout(r, 100));
		await this.animationManager?.slideFromDirection(this.winnerName, 'down', 'in', 50, Motion.F.base);

		await new Promise(r => setTimeout(r, 250));

		const t = getCurrentTranslation();
		this.continueText.text = t.spectatorQuestion;
		this.continueText.fontSizeInPixels = 35;
		this.continueText.isVisible = true;
		this.timerText.isVisible = true;
		this.animationManager?.twinkle(this.continueText, Motion.F.slow);

		let timeLeft = 10;
		this.spectatorTimerInterval = setInterval(() => {
			timeLeft--;
			this.timerText.text = timeLeft.toString();
			if (timeLeft <= 0 && this.spectatorTimerInterval) {
				clearInterval(this.spectatorTimerInterval);
				this.spectatorTimerInterval = null;
			}
		}, 1000);
	}

	async showFinalWinner(winner: string): Promise<void> {
		if (!this.adt) return;

		this.configureDisplay('champion');
		this.winnerName.text = winner;
		
		this.overlay.isVisible = true;
		this.overlay.background = END_GAME_STYLES.championBackground;

		this.winnerLabel.alpha = 0;
		this.winnerName.alpha = 0;
		
		await this.animationManager?.fade(this.winnerLabel, 'in', Motion.F.base);
		await this.animationManager?.fade(this.winnerName, 'in', Motion.F.base);
		this.animationManager?.scale(this.winnerName, 1, 1.2, Motion.F.breath, true, true);

		await new Promise(r => setTimeout(r, 5000));

		await this.animationManager?.fade(this.overlay, 'out', Motion.F.fast);
		this.overlay.isVisible = false;
		
		this.overlay.background = END_GAME_STYLES.overlay.background;
	}

	async hidePartial(): Promise<void> {
		await Promise.all([
			this.animationManager?.slideFromDirection(this.winnerLabel, 'up', 'out', 50, Motion.F.fast),
			this.animationManager?.slideFromDirection(this.winnerName, 'down', 'out', 50, Motion.F.fast),
		]);

		this.overlay.isPointerBlocker = false;
		this.overlay.isVisible = false;
		this.continueText.isVisible = false;
		
		if (this.spectatorTimerInterval) {
			clearInterval(this.spectatorTimerInterval);
			this.spectatorTimerInterval = null;
		}
		this.timerText.isVisible = false;
	}

}