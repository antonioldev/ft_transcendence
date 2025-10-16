import { Color3, Color4 } from "@babylonjs/core";
import { webSocketClient } from '../../core/WebSocketClient.js';
import { PowerupState, PowerupType } from "../../shared/constants.js";
import { GAME_CONFIG } from "../../shared/gameConfig.js";
import { GameObjects, Powerup } from "../../shared/types.js";
import { PlayerSide, PlayerState } from "../utils.js";
import { AnimationManager } from "./AnimationManager.js";
import { GUIManager } from "./GuiManager.js";

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
		let edgeGlowColor: Color4;
		switch (powerupType) {
			case PowerupType.SHRINK_OPPONENT:
				if (side === PlayerSide.LEFT) {
					this.animationManager?.scaleWidthPaddle(this.gameObjects?.players.right, med, sml);
					this.players.get(PlayerSide.RIGHT)!.size = GAME_CONFIG.decreasedPaddleWidth;
					this.animationManager?.glowEffect(this.gameObjects?.effects?.rightGlow, Color3.Red());
				} else {
					this.animationManager?.scaleWidthPaddle(this.gameObjects?.players.left, med, sml);
					this.players.get(PlayerSide.LEFT)!.size = GAME_CONFIG.decreasedPaddleWidth;
					this.animationManager?.glowEffect(this.gameObjects?.effects?.leftGlow, Color3.Red());
				}
				break;
			case PowerupType.GROW_PADDLE:
				if (side === PlayerSide.LEFT) {
					this.animationManager?.scaleWidthPaddle(this.gameObjects?.players.left, med, lrg);
					this.players.get(PlayerSide.LEFT)!.size = GAME_CONFIG.increasedPaddleWidth;
					this.animationManager?.glowEffect(this.gameObjects?.effects?.leftGlow, Color3.Green());
				} else {
					this.animationManager?.scaleWidthPaddle(this.gameObjects?.players.right, med, lrg);
					this.players.get(PlayerSide.RIGHT)!.size = GAME_CONFIG.increasedPaddleWidth;
					this.animationManager?.glowEffect(this.gameObjects?.effects?.rightGlow, Color3.Green());
				}
				break;
			case PowerupType.INVERT_OPPONENT:
				glowColor = Color3.Yellow();
				if (side === PlayerSide.LEFT) {
					this.players.get(PlayerSide.RIGHT)!.inverted = true;
					this.animationManager?.glowEffect(this.gameObjects?.effects?.rightGlow, glowColor);
				}
				else {
					this.players.get(PlayerSide.LEFT)!.inverted = true;
					this.animationManager?.glowEffect(this.gameObjects?.effects?.leftGlow, glowColor);
				}
				break;
			case PowerupType.INVISIBLE_BALL:
				this.animationManager?.blinkInvisibility(this.gameObjects.balls);
				break;
			
			case PowerupType.SHIELD:
				const shieldGlow = side === PlayerSide.LEFT 
					? this.gameObjects?.effects?.leftShield : this.gameObjects?.effects?.rightShield;
				glowColor = new Color3(2, 2, 0);
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
				glowColor = Color3.Red();
				edgeGlowColor = new Color4(1, 0, 0, 0.5);
				if (side === PlayerSide.LEFT) {
					this.players.get(PlayerSide.RIGHT)!.inverted = true;
					this.animationManager?.glowEffect(this.gameObjects?.effects?.rightCage, glowColor, edgeGlowColor);
				}
				else {
					this.players.get(PlayerSide.LEFT)!.inverted = true;
					this.animationManager?.glowEffect(this.gameObjects?.effects?.leftCage, glowColor, edgeGlowColor);
				}
				break;
			case PowerupType.INCREASE_PADDLE_SPEED:
				glowColor = Color3.Green();
				edgeGlowColor = new Color4(0, 1, 0, 0.5);
				if (side === PlayerSide.LEFT) {
					this.players.get(PlayerSide.RIGHT)!.inverted = true;
					this.animationManager?.glowEffect(this.gameObjects?.effects?.leftCage, glowColor, edgeGlowColor);
				}
				else {
					this.players.get(PlayerSide.LEFT)!.inverted = true;
					this.animationManager?.glowEffect(this.gameObjects?.effects?.rightCage, glowColor, edgeGlowColor);
				}
				break;
			case PowerupType.POWERSHOT:
				glowColor = new Color3(2, 2, 0);
				this.gameObjects?.balls.forEach((ball: any, index: number) => {
					if (ball.visibility > 0) {
						const ballGlow = this.gameObjects?.effects?.ballsGlow[index];
						if (ballGlow)
							this.animationManager?.glowEffect(ballGlow, glowColor);
					}
				});
				break;
			case PowerupType.CURVE_BALL:
				glowColor = new Color3(1.5, 0, 0);
				this.gameObjects?.balls.forEach((ball: any, index: number) => {
					if (ball.visibility > 0) {
						const ballGlow = this.gameObjects?.effects?.ballsGlow[index];
						if (ballGlow)
							this.animationManager?.glowEffect(ballGlow, glowColor);
					}
				});
				break;
			case PowerupType.INVISIBLE_BALL:
			case PowerupType.TRIPLE_SHOT:
			case PowerupType.RESET_RALLY:
			case PowerupType.DOUBLE_POINTS:
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
					this.animationManager?.scaleWidthPaddle(this.gameObjects?.players.right, sml, med);
					this.players.get(PlayerSide.RIGHT)!.size = GAME_CONFIG.paddleWidth;
					this.animationManager?.stopEffect(this.gameObjects?.effects?.rightGlow);
				} else {
					this.animationManager?.scaleWidthPaddle(this.gameObjects?.players.left, sml, med);
					this.players.get(PlayerSide.LEFT)!.size = GAME_CONFIG.paddleWidth;
					this.animationManager?.stopEffect(this.gameObjects?.effects?.leftGlow);
				}
				break;
			case PowerupType.GROW_PADDLE:
				if (side === PlayerSide.LEFT) {
					this.animationManager?.scaleWidthPaddle(this.gameObjects?.players.left, lrg, med);
					this.players.get(PlayerSide.LEFT)!.size = GAME_CONFIG.paddleWidth;
					this.animationManager?.stopEffect(this.gameObjects?.effects?.leftGlow);
				} else {
					this.animationManager?.scaleWidthPaddle(this.gameObjects?.players.right, lrg, med);
					this.players.get(PlayerSide.RIGHT)!.size = GAME_CONFIG.paddleWidth;
					this.animationManager?.stopEffect(this.gameObjects?.effects?.rightGlow);
				}
				break;
			case PowerupType.INVERT_OPPONENT:
				if (side === PlayerSide.LEFT) {
					this.players.get(PlayerSide.RIGHT)!.inverted = false;
					this.animationManager?.stopEffect(this.gameObjects?.effects?.rightGlow);
				} else {
					this.players.get(PlayerSide.LEFT)!.inverted = false;
					this.animationManager?.stopEffect(this.gameObjects?.effects?.leftGlow);
				}
				break;
			
			case PowerupType.SHIELD:
				const shieldGlow = side === PlayerSide.LEFT 
				? this.gameObjects?.effects?.leftShield
				: this.gameObjects?.effects?.rightShield;
				if (shieldGlow)
					this.animationManager?.stopEffect(shieldGlow);
				break;
			case PowerupType.FREEZE:
				this.gameObjects?.effects?.ballsFreeze.forEach((ballFreeze: any) => {
					this.animationManager?.stopEffect(ballFreeze);
				});
				break;
			case PowerupType.SLOW_OPPONENT:
				if (side === PlayerSide.LEFT) {
					this.players.get(PlayerSide.RIGHT)!.inverted = false;
					this.animationManager?.stopEffect(this.gameObjects?.effects?.rightCage);
				} else {
					this.players.get(PlayerSide.LEFT)!.inverted = false;
					this.animationManager?.stopEffect(this.gameObjects?.effects?.leftCage);
				}
				break;
			case PowerupType.INCREASE_PADDLE_SPEED:
				if (side === PlayerSide.LEFT)
					this.animationManager?.stopEffect(this.gameObjects?.effects?.leftCage);
				else
					this.animationManager?.stopEffect(this.gameObjects?.effects?.rightCage);
				break;

			case PowerupType.POWERSHOT:
			case PowerupType.CURVE_BALL:
				this.gameObjects?.effects?.ballsGlow.forEach((ballGlow: any) => {
					this.animationManager?.stopEffect(ballGlow);
				});
				break;
			case PowerupType.INVISIBLE_BALL:
			case PowerupType.TRIPLE_SHOT:
			case PowerupType.RESET_RALLY:
			case PowerupType.DOUBLE_POINTS:
				break;
		}
		this.guiManager?.hud.updatePowerUp(side, slot, PowerupState.SPENT);
	}
}