import { AdvancedDynamicTexture, Control, Rectangle, TextBlock, Grid, Image, ScrollViewer, StackPanel, MultiLine} from "@babylonjs/gui";
import { Scene, KeyboardEventTypes} from "@babylonjs/core";
import { Logger } from '../utils/LogManager.js';
import { GameConfig } from './GameConfig.js';
import { GameMode, ViewMode, PowerupType, PowerUpAction } from '../shared/constants.js';
import { getCurrentTranslation } from '../translations/translations.js';
import { spawnFireworksInFrontOfCameras, FINAL_FIREWORKS, spawnGUISparkles } from './scene/fireworks.js';
import { AnimationManager, Motion } from "./AnimationManager.js";
import { AudioManager } from "./AudioManager.js";
import { HUD_STYLES, POWER_UP_STYLES, PAUSE_MENU_STYLES, COUNTDOWN_STYLES, LOBBY_STYLES,
	VIEW_MODE_STYLES, PARTIAL_END_GAME_STYLES, END_GAME_STYLES, BRACKET_STYLES, COLORS } from "./GuiStyle.js";

/**
 * Manages all GUI elements for the game
 */
export class GUIManager {
	private readonly H_CENTER = Control.HORIZONTAL_ALIGNMENT_CENTER;
	private readonly H_LEFT = Control.HORIZONTAL_ALIGNMENT_LEFT;
	private readonly H_RIGHT = Control.HORIZONTAL_ALIGNMENT_RIGHT;

	private advancedTexture: AdvancedDynamicTexture | null = null;
	private isInitialized: boolean = false;
	private hudGrid!: Grid;
	private fpsText!: TextBlock;
	private score1Text!: TextBlock;
	private score2Text!: TextBlock;
	private player1Label!: TextBlock;
	private player2Label!: TextBlock;
	private rallyText!: TextBlock;
	private rally!: TextBlock;
	private previousRally: number = 1;
	private countdownText!: TextBlock;
	private countdownContainer!: Rectangle;
	private endGameOverlay!: Grid;
	private endGameWinnerText!: TextBlock;
	private partialEndGameOverlay!: Rectangle;
	private partialWinnerLabel!: TextBlock;
	private partialWinnerName!: TextBlock;
	private continueText!: TextBlock;

	private pauseOverlay!: Rectangle;
	private pauseGrid!: Grid;
	private pauseTitle!: TextBlock;
	private pauseInstruction!: TextBlock;
	private pauseHint!: TextBlock;
	private muteIcon?: Image;
	private toggleMuteCallback?: () => boolean;

	private lobbyOverlay?: Rectangle;
	private lobbyListPanel?: StackPanel;
	private lobbyCountText?: TextBlock;
	private lobbyDotsTimer?: number;
	private lobbySubtitle?: TextBlock;

	private isTournament: boolean = false;
	private isBrackerGridCreated: boolean = false;
	private playerTotal: number = 0;
	private bracketOverlay?: Rectangle;
	private bracketScroll?: ScrollViewer;
	private bracketGrid?: Grid;

	private powerUpSlotP1?: Rectangle;
	private powerUpSlotP2?: Rectangle;
	private powerUpCellsP1: Array<{root: Rectangle; icon?: Image; letter?: TextBlock}> = [];
	private powerUpCellsP2: Array<{root: Rectangle; icon?: Image; letter?: TextBlock}> = [];

	private POWERUP_ICON: Record<number, string> = {
		[PowerupType.SLOW_OPPONENT]:	   "assets/icons/powerup/slow.png",
		[PowerupType.SHRINK_OPPONENT]:	 "assets/icons/powerup/smaller.png",
		[PowerupType.INCREASE_PADDLE_SPEED]:"assets/icons/powerup/fast.png",
		[PowerupType.GROW_PADDLE]:		 "assets/icons/powerup/larger.png",
	};

	constructor(private scene: Scene, config: GameConfig, private animationManager: AnimationManager, audioManager: AudioManager) {
		try {
			this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this.scene);
			this.advancedTexture!.layer!.layerMask = 0x20000000;
			this.isTournament = config.isTournament;

			this.createHUD(config);
			this.createLobbyOverlay();
			this.createPowerUpSlots();
			this.createPauseOverlay();
			this.createBracketOverlay();
			this.createViewModeDivider(config);
			this.createCountdownOverlay();
			this.createPartialEndGameOverlay();
			this.createEndGameOverlay();
			this.setToggleMuteCallback(() => audioManager.toggleMute());

			this.isInitialized = true;
		} catch (error) {
			Logger.error('Error creating GUI', 'GUIManager', error);
			throw error;
		}
	}

	private createHUD(config: GameConfig): void {
	this.hudGrid = this.createGrid("hudGrid", HUD_STYLES.hudGrid);
	this.advancedTexture!.addControl(this.hudGrid);

	this.hudGrid.addColumnDefinition(HUD_STYLES.gridColumns.fps, false);
	this.hudGrid.addColumnDefinition(HUD_STYLES.gridColumns.p1Controls, false);
	this.hudGrid.addColumnDefinition(HUD_STYLES.gridColumns.p1Score, false);
	this.hudGrid.addColumnDefinition(HUD_STYLES.gridColumns.p2Score, false);
	this.hudGrid.addColumnDefinition(HUD_STYLES.gridColumns.p2Controls, false);
	this.hudGrid.addColumnDefinition(HUD_STYLES.gridColumns.rally, false);

	this.fpsText =  this.createTextBlock("fpsText", HUD_STYLES.fpsText, "FPS: 0");
	this.hudGrid.addControl(this.fpsText, 0, 0);

	const p1Controls =  this.createTextBlock("PlayerControls_p1", HUD_STYLES.playerControlsP1, this.getControlsText(config.viewMode, 1));
	this.hudGrid.addControl(p1Controls, 0, 1);

	const p1Cell = new Grid();
	p1Cell.addRowDefinition(1, false);
	p1Cell.addRowDefinition(1, false);
	p1Cell.addColumnDefinition(1, false);

	this.player1Label = this.createTextBlock("player1Label", HUD_STYLES.player1Label, "Player 1");
	this.score1Text =  this.createTextBlock("score1Text", HUD_STYLES.score1Text, "0");
	
	p1Cell.addControl(this.player1Label, 0, 0);
	p1Cell.addControl(this.score1Text, 1, 0);
	this.hudGrid.addControl(p1Cell, 0, 2);

	const p2Cell = new Grid();
	p2Cell.addRowDefinition(1, false);
	p2Cell.addRowDefinition(1, false);
	p2Cell.addColumnDefinition(1, false);

	this.player2Label =  this.createTextBlock("player2Label", HUD_STYLES.player2Label, "Player 2");
	this.score2Text =  this.createTextBlock("score2Text", HUD_STYLES.score2Text, "0");
	
	p2Cell.addControl(this.player2Label, 0, 0);
	p2Cell.addControl(this.score2Text, 1, 0);
	this.hudGrid.addControl(p2Cell, 0, 3);

	const p2Controls =  this.createTextBlock("PlayerControls_p2", HUD_STYLES.playerControlsP2, this.getControlsText(config.viewMode, 2));
	this.hudGrid.addControl(p2Controls, 0, 4);

	const rallyCell = new Grid();
	rallyCell.addRowDefinition(1, false);
	rallyCell.addRowDefinition(1, false);
	rallyCell.addColumnDefinition(1, false);

	this.rallyText =  this.createTextBlock("rallyText", HUD_STYLES.rallyText, "Rally");
	this.rally =  this.createTextBlock("rallyValue", HUD_STYLES.rallyValue, "0");
	
	rallyCell.addControl(this.rallyText, 0, 0);
	rallyCell.addControl(this.rally, 1, 0);
	this.hudGrid.addControl(rallyCell, 0, 5);

	this.rally.transformCenterX = 0.5;
	this.rally.transformCenterY = 0.5;
	}

	private createLobbyOverlay(): void {
		if (!this.advancedTexture) return;

		const t = getCurrentTranslation();
		this.lobbyOverlay = this.createRect("lobbyOverlay", LOBBY_STYLES.overlay);
		this.advancedTexture.addControl(this.lobbyOverlay);
		
		
		const mainGrid = new Grid("lobbyMainGrid");
		mainGrid.addRowDefinition(0.15, false); // Title row
		mainGrid.addRowDefinition(0.15, false);  // Subtitle row
		mainGrid.addRowDefinition(0.1, false); // Count row
		mainGrid.addRowDefinition(0.6, false);  // Scroll row
		mainGrid.width = "100%";
		mainGrid.height = "100%";
		this.lobbyOverlay.addControl(mainGrid);

		const title = this.createTextBlock("lobbyTitle", LOBBY_STYLES.title, t.tournamentOnline);
		mainGrid.addControl(title, 0, 0);

		const subtitle = this.createTextBlock("lobbySubtitle", LOBBY_STYLES.subtitle, t.waiting);
		mainGrid.addControl(subtitle, 1, 0);
		this.lobbySubtitle = subtitle;

		this.lobbyCountText = this.createTextBlock("lobbyCount", LOBBY_STYLES.count, "");
		mainGrid.addControl(this.lobbyCountText, 2, 0);

		this.lobbyListPanel = this.createStackPanel("lobbyList", LOBBY_STYLES.lobbyList);
		mainGrid.addControl(this.lobbyListPanel, 3, 0);
	}

	private createPowerUpSlots(): void {
		if (!this.advancedTexture) return;

		this.powerUpSlotP1 = this.createRect("powerUpSlotP1", POWER_UP_STYLES.powerUpSlot);
		this.powerUpSlotP1.horizontalAlignment = this.H_LEFT;
		this.advancedTexture.addControl(this.powerUpSlotP1);

		for (let i = 0; i < 3; i++) {
			const cell = this.createPowerUpCell(i, 0); // Player 1
			this.powerUpCellsP1.push(cell);
			this.powerUpSlotP1!.addControl(cell.root);
		}

		this.powerUpSlotP2 = this.createRect("powerUpSlotP2", POWER_UP_STYLES.powerUpSlot);
		this.powerUpSlotP2.horizontalAlignment = this.H_RIGHT;
		this.advancedTexture.addControl(this.powerUpSlotP2);

		for (let i = 0; i < 3; i++) {
			const cell = this.createPowerUpCell(i, 1); // Player 2
			this.powerUpCellsP2.push(cell);
			this.powerUpSlotP2!.addControl(cell.root);
		}
	}

	private createPowerUpCell(index: number, player: number): {root: Rectangle; icon?: Image; letter?: TextBlock} {
	const cell = this.createRect(`powerUpCell_${player}_${index}`, POWER_UP_STYLES.powerUpCell);
	cell.top = `${index * 90}px`;

	const icon = this.createImage(`powerUpIcon_${player}_${index}`, POWER_UP_STYLES.powerUpIcon, "");

	const letterKeys = player === 0 ? ['C', 'V', 'B'] : ['I', 'O', 'P'];
	const letter = this.createTextBlock( `powerUpLetter_${player}_${index}`, POWER_UP_STYLES.powerUpLetter, letterKeys[index]);

	// Position the letter correctly
	if (player === 0) {
			icon.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
			letter.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
			letter.left = "80px";
		} else {
			letter.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
			letter.left = "5px";
			icon.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
		}

	cell.addControl(icon);
	cell.addControl(letter);

	return {
		root: cell,
		icon: icon,
		letter: letter,
	};
}

	private createPauseOverlay(): void {
		if (!this.advancedTexture) return;

		const t = getCurrentTranslation();

		this.pauseOverlay = this.createRect("pauseOverlay", PAUSE_MENU_STYLES.pauseOverlay);
		this.advancedTexture.addControl(this.pauseOverlay);

		this.pauseGrid = this.createGrid("pauseGrid", PAUSE_MENU_STYLES.pauseGrid);
		this.pauseOverlay.addControl(this.pauseGrid);

		this.pauseGrid.addRowDefinition(PAUSE_MENU_STYLES.gridRows.title, false);
		this.pauseGrid.addRowDefinition(PAUSE_MENU_STYLES.gridRows.instruction, false);
		this.pauseGrid.addRowDefinition(PAUSE_MENU_STYLES.gridRows.hint, false);
		this.pauseGrid.addRowDefinition(PAUSE_MENU_STYLES.gridRows.muteIcon, false);

		this.pauseTitle = this.createTextBlock( "pauseTitle", PAUSE_MENU_STYLES.pauseTitle, t.gamePaused);
		this.pauseGrid.addControl(this.pauseTitle, 0, 0);

		this.pauseInstruction = this.createTextBlock( "pauseInstruction", PAUSE_MENU_STYLES.pauseInstruction, t.exitGame);
		this.pauseGrid.addControl(this.pauseInstruction, 1, 0);

		this.pauseHint = this.createTextBlock( "pauseHint", PAUSE_MENU_STYLES.pauseHint, t.pauseControls);
		this.pauseGrid.addControl(this.pauseHint, 2, 0);

		this.muteIcon = this.createImage( "muteIcon", PAUSE_MENU_STYLES.muteIcon, "assets/icons/sound_on.png");
		this.muteIcon.onPointerClickObservable.add(() => {
			this.animateMuteIcon();
			if (this.toggleMuteCallback) {
				const isMuted = this.toggleMuteCallback();
				if (this.muteIcon)
					this.muteIcon.source = isMuted ? "assets/icons/sound_off.png" : "assets/icons/sound_on.png";
			}
		});
		this.pauseGrid.addControl(this.muteIcon, 3, 0);
	}

	private createBracketOverlay(): void {
		if (!this.advancedTexture) return;

		const t = getCurrentTranslation();

		this.bracketOverlay = this.createRect("bracketOverlay", BRACKET_STYLES.bracketOverlay);
		this.bracketOverlay.paddingRight = `${this.bracketOverlay.thickness + 8}px`;
		this.advancedTexture.addControl(this.bracketOverlay);

		const container = this.createGrid("bracketContainer", BRACKET_STYLES.bracketContainer);
		container.addRowDefinition(BRACKET_STYLES.containerRows.header, false);
		container.addRowDefinition(BRACKET_STYLES.containerRows.content, false);
		container.addColumnDefinition(1, false);
		this.bracketOverlay.addControl(container);

		const headerGrid = this.createGrid("headerGrid", BRACKET_STYLES.headerGrid);
		headerGrid.addColumnDefinition(BRACKET_STYLES.gridColumns.icon, true);
		headerGrid.addColumnDefinition(BRACKET_STYLES.gridColumns.title, false);

		const bracketIcon = this.createImage("bracketIcon", BRACKET_STYLES.bracketIcon, "assets/icons/tournament.png");
		headerGrid.addControl(bracketIcon, 0, 0);

		const bracketTitle = this.createTextBlock("bracketTitle", BRACKET_STYLES.bracketTitle, t.tournamentTitle);
		headerGrid.addControl(bracketTitle, 0, 1);

		container.addControl(headerGrid, 0, 0);

		this.bracketScroll = new ScrollViewer("bracketScroll");
		this.applyStyles(this.bracketScroll, BRACKET_STYLES.bracketScroll);
		this.bracketScroll.verticalBar.isVisible = false;
		this.bracketScroll.horizontalBar.isVisible = true;
		container.addControl(this.bracketScroll, 1, 0);

		const contentWrap = this.createStackPanel("bracketContentWrap", BRACKET_STYLES.contentWrap);
		this.bracketScroll.addControl(contentWrap);

		this.bracketGrid = this.createGrid("bracketGrid", BRACKET_STYLES.bracketGrid);
		this.bracketGrid.addRowDefinition(1, false);
		contentWrap.addControl(this.bracketGrid);
	}

	private createViewModeDivider(config: GameConfig): void {
		if (config.viewMode === ViewMode.MODE_3D && 
			(config.gameMode === GameMode.TWO_PLAYER_LOCAL || config.gameMode === GameMode.TOURNAMENT_LOCAL)) {
			const dividerLine = this.createRect("divider", VIEW_MODE_STYLES.dividerLine);
			this.advancedTexture!.addControl(dividerLine);
		}
	}

	private createCountdownOverlay(): void {
		this.countdownContainer = this.createRect("countdownContainer", COUNTDOWN_STYLES.countdownContainer);

		this.countdownText = this.createTextBlock("5", COUNTDOWN_STYLES.countdownText, "5");

		this.countdownContainer.addControl(this.countdownText);
		this.advancedTexture!.addControl(this.countdownContainer);
	}

	private createPartialEndGameOverlay(): void {
		const t = getCurrentTranslation();

		this.partialEndGameOverlay = this.createRect("partialWinnerLayer", PARTIAL_END_GAME_STYLES.partialEndGameOverlay);
		this.advancedTexture!.addControl(this.partialEndGameOverlay);

		const centerColumn = this.createGrid("winnerGrid", PARTIAL_END_GAME_STYLES.winnerGrid);
		this.partialEndGameOverlay.addControl(centerColumn);

		centerColumn.addRowDefinition(PARTIAL_END_GAME_STYLES.gridRows.label);
		centerColumn.addRowDefinition(PARTIAL_END_GAME_STYLES.gridRows.name);
		centerColumn.addRowDefinition(PARTIAL_END_GAME_STYLES.gridRows.continue);

		this.partialWinnerLabel = this.createTextBlock( "winnerLabel", PARTIAL_END_GAME_STYLES.partialWinnerLabel, t.winner);
		centerColumn.addControl(this.partialWinnerLabel, 0, 0);

		this.partialWinnerName = this.createTextBlock( "winnerName", PARTIAL_END_GAME_STYLES.partialWinnerName, "");
		centerColumn.addControl(this.partialWinnerName, 1, 0);

		this.continueText = this.createTextBlock( "continue_text", PARTIAL_END_GAME_STYLES.continueText, t.continue );
		centerColumn.addControl(this.continueText, 2, 0);
	}

	private createEndGameOverlay(): void {
		// Create end game overlay with styles
		this.endGameOverlay = this.createGrid("endGameOverlay", END_GAME_STYLES.endGameOverlay);
		this.endGameOverlay.addColumnDefinition(1.0);

		// Create winner text with styles
		this.endGameWinnerText = this.createTextBlock( "endGameWinnerText", END_GAME_STYLES.endGameWinnerText, "");
		this.endGameOverlay.addControl(this.endGameWinnerText, 0, 0);
		this.advancedTexture!.addControl(this.endGameOverlay);
	}

	//Helper functions to create Gui objects
	private applyStyles(control: any, styles: any): void {
		Object.entries(styles).forEach(([key, value]) => {
			if (value !== undefined && key in control) {
				(control as any)[key] = value;
			}
		});
	}

	private createRect(name: string, styles: any): Rectangle {
		const rect = new Rectangle(name);
		this.applyStyles(rect, styles);
		return rect;
	}

	private  createTextBlock(name: string, styles: any, text?: string): TextBlock {
		const textBlock = new TextBlock(name, text);
		this.applyStyles(textBlock, styles);
		return textBlock;
	}

	private createGrid(name: string, styles: any): Grid {
		const grid = new Grid(name);
		this.applyStyles(grid, styles);
		return grid;
	}

	private createImage(name: string, styles: any, source?: string): Image {
		const image = new Image(name, source);
		this.applyStyles(image, styles);
		return image;
	}

	private createStackPanel(name: string, styles: any): StackPanel {
		const stackPanel = new StackPanel(name);
		this.applyStyles(stackPanel, styles);
		return stackPanel;
	}

	// SETTER

	setPauseVisible(visible: boolean): void {
		if (!this.isReady || !this.animationManager) return;

		if (visible) {
			this.pauseOverlay.isVisible = true;
			this.pauseOverlay.alpha = 0;
			this.pauseOverlay.thickness = 0;

			const frames = Motion.F.base;
			this.pauseOverlay.animations = [
			this.animationManager.createFloat("alpha", 0, 1, frames, false, Motion.ease.quadOut()),
			this.animationManager.createFloat("thickness", 0, 4, frames, false, Motion.ease.quadOut()),
			];
			this.animationManager.play(this.pauseOverlay, frames, false);
			this.showBracketOverlay(true);
		} else {
			const frames = Motion.F.fast;
			this.pauseOverlay.animations = [
			this.animationManager.createFloat("alpha", 1, 0, frames, false, Motion.ease.quadOut()),
			this.animationManager.createFloat("thickness", 4, 0, frames, false, Motion.ease.quadOut()),
			];
			this.showBracketOverlay(false);
			this.animationManager.play(this.pauseOverlay, frames, false).then(() => {
			this.pauseOverlay.isVisible = false;
			this.pauseOverlay.alpha = 0;
			this.pauseOverlay.thickness = 0;
			});
		}
	}
	showCountdown(show: boolean, count?: number): void {
		if (!this.isReady) return;
		this.countdownContainer.isVisible = show;

		if (show && count !== undefined) {
			this.countdownText.text = count.toString();
			this.animationManager?.pulse(this.countdownText, Motion.F.xSlow);
			return;
		}
		this.countdownText.animations = [];
	}

	updateFPS(fps: number): void {
		if (!this.isReady) return;
		this.fpsText.text = `FPS: ${Math.round(fps)}`;
	}

	updateRally(rally: number): boolean {
		if (!this.isReady) return false;
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
				this.animationManager?.pop(this.rally, Motion.F.base, 1.4);
			this.previousRally = rally;
			return true;
		}
		this.previousRally = rally;
		return false;
	}

	updateScores(leftScore: number, rightScore: number): void {
		if (!this.isReady) return;
		const oldLeft = parseInt(this.score1Text.text);
		const oldRight = parseInt(this.score2Text.text);

		this.score1Text.text = leftScore.toString();
		this.score2Text.text = rightScore.toString();

		if (leftScore > oldLeft)
			this.animationManager?.pop(this.score1Text, Motion.F.fast, 0.9);
		else if (rightScore > oldRight)
			this.animationManager?.pop(this.score2Text, Motion.F.fast, 0.9);
	}

	updatePlayerNames(player1Name: string, player2Name: string): void {
		if (!this.isReady) return;
		this.player1Label.text = player1Name;
		this.player2Label.text = player2Name;
		this.hudGrid.isVisible = true;
	}

	async showWinner(winner: string): Promise<void> {
		if (!this.isReady) return;
		this.hudGrid.isVisible = false;
		this.endGameWinnerText.text = `🏆 ${winner} WINS! 🏆`;
		this.endGameWinnerText.color = "rgba(255, 255, 255, 1)";
		this.endGameOverlay.isVisible = true;
		this.animationManager?.pop(this.endGameWinnerText, Motion.F.fast, 0.9);
		const scene = this.scene;
		const cams = scene.activeCameras?.length ? scene.activeCameras : scene.activeCamera;
		spawnFireworksInFrontOfCameras(scene, FINAL_FIREWORKS, cams);
		await new Promise(resolve => setTimeout(resolve, 5000));

		this.hudGrid.isVisible = true;
		this.endGameOverlay.isVisible = false;
	}

	async animateBackground(show: boolean): Promise<void> {
		if (!this.isReady) return;
		if (show) {
			this.partialEndGameOverlay.isVisible = true;
			this.hudGrid.isVisible = false;
			await this.animationManager?.fadeIn(this.partialEndGameOverlay, Motion.F.slow);
		} else {
			await this.animationManager?.fadeOut(this.partialEndGameOverlay, Motion.F.fast);
			this.partialEndGameOverlay.isVisible = false;
			this.hudGrid.isVisible = true;
		}
	}

	async showPartialWinner(winner: string): Promise<void> {
		if (!this.isReady || !this.advancedTexture) return;

		this.partialWinnerName.text = winner;
		this.partialEndGameOverlay.isVisible = true;
		this.partialWinnerLabel.isVisible = true;
		this.partialWinnerName.isVisible = true;
		if (this.powerUpSlotP1) this.powerUpSlotP1.isVisible = false;
		if (this.powerUpSlotP2) this.powerUpSlotP2.isVisible = false;
		
		this.partialEndGameOverlay.isPointerBlocker = true;

		spawnGUISparkles(this.advancedTexture, this.animationManager);

		await this.animationManager?.slideInY(this.partialWinnerLabel, -200, Motion.F.base);
		await new Promise(r => setTimeout(r, 60));
		await this.animationManager?.slideInY(this.partialWinnerName, 50, Motion.F.slow);
		this.animationManager?.breathe(this.partialWinnerName, Motion.F.breath);

		await new Promise(r => setTimeout(r, 180));
	}

	async waitForSpaceToContinue(ms: number): Promise<void> {
		if (!this.isReady || !this.advancedTexture) return;
		const scene = this.scene;
		await new Promise<void>(res => setTimeout(res, ms));
		this.continueText.isVisible = true;
		this.animationManager?.twinkle(this.continueText, Motion.F.slow);

		return new Promise<void>((resolve) => {
			const sub = scene.onKeyboardObservable.add((kbInfo: any) => {
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

	async hidePartialWinner(): Promise<void> {
		if (!this.isReady) return;
		await Promise.all([
			this.animationManager?.slideOutY(this.partialWinnerLabel, -50, Motion.F.fast),
			this.animationManager?.slideOutY(this.partialWinnerName, 50, Motion.F.fast)
		]);

		this.partialEndGameOverlay.isPointerBlocker = false;
		this.partialEndGameOverlay.isVisible = false;
		if (this.powerUpSlotP1) this.powerUpSlotP1.isVisible = true;
		if (this.powerUpSlotP2) this.powerUpSlotP2.isVisible = true;
	}

	private async animateMuteIcon(): Promise<void> {
		if (!this.isReady || !this.muteIcon) return;
		await this.animationManager?.pop(this.muteIcon, Motion.F.xFast, 0.9);
	}

	showLobby(players: string[]): void {
		if (!this.advancedTexture) return;
		const t = getCurrentTranslation();
		if (this.lobbyOverlay && this.lobbyOverlay.isVisible === false) {
			this.lobbyOverlay!.isVisible = true;
			this.animationManager?.fadeIn(this.lobbyOverlay!);
		}

		if (!this.lobbySubtitle) return;
  			this.startLobbyDots();

		if (!this.lobbyListPanel || !this.lobbyCountText) return;
		const children = [...this.lobbyListPanel.children];
		children.forEach(c => this.lobbyListPanel!.removeControl(c));

		for (let i = 0; i < players.length; i += 2) {
			const rowContainer = new Grid();
			rowContainer.addColumnDefinition(0.5, false);
			rowContainer.addColumnDefinition(0.5, false);
			rowContainer.width = "100%";
			rowContainer.height = "34px";
			
			const leftRow = this.createRect(`lobbyRow_${i}`, LOBBY_STYLES.rowRect);
			const leftTb = this.createTextBlock(`lobbyRowText_${i}`, LOBBY_STYLES.rowText, players[i]);
			leftRow.addControl(leftTb);
			rowContainer.addControl(leftRow, 0, 0);
			setTimeout(() => this.animationManager.fadeIn(leftTb), (i * 120));

			if (players[i + 1] !== undefined) {
				const rightRow = this.createRect(`lobbyRow_${i+1}`, LOBBY_STYLES.rowRect);
				const rightTb = this.createTextBlock(`lobbyRowText_${i+1}`, LOBBY_STYLES.rowText, players[i + 1]);
				rightTb.textHorizontalAlignment = this.H_LEFT;
				rightRow.addControl(rightTb);
				rowContainer.addControl(rightRow, 0, 1);
				setTimeout(() => this.animationManager.fadeIn(rightTb), ((i + 1) * 120));
			}
			
			this.lobbyListPanel!.addControl(rowContainer);
		}
		this.lobbyCountText.text = `${t.countPlayer}: ${players.length}`;
	}

	private startLobbyDots(): void {
		if (!this.lobbySubtitle) return;
		this.stopLobbyDots();
		const base = this.lobbySubtitle.text?.replace(/\.*$/, "") || ""; // strip trailing dots once
		let step = 0;
		this.lobbyDotsTimer = window.setInterval(() => {
			step = (step + 1) % 4; // 0..3
			this.lobbySubtitle!.text = base + ".".repeat(step);
		}, 500);
		}

	private stopLobbyDots(): void {
		if (this.lobbyDotsTimer) {
			clearInterval(this.lobbyDotsTimer);
			this.lobbyDotsTimer = undefined;
		}
	}

	hideLobby(): void {
		if (!this.lobbyOverlay) return;
		this.animationManager?.fadeOut(this.lobbyOverlay!);
		this.lobbyOverlay!.isVisible = false;
		this.stopLobbyDots();
	}

	updateControlVisibility(player1: boolean, player2: boolean): void {
		if (!this.isReady) return;
		const p1 = this.advancedTexture?.getControlByName("PlayerControls_p1") as TextBlock | null;
		const p2 = this.advancedTexture?.getControlByName("PlayerControls_p2") as TextBlock | null;

		if (p1) p1.color = player1 ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0)";
		if (p2) p2.color = player2 ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0)";
		if (player1 && this.powerUpSlotP1) this.powerUpSlotP1.isVisible = true;
		if (player2 && this.powerUpSlotP2) this.powerUpSlotP2.isVisible = true;
	}
	private getControlsText(viewMode: ViewMode, player: number): string {
		const t = getCurrentTranslation();
		const move = t.controls;
		
		if (viewMode === ViewMode.MODE_2D)
			return player === 1 ? move + "\nP1: W / S" : move + "\nP2: ↑ / ↓";
		else
			return player === 1 ? move + "\nP1: A / D" : move + "\nP2: ← / →";
	}

	// Callbacks
	setToggleMuteCallback(callback: () => boolean): void {
		if (!this.isReady) return;
		this.toggleMuteCallback = callback;
	}

	// Check if gui is initialised
	isReady(): boolean {
		return this.isInitialized;
	}

	// Clean up all GUI resources
	dispose(): void {
		if (!this.isReady()) return;
		
		try {
			this.fpsText.dispose();
			this.score1Text.dispose();
			this.score2Text.dispose();
			this.countdownText.dispose();
			this.countdownContainer.dispose();
			this.player1Label.dispose();
			this.player2Label.dispose();
			this.rallyText.dispose();
			this.rally.dispose();
			this.endGameWinnerText.dispose();
			this.endGameOverlay.dispose();
			this.hudGrid.dispose();
			this.partialEndGameOverlay.dispose();
			this.partialWinnerLabel.dispose();
			this.partialWinnerName.dispose();
			this.continueText.dispose();
			this.muteIcon?.dispose()
			this.pauseHint.dispose();
			this.pauseInstruction.dispose();
			this.pauseTitle.dispose();
			this.pauseGrid.dispose();
			this.pauseOverlay.dispose();

			this.bracketOverlay?.dispose();
			this.bracketScroll?.dispose();
			this.bracketGrid?.dispose();

			this.powerUpSlotP1?.dispose();
			this.powerUpSlotP2?.dispose();
			this.powerUpCellsP1.forEach(cell => {
				cell.root.dispose();
				cell.icon?.dispose();
				cell.letter?.dispose();
			});
			this.powerUpCellsP2.forEach(cell => {
				cell.root.dispose();
				cell.icon?.dispose();
				cell.letter?.dispose();
			});
			this.powerUpCellsP1 = [];
			this.powerUpCellsP2 = [];

			this.advancedTexture?.dispose();
			this.advancedTexture = null;

			this.isInitialized = false;
			Logger.debug('Class disposed', 'GUIManager');
		} catch (error) {
			Logger.error('Error disposing GUI', 'GUIManager', error);
		}
	}

	updateMatch(winner: string, round_index: number, match_index: number): void {
		if (!this.advancedTexture) return;
		if (!this.bracketGrid) return;

		const leftSlot = match_index * 2;
		const rightSlot = match_index * 2 + 1;

		const leftId = `bracketCell_${round_index}_${leftSlot}`;
		const rightId = `bracketCell_${round_index}_${rightSlot}`;
		const nextId = `bracketCell_${round_index + 1}_${match_index}`;

		const leftTb = this.advancedTexture.getControlByName(leftId) as TextBlock;
		const rightTb = this.advancedTexture.getControlByName(rightId) as TextBlock;
		const leftRect = this.advancedTexture.getControlByName(`${leftId}_rect`) as Rectangle;
		const rightRect = this.advancedTexture.getControlByName(`${rightId}_rect`) as Rectangle;
		const nextTb   = this.advancedTexture.getControlByName(nextId) as TextBlock;

		if (!leftTb || !rightTb || !leftRect || !rightRect) return;

		const isLeftWinner  = leftTb.text  === winner;
		const isRightWinner = rightTb.text === winner;


		if (isLeftWinner) {
			rightTb.text = "❌ " + rightTb.text;
			this.applyStyles(leftRect, BRACKET_STYLES.winnerCell);
			this.applyStyles(leftTb, BRACKET_STYLES.winnerText);
			this.applyStyles(rightRect, BRACKET_STYLES.loserCell);
			this.applyStyles(rightTb, BRACKET_STYLES.loserText);
			
		} else if (isRightWinner) {
			leftTb.text = "❌ " + leftTb.text;
			this.applyStyles(rightRect, BRACKET_STYLES.winnerCell);
			this.applyStyles(rightTb, BRACKET_STYLES.winnerText);
			this.applyStyles(leftRect, BRACKET_STYLES.loserCell);
			this.applyStyles(leftTb, BRACKET_STYLES.loserText);
		}
		if (nextTb)
			nextTb.text = winner;
	}

	insertMatch(
		roundIndex: number,
		matchIndex: number,
		left: string | null,
		right: string | null,
		matchTotal?: number
	): void {
		if (!this.bracketGrid) return;
		if (!this.isBrackerGridCreated && matchTotal !== undefined)
			this.initializeGriBracket(matchTotal);

		const colPanel = this.bracketGrid.getChildByName(`bracketCol_${roundIndex - 1}`) as StackPanel;
		if (!colPanel) return;

		const leftSlot = matchIndex * 2;
		const rightSlot = matchIndex * 2 + 1;

		const leftId  = `bracketCell_${roundIndex}_${leftSlot}`;
		const rightId = `bracketCell_${roundIndex}_${rightSlot}`;

		const leftTb  = this.advancedTexture?.getControlByName(leftId)  as TextBlock;
		const rightTb = this.advancedTexture?.getControlByName(rightId) as TextBlock;

		if (left !== null && leftTb !== null)
			leftTb.text = left;
		if (right !== null && rightTb !== null)
			rightTb.text = right;
	}

	private initializeGriBracket(matchTotal: number): void {
		this.playerTotal = matchTotal * 2;
		const rounds = Math.ceil(Math.log2(this.playerTotal));
		const totalColumns = rounds + 1;

		for (let col = 0; col < totalColumns; col++) {
			this.bracketGrid?.addColumnDefinition(220, true);

			const colPanel = this.createStackPanel(`bracketCol_${col}`, BRACKET_STYLES.bracketColPanel);
			this.bracketGrid?.addControl(colPanel, 1, col);

			const slots = this.playerTotal / Math.pow(2, col);
			for (let i = 0; i < slots; i++) {
				const cellName = `bracketCell_${col + 1}_${i}`;
				const cellHeight = 50 * Math.pow(2, col);
				const cellRect = this.createRect(`${cellName}_rect`, BRACKET_STYLES.bracketCellRect);
				cellRect.height = `${cellHeight}px`;
				colPanel.addControl(cellRect);
				const tb = this.createTextBlock( cellName, BRACKET_STYLES.bracketCellText, "");
				tb.fontSize = col === rounds ? 48 : 16;
				tb.text = col === rounds ? "🏆" : "tbd";
				cellRect.addControl(tb);
			}
			this.wireRound(col);
		}
		this.isBrackerGridCreated = true;
	}

	private createAnchorPoint(parentControl: Control, position: 'left' | 'right'): Control {
		const anchor = new Control(`anchor_${parentControl.name}_${position}`);
		anchor.widthInPixels = 1;
		anchor.heightInPixels = 1;
		anchor.isVisible = false;
		anchor.isPointerBlocker = false;
		
		// Position the anchor at the edge of the parent control
		if (position === 'right') {
			anchor.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
		} else {
			anchor.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
		}
		anchor.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
		
		// Add the anchor to the same parent as the control
		parentControl.parent?.addControl(anchor);
		
		return anchor;
	}

	private addConnector(src: Control, dst: Control, color = "#BBB", width = 2): MultiLine {
		const line = new MultiLine(`conn_${src.name}_${dst.name}`);
		line.lineWidth = width;
		line.color = color;
		line.alpha = 0.9;
		line.isPointerBlocker = false;
		
		const srcRightAnchor = this.createAnchorPoint(src, 'right');
		const dstLeftAnchor = this.createAnchorPoint(dst, 'left');
		
		line.add(srcRightAnchor);
		line.add(dstLeftAnchor);
		
		this.bracketOverlay?.addControl(line);
		line.zIndex = 5;
		return line;
	}
	
	
	private wireRound(roundIndex: number): void {
		const slotsInThisRound = this.playerTotal / Math.pow(2, roundIndex - 1);
		const nextRoundMatches = Math.ceil(slotsInThisRound / 2);

		for (let match = 0; match < nextRoundMatches; match++) {
			const leftIdx  = match * 2;
			const rightIdx = match * 2 + 1;

			const left  = this.advancedTexture?.getControlByName(`bracketCell_${roundIndex}_${leftIdx}`)  as Control | null;
			const right = this.advancedTexture?.getControlByName(`bracketCell_${roundIndex}_${rightIdx}`) as Control | null;
			const next  = this.advancedTexture?.getControlByName(`bracketCell_${roundIndex + 1}_${match}`) as Control | null;

			if (!left || !right || !next) continue;

			this.addConnector(left,  next);
			this.addConnector(right, next);
		}
	}

	private showBracketOverlay(show: boolean): void {
		if (!this.bracketOverlay || !this.animationManager) return;
		if (show && this.isTournament) {
			this.bracketOverlay.isVisible = true;

			this.bracketOverlay.horizontalAlignment = this.H_RIGHT;
			this.bracketOverlay.paddingRight = "5px"
			this.bracketOverlay.leftInPixels = 400;
			this.pauseGrid.width = "50%";
			this.pauseGrid.horizontalAlignment = this.H_LEFT;

			this.animationManager.slideInX(this.bracketOverlay, 400, Motion.F.base);
		} else {
			this.animationManager.slideOutX(this.bracketOverlay, 400, Motion.F.xFast).then(() => {
			this.bracketOverlay!.isVisible = false;
			this.pauseGrid.width = "100%";
			this.pauseGrid.horizontalAlignment = this.H_CENTER;
		});
		}
	}

	updatePowerUpSlot(player: number, slotIndex: number, powerUpType: PowerupType | null, action: PowerUpAction): void {
		if (!this.isReady) return;
		
		const cells = player === 0 ? this.powerUpCellsP1 : this.powerUpCellsP2;
		
		if (slotIndex >= 0 && slotIndex < cells.length) {
			const cell = cells[slotIndex];
			const direction = player === 0 ? -100 : 100;

			switch (action) {
				case PowerUpAction.CREATED:
					this.scene.stopAnimation(cell.root);
					cell.root.scaleX = 1;
					cell.root.scaleY = 1;
					cell.root.alpha = 0;
					cell.root.color = "rgba(255, 255, 255, 0.5)";
					cell.root.background = "rgba(0, 0, 0, 1)";
					if (powerUpType !== null && this.POWERUP_ICON[powerUpType]) {
						if (!cell.icon) {
							cell.icon = new Image(`powerUpIcon_${player}_${slotIndex}`, this.POWERUP_ICON[powerUpType]);
							cell.icon.stretch = Image.STRETCH_UNIFORM;
							cell.icon.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
							cell.icon.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
							cell.root.addControl(cell.icon);
						} else {
							cell.icon.source = this.POWERUP_ICON[powerUpType];
						}
						cell.icon.alpha = 1;
						cell.icon.isVisible = true;

						const delay = slotIndex * 100;			  
						setTimeout(() => {
							this.animationManager.slideInX(cell.root, direction, Motion.F.slow)
								.then(() => this.animationManager.pop(cell.root, Motion.F.fast, 1.1));
						}, delay);}
					break;
					
				case PowerUpAction.ACTIVATED:
					if (cell.icon) {
						cell.root.color = "rgba(255, 0, 0, 1)";
						this.animationManager?.twinkle(cell.root, Motion.F.fast);
					}
					break;
					
				case PowerUpAction.DEACTIVATED:
					this.scene.stopAnimation(cell.root);
					cell.root.scaleX = 1;
					cell.root.scaleY = 1;
					cell.root.color = "rgba(255, 255, 255, 0.5)";
					cell.root.background = "rgba(255, 255, 255, 0.25)";
					
					if (cell.icon)
						this.animationManager.fadeOut(cell.icon, Motion.F.fast).then(() => {
							cell.icon!.alpha = 0.3;
						});
					break;
			}
		}
	}


}