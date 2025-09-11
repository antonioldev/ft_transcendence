import { AdvancedDynamicTexture, Control, Rectangle, TextBlock, Grid, Image, ScrollViewer, StackPanel, MultiLine} from "@babylonjs/gui";
import { Scene, KeyboardEventTypes} from "@babylonjs/core";
import { Logger } from '../../utils/LogManager.js';
import { GameConfig } from '../GameConfig.js';
import { GameMode, ViewMode, Powerup, PowerUpAction } from '../../shared/constants.js';
import { getCurrentTranslation } from '../../translations/translations.js';
import { spawnFireworksInFrontOfCameras, FINAL_FIREWORKS, spawnGUISparkles } from '../scene/fireworks.js';
import { AnimationManager, Motion } from "../AnimationManager.js";
import { AudioManager } from "../AudioManager.js";
import {
  COLORS,
  LOADING_STYLE,
  HUD_STYLES,
  POWER_UP_STYLES,
  PAUSE_MENU_STYLES,
  LOBBY_STYLES,
  COUNTDOWN_STYLES,
  VIEW_MODE_STYLES,
  PARTIAL_END_GAME_STYLES,
  END_GAME_STYLES,
  BRACKET_STYLES,
  applyStyles,
  createRect,
  createTextBlock,
  createGrid,
  createImage,
  createStackPanel
} from "./GuiStyle.js";


export class Countdown {
	private countdownText!: TextBlock;
	private countdownContainer!: Rectangle;

	constructor(private advancedTexture: AdvancedDynamicTexture, private animationManager: AnimationManager) {
		this.countdownContainer = createRect("countdownContainer", COUNTDOWN_STYLES.countdownContainer);

		this.countdownText = createTextBlock("5", COUNTDOWN_STYLES.countdownText, "5");

		this.countdownContainer.addControl(this.countdownText);
		this.advancedTexture!.addControl(this.countdownContainer);

	}

	set(show: boolean, count?: number): void {
		this.countdownContainer.isVisible = show;

		if (show && count !== undefined) {
			this.countdownText.text = count.toString();
			this.animationManager?.pulse(this.countdownText, Motion.F.xSlow);
			return;
		}
		this.countdownText.animations = [];
	}

	async finish(hideAfterMs = 350) {
		this.countdownText.text = "GO!";
		this.countdownText.animations = [];
		this.animationManager?.pulse(this.countdownText);

		await new Promise((r) => setTimeout(r, hideAfterMs));
		await this.animationManager?.fadeOut(this.countdownContainer);
		this.countdownContainer.isVisible = false;
	}

	dispose(): void {
		this.countdownText.dispose();
		this.countdownContainer.dispose();
	}
}