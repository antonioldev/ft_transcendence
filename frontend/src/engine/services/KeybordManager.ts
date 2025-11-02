import { DeviceSourceManager, DeviceType, Scene } from "@babylonjs/core";
import { webSocketClient } from '../../core/WebSocketClient.js';
import { Direction } from '../../shared/constants.js';
import { getPlayerBoundaries } from '../../shared/gameConfig.js';
import { KeyboardMode, Keys, PlayerSide, PROFILES_2D, PROFILES_3D, ViewMode } from '../../utils/constants.js';
import { Logger } from '../../utils/LogManager.js';
import { GameObjects, KeysProfile, PlayerState } from '../../utils/types.js';
import { GameConfig } from '../GameInitializer.js';
import { PowerupManager } from "./PowerUpManager.js";

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
		private callbacks: {
			onPauseToggle: () => void;
			onExitToMenu: () => void;
			onSwitchGame: (direction: Direction) => void;
			onToggleMatchTree: () => void;
		}
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
		this.setMode(KeyboardMode.SPECTATOR_CHOICE);
		return new Promise<boolean>((resolve) => {
			this.spectatorChoiceResolver = resolve;
			setTimeout(() => {
				if (this.spectatorChoiceResolver !== null) {
					this.spectatorChoiceResolver = null;
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
		} else if (key === Keys.N) {
			this.spectatorChoiceResolver?.(false);
			this.spectatorChoiceResolver = null;
		}
	}

	private handleGlobalKeyDown(event: KeyboardEvent): void {
		const key = event.keyCode;
		switch (this.mode) {
			case KeyboardMode.DISABLED:
				break;
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
					this.callbacks.onPauseToggle();
					return;
				}
				this.handlePowerupKeys(key);
				break;
		}
	}

	private handleSpectatorInteraciot(key: number): void {
		switch (key) {
			case Keys.Y:
				this.callbacks.onExitToMenu();
				break;
			case Keys.LEFT:
				this.callbacks.onSwitchGame(Direction.LEFT);
				break;
			case Keys.RIGHT:
				this.callbacks.onSwitchGame(Direction.RIGHT);
				break;
			case Keys.SPACE:
				this.callbacks.onToggleMatchTree();
				break;
		}
	}

	private handlePauseMenuKeys(key: number): void {
		switch (key) {
			case Keys.Y:
				this.callbacks.onExitToMenu();
				break;
			case Keys.N:
			case Keys.ESC:
				this.callbacks.onPauseToggle();
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
		if (!this.isInitialized || !this.deviceSourceManager ||
			!this.gameObjects || this.mode === KeyboardMode.DISABLED) return;

		try {
			const keyboardSource = this.deviceSourceManager.getDeviceSource(DeviceType.Keyboard);
			if (!keyboardSource) return;

			this.players.forEach((playerState, side) => {
				if (playerState.isControlled && playerState.keyboardProfile)
					this.handlePlayerMovement(keyboardSource, side, playerState, playerState.keyboardProfile);

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