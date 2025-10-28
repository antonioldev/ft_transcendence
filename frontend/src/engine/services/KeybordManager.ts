import { DeviceSourceManager, DeviceType, Scene } from "@babylonjs/core";
import { webSocketClient } from '../../core/WebSocketClient.js';
import { Direction, ViewMode } from '../../shared/constants.js';
import { getPlayerBoundaries } from '../../shared/gameConfig.js';
import { GameObjects } from '../../shared/types.js';
import { Logger } from '../../utils/LogManager.js';
import { GameConfig } from '../GameConfig.js';
import { PlayerSide, PlayerState } from "../utils.js";
// import { GUIManager } from "./GuiManager.js";
import { PowerupManager } from "./PowerUpManager.js";
import { GameEventEmitter, GameEventType } from "./EventEmitter.js";


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

export enum KeyboardMode {
	NORMAL,
	PAUSED,
	SPECTATOR_CHOICE,
	SPECTATOR
}

// Manages all keyboard input handling for the game
export class KeyboardManager {
	private deviceSourceManager: DeviceSourceManager | null = null;
	private globalKeyDownHandler: (event: KeyboardEvent) => void;
	private activeProfiles!: { P1: KeysProfile; P2: KeysProfile; DEFAULT: KeysProfile, DEFAULT_RIGHT: KeysProfile };
	private isInitialized: boolean = false;
	private mode: KeyboardMode = KeyboardMode.NORMAL;
	private spectatorChoiceResolver: ((choice: boolean) => void) | null = null;

	constructor(
		scene: Scene,
		private config: GameConfig,
		private gameObjects: GameObjects,
		private players: Map<PlayerSide, PlayerState>,
		private powerupManager: PowerupManager,
		private eventEmitter: GameEventEmitter
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

	setMode(mode: KeyboardMode): void {
		this.mode = mode;
	}

	assignLocalControls() {
		this.players.forEach((player, side) => {
			if (!player.isControlled) return;

			if (this.config.isLocalMultiplayer) {
				player.keyboardProfile = (side === PlayerSide.LEFT) ?
					this.activeProfiles.P1 : this.activeProfiles.P2;
			} else {
				player.keyboardProfile = (side === PlayerSide.LEFT) ?
					this.activeProfiles.DEFAULT : this.activeProfiles.DEFAULT_RIGHT;
			}
		});
	}

	waitForSpectatorChoice(): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			this.spectatorChoiceResolver = resolve;
			this.setMode(KeyboardMode.SPECTATOR_CHOICE);
			setTimeout(() => {
				if (this.spectatorChoiceResolver !== null) {
					this.spectatorChoiceResolver = null;
					this.eventEmitter.emit({ 
						type: GameEventType.SPECTATOR_CHOICE, 
						choice: false 
					});
					resolve(false);
				}
			}, 10000);
		});
	}

	private handleSpectatorChoiceKeys(key: number): void {
		if (key === Keys.Y) {
			this.spectatorChoiceResolver?.(true);
			this.spectatorChoiceResolver = null;
			this.setMode(KeyboardMode.SPECTATOR);
			this.eventEmitter.emit({ 
				type: GameEventType.SPECTATOR_CHOICE, 
				choice: true 
			});
		} else if (key === Keys.N) {
			this.spectatorChoiceResolver?.(false);
			this.spectatorChoiceResolver = null;
			this.eventEmitter.emit({ 
				type: GameEventType.SPECTATOR_CHOICE, 
				choice: false 
			});
		}
	}

	private handleGlobalKeyDown(event: KeyboardEvent): void {
		const key = event.keyCode;
		
		switch (this.mode) {
			case KeyboardMode.SPECTATOR_CHOICE:
				this.handleSpectatorChoiceKeys(key);
				break;
			case KeyboardMode.SPECTATOR:
				this.handleSpectatorInteraciot(key);
				break;
			case KeyboardMode.PAUSED:
				this.handlePauseMenuKeys(key);
				break;
			case KeyboardMode.NORMAL:
				if (key === Keys.ESC) {
					this.handleEscapeKey();
					return;
				}
				this.handlePowerupKeys(key);
				break;
		}
	}

	private handleSpectatorInteraciot(key: number): void {
		switch (key) {
			case Keys.Y:
				this.eventEmitter.emit({ type: GameEventType.EXIT_TO_MENU });
				break;
			case Keys.LEFT:
				this.eventEmitter.emit({ 
					type: GameEventType.SWITCH_GAME, 
					direction: Direction.LEFT 
				});
				break;
			case Keys.RIGHT:
				this.eventEmitter.emit({ 
					type: GameEventType.SWITCH_GAME, 
					direction: Direction.RIGHT 
				});
				break;
			case Keys.SPACE:
				this.eventEmitter.emit({ type: GameEventType.TOGGLE_MATCH_TREE });
				break;
		}
	}

	private handleEscapeKey(): void {
		this.eventEmitter.emit({ type: GameEventType.PAUSE_TOGGLE });
	}

	private handlePauseMenuKeys(key: number): void {
		switch (key) {
			case Keys.Y:
				this.eventEmitter.emit({ type: GameEventType.EXIT_TO_MENU });
				break;
			case Keys.N:
			case Keys.ESC:
				this.eventEmitter.emit({ type: GameEventType.PAUSE_TOGGLE });
				break;
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