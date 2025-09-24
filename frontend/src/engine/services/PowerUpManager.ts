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

	handleUpdates(side: PlayerSide, player: PlayerState, serverPowerups: Powerup[]): void {
		if (!serverPowerups || serverPowerups.length === 0)
			return;

		if (!player.powerUpsAssigned) {
			player.powerUpsAssigned = true;
			const assignMessage = {
				side: side,
				powerups: serverPowerups.map(p => p.type),
				slot_states: serverPowerups.map(p => p.state)
			};
			this.assign(assignMessage);
			return;
		}

		for (let i = 0; i < serverPowerups.length; i++) {
			const serverPowerup = serverPowerups[i];

			if (serverPowerup.state === PowerupState.ACTIVE && player.activePowerup !== serverPowerup.type) {
				this.activate({
					side: side,
					slot: i,
					powerup: serverPowerup.type
				});
			} else if (serverPowerup.state === PowerupState.SPENT && player.activePowerup === serverPowerup.type) {
				this.deactivate({
					side: side,
					slot: i,
					powerup: serverPowerup.type
				});
			}
			this.guiManager?.powerUp.update(side, i, serverPowerup.type, serverPowerup.state);
		}
	}

	assign(message: any): void {
		if (!message || !Array.isArray(message.powerups))
			return;

		const types: number[] = message.powerups;
		const states: number[] = message.slot_states;
		const side = message.side;

		if (side !== PlayerSide.LEFT && side !== PlayerSide.RIGHT)
			return;

		const mappedTypes = types.map(id => id as PowerupType);
		this.players.get(side)!.powerUps = mappedTypes;

		for (let i = 0; i < Math.min(types.length, states.length); i++)
			this.guiManager?.powerUp.assign(side, i, types[i]);
	}

	// Player requests to activate a powerup
	requestActivatePowerup(side: PlayerSide, slotIndex: number): void {
		if (!this.players.get(side)?.isControlled)
			return;
		
		const powerUps = this.players.get(side)!.powerUps;
		
		if (!powerUps)
			return;

		const powerup = powerUps[slotIndex];
		
		if (powerup === null || powerup === undefined)
			return;

		const currentlyActive = this.players.get(side)!.activePowerup;
		
		if (currentlyActive === powerup)
			return;

		webSocketClient.sendPowerupActivationRequest(powerup, side, slotIndex);
	}

	activate(message: any): void {
		if (!message)
			return;

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
		this.guiManager?.powerUp.update(side, slot, powerup, PowerupState.ACTIVE);
	}

	deactivate(message: any): void {
		if (!message)
			return;

		const side = message.side;
		const slot = message.slot;
		const powerup = message.powerup;

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
		this.guiManager?.powerUp.update(side, slot, powerup, PowerupState.SPENT);
	}
}