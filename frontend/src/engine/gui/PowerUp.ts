import { AdvancedDynamicTexture, Control, Rectangle, TextBlock, Image} from "@babylonjs/gui";
import { PowerupType, PowerupState } from '../../shared/constants.js';
import { AnimationManager, Motion } from "../services/AnimationManager.js";
import { H_RIGHT, H_LEFT, POWER_UP_STYLES, createRect, createTextBlock, createImage} from "./GuiStyle.js";
import { GameConfig } from "../GameConfig.js";
import { PlayerSide } from "../utils.js";

export class PowerUp {
	private hdImagesP1: Map<PowerupType, Image> = new Map();
	private hdImagesP2: Map<PowerupType, Image> = new Map();
	private powerUpSlotP1!: Rectangle;
	private powerUpSlotP2!: Rectangle;
	private powerUpCellsP1: Array<{root: Rectangle; icon?: Image; letter?: TextBlock}> = [];
	private powerUpCellsP2: Array<{root: Rectangle; icon?: Image; letter?: TextBlock}> = [];
	private POWERUP_ICON: Record<number, string> = {
		[PowerupType.SLOW_OPPONENT]:	   "assets/icons/powerup/slow.png",
		[PowerupType.SHRINK_OPPONENT]:	 "assets/icons/powerup/smaller.png",
		[PowerupType.INVERT_OPPONENT]:	"assets/icons/powerup/invert.png",
		[PowerupType.INCREASE_PADDLE_SPEED]:"assets/icons/powerup/fast.png",
		[PowerupType.GROW_PADDLE]:		 "assets/icons/powerup/larger.png",
		[PowerupType.FREEZE]:			"assets/icons/powerup/stop.png",
		[PowerupType.POWERSHOT]:		"assets/icons/powerup/shot.png",
		[PowerupType.RESET_RALLY]:		"assets/icons/powerup/rallyReset.png",
		[PowerupType.DOUBLE_POINTS]:	"assets/icons/powerup/rallyMultiplier.png",
		[PowerupType.INVISIBLE_BALL]:	"assets/icons/powerup/ghost.png"
	};

	private POWERUP_ICON_HD: Record<number, string> = {
		[PowerupType.SLOW_OPPONENT]: "assets/icons/powerupHD/slow.png",
		[PowerupType.SHRINK_OPPONENT]: "assets/icons/powerupHD/smaller.png",
		[PowerupType.INVERT_OPPONENT]: "assets/icons/powerupHD/invert.png",
		[PowerupType.INCREASE_PADDLE_SPEED]: "assets/icons/powerupHD/fast.png",
		[PowerupType.GROW_PADDLE]: "assets/icons/powerupHD/larger.png",
		[PowerupType.FREEZE]: "assets/icons/powerupHD/stop.png",
		[PowerupType.POWERSHOT]: "assets/icons/powerupHD/shot.png",
		[PowerupType.RESET_RALLY]:		"assets/icons/powerupHD/rallyReset.png",
		[PowerupType.DOUBLE_POINTS]:	"assets/icons/powerupHD/rallyMultiplier.png",
		[PowerupType.INVISIBLE_BALL]:	"assets/icons/powerupHD/ghost.png"
	};

	constructor(private adt: AdvancedDynamicTexture, private animationManager: AnimationManager, config: GameConfig) {
		this.powerUpSlotP1 = createRect("powerUpSlotP1", POWER_UP_STYLES.powerUpSlot);
		this.powerUpSlotP1.horizontalAlignment = H_LEFT;
		this.adt.addControl(this.powerUpSlotP1);

		for (let i = 0; i < 3; i++) {
			const cell = this.createPowerUpCell(i, 0, config); // Player 1
			this.powerUpCellsP1.push(cell);
			this.powerUpSlotP1!.addControl(cell.root);
		}

		this.powerUpSlotP2 = createRect("powerUpSlotP2", POWER_UP_STYLES.powerUpSlot);
		this.powerUpSlotP2.horizontalAlignment = H_RIGHT;
		this.adt.addControl(this.powerUpSlotP2);

		for (let i = 0; i < 3; i++) {
			const cell = this.createPowerUpCell(i, 1, config); // Player 2
			this.powerUpCellsP2.push(cell);
			this.powerUpSlotP2!.addControl(cell.root);
		}

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

	private createPowerUpCell(index: number, player: PlayerSide, config: GameConfig): {root: Rectangle; icon?: Image; letter?: TextBlock} {
		const cell = createRect(`powerUpCell_${player}_${index}`, POWER_UP_STYLES.powerUpCell);
		cell.top = `${index * 90}px`;

		const icon = createImage(`powerUpIcon_${player}_${index}`, POWER_UP_STYLES.powerUpIcon, "");

		let letterKeys = ['1', '2', '3'];
		if (config.isLocalMultiplayer)
			letterKeys = player === 0 ? ['C', 'V', 'B'] : ['I', 'O', 'P'];

		const letter = createTextBlock( `powerUpLetter_${player}_${index}`, POWER_UP_STYLES.powerUpLetter, letterKeys[index]);

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

	show(show: boolean): void {
		this.powerUpSlotP1.isVisible = show;
		this.powerUpSlotP2.isVisible = show;
	}

	assign(player: PlayerSide, slotIndex: number, powerUpType: PowerupType): void {
		const scene = this.adt.getScene();
		this.show(true);
		const cells = player === 0 ? this.powerUpCellsP1 : this.powerUpCellsP2;
		
		if (slotIndex >= 0 && slotIndex < cells.length) {
			const cell = cells[slotIndex];
			const direction = player === 0 ? -100 : 100;
			const slideDirection = player === 1 ? 'left' : 'right';

			scene?.stopAnimation(cell.root);

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

				cell.root.alpha = 0;
				const delay = slotIndex * 100;
				setTimeout(() => {
					this.animationManager.slideFromDirection(cell.root, slideDirection, 'in', Math.abs(direction), Motion.F.base)
						.then(() => {
							return this.animationManager.scale(cell.root, 1, 1.1, Motion.F.fast, true);
						});
				}, delay);
			}
		}
	}

	// Update the existing update method to only handle state changes
	update(player: PlayerSide, slotIndex: number, action: PowerupState): void {
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

	async activateAnimationHD(player: PlayerSide, powerUpType: PowerupType): Promise<void> {
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

	reset(): void {
		const scene = this.adt.getScene();

		this.powerUpCellsP1.forEach((cell) => {
			scene?.stopAnimation(cell.root);
			cell.root.scaleX = 1;
			cell.root.scaleY = 1;
			cell.root.alpha = 0;
			cell.root.color = "rgba(255, 255, 255, 0.5)";
			cell.root.background = "rgba(0, 0, 0, 1)";
			
			if (cell.icon) {
				cell.icon.alpha = 0;
				cell.icon.isVisible = false;
				cell.icon.source = "";
			}
		});

		this.powerUpCellsP2.forEach((cell) => {
			scene?.stopAnimation(cell.root);
			cell.root.scaleX = 1;
			cell.root.scaleY = 1;
			cell.root.alpha = 0;
			cell.root.color = "rgba(255, 255, 255, 0.5)";
			cell.root.background = "rgba(0, 0, 0, 1)";
			
			if (cell.icon) {
				cell.icon.alpha = 0;
				cell.icon.isVisible = false;
				cell.icon.source = "";
			}
		});

		this.show(false);
	}

	dispose(): void {
		this.powerUpSlotP1?.dispose();
		this.powerUpSlotP2?.dispose();
		this.powerUpCellsP1.forEach((cell) => {
			cell.root.dispose();
			cell.icon?.dispose();
			cell.letter?.dispose();
		});
		this.powerUpCellsP2.forEach((cell) => {
			cell.root.dispose();
			cell.icon?.dispose();
			cell.letter?.dispose();
		});
		this.powerUpCellsP1 = [];
		this.powerUpCellsP2 = [];
	}
}