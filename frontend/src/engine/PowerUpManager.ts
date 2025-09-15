import { PowerupType, PowerUpAction } from "../shared/constants.js";
import { GAME_CONFIG } from "../shared/gameConfig.js";
import { AnimationManager } from "./AnimationManager.js";
// import { AudioManager } from "./AudioManager.js";
import { GUIManager } from "./GuiManager.js";
import { GameObjects } from "../shared/types.js";
import { webSocketClient } from '../core/WebSocketClient.js';
import { PlayerSide, PlayerState } from "./utils.js"

// Manages all powerup-related functionality including assignment, activation, deactivation, and visual/audio effects
export class PowerupManager {
	constructor(
		private players: Map<PlayerSide, PlayerState>,
		private animationManager: AnimationManager,
		// private audioManager: AudioManager,
		private guiManager: GUIManager,
		private gameObjects: GameObjects
	) {}

	// Handle server assigning powerups to player
	assign(message: any): void {
		if (!message || !Array.isArray(message.powerups))
			console.warn("[PowerUps] invalid message", message);

		const ids: number[] = message.powerups;
		const side = message.side;

		if (side !== PlayerSide.LEFT && side !== PlayerSide.RIGHT)
			return;

		this.players.get(side)!.powerUps = ids.map(id => id as PowerupType);

		ids.forEach((powerup, index) => {
			this.guiManager?.powerUp.update(side, index, powerup as PowerupType, PowerUpAction.CREATED);
		});
	}

	// Player requests to activate a powerup
	requestActivatePowerup(side: PlayerSide, slotIndex: number): void {
		const powerUps = this.players.get(side)!.powerUps;
		if (!powerUps) return;

		const powerup = powerUps[slotIndex];
		if (powerup === null || powerup === undefined) return;

		const currentlyActive = this.players.get(side)!.activePowerup;
		if (currentlyActive === powerup) return;

		webSocketClient.sendPowerupActivationRequest(powerup, side, slotIndex);
	}

	activate(message: any): void {
		if (!message) return;

		console.warn(`[PowerUp Toggle] Activating power-up:`, message);

		const side = message.side;
		const slot = message.slot;
		const powerup = message.powerup;

		const med = GAME_CONFIG.paddleWidth;
		const lrg = GAME_CONFIG.increasedPaddleWidth;
		const sml = GAME_CONFIG.decreasedPaddleWidth;
		this.players.get(side)!.activePowerup = powerup;
		switch (message.powerup) {
			case PowerupType.SHRINK_OPPONENT:
				if (side === PlayerSide.LEFT) {
					this.animationManager?.scaleWidth(this.gameObjects?.players.right, med, sml);
					this.players.get(PlayerSide.RIGHT)!.size = GAME_CONFIG.decreasedPaddleWidth;
				} else {
					this.animationManager?.scaleWidth(this.gameObjects?.players.left, med, sml);
					this.players.get(PlayerSide.LEFT)!.size = GAME_CONFIG.decreasedPaddleWidth;
				}
				break;
			case PowerupType.GROW_PADDLE:
				if (side === PlayerSide.LEFT) {
					this.animationManager?.scaleWidth(this.gameObjects?.players.left, med, lrg);
					this.players.get(PlayerSide.LEFT)!.size = GAME_CONFIG.increasedPaddleWidth;
				} else {
					this.animationManager?.scaleWidth(this.gameObjects?.players.right, med, lrg);
					this.players.get(PlayerSide.RIGHT)!.size = GAME_CONFIG.increasedPaddleWidth;
				}
				break;
			case PowerupType.INVERT_OPPONENT:
				if (side === PlayerSide.LEFT)
					this.players.get(PlayerSide.RIGHT)!.inverted = true;
				else
					this.players.get(PlayerSide.LEFT)!.inverted = true;
				break;
		}
		this.guiManager?.powerUp.update(side, slot, null, PowerUpAction.ACTIVATED);
	}

	deactivate(message: any): void {
		if (!message) return;

		console.warn(`[PowerUp Toggle] Deactivating power-up:`, message);

		const side = message.side;
		const slot = message.slot;

		const med = GAME_CONFIG.paddleWidth;
		const lrg = GAME_CONFIG.increasedPaddleWidth;
		const sml = GAME_CONFIG.decreasedPaddleWidth;
		this.players.get(side)!.activePowerup = null;
		switch (message.powerup) {
			case PowerupType.SHRINK_OPPONENT:
				if (side === PlayerSide.LEFT) {
					this.animationManager?.scaleWidth(this.gameObjects?.players.right, sml, med);
					this.players.get(PlayerSide.RIGHT)!.size = GAME_CONFIG.paddleWidth;
				} else {
					this.animationManager?.scaleWidth(this.gameObjects?.players.left, sml, med);
					this.players.get(PlayerSide.LEFT)!.size = GAME_CONFIG.paddleWidth;
				}
				break;
			case PowerupType.GROW_PADDLE:
				if (side === PlayerSide.LEFT) {
					this.animationManager?.scaleWidth(this.gameObjects?.players.left, lrg, med);
					this.players.get(PlayerSide.LEFT)!.size = GAME_CONFIG.paddleWidth;
				} else {
					this.animationManager?.scaleWidth(this.gameObjects?.players.right, lrg, med);
					this.players.get(PlayerSide.RIGHT)!.size = GAME_CONFIG.paddleWidth;
				}
				break;
			case PowerupType.INVERT_OPPONENT:
				if (side === PlayerSide.LEFT)
					this.players.get(PlayerSide.RIGHT)!.inverted = false;
				else
					this.players.get(PlayerSide.LEFT)!.inverted = false;
				break;
		}
		this.guiManager?.powerUp.update(side, slot, null, PowerUpAction.DEACTIVATED);
	}

	dispose(): void {
	}
}