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

		const isLeftSide = side === PlayerSide.LEFT;
		const opponent = isLeftSide ? PlayerSide.RIGHT : PlayerSide.LEFT;
		const playerMesh = isLeftSide ? this.gameObjects?.players.left : this.gameObjects?.players.right;
		const opponentMesh = isLeftSide ? this.gameObjects?.players.right : this.gameObjects?.players.left;
		
		switch (powerupType) {
			case PowerupType.SHRINK_OPPONENT:
				this.animationManager.scaleWidthPaddle(opponentMesh, med, sml);
				this.players.get(opponent)!.size = GAME_CONFIG.decreasedPaddleWidth;
				this.animationManager.glowEffect(
					isLeftSide ? this.gameObjects.effects.rightGlow : this.gameObjects.effects.leftGlow, Color3.Red());
				break;
			case PowerupType.GROW_PADDLE:
				this.animationManager.scaleWidthPaddle(playerMesh, med, lrg);
				this.players.get(side)!.size = GAME_CONFIG.increasedPaddleWidth;
				this.animationManager?.glowEffect(
					isLeftSide ? this.gameObjects?.effects?.leftGlow : this.gameObjects?.effects?.rightGlow, Color3.Green());
				break;
			case PowerupType.INVERT_OPPONENT:
				this.players.get(opponent)!.inverted = true;
				this.animationManager?.glowEffect(
					isLeftSide ? this.gameObjects?.effects?.rightGlow : this.gameObjects?.effects?.leftGlow, Color3.Yellow());
				break;
			case PowerupType.INVISIBLE_BALL:
				// this.animationManager?.blinkInvisibility(this.gameObjects.balls);
				this.gameObjects?.balls.forEach((ball: any) => {
					this.animationManager?.blinkInvisibility(ball);
				});
				break;
			
			case PowerupType.SHIELD:
				const shieldGlow = isLeftSide ? this.gameObjects?.effects?.leftShield : this.gameObjects?.effects?.rightShield;
				this.animationManager?.glowEffect(shieldGlow, new Color3(2, 2, 0));
				break;
			case PowerupType.FREEZE:
				this.gameObjects?.balls.forEach((ball: any, index: number) => {
					if (ball.visibility > 0) {
						const ballFreeze = this.gameObjects?.effects?.ballsFreeze[index];
						if (ballFreeze) this.animationManager?.glowEffect(ballFreeze, new Color3(135, 206, 235));
					}
				});
				break;
			case PowerupType.SLOW_OPPONENT:
				this.animationManager?.glowEffect(
					isLeftSide ? this.gameObjects?.effects?.rightCage : this.gameObjects?.effects?.leftCage, 
					Color3.Red(), new Color4(1, 0, 0, 0.5)
				);
				break;
			case PowerupType.INCREASE_PADDLE_SPEED:
				this.animationManager?.glowEffect(
					isLeftSide ? this.gameObjects?.effects?.leftCage : this.gameObjects?.effects?.rightCage, 
					Color3.Green(),
					new Color4(0, 1, 0, 0.5)
				);
				break;
			case PowerupType.POWERSHOT:
				this.gameObjects?.balls.forEach((ball: any, index: number) => {
					if (ball.visibility > 0) {
						const ballGlow = this.gameObjects?.effects?.ballsGlow[index];
						if (ballGlow)
							this.animationManager?.glowEffect(ballGlow, new Color3(2, 2, 0));
					}
				});
				break;
			case PowerupType.CURVE_BALL:
				this.gameObjects?.balls.forEach((ball: any, index: number) => {
					if (ball.visibility > 0) {
						const ballGlow = this.gameObjects?.effects?.ballsGlow[index];
						if (ballGlow)
							this.animationManager?.glowEffect(ballGlow, new Color3(1.5, 0, 0));
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

		const isLeftSide = side === PlayerSide.LEFT;
		const opponent = isLeftSide ? PlayerSide.RIGHT : PlayerSide.LEFT;
		const playerMesh = isLeftSide ? this.gameObjects?.players.left : this.gameObjects?.players.right;
		const opponentMesh = isLeftSide ? this.gameObjects?.players.right : this.gameObjects?.players.left;
		
		switch (powerupType) {
			case PowerupType.SHRINK_OPPONENT:
				this.animationManager?.scaleWidthPaddle(opponentMesh, sml, med);
				this.players.get(opponent)!.size = GAME_CONFIG.paddleWidth;
				this.animationManager?.stopEffect(
					isLeftSide ? this.gameObjects?.effects?.rightGlow : this.gameObjects?.effects?.leftGlow
				);
				break;
			case PowerupType.GROW_PADDLE:
				this.animationManager?.scaleWidthPaddle(playerMesh, lrg, med);
				this.players.get(side)!.size = GAME_CONFIG.paddleWidth;
				this.animationManager?.stopEffect(
					isLeftSide ? this.gameObjects?.effects?.leftGlow : this.gameObjects?.effects?.rightGlow
				);
				break;
			case PowerupType.INVERT_OPPONENT:
				this.players.get(opponent)!.inverted = false;
				this.animationManager?.stopEffect(
					isLeftSide ? this.gameObjects?.effects?.rightGlow : this.gameObjects?.effects?.leftGlow
				);
				break;
			
			case PowerupType.SHIELD:
				this.animationManager?.stopEffect(
					isLeftSide ? this.gameObjects?.effects?.leftShield : this.gameObjects?.effects?.rightShield
				);
				break;
			case PowerupType.FREEZE:
				this.gameObjects?.effects?.ballsFreeze.forEach((ballFreeze: any) => {
					this.animationManager?.stopEffect(ballFreeze);
				});
				break;
			case PowerupType.SLOW_OPPONENT:
				this.animationManager?.stopEffect(
					isLeftSide ? this.gameObjects?.effects?.rightCage : this.gameObjects?.effects?.leftCage
				);
				break;
			case PowerupType.INCREASE_PADDLE_SPEED:
				this.animationManager?.stopEffect(
					isLeftSide ? this.gameObjects?.effects?.leftCage : this.gameObjects?.effects?.rightCage
				);
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