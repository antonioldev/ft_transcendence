import { PowerupType, PowerupState } from "../../shared/constants.js";
import { GAME_CONFIG } from "../../shared/gameConfig.js";
import { AnimationManager } from "./AnimationManager.js";
import { GUIManager } from "./GuiManager.js";
import { GameObjects, Powerup } from "../../shared/types.js";
import { webSocketClient } from '../../core/WebSocketClient.js';
import { PlayerSide, PlayerState } from "../utils.js"
import { Color3 } from "@babylonjs/core";
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
				this.guiManager?.hud.assignPowerUp(side, i, serverPowerups[i].type);
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
				this.guiManager?.hud.updatePowerUp(side, i, serverPowerup.state);
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
		
		this.guiManager?.hud.activatePowerUpAnimationHD(side, powerupType);
		let glowColor: Color3;
		switch (powerupType) {
			case PowerupType.SHRINK_OPPONENT:
				if (side === PlayerSide.LEFT) {
					this.animationManager?.scaleWidth(this.gameObjects?.players.right, med, sml);
					this.players.get(PlayerSide.RIGHT)!.size = GAME_CONFIG.decreasedPaddleWidth;
					this.animationManager?.glowEffect(this.gameObjects?.effects?.right, Color3.Red());
				} else {
					this.animationManager?.scaleWidth(this.gameObjects?.players.left, med, sml);
					this.players.get(PlayerSide.LEFT)!.size = GAME_CONFIG.decreasedPaddleWidth;
					this.animationManager?.glowEffect(this.gameObjects?.effects?.left, Color3.Red());
				}
				break;
			case PowerupType.GROW_PADDLE:
				if (side === PlayerSide.LEFT) {
					this.animationManager?.scaleWidth(this.gameObjects?.players.left, med, lrg);
					this.players.get(PlayerSide.LEFT)!.size = GAME_CONFIG.increasedPaddleWidth;
					this.animationManager?.glowEffect(this.gameObjects?.effects?.left, Color3.Green());
				} else {
					this.animationManager?.scaleWidth(this.gameObjects?.players.right, med, lrg);
					this.players.get(PlayerSide.RIGHT)!.size = GAME_CONFIG.increasedPaddleWidth;
					this.animationManager?.glowEffect(this.gameObjects?.effects?.right, Color3.Green());
				}
				break;
			case PowerupType.INVERT_OPPONENT:
				glowColor = Color3.FromHexString("#fbff00ff");
				if (side === PlayerSide.LEFT) {
					this.players.get(PlayerSide.RIGHT)!.inverted = true;
					this.animationManager?.glowEffect(this.gameObjects?.effects?.right, glowColor);
				}
				else {
					this.players.get(PlayerSide.LEFT)!.inverted = true;
					this.animationManager?.glowEffect(this.gameObjects?.effects?.left, glowColor);
				}
				break;
			case PowerupType.INVISIBLE_BALL:
				this.animationManager?.blinkInvisibility(this.gameObjects.balls);
				break;
			
			case PowerupType.SHIELD:
				const shieldGlow = side === PlayerSide.LEFT 
				? this.gameObjects?.effects?.shieldLeft
				: this.gameObjects?.effects?.shieldRight;
				glowColor = Color3.FromHexString("#00FFFF");
				if (shieldGlow)
					this.animationManager?.glowEffect(shieldGlow, glowColor);
				break;
			case PowerupType.FREEZE:
				glowColor = Color3.FromHexString("#87CEEB");
				this.gameObjects?.balls.forEach((ball: any, index: number) => {
					if (ball.visibility > 0) {
						const ballFreeze = this.gameObjects?.effects?.ballsFreeze[index];
						if (ballFreeze)
							this.animationManager?.glowEffect(ballFreeze, glowColor);
					}
				});
				break;
			case PowerupType.SLOW_OPPONENT:
				break;
			case PowerupType.INCREASE_PADDLE_SPEED:
				break;
			case PowerupType.POWERSHOT:
				glowColor = Color3.FromHexString("#fffb00ff");
				this.gameObjects?.balls.forEach((ball: any, index: number) => {
					if (ball.visibility > 0) {
						const ballGlow = this.gameObjects?.effects?.balls[index];
						if (ballGlow)
							this.animationManager?.glowEffect(ballGlow, glowColor);
					}
				});
				break;
				break;
			case PowerupType.INVISIBLE_BALL: // NOTHING already visible effect
				break;
			case PowerupType.CURVE_BALL:
				break;
			case PowerupType.TRIPLE_SHOT:
				break;
			case PowerupType.RESET_RALLY: // NOTHING
				break;
			case PowerupType.DOUBLE_POINTS: // NOTHING
				break;
		}
		this.guiManager?.hud.updatePowerUp(side, slot, PowerupState.ACTIVE);
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
					this.animationManager?.stopGlowEffect(this.gameObjects?.effects?.right);
				} else {
					this.animationManager?.scaleWidth(this.gameObjects?.players.left, sml, med);
					this.players.get(PlayerSide.LEFT)!.size = GAME_CONFIG.paddleWidth;
					this.animationManager?.stopGlowEffect(this.gameObjects?.effects?.left);
				}
				break;
			case PowerupType.GROW_PADDLE:
				if (side === PlayerSide.LEFT) {
					this.animationManager?.scaleWidth(this.gameObjects?.players.left, lrg, med);
					this.players.get(PlayerSide.LEFT)!.size = GAME_CONFIG.paddleWidth;
					this.animationManager?.stopGlowEffect(this.gameObjects?.effects?.left);
				} else {
					this.animationManager?.scaleWidth(this.gameObjects?.players.right, lrg, med);
					this.players.get(PlayerSide.RIGHT)!.size = GAME_CONFIG.paddleWidth;
					this.animationManager?.stopGlowEffect(this.gameObjects?.effects?.right);
				}
				break;
			case PowerupType.INVERT_OPPONENT:
				if (side === PlayerSide.LEFT)
					this.players.get(PlayerSide.RIGHT)!.inverted = false;
				else
					this.players.get(PlayerSide.LEFT)!.inverted = false;
				break;
			
			case PowerupType.SHIELD:
				const shieldGlow = side === PlayerSide.LEFT 
				? this.gameObjects?.effects?.shieldLeft
				: this.gameObjects?.effects?.shieldRight;
				if (shieldGlow)
					this.animationManager?.stopGlowEffect(shieldGlow);
				break;
			case PowerupType.FREEZE:
			case PowerupType.CURVE_BALL:
			case PowerupType.POWERSHOT:
				this.gameObjects?.effects?.balls.forEach((ballGlow: any) => {
					this.animationManager?.stopGlowEffect(ballGlow);
				});
				break;
			case PowerupType.INCREASE_PADDLE_SPEED:
				break;
			case PowerupType.SLOW_OPPONENT:
				break;
			case PowerupType.INVISIBLE_BALL:
				break;
			case PowerupType.TRIPLE_SHOT:
				break;
			case PowerupType.RESET_RALLY:
				break;
			case PowerupType.DOUBLE_POINTS:
				break;
		}
		
		this.guiManager?.hud.updatePowerUp(side, slot, PowerupState.SPENT);
	}


	dispose(): void {
		
	}
}