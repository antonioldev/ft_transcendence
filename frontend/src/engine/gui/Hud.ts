import { AdvancedDynamicTexture, Control, Grid, Image, Rectangle, TextBlock } from "@babylonjs/gui";
import { PowerupState, PowerupType } from '../../shared/constants.js';
import { getCurrentTranslation } from '../../translations/translations.js';
import { GameConfig } from '../GameConfig.js';
import { AnimationManager, Motion } from "../services/AnimationManager.js";
import { PlayerSide } from "../utils.js";
import { HUD_STYLES, POWER_UP_STYLES, SPECTATOR_STYLE, createGrid, createImage, createRect, createStackPanel, createTextBlock } from "./GuiStyle.js";

export class Hud {
	private hudGrid!: Grid;
	private score1Text!: TextBlock;
	private score2Text!: TextBlock;
	private player1Label!: TextBlock;
	private player2Label!: TextBlock;
	private rallyText!: TextBlock;
	private rally!: TextBlock;
	private previousRally: number = 1;
	private spectatorOverlay!: Rectangle;
	private spectatorBanner!: Rectangle;
	private powerUpContainerP1!: Rectangle;
	private powerUpContainerP2!: Rectangle;
	private hdImagesP1: Map<PowerupType, Image> = new Map();
	private hdImagesP2: Map<PowerupType, Image> = new Map();
	private powerUpCellsP1: Array<{root: Rectangle; icon?: Image; letter?: TextBlock}> = [];
	private powerUpCellsP2: Array<{root: Rectangle; icon?: Image; letter?: TextBlock}> = [];
	
	private POWERUP_ICON: Record<number, string> = {
		[PowerupType.SLOW_OPPONENT]: "assets/icons/powerup/slow.png",
		[PowerupType.SHRINK_OPPONENT]: "assets/icons/powerup/smaller.png",
		[PowerupType.INVERT_OPPONENT]: "assets/icons/powerup/invert.png",
		[PowerupType.INCREASE_PADDLE_SPEED]: "assets/icons/powerup/fast.png",
		[PowerupType.GROW_PADDLE]: "assets/icons/powerup/larger.png",
		[PowerupType.FREEZE]: "assets/icons/powerup/stop.png",
		[PowerupType.POWERSHOT]: "assets/icons/powerup/shot.png",
		[PowerupType.RESET_RALLY]: "assets/icons/powerup/rallyReset.png",
		[PowerupType.DOUBLE_POINTS]: "assets/icons/powerup/rallyMultiplier.png",
		[PowerupType.INVISIBLE_BALL]: "assets/icons/powerup/ghost.png",
		[PowerupType.CURVE_BALL]: "assets/icons/powerup/curve.png",
		[PowerupType.TRIPLE_SHOT]: "assets/icons/powerupHD/ballMultiplier.png",
		[PowerupType.SHIELD]: "assets/icons/powerupHD/shield.png"
	};

	private POWERUP_ICON_HD: Record<number, string> = {
		[PowerupType.SLOW_OPPONENT]: "assets/icons/powerupHD/slow.png",
		[PowerupType.SHRINK_OPPONENT]: "assets/icons/powerupHD/smaller.png",
		[PowerupType.INVERT_OPPONENT]: "assets/icons/powerupHD/invert.png",
		[PowerupType.INCREASE_PADDLE_SPEED]: "assets/icons/powerupHD/fast.png",
		[PowerupType.GROW_PADDLE]: "assets/icons/powerupHD/larger.png",
		[PowerupType.FREEZE]: "assets/icons/powerupHD/stop.png",
		[PowerupType.POWERSHOT]: "assets/icons/powerupHD/shot.png",
		[PowerupType.RESET_RALLY]: "assets/icons/powerupHD/rallyReset.png",
		[PowerupType.DOUBLE_POINTS]: "assets/icons/powerupHD/rallyMultiplier.png",
		[PowerupType.INVISIBLE_BALL]: "assets/icons/powerupHD/ghost.png",
		[PowerupType.CURVE_BALL]: "assets/icons/powerupHD/curve.png",
		[PowerupType.TRIPLE_SHOT]: "assets/icons/powerupHD/ballMultiplier.png",
		[PowerupType.SHIELD]: "assets/icons/powerupHD/shield.png"
		
	};

	constructor(private adt: AdvancedDynamicTexture, private animationManager: AnimationManager, config: GameConfig) {
		this.createHud(config);
		this.createSpectatorBanner();
		this.createPowerUpHDImages();
	}

	private createHud(config: GameConfig): void {
		this.hudGrid = createGrid("hudGrid", HUD_STYLES.hudGrid);
		this.adt!.addControl(this.hudGrid);

		// Grid layout: P1 PowerUps | P1 Name+Score | Rally | P2 Name+Score | P2 PowerUps
		this.hudGrid.addColumnDefinition(0.2, false); // P1 PowerUps
		this.hudGrid.addColumnDefinition(0.25, false); // P1 Score
		this.hudGrid.addColumnDefinition(0.1, false); // Rally
		this.hudGrid.addColumnDefinition(0.25, false); // P2 Score
		this.hudGrid.addColumnDefinition(0.2, false); // P2 PowerUps

		// P1 PowerUps
		const p1PowerUpContainer = this.createPowerUpContainer(0, config);
		this.powerUpContainerP1 = p1PowerUpContainer;
		this.hudGrid.addControl(p1PowerUpContainer, 0, 0);

		// P1 Score Cell
		const p1Stack = createStackPanel("player1Stack", HUD_STYLES.stack);

		this.player1Label = createTextBlock("player1Label", HUD_STYLES.playerLabel, "Player 1");
		this.score1Text = createTextBlock("score1Text", HUD_STYLES.scoreText, "0");

		p1Stack.addControl(this.player1Label);
		p1Stack.addControl(this.score1Text);
		this.hudGrid.addControl(p1Stack, 0, 1);

		// Rally Cell
		const rallyStack = createStackPanel("rallyStack", HUD_STYLES.stack);

		this.rally = createTextBlock("rallyValue", HUD_STYLES.rallyValue, "0");
		this.rallyText = createTextBlock("rallyText", HUD_STYLES.rallyText, "Rally");
		
		rallyStack.addControl(this.rally);
		rallyStack.addControl(this.rallyText);
		this.hudGrid.addControl(rallyStack, 0, 2);

		// P2 Score Cell
		const p2Stack = createStackPanel("player2Stack", HUD_STYLES.stack);

		this.player2Label = createTextBlock("player2Label", HUD_STYLES.playerLabel, "Player 2");
		this.score2Text = createTextBlock("score2Text", HUD_STYLES.scoreText, "0");
		
		p2Stack.addControl(this.player2Label);
		p2Stack.addControl(this.score2Text);
		this.hudGrid.addControl(p2Stack, 0, 3);

		// P2 PowerUps
		const p2PowerUpContainer = this.createPowerUpContainer(1, config);
		this.powerUpContainerP2 = p2PowerUpContainer;
		this.hudGrid.addControl(p2PowerUpContainer, 0, 4);
	}

	private createPowerUpContainer(player: PlayerSide, config: GameConfig): Rectangle {
		const container = createRect(`powerUpContainer_${player}`, POWER_UP_STYLES.powerUpSlot);

		const cells = player === 0 ? this.powerUpCellsP1 : this.powerUpCellsP2;

		for (let i = 0; i < 3; i++) {
			const cell = this.createPowerUpCell(i, player, config);
			cells.push(cell);
			container.addControl(cell.root);
		}

		return container;
	}

	private createPowerUpCell(index: number, player: PlayerSide, config: GameConfig): {root: Rectangle; icon?: Image; letter?: TextBlock} {
		const cell = createRect(`powerUpCell_${player}_${index}`, POWER_UP_STYLES.powerUpCell);
		cell.left = `${index * 32}%`;

		let letterKeys = ['1', '2', '3'];
		if (config.isLocalMultiplayer)
			letterKeys = player === 0 ? ['C', 'V', 'B'] : ['I', 'O', 'P'];

		const letter = createTextBlock(`powerUpLetter_${player}_${index}`, POWER_UP_STYLES.powerUpLetter, letterKeys[index]);
		const icon = createImage(`powerUpIcon_${player}_${index}`, POWER_UP_STYLES.powerUpIcon, "");

		cell.addControl(letter);
		cell.addControl(icon);

		return { root: cell, icon: icon, letter: letter };
	}

	private createPowerUpHDImages(): void {
		for (const type in this.POWERUP_ICON_HD) {
			const src = this.POWERUP_ICON_HD[type];
			const typeNum = Number(type);
			const isDefensivePowerup = typeNum <= 2;

			const imgP1 = createImage(`hdIconP1_${type}`, POWER_UP_STYLES.powerUpHd, src);
			imgP1.leftInPixels = isDefensivePowerup ? 250 : -250;
			this.adt.addControl(imgP1);
			this.hdImagesP1.set(typeNum, imgP1);

			const imgP2 = createImage(`hdIconP2_${type}`, POWER_UP_STYLES.powerUpHd, src);
			imgP2.leftInPixels = isDefensivePowerup ? -250 : 250;
			this.adt.addControl(imgP2);
			this.hdImagesP2.set(typeNum, imgP2);
		}
	}

	private createSpectatorBanner(): void {
		const t = getCurrentTranslation();

		this.spectatorOverlay = createRect("spectatorOverlay", SPECTATOR_STYLE.spectatorOverlay);
		this.adt!.addControl(this.spectatorOverlay);
		this.spectatorBanner = createRect("spectatorBanner", SPECTATOR_STYLE.spectatorBanner);
		this.spectatorOverlay.addControl(this.spectatorBanner);

		const bannerContent = createStackPanel("bannerContent", SPECTATOR_STYLE.bannerContent);
		this.spectatorBanner.addControl(bannerContent);

		const spectatorText = createTextBlock("spectatorText", SPECTATOR_STYLE.spectatorText, t.spectator);
		bannerContent.addControl(spectatorText);

		const spectatorControls = createTextBlock("spectatorControls", SPECTATOR_STYLE.spectatorControls, t.spectatorInstruction);
		bannerContent.addControl(spectatorControls);
	}

	show(show: boolean): void {
		this.hudGrid.isVisible = show;

		this.powerUpContainerP1.isVisible = show;
		this.powerUpContainerP2.isVisible = show;
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

			let scale = 1.4;
			if (rally > 0 && rally % 5 === 0)
				scale = 2;
			this.animationManager?.scale(this.rally, 1, scale, Motion.F.base, true);
			this.previousRally = rally;
			return true;
		}
		this.previousRally = rally;
		return false;
	}

	async setSpectatorMode(): Promise<void> {
		this.spectatorOverlay.isVisible = true;
		this.animationManager.fade(this.spectatorBanner, 'in', Motion.F.base);
		this.animationManager.twinkle(this.spectatorOverlay, Motion.F.fast);
	}

	updateScores(leftScore: number, rightScore: number): void {
		const oldLeft = parseInt(this.score1Text.text);
		const oldRight = parseInt(this.score2Text.text);

		this.score1Text.text = leftScore.toString();
		this.score2Text.text = rightScore.toString();

		if (leftScore > oldLeft)
			this.animationManager?.scale(this.score1Text, 1, 0.9, Motion.F.base, true);
		else if (rightScore > oldRight)
			this.animationManager?.scale(this.score2Text, 1, 0.9, Motion.F.base, true);
	}

	updatePlayerNames(player1Name: string, player2Name: string): void {
		this.player1Label.text = player1Name;
		this.player2Label.text = player2Name;
		this.hudGrid.isVisible = true;
	}

	assignPowerUp(player: PlayerSide, slotIndex: number, powerUpType: PowerupType): void {
		const scene = this.adt.getScene();
		const cells = player === 0 ? this.powerUpCellsP1 : this.powerUpCellsP2;
		if (slotIndex >= 0 && slotIndex < cells.length) {
			const cell = cells[slotIndex];
			scene?.stopAnimation(cell.root);

			cell.root.scaleX = 1;
			cell.root.scaleY = 1;
			cell.root.alpha = 0;
			cell.root.color = "rgba(255, 255, 255, 0.5)";
			
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

				cell.root.alpha = 0;
				const delay = slotIndex * 100;
				setTimeout(() => {
					this.animationManager.slideFromDirection(cell.root, 'up', 'in', 100, Motion.F.base)
						.then(() => {
							return this.animationManager.scale(cell.root, 1, 1.1, Motion.F.fast, true);
						});
				}, delay);
			}
		}
	}

	updatePowerUp(player: PlayerSide, slotIndex: number, action: PowerupState): void {
		const scene = this.adt.getScene();
		const cells = player === 0 ? this.powerUpCellsP1 : this.powerUpCellsP2;
		
		if (slotIndex >= 0 && slotIndex < cells.length) {
			const cell = cells[slotIndex];

			switch (action) {
				case PowerupState.ACTIVE:
					cell.root.color = "rgba(255, 0, 0, 1)";
					if (cell.icon)
						this.animationManager?.twinkle(cell.root, Motion.F.fast);
					break;
					
				case PowerupState.SPENT:
					scene?.stopAnimation(cell.root);
					cell.root.scaleX = 1;
					cell.root.scaleY = 1;
					cell.root.color = "rgba(255, 255, 255, 0.5)";
					cell.root.background = "rgba(255, 255, 255, 0.25)";
					
					if (cell.icon)
						this.animationManager.fade(cell.icon, 'out', Motion.F.fast).then(() => {
							cell.icon!.alpha = 0.3;
						});
					break;
			}
		}
	}

	async activatePowerUpAnimationHD(player: PlayerSide, powerUpType: PowerupType): Promise<void> {
		const imagesHD = player === PlayerSide.LEFT ? this.hdImagesP1 : this.hdImagesP2;
		const imageHD = imagesHD.get(powerUpType);

		if (!imageHD) return;

		imageHD.isVisible = true;
		imageHD.alpha = 0.6;
		imageHD.scaleX = 0.1;
		imageHD.scaleY = 0.1;
		imageHD.rotation = 0;

		await this.animationManager.smashEffect(imageHD);
		await new Promise(resolve => setTimeout(resolve, 300));
		await this.animationManager.fade(imageHD, 'out', Motion.F.fast);
		
		imageHD.isVisible = false;
	}

	resetPowerUps(): void {
		const scene = this.adt.getScene();

		[this.powerUpCellsP1, this.powerUpCellsP2].forEach(cells => {
			cells.forEach((cell) => {
				scene?.stopAnimation(cell.root);
				cell.root.scaleX = 1;
				cell.root.scaleY = 1;
				cell.root.alpha = 0;
				cell.root.topInPixels = 0;
				cell.root.color = "rgba(255, 255, 255, 0.5)";
				// cell.root.background = "rgba(0, 0, 0, 1)";
				
				if (cell.icon) {
					cell.icon.alpha = 0;
					// cell.icon.isVisible = false;
					cell.icon.source = "";
					// cell.icon.dispose();
				}
			});
		});
	}
	dispose(): void {
		this.rallyText.dispose();
		this.rally.dispose();
		this.score1Text.dispose();
		this.score2Text.dispose();
		this.player1Label.dispose();
		this.player2Label.dispose();
		this.hudGrid.dispose();
		// this.spectatorText.dispose();
		// this.spectatorBanner.dispose();

		[...this.powerUpCellsP1, ...this.powerUpCellsP2].forEach(cell => {
			cell.icon?.dispose();
			cell.letter?.dispose();
			cell.root.dispose();
		});

		this.hdImagesP1.forEach(img => img.dispose());
		this.hdImagesP2.forEach(img => img.dispose());
	}
}