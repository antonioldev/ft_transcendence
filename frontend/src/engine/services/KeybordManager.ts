import { DeviceSourceManager, DeviceType, Scene } from "@babylonjs/core";
import { Logger } from '../../utils/LogManager.js';
import { GameConfig } from '../GameConfig.js';
import { Direction, GameMode, ViewMode } from '../../shared/constants.js';
import { PlayerControls, GameObjects } from '../../shared/types.js';
import { getPlayerBoundaries } from '../../shared/gameConfig.js';
import { PlayerSide, PlayerState } from "../utils.js";
import { webSocketClient } from '../../core/WebSocketClient.js';
import { PowerupManager } from "./PowerUpManager.js";
import { GameStateManager } from "../GameStateManager.js";


export const Keys = {
  W: 87, S: 83, A: 65, D: 68,
  C: 67, V: 86, B: 66, I: 73, O: 79, P: 80,
  UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39
} as const;
export enum LocalSlot { A , B };
export type MoveKeys = { left: number; right: number; };
export type PowerKeys = { k1: number; k2: number; k3: number };
export type KeysProfile = { move: MoveKeys; power: PowerKeys };


export const PROFILES_2D = {
  P1: { move: { left: Keys.W, right: Keys.S }, power: { k1: Keys.C, k2: Keys.V, k3: Keys.B } },
  P2: { move: { left: Keys.UP, right: Keys.DOWN }, power: { k1: Keys.I, k2: Keys.O, k3: Keys.P } },
} as const;

export const PROFILES_3D = {
  P1: { move: { left: Keys.A, right: Keys.D }, power: { k1: Keys.C, k2: Keys.V, k3: Keys.B } },
  P2: { move: { left: Keys.LEFT, right: Keys.RIGHT }, power: { k1: Keys.I, k2: Keys.O, k3: Keys.P } },
} as const;



// Manages all keyboard input handling for the game
export class KeyboardManager {
	private deviceSourceManager: DeviceSourceManager | null = null;
	private globalKeyDownHandler: (event: KeyboardEvent) => void;
	private activeProfiles!: { P1: KeysProfile; P2: KeysProfile };
	private isInitialized: boolean = false;

	private gameCallbacks: {
		onPause: () => void;
		onResume: () => void;
		onExitToMenu: () => void;
	};

	constructor(
		scene: Scene,
		config: GameConfig,
		private gameObjects: GameObjects,
		private players: Map<PlayerSide, PlayerState>,
		private powerupManager: PowerupManager | null = null,
		private gameState: GameStateManager,
		callbacks: {
			onPause: () => void;
			onResume: () => void;
			onExitToMenu: () => void;
		}
	) {
		this.gameCallbacks = callbacks;
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

	mapModeAndAssignment(mode: GameMode, controlledSides?: number[]) {
		this.players.get(PlayerSide.LEFT)!.controlledBy = null;
		this.players.get(PlayerSide.RIGHT)!.controlledBy = null;
		
		switch (mode) {
		case GameMode.SINGLE_PLAYER:
		case GameMode.TWO_PLAYER_REMOTE:
		case GameMode.TOURNAMENT_REMOTE:
			if (controlledSides && controlledSides.length > 0) {
				const assignedSide = controlledSides[0] as PlayerSide;
				this.players.get(assignedSide)!.controlledBy = LocalSlot.A;
			}
			break;
		case GameMode.TWO_PLAYER_LOCAL:
		case GameMode.TOURNAMENT_LOCAL:
			this.players.get(PlayerSide.LEFT)!.controlledBy = LocalSlot.A;
			this.players.get(PlayerSide.RIGHT)!.controlledBy = LocalSlot.B;
			break;
		}
	}

	// Handle global keyboard events (pause, resume, powerups, etc.)
	private handleGlobalKeyDown(event: KeyboardEvent): void {
		const key = event.key.toLowerCase();

		if (event.key === 'Escape') {
			this.handleEscapeKey();
			return;
		}

		if (this.gameState.isPaused() || this.gameState.isPausedLocal()) {
			this.handlePauseMenuKeys(key, event.key);
			return;
		}

		if (this.gameState.isPlaying())
			this.handlePowerupKeys(key);
	}

	private handleEscapeKey(): void {
		if (this.gameState.canShowPauseMenu()) {
			if (this.gameState.isPlaying() || this.gameState.isMatchEnded())
				this.gameCallbacks.onPause();
			else if (this.gameState.isPaused() || this.gameState.isPausedLocal())
				this.gameCallbacks.onResume();
		}
	}

	private handlePauseMenuKeys(key: string, originalKey: string): void {
		if (key === 'y')
			this.gameCallbacks.onExitToMenu?.();
		else if (key === 'n' || originalKey === 'Escape')
			this.gameCallbacks.onResume();
	}

	private handlePowerupKeys(key: string): void {
		if (!this.powerupManager) return;

		for (const [side, playerState] of this.players.entries()) {
			if (!playerState.isControlled || playerState.controlledBy === null) continue;
			
			const profile = (playerState.controlledBy === LocalSlot.A) ? this.activeProfiles.P1 : this.activeProfiles.P2;
			
			if (key === profile.power.k1.toLowerCase()) {
				this.powerupManager.requestActivatePowerup(side, 0);
				return;
			}
			if (key === profile.power.k2.toLowerCase()) {
				this.powerupManager.requestActivatePowerup(side, 1);
				return;
			}
			if (key === profile.power.k3.toLowerCase()) {
				this.powerupManager.requestActivatePowerup(side, 2);
				return;
			}
		}
	}

	update(): void {
		if (!this.isInitialized || !this.deviceSourceManager || !this.gameObjects) return;

		try {
		const keyboardSource = this.deviceSourceManager.getDeviceSource(DeviceType.Keyboard);
		if (!keyboardSource) return;

		// Check each player
		for (const [side, playerState] of this.players.entries()) {
			if (!playerState.isControlled || playerState.controlledBy === null) continue;
			
			const profile = (playerState.controlledBy === LocalSlot.A) ? this.activeProfiles.P1 : this.activeProfiles.P2;
			this.handlePlayerMovement(keyboardSource, profile, side, playerState);
		}
		} catch (error) {
		Logger.error('Error updating player input', 'KeyboardManager', error);
		}
	}

	// Handle individual player input
	private handlePlayerMovement(keyboardSource: any, profile: KeysProfile, side: PlayerSide, playerState: PlayerState): void {
		const bounds = getPlayerBoundaries(playerState.size);
		const player = side === PlayerSide.LEFT ? this.gameObjects.players.left : this.gameObjects.players.right;

		let input: Direction = Direction.STOP;
		if (keyboardSource.getInput(profile.move.left) === 1)
			input = Direction.LEFT;
		else if (keyboardSource.getInput(profile.move.right) === 1)
			input = Direction.RIGHT;
		
		if (input === Direction.STOP) return;

		const inverted = playerState.inverted;
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