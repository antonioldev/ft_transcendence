import { PowerupType, PowerupState } from "../../shared/constants.js";
import { GAME_CONFIG } from "../../shared/gameConfig.js";
import { AnimationManager } from "./AnimationManager.js";
import { GUIManager } from "./GuiManager.js";
import { GameObjects, Powerup } from "../../shared/types.js";
import { webSocketClient } from '../../core/WebSocketClient.js';
import { PlayerSide, PlayerState } from "../utils.js"

// Manages all powerup-related functionality including assignment, activation, deactivation, and visual/audio effects
export class PowerupManager {
	constructor(
		private players: Map<PlayerSide, PlayerState>,
		private animationManager: AnimationManager,
		private guiManager: GUIManager,
		private gameObjects: GameObjects
	) {}

	handleUpdates(side: PlayerSide, serverPowerups: Powerup[]): void {
		
		if (!serverPowerups || serverPowerups.length === 0)
			return;

		const player = this.players.get(side);
		if (player === null || player === undefined)
			return;

		if (!player.powerUpsAssigned) {
			player.powerUpsAssigned = true;
			player.powerUps = [...serverPowerups];
			for (let i = 0; i < serverPowerups.length; i++)
				this.guiManager?.powerUp.assign(side, i, serverPowerups[i].type);
			return;
		}

		for (let i = 0; i < serverPowerups.length; i++) {
			const serverPowerup = serverPowerups[i];
			const clientPowerup = player.powerUps[i];
			let powerUpStateChanged = false;

			if (serverPowerup.state === PowerupState.ACTIVE && clientPowerup.state === PowerupState.UNUSED) {
				clientPowerup.state = serverPowerup.state;
				this.activate(side, i, serverPowerup.type);
				powerUpStateChanged = true;
			} else if (serverPowerup.state === PowerupState.SPENT && clientPowerup.state === PowerupState.ACTIVE) {
				clientPowerup.state = serverPowerup.state;
				this.deactivate(side, i, serverPowerup.type);
				powerUpStateChanged = true;
			}
			if (powerUpStateChanged)
				this.guiManager?.powerUp.update(side, i, serverPowerup.state);
		}
	}

	requestActivatePowerup(side: PlayerSide, slotIndex: number): void {
		const player = this.players.get(side);
		if (!player?.isControlled)
			return;
		
		const powerUps = player.powerUps;
		
		if (!powerUps || slotIndex >= powerUps.length)
			return;

		const powerup = powerUps[slotIndex];
		
		if (!powerup || powerup.state !== PowerupState.UNUSED)
			return;

		const hasActivePowerupOfSameType = powerUps.some(p => 
			p.type === powerup.type && p.state === PowerupState.ACTIVE
		);
		
		if (hasActivePowerupOfSameType)
			return;

		webSocketClient.sendPowerupActivationRequest(powerup.type, side, slotIndex);
	}

	activate(side: PlayerSide, slot: number, powerupType: PowerupType): void {
		const med = GAME_CONFIG.paddleWidth;
		const lrg = GAME_CONFIG.increasedPaddleWidth;
		const sml = GAME_CONFIG.decreasedPaddleWidth;
		
		switch (powerupType) {
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
		
		this.guiManager?.powerUp.update(side, slot, PowerupState.ACTIVE);
	}

	deactivate(side: PlayerSide, slot: number, powerupType: PowerupType): void {
		const med = GAME_CONFIG.paddleWidth;
		const lrg = GAME_CONFIG.increasedPaddleWidth;
		const sml = GAME_CONFIG.decreasedPaddleWidth;
		
		switch (powerupType) {
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
		
		this.guiManager?.powerUp.update(side, slot, PowerupState.SPENT);
	}
}