import { DeviceSourceManager, DeviceType, Scene } from "@babylonjs/core";
import { Logger } from '../../utils/LogManager.js';
import { GameConfig } from '../GameConfig.js';
import { Direction, GameMode, ViewMode, GameState } from '../../shared/constants.js';
import { GameObjects } from '../../shared/types.js';
import { getPlayerBoundaries } from '../../shared/gameConfig.js';
import { PlayerSide, PlayerState } from "../utils.js";
import { webSocketClient } from '../../core/WebSocketClient.js';
import { PowerupManager } from "./PowerUpManager.js";
import { GameStateManager } from "../GameStateManager.js";


export const Keys = {
  W: 87, S: 83, A: 65, D: 68,
  C: 67, V: 86, B: 66, I: 73, O: 79, P: 80,
  UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39,
  ESC: 27, Y: 89, N: 78,
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
	private isInitialized: boolean = false;

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
		this.players.get(PlayerSide.LEFT)!.isControlled = false;
		this.players.get(PlayerSide.RIGHT)!.isControlled = false;
		
		switch (mode) {
			case GameMode.SINGLE_PLAYER:
			case GameMode.TWO_PLAYER_REMOTE:
			case GameMode.TOURNAMENT_REMOTE:
				if (controlledSides && controlledSides.length > 0) {
					const assignedSide = controlledSides[0] as PlayerSide;
					this.players.get(assignedSide)!.isControlled = true;
				}
				break;
			case GameMode.TWO_PLAYER_LOCAL:
			case GameMode.TOURNAMENT_LOCAL:
				this.players.get(PlayerSide.LEFT)!.isControlled = true;
				this.players.get(PlayerSide.RIGHT)!.isControlled = true;
				break;
		}
	}

	private handleGlobalKeyDown(event: KeyboardEvent): void {
		const key = event.keyCode;

		if (key === Keys.ESC) {
			this.handleEscapeKey();
			return;
		}

		if (this.gameState.isPaused() || this.gameState.isPausedLocal() || this.gameState.isSpectatorPaused()) {
			this.handlePauseMenuKeys(key);
			return;
		}

		if (this.gameState.isSpectator()) {
			this.handleSwitchGame(key);
			return;
		}

		if (this.gameState.isPlaying()) {
			this.handlePowerupKeys(key);
		}
	}

	// Updated escape key handler
	private handleEscapeKey(): void {
		if (!this.gameState.canShowPauseMenu()) return;

		if (this.gameState.isPaused() || this.gameState.isPausedLocal()) {
			this.gameCallbacks.onResume();
		} else if (this.gameState.isSpectatorPaused()) {
			this.gameState.set(GameState.SPECTATOR);
			this.gameCallbacks.onResume();
		} else if (this.gameState.isSpectator()) {
			this.gameState.set(GameState.SPECTATOR_PAUSED);
			this.gameCallbacks.onPause();
		} else {
			this.gameCallbacks.onPause();
		}
	}

	private handleSwitchGame(key: number): void {
		if (key === Keys.LEFT)
			webSocketClient.sendSwitchGame(Direction.LEFT);
		else if (key === Keys.RIGHT)
			webSocketClient.sendSwitchGame(Direction.RIGHT);
	}

	private handlePauseMenuKeys(key: number): void {
		switch (key) {
			case Keys.Y:
				this.gameCallbacks.onExitToMenu?.();
				break;
			case Keys.N:
			case Keys.ESC:
				this.gameCallbacks.onResume();
				break;
		}
	}

	private handlePowerupKeys(key: number): void {
		if (!this.powerupManager) return;
		for (const [side, playerState] of this.players.entries()) {
			if (!playerState.isControlled) continue;
			
			let profile: KeysProfile;
			if (this.config.isLocalMultiplayer)
				profile = (side === PlayerSide.LEFT) ? this.activeProfiles.P1 : this.activeProfiles.P2;
			else
				profile = this.activeProfiles.DEFAULT;
			
			if (key === profile.power.k1){
				this.powerupManager.requestActivatePowerup(side, 0);
				return;
			}
			if (key === profile.power.k2) {
				this.powerupManager.requestActivatePowerup(side, 1);
				return;
			}
			if (key === profile.power.k3) {
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

			for (const [side, playerState] of this.players.entries()) {
				if (!playerState.isControlled) continue;

				this.handlePlayerMovement(keyboardSource, side, playerState);
			}
			} catch (error) {
			Logger.error('Error updating player input', 'KeyboardManager', error);
		}
	}

	private handlePlayerMovement(keyboardSource: any, side: PlayerSide, playerState: PlayerState): void {
		if (!playerState.isControlled) return;
		
		const bounds = getPlayerBoundaries(playerState.size);
		const player = side === PlayerSide.LEFT ? this.gameObjects.players.left : this.gameObjects.players.right;

		let profile: KeysProfile;
		if (this.config.isLocalMultiplayer)
			profile = (side === PlayerSide.LEFT) ? this.activeProfiles.P1 : this.activeProfiles.P2;
		else if (this.config.viewMode === ViewMode.MODE_3D && side === PlayerSide.RIGHT)
			profile = this.activeProfiles.DEFAULT_RIGHT;
		else
			profile = this.activeProfiles.DEFAULT;

		let input: Direction = Direction.STOP;
		if (keyboardSource.getInput(profile.move.left) === 1)
			input = Direction.LEFT;
		else if (keyboardSource.getInput(profile.move.right) === 1)
			input = Direction.RIGHT;
		
		if (input === Direction.STOP) return;

		let effectiveInput = input;
		
		// 3D Player 2 camera inversion (ONLY in local multiplayer)
		if (this.config.isRemoteMultiplayer && 
			this.config.viewMode === ViewMode.MODE_3D && 
			side === PlayerSide.RIGHT) {
			effectiveInput = (input === Direction.LEFT) ? Direction.RIGHT : Direction.LEFT;
		}
		
		// Powerup inversion
		if (playerState.inverted) {
			effectiveInput = (effectiveInput === Direction.LEFT) ? Direction.RIGHT : Direction.LEFT;
		}

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