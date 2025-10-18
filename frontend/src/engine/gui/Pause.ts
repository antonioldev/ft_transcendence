import { AdvancedDynamicTexture, Rectangle, Checkbox } from "@babylonjs/gui";
import { ViewMode } from "../../shared/constants.js";
import { GAME_CONFIG } from "../../shared/gameConfig.js";
import { getCurrentTranslation } from '../../translations/translations.js';
import { GameConfig } from "../GameConfig.js";
import { AnimationManager, Motion } from "../services/AnimationManager.js";
import { H_LEFT, PAUSE_MENU_STYLES, createGrid, createRect, createStackPanel, createTextBlock, createCheckbox } from "./GuiStyle.js";

export class Pause {
	private overlay!: Rectangle;
	private spectatorPauseBox!: Rectangle;
	private checkboxMusic?: Checkbox;
	private checkboxEffects?: Checkbox;

	constructor(private adt: AdvancedDynamicTexture, private animationManager: AnimationManager,
	config: GameConfig, private onToggleMusic?: () => boolean, private onToggleEffects?: () => boolean) {
		const t = getCurrentTranslation();

		this.overlay = createRect("pauseOverlay", PAUSE_MENU_STYLES.pauseOverlay);
		this.adt.addControl(this.overlay);

		const pauseGrid = createGrid("pauseGrid", PAUSE_MENU_STYLES.pauseGrid);
		if (config.isTournament) {
			pauseGrid.width = "80%";
			pauseGrid.horizontalAlignment = H_LEFT;
		}
		this.overlay.addControl(pauseGrid);

		pauseGrid.addRowDefinition(PAUSE_MENU_STYLES.gridRows.title, false);
		pauseGrid.addRowDefinition(PAUSE_MENU_STYLES.gridRows.gameInstructions, false);
		pauseGrid.addRowDefinition(PAUSE_MENU_STYLES.gridRows.exitInstruction, false);
		pauseGrid.addRowDefinition(PAUSE_MENU_STYLES.gridRows.audio, false);

		const pauseTitle = createTextBlock( "pauseTitle", PAUSE_MENU_STYLES.pauseTitle, t.gamePaused);
		pauseGrid.addControl(pauseTitle, 0, 0);

		const gameInstructions = createRect("gameInstructions", PAUSE_MENU_STYLES.gameInstructionContainer);
		pauseGrid.addControl(gameInstructions, 1, 0);
		this.buildInstructions(gameInstructions, config);

		const exitStack = createStackPanel("exitStack", PAUSE_MENU_STYLES.instructionsStack);
		pauseGrid.addControl(exitStack, 2, 0);

		const pauseInstruction = createTextBlock("pauseInstruction", PAUSE_MENU_STYLES.pauseInstruction, t.exitGame);
		exitStack.addControl(pauseInstruction);

		const pauseHint = createTextBlock("pauseHint", PAUSE_MENU_STYLES.pauseHint, t.pauseControls);
		exitStack.addControl(pauseHint);

		const audioGrid = createGrid("audioGrid", PAUSE_MENU_STYLES.audioGrid);
		audioGrid.addColumnDefinition(0.5, false);
		audioGrid.addColumnDefinition(0.5, false);
		pauseGrid.addControl(audioGrid, 3, 0);

		const musicStack = createStackPanel("musicStack", PAUSE_MENU_STYLES.audioStack);
		audioGrid.addControl(musicStack, 0, 0);
		
		const musicLabel = createTextBlock("musicLabel", PAUSE_MENU_STYLES.pauseHint, t.music);
		musicStack.addControl(musicLabel);

		this.checkboxMusic = createCheckbox("musicCheckbox", PAUSE_MENU_STYLES.muteCheckbox, config.musicEnabled);
		musicStack.addControl(this.checkboxMusic);
		
		this.checkboxMusic.onIsCheckedChangedObservable.add(() => {
			if (this.onToggleMusic) {
				const isEnabled = this.onToggleMusic();
				if (this.checkboxMusic) {
					this.animationManager?.scale(this.checkboxMusic, 1, 0.9, Motion.F.xFast, true);
					this.checkboxMusic.isChecked = isEnabled;
				}
			}
		});
		
		const effectsStack = createStackPanel("effectsStack", PAUSE_MENU_STYLES.audioStack);
		audioGrid.addControl(effectsStack, 0, 1);
		
		const effectsLabel = createTextBlock("effectsLabel", PAUSE_MENU_STYLES.pauseHint, t.soundEffects);
		effectsStack.addControl(effectsLabel);

		this.checkboxEffects = createCheckbox("effectsCheckbox", PAUSE_MENU_STYLES.muteCheckbox, config.soundEffectsEnabled);
		effectsStack.addControl(this.checkboxEffects);
		
		this.checkboxEffects.onIsCheckedChangedObservable.add(() => {
			if (this.onToggleEffects) {
				const isEnabled = this.onToggleEffects();
				if (this.checkboxEffects) {
					this.animationManager?.scale(this.checkboxEffects, 1, 0.9, Motion.F.xFast, true);
					this.checkboxEffects.isChecked = isEnabled;
				}  
			}
		});

		this.spectatorPauseBox = createRect("spectatorPauseBox", PAUSE_MENU_STYLES.spectatorPauseBox);
		this.adt.addControl(this.spectatorPauseBox);
		
		const spectatorPauseText = createTextBlock("spectatorPauseText", PAUSE_MENU_STYLES.spectatorPauseText, t.gamePaused);
		this.spectatorPauseBox.addControl(spectatorPauseText);
	}

	private buildInstructions(gameInstructions: Rectangle, config: GameConfig): void {
		const t = getCurrentTranslation();

		const instructionsStack = createStackPanel("instructionsStack", PAUSE_MENU_STYLES.instructionsStack);
		gameInstructions.addControl(instructionsStack);
		
		const controlsTitle = createTextBlock("controlsTitle", PAUSE_MENU_STYLES.instructionTitle, t.pauseControlsTitle);
		instructionsStack.addControl(controlsTitle);

		const movementHeader = createTextBlock("movementHeader", PAUSE_MENU_STYLES.instructionSectionHeader, t.pauseMovementTitle);
		instructionsStack.addControl(movementHeader);

		const movementText = this.getMovementText(config);
		const movementDetails = createTextBlock("movementDetails", PAUSE_MENU_STYLES.instructionDetails, movementText);
		instructionsStack.addControl(movementDetails);

		const powerupsHeader = createTextBlock("powerupsHeader", PAUSE_MENU_STYLES.instructionSectionHeader, t.pausePowerupsTitle);
		instructionsStack.addControl(powerupsHeader);

		const powerupsText = this.getPowerupsText(config);
		const powerupsDetails = createTextBlock("powerupsDetails", PAUSE_MENU_STYLES.instructionDetails, powerupsText);
		instructionsStack.addControl(powerupsDetails);

		const objectiveHeader = createTextBlock("objectiveHeader", PAUSE_MENU_STYLES.instructionSectionHeader, t.pauseObjectiveTitle);
		instructionsStack.addControl(objectiveHeader);

		const points = GAME_CONFIG.scoreToWin;
		const objectiveText = t.pauseObjectiveText.replace('{points}', points.toString());
		const objectiveDetails = createTextBlock("objectiveDetails", PAUSE_MENU_STYLES.instructionDetails, objectiveText);
		instructionsStack.addControl(objectiveDetails);
	}

	private getMovementText(config: GameConfig): string {
		const t = getCurrentTranslation();
		
		if (config.isLocalMultiplayer) {
			if (config.viewMode === ViewMode.MODE_2D) {
				return `${t.pauseMovementP1_2D}\n${t.pauseMovementP2_2D}`;
			} else {
				return `${t.pauseMovementP1_3D}\n${t.pauseMovementP2_3D}`;
			}
		} else {
			if (config.viewMode === ViewMode.MODE_2D) {
				return t.pauseMovementSolo_2D;
			} else {
				return t.pauseMovementSolo_3D;
			}
		}
	}

	private getPowerupsText(config: GameConfig): string {
		const t = getCurrentTranslation();
		
		if (config.isLocalMultiplayer) {
			return `${t.pausePowerupsMulti_P1}\n${t.pausePowerupsMulti_P2}`;
		} else {
			return t.pausePowerupsSolo;
		}
	}

	show(show: boolean, isSpectator: boolean = false): void {
		if (show) {
			if (isSpectator) {
				if (!this.spectatorPauseBox.isVisible) {
					this.spectatorPauseBox.isVisible = true;
					this.spectatorPauseBox.alpha = 0;
					this.animationManager.fade(this.spectatorPauseBox, 'in', Motion.F.base);
				}
			} else {
				if(!this.overlay.isVisible) {
					this.overlay.isVisible = true;
					this.overlay.alpha = 0;
					this.overlay.thickness = 0;

					this.animationManager.fade(this.overlay, "in", Motion.F.base, true);
				}
			}
		} else {
			if (this.spectatorPauseBox.isVisible) {
				this.animationManager.fade(this.spectatorPauseBox, 'out', Motion.F.fast).then(() => {
					this.spectatorPauseBox.isVisible = false;
					this.spectatorPauseBox.alpha = 0;
				});
			}
			
			if (this.overlay.isVisible) {
				this.animationManager.fade(this.overlay, "out", Motion.F.base, true).then(() => {
					this.overlay.isVisible = false;
					this.overlay.alpha = 0;
					this.overlay.thickness = 0;
				});
			}
		}
	}

	dispose(): void {
		this.checkboxMusic?.onIsCheckedChangedObservable.clear();
		this.checkboxEffects?.onIsCheckedChangedObservable.clear();
	}
}