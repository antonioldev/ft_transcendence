import { AdvancedDynamicTexture, Rectangle, TextBlock, Grid} from "@babylonjs/gui";
import { KeyboardEventTypes} from "@babylonjs/core";
import { getCurrentTranslation } from '../../translations/translations.js';
import { spawnGUISparkles } from '../scene/fireworks.js';
import { AnimationManager, Motion } from "../services/AnimationManager.js";
import { PARTIAL_END_GAME_STYLES, END_GAME_STYLES, createRect, createTextBlock, createGrid} from "./GuiStyle.js";

export class EndGame {
	private partialEndGameOverlay!: Rectangle;
	private partialWinnerLabel!: TextBlock;
	private partialWinnerName!: TextBlock;
	private continueText!: TextBlock;
	private endGameOverlay!: Grid;
	private endGameWinnerText!: TextBlock;

	constructor(private adt: AdvancedDynamicTexture, private animationManager: AnimationManager) {
		const t = getCurrentTranslation();

		// Partial End Game
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

		// END GAME
		this.endGameOverlay = createGrid("endGameOverlay", END_GAME_STYLES.endGameOverlay);
		this.endGameOverlay.addColumnDefinition(1.0);

		this.endGameWinnerText = createTextBlock( "endGameWinnerText", END_GAME_STYLES.endGameWinnerText, "");
		this.endGameOverlay.addControl(this.endGameWinnerText, 0, 0);
		this.adt!.addControl(this.endGameOverlay);
	}

	async fadeBackground(show: boolean): Promise<void> {
		if (show) {
			this.partialEndGameOverlay.isVisible = true;
			await this.animationManager?.fadeIn(this.partialEndGameOverlay, Motion.F.slow);
		} else {
			await this.animationManager?.fadeOut(this.partialEndGameOverlay, Motion.F.fast);
			this.partialEndGameOverlay.isVisible = false;
		}
	}

	async showPartial(name: string): Promise<void> {
		if (!this.adt) return;

		this.partialWinnerName.text = name;
		this.partialEndGameOverlay.isVisible = true;
		this.partialWinnerLabel.isVisible = true;
		this.partialWinnerName.isVisible = true;
		this.partialEndGameOverlay.isPointerBlocker = true;

		spawnGUISparkles(this.adt, this.animationManager);

		await this.animationManager?.slideInY(this.partialWinnerLabel, -200, Motion.F.base);
		await new Promise(r => setTimeout(r, 60));
		await this.animationManager?.slideInY(this.partialWinnerName, 50, Motion.F.slow);
		this.animationManager?.breathe(this.partialWinnerName, Motion.F.breath);

		await new Promise(r => setTimeout(r, 180));
	}

	async hidePartial(): Promise<void> {
		await Promise.all([
			this.animationManager?.slideOutY(this.partialWinnerLabel, -50, Motion.F.fast),
			this.animationManager?.slideOutY(this.partialWinnerName, 50, Motion.F.fast),
		]);

		this.partialEndGameOverlay.isPointerBlocker = false;
		this.partialEndGameOverlay.isVisible = false;
	}

	async showFinal(winner: string): Promise<void> {
		this.endGameWinnerText.text = `🏆 ${winner} WINS! 🏆`;
		this.endGameWinnerText.color = "rgba(255, 255, 255, 1)";
		this.endGameOverlay.isVisible = true;

		this.animationManager?.pop(this.endGameWinnerText, Motion.F.fast, 0.9);

		await new Promise(r => setTimeout(r, 5000));

		this.endGameOverlay.isVisible = false;
	}


	async waitForSpaceToContinue(ms: number): Promise<void> {
		if (!this.adt) return;
		const scene = this.adt.getScene();
		await new Promise<void>(res => setTimeout(res, ms));
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

	dispose(): void {
		this.endGameWinnerText.dispose();
		this.endGameOverlay.dispose();
		this.partialEndGameOverlay.dispose();
		this.partialWinnerLabel.dispose();
		this.partialWinnerName.dispose();
		this.continueText.dispose();
	}
}