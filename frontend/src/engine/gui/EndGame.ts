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
	private spectatorText!: TextBlock;

	private continueText!: TextBlock;
	private endGameOverlay!: Grid;
	private endGameWinnerText!: TextBlock;

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

	async showPartial(name: string): Promise<void> {
		if (!this.adt) return;

		this.partialWinnerName.text = name;
		this.partialWinnerName.color = "rgba(255, 215, 0, 1)";
		this.partialEndGameOverlay.isVisible = true;
		this.partialWinnerLabel.isVisible = true;
		this.partialWinnerName.isVisible = true;
		this.partialEndGameOverlay.isPointerBlocker = true;

		spawnGUISparkles(this.adt, this.animationManager, true);

		await this.animationManager?.slideFromDirection(this.partialWinnerLabel, 'up', 'in', 200, Motion.F.base);
		await new Promise(r => setTimeout(r, 60));
		await this.animationManager?.slideFromDirection(this.partialWinnerName, 'down', 'in', 50, Motion.F.slow);
		this.animationManager?.scale(this.partialWinnerName, 1, 1.5, Motion.F.breath, true, true);

		await new Promise(r => setTimeout(r, 180));
	}

	async showPartialLoser(): Promise<void> {
		if (!this.adt) return;

		this.partialWinnerName.text = "You Lost"; // TODO translate
		this.partialWinnerName.color = "rgba(255, 0, 0, 1)";
		this.partialWinnerLabel.text = "Match Ended";
		
		this.partialEndGameOverlay.isVisible = true;
		this.partialWinnerLabel.isVisible = true;
		this.partialWinnerName.isVisible = true;
		this.partialEndGameOverlay.isPointerBlocker = true;

		spawnGUISparkles(this.adt, this.animationManager, false);

		await this.animationManager?.slideFromDirection(this.partialWinnerLabel, 'up', 'in', 200, Motion.F.slow);
		await new Promise(r => setTimeout(r, 100));
		await this.animationManager?.slideFromDirection(this.partialWinnerName, 'down', 'in', 50, Motion.F.base);

		await new Promise(r => setTimeout(r, 250));
	}

	async showSpectatorPrompt(): Promise<boolean> {
		const t = getCurrentTranslation();

		this.continueText.text = t.spectatorQuestion;
		const timerText = createTextBlock(
			"spectatorTimer", PARTIAL_END_GAME_STYLES.continueText, "10");
		timerText.fontSize = "20px";
		timerText.top = "120px";
		
		this.partialEndGameOverlay.addControl(timerText);

		this.continueText.isVisible = true;
		timerText.isVisible = true;
		this.animationManager?.twinkle(this.continueText, Motion.F.slow);
		setTimeout(resizeBy, 2000);
		
		return(true);
        
	}

	async hidePartial(): Promise<void> {
		await Promise.all([
			this.animationManager?.slideFromDirection(this.partialWinnerLabel, 'up', 'out', 50, Motion.F.fast),
			this.animationManager?.slideFromDirection(this.partialWinnerName, 'down', 'out', 50, Motion.F.fast),
		]);

		this.partialEndGameOverlay.isPointerBlocker = false;
		this.partialEndGameOverlay.isVisible = false;
		this.continueText.isVisible = false;
	}

	async showFinal(winner: string): Promise<void> {
		this.endGameWinnerText.text = `🏆 ${winner} WINS! 🏆`;
		this.endGameWinnerText.color = "rgba(255, 255, 255, 1)";
		this.endGameOverlay.isVisible = true;

		this.animationManager?.scale(this.endGameWinnerText, 1, 1.2, Motion.F.breath, true);

		await new Promise(r => setTimeout(r, 5000));

		this.endGameOverlay.isVisible = false;
	}

	async waitForContinue(ms: number, requireSpace: boolean = true): Promise<void> {
		if (!this.adt) return;

		const scene = this.adt.getScene();

		await new Promise<void>(res => setTimeout(res, ms));
		if (requireSpace) {
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

	dispose(): void {
		this.endGameWinnerText.dispose();
		this.endGameOverlay.dispose();
		this.partialEndGameOverlay.dispose();
		this.partialWinnerLabel.dispose();
		this.partialWinnerName.dispose();
		this.continueText.dispose();
	}
}