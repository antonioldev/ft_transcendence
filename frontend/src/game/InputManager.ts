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

// Manages player input and interactions with the game environment
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

    // Sets the callback function to handle network updates for player movements
    setNetworkCallback(callback: (side: number, direction: Direction) => void): void {
        this.networkCallback = callback;
    }

    configureInput(gameMode: GameMode, controlledSide: number = 0): void {
        this.gameMode = gameMode;
        this.controlledSide = controlledSide;
        
        // Determine if this is local multiplayer (client controls both players)
        this.isLocalMultiplayer = (
            gameMode === GameMode.TWO_PLAYER_LOCAL || 
            gameMode === GameMode.TOURNAMENT_LOCAL
        );
        
        console.log(`🎮 InputManager configured:`, {
            gameMode: gameMode,
            controlledSide: controlledSide,
            isLocalMultiplayer: this.isLocalMultiplayer
        });
    }

    // Configures controls based on the game mode (2D or 3D) and assigns player references
    setupControls(players: {left: any, right: any}, gameMode: ViewMode): void {
        if (gameMode === ViewMode.MODE_2D)
            this.inputConfig = GAME_CONFIG.input2D;
        else
            this.inputConfig = GAME_CONFIG.input3D;
        this.players = players;
    }

    // Updates the input state by checking the current keyboard inputs
    updateInput(): void {
        const keyboardSource = this.deviceSourceManager.getDeviceSource(BABYLON.DeviceType.Keyboard);
        if (keyboardSource && this.players && this.inputConfig) {
            this.handleInput(keyboardSource, this.players, this.inputConfig);
        }
    }

    private shouldListenToLeftPlayer(): boolean {
        return this.isLocalMultiplayer || this.controlledSide === 0;
    }

    private shouldListenToRightPlayer(): boolean {
        return this.isLocalMultiplayer || this.controlledSide === 1;
    }

    // Processes keyboard input and triggers the appropriate network callback for player movements
    // private handleInput(keyboardSource: any, players: any, input: any): void {
    //     // Player Left (side 0)
    //     if (keyboardSource.getInput(input.playerLeft.left) === 1) {
    //         if (players.left.position.x > this.boundaries.left) {
    //             this.networkCallback?.(0, Direction.LEFT);
    //         }
    //     } else if (keyboardSource.getInput(input.playerLeft.right) === 1) {
    //         if (players.left.position.x < this.boundaries.right) {
    //             this.networkCallback?.(0, Direction.RIGHT);
    //         }
    //     } else {
    //         this.networkCallback?.(0, Direction.STOP);
    //     }

    //     // Player Right (side 1) - for two player local
    //     if (keyboardSource.getInput(input.playerRight.left) === 1) {
    //         if (players.right.position.x > this.boundaries.left) {
    //             this.networkCallback?.(1, Direction.LEFT);
    //         }
    //     } else if (keyboardSource.getInput(input.playerRight.right) === 1) {
    //         if (players.right.position.x < this.boundaries.right) {
    //             this.networkCallback?.(1, Direction.RIGHT);
    //         }
    //     } else {
    //         this.networkCallback?.(1, Direction.STOP);
    //     }
    // }

    private handleInput(keyboardSource: any, players: any, input: any): void {
        // Handle Player Left (side 0) input ONLY if we should control it
        if (this.shouldListenToLeftPlayer()) {
            if (keyboardSource.getInput(input.playerLeft.left) === 1) {
                if (players.left.position.x > this.boundaries.left) {
                    this.networkCallback?.(0, Direction.LEFT);
                }
            } else if (keyboardSource.getInput(input.playerLeft.right) === 1) {
                if (players.left.position.x < this.boundaries.right) {
                    this.networkCallback?.(0, Direction.RIGHT);
                }
            } else {
                this.networkCallback?.(0, Direction.STOP);
            }
        }

        // Handle Player Right (side 1) input ONLY if we should control it
        if (this.shouldListenToRightPlayer()) {
            if (keyboardSource.getInput(input.playerRight.left) === 1) {
                if (players.right.position.x > this.boundaries.left) {
                    this.networkCallback?.(1, Direction.LEFT);
                }
            } else if (keyboardSource.getInput(input.playerRight.right) === 1) {
                if (players.right.position.x < this.boundaries.right) {
                    this.networkCallback?.(1, Direction.RIGHT);
                }
            } else {
                this.networkCallback?.(1, Direction.STOP);
            }
        }
    }

    // Calculates the camera follow target position based on the player's position
    getFollowTarget(player: any) {
        const followLimit = GAME_CONFIG.fieldBoundary - GAME_CONFIG.edgeBuffer;
        let targetX = Math.max(-followLimit, Math.min(followLimit, player.position.x));
        return new BABYLON.Vector3(targetX, player.position.y, player.position.z);
    }

    // Disposes of the device source manager to clean up resources
    dispose(): void {
        this.deviceSourceManager?.dispose();
    }
}