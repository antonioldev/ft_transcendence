import { AdvancedDynamicTexture, Control, Rectangle, TextBlock, Image} from "@babylonjs/gui";
import { PowerupType, PowerupState } from '../../shared/constants.js';
import { AnimationManager, Motion } from "../services/AnimationManager.js";
import { H_RIGHT, H_LEFT, POWER_UP_STYLES, createRect, createTextBlock, createImage} from "./GuiStyle.js";
import { GameConfig } from "../GameConfig.js";
import { PlayerSide } from "../utils.js";

export class PowerUp {
	private powerUpSlotP1!: Rectangle;
	private powerUpSlotP2!: Rectangle;
	private powerUpCellsP1: Array<{root: Rectangle; icon?: Image; letter?: TextBlock}> = [];
	private powerUpCellsP2: Array<{root: Rectangle; icon?: Image; letter?: TextBlock}> = [];
	private POWERUP_ICON: Record<number, string> = {
		[PowerupType.SLOW_OPPONENT]:	   "assets/icons/powerup/slow.png",
		[PowerupType.SHRINK_OPPONENT]:	 "assets/icons/powerup/smaller.png",
		[PowerupType.INCREASE_PADDLE_SPEED]:"assets/icons/powerup/fast.png",
		[PowerupType.GROW_PADDLE]:		 "assets/icons/powerup/larger.png",
		[PowerupType.INVERT_OPPONENT]:	"assets/icons/powerup/invert.png",
		[PowerupType.FREEZE]:			"assets/icons/powerup/stop.png"
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
					this.animationManager.slideInX(cell.root, direction, Motion.F.slow)
						.then(() => {
							return this.animationManager.pop(cell.root, Motion.F.fast, 1.1);
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
					if (cell.icon) {
						cell.root.color = "rgba(255, 0, 0, 1)";
						this.animationManager?.twinkle(cell.root, Motion.F.fast);
					}
					break;
					
				case PowerupState.SPENT:
					scene?.stopAnimation(cell.root);
					cell.root.scaleX = 1;
					cell.root.scaleY = 1;
					cell.root.color = "rgba(255, 255, 255, 0.5)";
					cell.root.background = "rgba(255, 255, 255, 0.25)";
					
					if (cell.icon) {
						this.animationManager.fadeOut(cell.icon, Motion.F.fast).then(() => {
							cell.icon!.alpha = 0.3;
						});
					}
					break;
			}
		}
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