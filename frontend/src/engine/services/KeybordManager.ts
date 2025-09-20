import { DeviceSourceManager, DeviceType, Scene } from "@babylonjs/core";
import { Logger } from '../../utils/LogManager.js';
import { GameConfig } from '../GameConfig.js';
import { Direction } from '../../shared/constants.js';
import { PlayerControls, GameObjects } from '../../shared/types.js';
import { getPlayerBoundaries } from '../../shared/gameConfig.js';
import { PlayerSide, PlayerState } from "../utils.js";
import { webSocketClient } from '../../core/WebSocketClient.js';
import { PowerupManager } from "./PowerUpManager.js";

export type MoveKeys = { up: string; down: string; left?: string; right?: string };
export type PowerKeys = { k1: string; k2: string; k3: string };

export const PROFILE_P1 = {
	move: { up: "w", down: "s", left: "a", right: "d" } satisfies MoveKeys,
	power: { k1: "c", k2: "v", k3: "b" } satisfies PowerKeys,
};

export const PROFILE_P2 = {
	move: { up: "arrowup", down: "arrowdown", left: "arrowleft", right: "arrowright" } satisfies MoveKeys,
	power: { k1: "i", k2: "o", k3: "p" } satisfies PowerKeys,
};

const isAnyDown = (getInput: (key: string) => number, keys?: string[]) =>
	!!keys?.some(k => getInput(k) === 1);

// Manages all keyboard input handling for the game
export class KeyboardManager {
	private deviceSourceManager: DeviceSourceManager | null = null;
	private globalKeyDownHandler: (event: KeyboardEvent) => void;
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
		this.globalKeyDownHandler = this.handleGlobalKeyDown.bind(this);
		this.setupGlobalKeyboardEvents();
		this.isInitialized = true;
	}

	private setupGlobalKeyboardEvents(): void {
		document.addEventListener('keydown', this.globalKeyDownHandler);
	}

	// Handle global keyboard events (pause, resume, powerups, etc.)
	private handleGlobalKeyDown(event: KeyboardEvent): void {
		const key = event.key.toLowerCase();

		if (event.key === 'Escape') {
			this.handleEscapeKey();
			return;
		}

		if (this.gameState.isPaused()) {
			this.handlePauseMenuKeys(key, event.key);
			return;
		}

		if (this.gameState.isPlaying())
			this.handlePowerupKeys(key);
	}

	private handleEscapeKey(): void {
		if (this.gameState.isPlaying())
			this.gameCallbacks.onPause();
		else if (this.gameState.isPaused())
			this.gameCallbacks.onResume();
	}

	private handlePauseMenuKeys(key: string, originalKey: string): void {
		if (key === 'y') {
			this.gameCallbacks.onExitToMenu?.();
		} else if (key === 'n' || originalKey === 'Escape') {
			this.gameCallbacks.onResume();
		}
	}

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
			document.removeEventListener('keydown', this.globalKeyDownHandler);
			
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