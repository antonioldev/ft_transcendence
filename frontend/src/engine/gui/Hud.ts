import { AdvancedDynamicTexture, TextBlock, Grid} from "@babylonjs/gui";
import { GameConfig } from '../GameConfig.js';
import { GameMode, ViewMode} from '../../shared/constants.js';
import { getCurrentTranslation } from '../../translations/translations.js';
import { AnimationManager, Motion } from "../services/AnimationManager.js";
import { HUD_STYLES, createTextBlock, createGrid,} from "./GuiStyle.js";

export class Hud {
	private hudGrid!: Grid;
	private fpsText!: TextBlock;
	private score1Text!: TextBlock;
	private score2Text!: TextBlock;
	private player1Label!: TextBlock;
	private player2Label!: TextBlock;
	private rallyText!: TextBlock;
	private rally!: TextBlock;
	private previousRally: number = 1;

	constructor(private adt: AdvancedDynamicTexture, private animationManager: AnimationManager, config: GameConfig) {
		this.hudGrid = createGrid("hudGrid", HUD_STYLES.hudGrid);
		this.adt!.addControl(this.hudGrid);

		this.hudGrid.addColumnDefinition(HUD_STYLES.gridColumns.fps, false);
		this.hudGrid.addColumnDefinition(HUD_STYLES.gridColumns.p1Controls, false);
		this.hudGrid.addColumnDefinition(HUD_STYLES.gridColumns.p1Score, false);
		this.hudGrid.addColumnDefinition(HUD_STYLES.gridColumns.p2Score, false);
		this.hudGrid.addColumnDefinition(HUD_STYLES.gridColumns.p2Controls, false);
		this.hudGrid.addColumnDefinition(HUD_STYLES.gridColumns.rally, false);

		this.fpsText =  createTextBlock("fpsText", HUD_STYLES.fpsText, "FPS: 0");
		this.hudGrid.addControl(this.fpsText, 0, 0);

		const p1Controls =  createTextBlock("PlayerControls_p1", HUD_STYLES.playerControlsP1, this.getControlsText(config, 1));
		this.hudGrid.addControl(p1Controls, 0, 1);

		const p1Cell = new Grid();
		p1Cell.addRowDefinition(1, false);
		p1Cell.addRowDefinition(1, false);
		p1Cell.addColumnDefinition(1, false);

		this.player1Label = createTextBlock("player1Label", HUD_STYLES.player1Label, "Player 1");
		this.score1Text =  createTextBlock("score1Text", HUD_STYLES.score1Text, "0");
		
		p1Cell.addControl(this.player1Label, 0, 0);
		p1Cell.addControl(this.score1Text, 1, 0);
		this.hudGrid.addControl(p1Cell, 0, 2);

		const p2Cell = new Grid();
		p2Cell.addRowDefinition(1, false);
		p2Cell.addRowDefinition(1, false);
		p2Cell.addColumnDefinition(1, false);

		this.player2Label =  createTextBlock("player2Label", HUD_STYLES.player2Label, "Player 2");
		this.score2Text =  createTextBlock("score2Text", HUD_STYLES.score2Text, "0");
		
		p2Cell.addControl(this.player2Label, 0, 0);
		p2Cell.addControl(this.score2Text, 1, 0);
		this.hudGrid.addControl(p2Cell, 0, 3);

		const p2Controls =  createTextBlock("PlayerControls_p2", HUD_STYLES.playerControlsP2, this.getControlsText(config, 2));
		this.hudGrid.addControl(p2Controls, 0, 4);

		const rallyCell = new Grid();
		rallyCell.addRowDefinition(1, false);
		rallyCell.addRowDefinition(1, false);
		rallyCell.addColumnDefinition(1, false);

		this.rallyText =  createTextBlock("rallyText", HUD_STYLES.rallyText, "Rally");
		this.rally =  createTextBlock("rallyValue", HUD_STYLES.rallyValue, "0");
		
		rallyCell.addControl(this.rallyText, 0, 0);
		rallyCell.addControl(this.rally, 1, 0);
		this.hudGrid.addControl(rallyCell, 0, 5);

		this.rally.transformCenterX = 0.5;
		this.rally.transformCenterY = 0.5;
	}

	show(show: boolean): void {
		this.hudGrid.isVisible = show;
	}

	updateFPS(fps: number): void {
		this.fpsText.text = `FPS: ${Math.round(fps)}`;
	}

	updateRally(rally: number): boolean {
		if (this.rally && ((this.previousRally < rally) || (rally === 1 && this.previousRally > rally))) {
			this.rally.text = `${Math.round(rally)}`;

			const maxRally = 10;
			const intensity = Math.min(rally / maxRally, 1);
			const r = 255;
			const g = Math.round(255 * (1 - intensity));
			const b = Math.round(255 * (1 - intensity));
			this.rally.color = `rgb(${r}, ${g}, ${b})`;

			if (rally > 0 && rally % 5 === 0)
				this.animationManager?.rotatePulse(this.rally, 1, Motion.F.slow);
			else
				this.animationManager?.scale(this.rally, 1, 1.4, Motion.F.base, true );
			this.previousRally = rally;
			return true;
		}
		this.previousRally = rally;
		return false;
	}

	private getControlsText(config: GameConfig, player: number): string {
		const t = getCurrentTranslation();
		const move = t.controls;

		if (config.gameMode === GameMode.SINGLE_PLAYER || config.isRemoteMultiplayer) {
			if (config.viewMode === ViewMode.MODE_2D)
				return move + "\n↑ / ↓";
			else
				return move + "\n← / →";
		}
		
		if (config.viewMode === ViewMode.MODE_2D)
			return player === 1 ? move + "\nP1: W / S" : move + "\nP2: ↑ / ↓";
		else
			return player === 1 ? move + "\nP1: A / D" : move + "\nP2: ← / →";
	}

	updateScores(leftScore: number, rightScore: number): void {
		const oldLeft = parseInt(this.score1Text.text);
		const oldRight = parseInt(this.score2Text.text);

		this.score1Text.text = leftScore.toString();
		this.score2Text.text = rightScore.toString();

		if (leftScore > oldLeft)
			this.animationManager?.scale(this.score1Text, 1, 0.9, Motion.F.base, true );
		else if (rightScore > oldRight)
			this.animationManager?.scale(this.score2Text, 1, 0.9, Motion.F.base, true );
	}

	updatePlayerNames(player1Name: string, player2Name: string): void {
		this.player1Label.text = player1Name;
		this.player2Label.text = player2Name;
		this.hudGrid.isVisible = true;
	}

	dispose(): void {
		this.rallyText.dispose();
		this.rally.dispose();
		this.score1Text.dispose();
		this.score2Text.dispose();
		this.player1Label.dispose();
		this.player2Label.dispose();
		this.fpsText.dispose();
		this.hudGrid.dispose();
	}
}