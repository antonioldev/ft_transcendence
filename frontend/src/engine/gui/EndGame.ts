import { KeyboardEventTypes } from "@babylonjs/core";
import { AdvancedDynamicTexture, Grid, Rectangle, TextBlock, Image } from "@babylonjs/gui";
import { getCurrentTranslation } from '../../translations/translations.js';
import { Z_INDEX } from "./GuiStyle";
import { AnimationManager, Motion } from "../services/AnimationManager.js";
import { END_GAME_STYLES, PARTIAL_END_GAME_STYLES, createGrid, createRect, createTextBlock } from "./GuiStyle.js";
import { PARTIAL_GUI_SPARKLES, PARTIAL_GUI_SPARKLES_LOSER, SparkleDetails } from "../scene/config/particleGuiConfig.js";
import { randomFromRange, randomFromArray } from "../utils.js";

export class EndGame {
	private partialEndGameOverlay!: Rectangle;
	private partialWinnerLabel!: TextBlock;
	private partialWinnerName!: TextBlock;
	private spectatorTimerText!: TextBlock;

	private continueText!: TextBlock;
	private endGameOverlay!: Grid;
	private endGameWinnerText!: TextBlock;
	private spectatorTimerInterval: ReturnType<typeof setInterval> | null = null;

	constructor(private adt: AdvancedDynamicTexture, private animationManager: AnimationManager) {
		const t = getCurrentTranslation();

		this.partialEndGameOverlay = createRect("partialWinnerLayer", PARTIAL_END_GAME_STYLES.partialEndGameOverlay);
		this.adt!.addControl(this.partialEndGameOverlay);

		const centerColumn = createGrid("winnerGrid", PARTIAL_END_GAME_STYLES.winnerGrid);
		this.partialEndGameOverlay.addControl(centerColumn);

		centerColumn.addRowDefinition(PARTIAL_END_GAME_STYLES.gridRows.label);
		centerColumn.addRowDefinition(PARTIAL_END_GAME_STYLES.gridRows.name);
		centerColumn.addRowDefinition(PARTIAL_END_GAME_STYLES.gridRows.continue);

		this.partialWinnerLabel = createTextBlock( "winnerLabel", PARTIAL_END_GAME_STYLES.partialWinnerLabel, t.winner);
		centerColumn.addControl(this.partialWinnerLabel, 0, 0);

		this.partialWinnerName = createTextBlock( "winnerName", PARTIAL_END_GAME_STYLES.partialWinnerName, "");
		centerColumn.addControl(this.partialWinnerName, 1, 0);

		this.continueText = createTextBlock( "continue_text", PARTIAL_END_GAME_STYLES.continueText, t.continue );
		centerColumn.addControl(this.continueText, 2, 0);

		this.spectatorTimerText = createTextBlock("spectatorTimer", PARTIAL_END_GAME_STYLES.continueText, "10");
		this.partialEndGameOverlay.addControl(this.spectatorTimerText);

		this.endGameOverlay = createGrid("endGameOverlay", END_GAME_STYLES.endGameOverlay);
		this.endGameOverlay.addColumnDefinition(1.0);

		this.endGameWinnerText = createTextBlock( "endGameWinnerText", END_GAME_STYLES.endGameWinnerText, "");
		this.endGameOverlay.addControl(this.endGameWinnerText, 0, 0);
		this.adt!.addControl(this.endGameOverlay);
	}

	async fadeBackground(show: boolean): Promise<void> {
		if (show && !this.partialEndGameOverlay.isVisible) {
			this.partialEndGameOverlay.isVisible = true;
			await this.animationManager?.fade(this.partialEndGameOverlay, 'in', Motion.F.slow);
		} else if (!show && this.partialEndGameOverlay.isVisible) {
			await this.animationManager?.fade(this.partialEndGameOverlay, 'out', Motion.F.fast);
			this.partialEndGameOverlay.isVisible = false;
		}
	}

	private createSparkleElement(config: SparkleDetails, winner: boolean): Image {
		const sparkle = new Image("sparkle", config.asset);
		sparkle.stretch = Image.STRETCH_UNIFORM;
	
		const size = randomFromRange(config.size.min, config.size.max);
		sparkle.widthInPixels = size;
		sparkle.heightInPixels = size;
	
		sparkle.color = randomFromArray(config.colors);
	
		if (!winner) {
			const startYOffset = -config.spread.y * 0.8;
			sparkle.top = `${randomFromRange(startYOffset, startYOffset + config.spread.y * 0.4)}%`;
		} else {
			sparkle.top = `${randomFromRange(-config.spread.y / 2, config.spread.y / 2)}%`;
		}
		
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
						const fallDistance = 300 + Math.random() * 200;
						const fallDuration = 40 + Math.random() * 20;
						animationManager.slideFromDirection(sparkle, 'down', 'out', fallDistance, fallDuration, true).then(() => sparkle.dispose());
					}, duration - 300);
				}
			});
		}, delay);
	}
	
	private spawnGUISparkles(
		advancedTexture: AdvancedDynamicTexture, 
		animationManager: any,
		winner: boolean
	): void {
		const config = winner ? PARTIAL_GUI_SPARKLES : PARTIAL_GUI_SPARKLES_LOSER;
		for (let i = 0; i < config.count; i++) {
			const sparkle = this.createSparkleElement(config, winner);
			advancedTexture.addControl(sparkle);
			const delay = Math.random() * (winner ? 800 : 100);
			this.animateSparkle(sparkle, animationManager, delay, config.duration, winner);
		}
	}

	async showPartialWinner(name: string, waitForSpace: boolean = true, duration: number = 2000): Promise<void> {
		if (!this.adt) return;

		this.partialWinnerName.text = name;
		this.partialWinnerName.color = "rgba(255, 215, 0, 1)";
		this.partialEndGameOverlay.isVisible = true;
		this.partialWinnerLabel.isVisible = true;
		this.partialWinnerName.isVisible = true;
		this.partialEndGameOverlay.isPointerBlocker = true;

		this.spawnGUISparkles(this.adt, this.animationManager, true);

		await this.animationManager?.slideFromDirection(this.partialWinnerLabel, 'up', 'in', 200, Motion.F.base);
		await new Promise(r => setTimeout(r, 60));
		await this.animationManager?.slideFromDirection(this.partialWinnerName, 'down', 'in', 50, Motion.F.slow);
		this.animationManager?.scale(this.partialWinnerName, 1, 1.5, Motion.F.breath, true, true);

		await new Promise(r => setTimeout(r, 180));

		const scene = this.adt.getScene();

		await new Promise<void>(res => setTimeout(res, duration));
		if (waitForSpace) {
			this.continueText.isVisible = true;
			this.animationManager?.twinkle(this.continueText, Motion.F.slow);

			return new Promise<void>((resolve) => {
				const sub = scene?.onKeyboardObservable.add((kbInfo: any) => {
					if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
						const e = kbInfo.event as KeyboardEvent;
						if (e.code === "Space" || e.key === " ") {
							scene.onKeyboardObservable.remove(sub);
							this.continueText.isVisible = false;
							this.partialWinnerLabel.isVisible = false;
							this.partialWinnerName.isVisible = false;
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

		this.partialWinnerName.text = "GAME OVER";
		this.partialWinnerName.color = "rgba(255, 0, 0, 1)";
		this.partialWinnerLabel.text = "Match Ended";
		
		this.partialEndGameOverlay.isVisible = true;
		this.partialWinnerLabel.isVisible = true;
		this.partialWinnerName.isVisible = true;
		this.partialEndGameOverlay.isPointerBlocker = true;

		this.spawnGUISparkles(this.adt, this.animationManager, false);

		await this.animationManager?.slideFromDirection(this.partialWinnerLabel, 'up', 'in', 200, Motion.F.slow);
		await new Promise(r => setTimeout(r, 100));
		await this.animationManager?.slideFromDirection(this.partialWinnerName, 'down', 'in', 50, Motion.F.base);

		await new Promise(r => setTimeout(r, 250));

		const t = getCurrentTranslation();

		this.continueText.text = t.spectatorQuestion;
		this.spectatorTimerText.fontSize = "20px";
		this.spectatorTimerText.top = "120px";

		this.continueText.isVisible = true;
		this.spectatorTimerText.isVisible = true;
		this.animationManager?.twinkle(this.continueText, Motion.F.slow);

		let timeLeft = 10;
		
		this.spectatorTimerInterval = setInterval(() => {
			timeLeft--;
			this.spectatorTimerText.text = timeLeft.toString();
			if (timeLeft <= 0 && this.spectatorTimerInterval) {
				clearInterval(this.spectatorTimerInterval);
				this.spectatorTimerInterval = null;
			}
		}, 1000);
	}

	async hidePartial(): Promise<void> {
		await Promise.all([
			this.animationManager?.slideFromDirection(this.partialWinnerLabel, 'up', 'out', 50, Motion.F.fast),
			this.animationManager?.slideFromDirection(this.partialWinnerName, 'down', 'out', 50, Motion.F.fast),
		]);

		this.partialEndGameOverlay.isPointerBlocker = false;
		this.partialEndGameOverlay.isVisible = false;
		this.continueText.isVisible = false;
		if (this.spectatorTimerInterval) {
			clearInterval(this.spectatorTimerInterval);
			this.spectatorTimerInterval = null;
		}
		this.continueText.isVisible = false;
		this.spectatorTimerText.isVisible = false;
	}

	async showFinalWinner(winner: string): Promise<void> {
		this.endGameWinnerText.text = `🏆 ${winner} WINS! 🏆`;
		this.endGameWinnerText.color = "rgba(255, 255, 255, 1)";
		this.endGameOverlay.isVisible = true;

		this.animationManager?.scale(this.endGameWinnerText, 1, 1.2, Motion.F.breath, true);

		await new Promise(r => setTimeout(r, 5000));

		this.endGameOverlay.isVisible = false;
	}
}