declare var BABYLON: any;

import { GAME_CONFIG, getPlayerBoundaries } from '../shared/gameConfig.js';
import { Direction, ViewMode, GameMode } from '../shared/constants.js';

interface PlayerControls {
    left: number;
    right: number;
}
  
interface InputConfig {
    playerLeft: PlayerControls;
    playerRight: PlayerControls;
}

/**
 * Manages player input and interactions with the game environment.
 */
export class InputManager {
    private deviceSourceManager: any;
    private boundaries = getPlayerBoundaries();
    private players: {left: any, right: any} | null = null;
    private inputConfig: InputConfig | null = null;
    private networkCallback: ((side: number, direction: Direction) => void) | null = null;
    private gameMode: GameMode | null = null;
    private controlledSide: number = 0;
    private isLocalMultiplayer: boolean = false;

    constructor(scene: any) {
        // Initializes the input manager with the given scene
        this.deviceSourceManager = new BABYLON.DeviceSourceManager(scene.getEngine());
    }

    /**
     * Sets the callback function to handle network updates for player movements.
     * @param callback - The callback function to handle input events.
     */
    setNetworkCallback(callback: (side: number, direction: Direction) => void): void {
        this.networkCallback = callback;
    }

    /**
     * Configures input handling based on game mode and controlled side.
     * @param gameMode - The current game mode.
     * @param controlledSide - Which side this client controls (0 = left, 1 = right).
     */
    configureInput(gameMode: GameMode, controlledSide: number = 0): void {
        this.gameMode = gameMode;
        this.controlledSide = controlledSide;
        
        // Determine if this is local multiplayer (client controls both players)
        this.isLocalMultiplayer = (
            gameMode === GameMode.TWO_PLAYER_LOCAL || 
            gameMode === GameMode.TOURNAMENT_LOCAL
        );
        
        console.log(`🎮 InputManager configured:`, {
            gameMode: GameMode[gameMode],
            controlledSide: controlledSide,
            isLocalMultiplayer: this.isLocalMultiplayer
        });
    }

    /**
     * Configures controls based on the view mode (2D or 3D) and assigns player references.
     * @param players - The player objects to control.
     * @param viewMode - The current view mode (2D or 3D).
     */
    setupControls(players: {left: any, right: any}, viewMode: ViewMode): void {
        if (viewMode === ViewMode.MODE_2D)
            this.inputConfig = GAME_CONFIG.input2D;
        else
            this.inputConfig = GAME_CONFIG.input3D;
        this.players = players;
    }

    /**
     * Updates the input state by checking the current keyboard inputs.
     */
    updateInput(): void {
        const keyboardSource = this.deviceSourceManager.getDeviceSource(BABYLON.DeviceType.Keyboard);
        if (keyboardSource && this.players && this.inputConfig) {
            this.handleInput(keyboardSource, this.players, this.inputConfig);
        }
    }

    /**
     * Determines if this client should listen to input for a specific player side.
     * @param side - The player side (0 = left, 1 = right).
     * @returns True if this client should handle input for this side.
     */
    private shouldListenToPlayer(side: number): boolean {
        return this.isLocalMultiplayer || this.controlledSide === side;
    }

    /**
     * Processes input for a specific player.
     * @param keyboardSource - The keyboard input source.
     * @param player - The player object to control.
     * @param controls - The control configuration for this player.
     * @param side - The player side (0 for left, 1 for right).
     */
    private handlePlayerInput(keyboardSource: any, player: any, controls: PlayerControls, side: number): void {
        if (!this.shouldListenToPlayer(side)) return;

        if (keyboardSource.getInput(controls.left) === 1) {
            if (player.position.x > this.boundaries.left) {
                this.networkCallback?.(side, Direction.LEFT);
            }
        } else if (keyboardSource.getInput(controls.right) === 1) {
            if (player.position.x < this.boundaries.right) {
                this.networkCallback?.(side, Direction.RIGHT);
            }
        } else {
            this.networkCallback?.(side, Direction.STOP);
        }
    }

    /**
     * Processes keyboard input and triggers the appropriate network callback for player movements.
     * @param keyboardSource - The keyboard input source.
     * @param players - The player objects.
     * @param input - The input configuration.
     */
    private handleInput(keyboardSource: any, players: any, input: InputConfig): void {
        // Handle Player Left (side 0)
        this.handlePlayerInput(keyboardSource, players.left, input.playerLeft, 0);
        
        // Handle Player Right (side 1)
        this.handlePlayerInput(keyboardSource, players.right, input.playerRight, 1);
    }

    /**
     * Calculates the camera follow target position based on the player's position.
     * @param player - The player object to follow.
     * @returns The target position for the camera.
     */
    getFollowTarget(player: any) {
        const followLimit = GAME_CONFIG.fieldBoundary - GAME_CONFIG.edgeBuffer;
        let targetX = Math.max(-followLimit, Math.min(followLimit, player.position.x));
        return new BABYLON.Vector3(targetX, player.position.y, player.position.z);
    }

    /**
     * Disposes of the device source manager to clean up resources.
     */
    dispose(): void {
        this.deviceSourceManager?.dispose();
    }
}