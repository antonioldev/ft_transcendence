import { DeviceSourceManager, DeviceType, Scene } from "@babylonjs/core";
import { Logger } from '../../utils/LogManager.js';
import { GameConfig } from '../GameConfig.js';
import { Direction, ViewMode} from '../../shared/constants.js';
import { GameObjects } from '../../shared/types.js';
import { getPlayerBoundaries } from '../../shared/gameConfig.js';
import { PlayerSide, PlayerState } from "../utils.js";
import { webSocketClient } from '../../core/WebSocketClient.js';
import { PowerupManager } from "./PowerUpManager.js";
import { GUIManager } from "./GuiManager.js";


export const Keys = {
  W: 87, S: 83, A: 65, D: 68,
  C: 67, V: 86, B: 66, I: 73, O: 79, P: 80,
  UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39,
  ESC: 27, Y: 89, N: 78, SPACE: 32,
  ONE: 49, TWO: 50, THREE: 51
} as const;

export type MoveKeys = { left: number; right: number; };
export type PowerKeys = { k1: number; k2: number; k3: number };
export type KeysProfile = { move: MoveKeys; power: PowerKeys };

export const PROFILES_2D = {
  P1: { move: { left: Keys.W, right: Keys.S }, power: { k1: Keys.C, k2: Keys.V, k3: Keys.B } },
  P2: { move: { left: Keys.UP, right: Keys.DOWN }, power: { k1: Keys.I, k2: Keys.O, k3: Keys.P } },
  DEFAULT: { move: { left: Keys.UP, right: Keys.DOWN }, power: { k1: Keys.ONE, k2: Keys.TWO, k3: Keys.THREE } },
  DEFAULT_RIGHT: { move: { left: Keys.UP, right: Keys.DOWN }, power: { k1: Keys.ONE, k2: Keys.TWO, k3: Keys.THREE } }
} as const;

export const PROFILES_3D = {
  P1: { move: { left: Keys.A, right: Keys.D }, power: { k1: Keys.C, k2: Keys.V, k3: Keys.B } },
  P2: { move: { left: Keys.RIGHT, right: Keys.LEFT }, power: { k1: Keys.I, k2: Keys.O, k3: Keys.P } },
  DEFAULT: { move: { left: Keys.LEFT, right: Keys.RIGHT }, power: { k1: Keys.ONE, k2: Keys.TWO, k3: Keys.THREE } },
  DEFAULT_RIGHT: { move: { left: Keys.RIGHT, right: Keys.LEFT }, power: { k1: Keys.ONE, k2: Keys.TWO, k3: Keys.THREE } }
} as const;



// Manages all keyboard input handling for the game
export class KeyboardManager {
	private deviceSourceManager: DeviceSourceManager | null = null;
	private globalKeyDownHandler: (event: KeyboardEvent) => void;
	private activeProfiles!: { P1: KeysProfile; P2: KeysProfile; DEFAULT: KeysProfile, DEFAULT_RIGHT: KeysProfile };
	// private activeProfiles!: { P1: KeysProfile; P2: KeysProfile;};
	private isInitialized: boolean = false;
	private spectatorStatus: 'no' | 'yes' | 'deciding' = 'no';
	private spectatorChoiceResolver: ((choice: boolean) => void) | null = null;

	constructor(
		scene: Scene,
		private config: GameConfig,
		private gameObjects: GameObjects,
		private players: Map<PlayerSide, PlayerState>,
		private powerupManager: PowerupManager,
		private gui: GUIManager,
	) {
		this.deviceSourceManager = new DeviceSourceManager(scene.getEngine());
		this.globalKeyDownHandler = this.handleGlobalKeyDown.bind(this);
		this.setupGlobalKeyboardEvents();
		if (config.viewMode === ViewMode.MODE_2D)
			this.activeProfiles = PROFILES_2D;
		else
			this.activeProfiles = PROFILES_3D;
		this.isInitialized = true;
	}

	private setupGlobalKeyboardEvents(): void {
		document.addEventListener('keydown', this.globalKeyDownHandler);
	}

	// mapModeAndAssignment(mode: GameMode, controlledSides?: PlayerSide[]) {
	// 	controlledSides?.forEach((side, index) => {
	// 		const player = this.players.get(side);
	// 		if (!player) return;

	// 		player.keyboardProfile = (side === PlayerSide.LEFT) ?
	// 				this.activeProfiles.P1 : this.activeProfiles.P2;

	// 		// if (this.config.isLocalMultiplayer) {
	// 		// 	player.keyboardProfile = (side === PlayerSide.LEFT) ?
	// 		// 		this.activeProfiles.P1 : this.activeProfiles.P2;
	// 		// } else {
	// 		// 	player.keyboardProfile = (side === PlayerSide.LEFT) ?
	// 		// 		this.activeProfiles.DEFAULT : this.activeProfiles.DEFAULT_RIGHT;
	// 		// }
	// 	});
	// }

	assignLocalControls() {
		this.players.forEach((player, side) => {
			if (!player.isControlled) return;
			
			// player.keyboardProfile = (side === PlayerSide.LEFT) ?
			// 	this.activeProfiles.P1 : this.activeProfiles.P2;
			if (this.config.isLocalMultiplayer) {
				player.keyboardProfile = (side === PlayerSide.LEFT) ?
					this.activeProfiles.P1 : this.activeProfiles.P2;
			} else {
				player.keyboardProfile = (side === PlayerSide.LEFT) ?
					this.activeProfiles.DEFAULT : this.activeProfiles.DEFAULT_RIGHT;
			}
		});
	}

	setSpectator(status: 'no' | 'yes' | 'deciding'): void {
		this.spectatorStatus = status;
	}

	private get isSpectator(): boolean {
		return this.spectatorStatus === 'yes';
	}

	private get isAwaitingSpectatorChoice(): boolean {
		return this.spectatorStatus === 'deciding';
	}

	waitForSpectatorChoice(): Promise<boolean> {
		this.setSpectator('deciding');
		this.gui.endGame.startSpectatorCountdown();
		
		return new Promise<boolean>((resolve) => {
			this.spectatorChoiceResolver = resolve;

			// Timeout after 10 seconds
			setTimeout(() => {
				if (this.spectatorStatus === 'deciding') {
					this.gui.endGame.hideSpectatorPrompt();
					this.setSpectator('no');
					this.spectatorChoiceResolver = null;
					document.dispatchEvent(new CustomEvent('game:exitToMenu'));
					resolve(false); // Still return false for completeness
				}
			}, 10000);
		});
	}
	
	private handleGlobalKeyDown(event: KeyboardEvent): void {
		const key = event.keyCode;

		if (key === 70) { // F key - Open
			this.gui.curtain.start();
			return;
		}
		
		if (key === 71) { // G key - Close
			this.gui.curtain.stop();
			return;
		}

		if (this.isAwaitingSpectatorChoice) {
			this.handleSpectatorChoiceKeys(key);
			return;
		}

		if (this.isSpectator) {
			this.handleSpectatorInteraciot(key);
			return;
		}

		if (key === Keys.ESC) {
			this.handleEscapeKey();
			return;
		}

		if (this.gui.isPauseMenuVisible())
			this.handlePauseMenuKeys(key);
		else
			this.handlePowerupKeys(key);
	}

	private handleSpectatorChoiceKeys(key: number): void {
		if (this.spectatorStatus !== 'deciding') return;
		
		if (key === Keys.Y) {
			this.gui.endGame.hideSpectatorPrompt();
			this.setSpectator('yes');
			this.spectatorChoiceResolver?.(true);
			this.spectatorChoiceResolver = null;
		} else if (key === Keys.N) {
			this.gui.endGame.hideSpectatorPrompt();
			this.setSpectator('no');
			this.spectatorChoiceResolver?.(false);
			this.spectatorChoiceResolver = null;
			document.dispatchEvent(new CustomEvent('game:exitToMenu'));
		}
	}
	private handleSpectatorInteraciot(key: number) {
		switch (key) {
			case Keys.Y:
				document.dispatchEvent(new CustomEvent('game:exitToMenu'));
				break;
			case Keys.LEFT:
					webSocketClient.sendSwitchGame(Direction.LEFT);
				break;
			case Keys.RIGHT:
					webSocketClient.sendSwitchGame(Direction.RIGHT);
				break;
			case Keys.SPACE:
				this.gui.matchTree.toggle();
				break;
		}
	}

	// Updated escape key handler
	private handleEscapeKey(): void {
		this.gui.togglePauseMenu();

		if (this.gui.isPauseMenuVisible())
			webSocketClient.sendPauseRequest();
		else
			webSocketClient.sendResumeRequest();
	}

	private handlePauseMenuKeys(key: number): void {
		// const isSpectators = !this.players.get(PlayerSide.LEFT)?.isControlled
		// 				&& !this.players.get(PlayerSide.RIGHT)?.isControlled;
		switch (key) {
			case Keys.Y:
				document.dispatchEvent(new CustomEvent('game:exitToMenu'));
				break;
			case Keys.N:
			case Keys.ESC:
				webSocketClient.sendResumeRequest();
				break;
			// case Keys.LEFT:
			// 	if (isSpectators)
			// 		webSocketClient.sendSwitchGame(Direction.LEFT);
			// 	break;
			// case Keys.RIGHT:
			// 	if (isSpectators)
			// 		webSocketClient.sendSwitchGame(Direction.RIGHT);
			// 	break;
		}
	}

	private handlePowerupKeys(key: number): void {
		if (!this.powerupManager) return;
		this.players.forEach((playerState, side) => {
			if (!playerState.isControlled || !playerState.keyboardProfile) return;
		
			const profile = playerState.keyboardProfile;

			switch (key) {
				case profile.power.k1:
					this.powerupManager.requestActivatePowerup(side, 0);
					return;
				case profile.power.k2:
					this.powerupManager.requestActivatePowerup(side, 1);
					return;
				case profile.power.k3:
					this.powerupManager.requestActivatePowerup(side, 2);
					return;
			}
		});
	}

	update(): void {
		if (!this.isInitialized || !this.deviceSourceManager || !this.gameObjects) return;

		try {
			const keyboardSource = this.deviceSourceManager.getDeviceSource(DeviceType.Keyboard);
			if (!keyboardSource) return;

			this.players.forEach((playerState, side) => {
				if (playerState.isControlled && playerState.keyboardProfile) {
					this.handlePlayerMovement(keyboardSource, side, playerState, playerState.keyboardProfile);
				}
			});
		} catch (error) {
			Logger.error('Error updating player input', 'KeyboardManager', error);
		}
	}

	private handlePlayerMovement(keyboardSource: any, side: PlayerSide, playerState: PlayerState, profile: KeysProfile): void {
		const bounds = getPlayerBoundaries(playerState.size);
		const player = side === PlayerSide.LEFT ? this.gameObjects.players.left : this.gameObjects.players.right;

		let input: Direction = Direction.STOP;
		if (keyboardSource.getInput(profile.move.left) === 1)
			input = Direction.LEFT;
		else if (keyboardSource.getInput(profile.move.right) === 1)
			input = Direction.RIGHT;
		
		if (input === Direction.STOP) return;

		let effectiveInput = input;
		
		// 3D Player 2 camera inversion (ONLY in remote multiplayer)
		if (this.config.isRemoteMultiplayer && this.config.viewMode === ViewMode.MODE_3D && side === PlayerSide.RIGHT)
			effectiveInput = (input === Direction.LEFT) ? Direction.RIGHT : Direction.LEFT;
		
		if (playerState.inverted)
			effectiveInput = (effectiveInput === Direction.LEFT) ? Direction.RIGHT : Direction.LEFT;

		if (effectiveInput === Direction.LEFT && player.position.x <= bounds.left) return;
		if (effectiveInput === Direction.RIGHT && player.position.x >= bounds.right) return;

		webSocketClient.sendPlayerInput(side, input);
	}

	dispose(): void {
		if (!this.isInitialized) return;

		try {
			document.removeEventListener('keydown', this.globalKeyDownHandler);
			
			this.deviceSourceManager?.dispose();
			this.deviceSourceManager = null;
			this.isInitialized = false;
			Logger.debug('KeyboardManager disposed', 'KeyboardManager');
		} catch (error) {
			Logger.error('Error disposing KeyboardManager', 'KeyboardManager', error);
		}
	}
}