import { DeviceSourceManager, DeviceType, Scene } from "@babylonjs/core";
import { Logger } from '../utils/LogManager.js';
import { GameConfig } from './GameConfig.js';
import { Direction } from '../shared/constants.js';
import { PlayerControls, GameObjects } from '../shared/types.js';
import { getPlayerBoundaries } from '../shared/gameConfig.js';
import { PlayerSide, PlayerState } from "./utils.js";
import { webSocketClient } from '../core/WebSocketClient.js';
import { PowerupManager } from "./PowerUpManager.js";

/**
 * Manages all keyboard input handling for the game
 */
export class KeyboardManager {
	private deviceSourceManager: DeviceSourceManager | null = null;
	private isInitialized: boolean = false;

	private gameState: {
		isPlaying: () => boolean;
		isPaused: () => boolean;
	};

	private gameCallbacks: {
		onPause: () => void;
		onResume: () => void;
		onExitToMenu: () => void;
	};

	constructor(
		scene: Scene,
		private config: GameConfig,
		private gameObjects: GameObjects,
		private players: Map<PlayerSide, PlayerState>,
		private powerupManager: PowerupManager | null = null,
		state: {
			isPlaying: () => boolean;
			isPaused: () => boolean;
		},
		callbacks: {
			onPause: () => void;
			onResume: () => void;
			onExitToMenu: () => void;
		}
	) {
		this.gameState = state;
		this.gameCallbacks = callbacks;
		this.deviceSourceManager = new DeviceSourceManager(scene.getEngine());
		this.setupGlobalKeyboardEvents();
		this.isInitialized = true;
	}

	// Set up global keyboard event listeners
	private setupGlobalKeyboardEvents(): void {
		document.addEventListener('keydown', (event) => {
			this.handleGlobalKeyDown(event);
		});
	}

	// Handle global keyboard events (pause, resume, powerups, etc.)
	private handleGlobalKeyDown(event: KeyboardEvent): void {
		const key = event.key.toLowerCase();

		// Handle escape key for pause/resume
		if (event.key === 'Escape') {
			this.handleEscapeKey();
			return;
		}

		// Handle pause menu navigation
		if (this.gameState.isPaused()) {
			this.handlePauseMenuKeys(key, event.key);
			return;
		}

		// Handle powerup activation during gameplay
		if (this.gameState.isPlaying())
			this.handlePowerupKeys(key);
	}

	// Handle escape key press for pause/resume functionality
	private handleEscapeKey(): void {
		if (this.gameState.isPlaying())
			this.gameCallbacks.onPause();
		else if (this.gameState.isPaused())
			this.gameCallbacks.onResume();
	}

	// Handle keyboard input during pause menu
	private handlePauseMenuKeys(key: string, originalKey: string): void {
		if (key === 'y') {
			this.gameCallbacks.onExitToMenu?.();
		} else if (key === 'n' || originalKey === 'Escape') {
			this.gameCallbacks.onResume();
		}
	}

	// Handle powerup activation keys
	private handlePowerupKeys(key: string): void {
		if (!this.powerupManager) return;

		switch (key) {
			// LEFT player (side 0): slots 0,1,2
			case 'c':
				this.powerupManager.requestActivatePowerup(0, 0);
				break;
			case 'v':
				this.powerupManager.requestActivatePowerup(0, 1);
				break;
			case 'b':
				this.powerupManager.requestActivatePowerup(0, 2);
				break;

			// RIGHT player (side 1): slots 0,1,2
			case 'i':
				this.powerupManager.requestActivatePowerup(1, 0);
				break;
			case 'o':
				this.powerupManager.requestActivatePowerup(1, 1);
				break;
			case 'p':
				this.powerupManager.requestActivatePowerup(1, 2);
				break;
		}
	}

	// Update player input based on keyboard state
	update(): void {
		if (!this.isInitialized || !this.deviceSourceManager || !this.gameObjects) return;

		try {
			const keyboardSource = this.deviceSourceManager.getDeviceSource(DeviceType.Keyboard);
			if (keyboardSource) {
				this.handlePlayerInput(
					keyboardSource, 
					this.gameObjects.players.left, 
					this.config.controls.playerLeft, 
					PlayerSide.LEFT
				);
				this.handlePlayerInput(
					keyboardSource, 
					this.gameObjects.players.right, 
					this.config.controls.playerRight, 
					PlayerSide.RIGHT
				);
			}
		} catch (error) {
			Logger.error('Error updating player input', 'KeyboardManager', error);
		}
	}

	// Handle individual player input
	private handlePlayerInput(
		keyboardSource: any, 
		player: any, 
		controls: PlayerControls, 
		side: PlayerSide
	): void {
		const playerState = this.players?.get(side);
		if (!playerState?.isControlled) return;

		const bounds = getPlayerBoundaries(this.players.get(side)!.size);

		let input: Direction = Direction.STOP;
		if (keyboardSource.getInput(controls.left) === 1)
			input = Direction.LEFT;
		else if (keyboardSource.getInput(controls.right) === 1)
			input = Direction.RIGHT;
		
		if (input === Direction.STOP) return;

		const inverted = this.players.get(side)!.inverted;
		const effectiveInput = inverted
			? (input === Direction.LEFT ? Direction.RIGHT : Direction.LEFT)
			: input;

		if (effectiveInput === Direction.LEFT && player.position.x <= bounds.left) return;
		if (effectiveInput === Direction.RIGHT && player.position.x >= bounds.right) return;

		webSocketClient.sendPlayerInput(side, input);
	}

	dispose(): void {
		if (!this.isInitialized) return;

		try {
			document.removeEventListener('keydown', this.handleGlobalKeyDown);
			
			this.deviceSourceManager?.dispose();
			this.deviceSourceManager = null;
			this.gameCallbacks = {
				onPause: () => {},
				onResume: () => {},
				onExitToMenu: () => {}
			};
			this.powerupManager = null;
			
			this.isInitialized = false;
			Logger.debug('KeyboardManager disposed', 'KeyboardManager');
		} catch (error) {
			Logger.error('Error disposing KeyboardManager', 'KeyboardManager', error);
		}
	}
}