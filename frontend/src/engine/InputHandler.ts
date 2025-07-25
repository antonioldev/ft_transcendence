declare var BABYLON: typeof import('@babylonjs/core'); //declare var BABYLON: any;

import { GameMode, Direction } from '../shared/constants.js';
import { InputConfig, PlayerControls, GameObjects, InputData } from '../shared/types.js';
import { getPlayerBoundaries } from '../shared/gameConfig.js';
import { Logger } from '../core/LogManager.js';

/**
 * Handles player input for the game, supporting both local and remote multiplayer modes.
 * 
 * The `InputHandler` class manages device input sources (keyboard), processes player controls,
 * validates movement boundaries, and dispatches input events directly to the WebSocket. It supports 
 * different game modes and integrates with Babylon.js scenes for device management.
 */
export class InputHandler {
    private deviceSourceManager: any = null;
    private boundaries = getPlayerBoundaries();
    private gameObjects: GameObjects | null = null;
    private isLocalMultiplayer: boolean = false;
    private controlledSide: number = 0;
    private isDisposed: boolean = false;
    private onInputCallback: ((input: InputData) => void) | null = null;

    constructor(
        private gameMode: GameMode,
        private controls: InputConfig,
        scene: any
    ) {
        this.setupDeviceManager(scene);
        this.configureGameMode();
    }

    // ========================================
    // INITIALIZATION
    // ========================================

    // Setup device source manager
    private setupDeviceManager(scene: any): void {
        try {
            this.deviceSourceManager = new BABYLON.DeviceSourceManager(scene.getEngine());
        } catch (error) {
            Logger.error('Error setting up device manager', 'InputHandler', error);
        }
    }

    // Configure input based on game mode
    private configureGameMode(): void {
        this.isLocalMultiplayer = (
            this.gameMode === GameMode.TWO_PLAYER_LOCAL || 
            this.gameMode === GameMode.TOURNAMENT_LOCAL
        );

        // For remote games, we typically control side 0 (left)
        // This could be configured differently based on server assignment // TODO
        this.controlledSide = 0;

        Logger.info('InputHandler configured', 'InputHandler', {
            gameMode: this.gameMode,
            controlledSide: this.controlledSide,
            isLocalMultiplayer: this.isLocalMultiplayer
        });
    }

    // ========================================
    // SETUP
    // ========================================

    // Set game objects for position validation
    setGameObjects(gameObjects: GameObjects): void {
        this.gameObjects = gameObjects;
    }

    // Set controlled side for remote games
    setControlledSide(side: number): void {
        this.controlledSide = side;
    }

    // Set input callback
    onInput(callback: (input: InputData) => void): void {
        this.onInputCallback = callback;
    }

    // ========================================
    // INPUT PROCESSING
    // ========================================

    // Update input state - call this in render loop
    updateInput(): void {
        if (this.isDisposed || !this.deviceSourceManager || !this.gameObjects) return;

        try {
            const keyboardSource = this.deviceSourceManager.getDeviceSource(BABYLON.DeviceType.Keyboard);
            if (keyboardSource) {
                this.processKeyboardInput(keyboardSource);
            }
        } catch (error) {
            Logger.error('Error updating input', 'InputHandler', error);
        }
    }

    // Process keyboard input for both players
    private processKeyboardInput(keyboardSource: any): void {
        if (!this.gameObjects) return;

        // Handle left player (side 0)
        this.handlePlayerInput(
            keyboardSource, 
            this.gameObjects.players.left, 
            this.controls.playerLeft, 
            0
        );
        
        // Handle right player (side 1)
        this.handlePlayerInput(
            keyboardSource, 
            this.gameObjects.players.right, 
            this.controls.playerRight, 
            1
        );
    }

    // Handle input for a specific player
    private handlePlayerInput(
        keyboardSource: any, 
        player: any, 
        controls: PlayerControls, 
        side: number
    ): void {
        // Check if we should listen to this player
        if (!this.shouldListenToPlayer(side)) return;

        let direction = Direction.STOP;

        // Check input and validate boundaries
        if (keyboardSource.getInput(controls.left) === 1) {
            if (player.position.x > this.boundaries.left) {
                direction = Direction.LEFT;
            }
        } else if (keyboardSource.getInput(controls.right) === 1) {
            if (player.position.x < this.boundaries.right) {
                direction = Direction.RIGHT;
            }
        }

        // Send input
        if (this.onInputCallback) {
            this.onInputCallback({ side, direction });
        }
    }

    // Determine if we should listen to this player's input
    private shouldListenToPlayer(side: number): boolean {
        return this.isLocalMultiplayer || this.controlledSide === side;
    }

    // ========================================
    // CLEANUP
    // ========================================

    // Dispose input handler
    async dispose(): Promise<void> {
        if (this.isDisposed) return;

        this.isDisposed = true;

        try {
            // Clear callback
            this.onInputCallback = null;

            // Clear references
            this.gameObjects = null;

            // Dispose device manager
            if (this.deviceSourceManager) {
                this.deviceSourceManager.dispose();
                this.deviceSourceManager = null;
            }

            Logger.info('InputHandler disposed successfully', 'InputHandler');
        } catch (error) {
            Logger.error('Error disposing InputHandler', 'InputHandler', error);
        }
    }
}