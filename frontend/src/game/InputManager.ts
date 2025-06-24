declare var BABYLON: any;

import { GAME_CONFIG, getPlayerBoundaries } from "./gameConfig.js";

export class InputManager {
    private deviceSourceManager: any;
    private boundaries = getPlayerBoundaries();
    private players: {left: any, right: any} | null = null;
    private inputConfig: any = null;

    constructor(scene: any) {
        this.deviceSourceManager = new BABYLON.DeviceSourceManager(scene.getEngine());
    }

    setupControls(players: {left: any, right: any}, gameMode: string): void {
        if (gameMode === "2D") {
            this.inputConfig = GAME_CONFIG.input2D;
        } else {
            this.inputConfig = GAME_CONFIG.input3D;
        }
        this.players = players;
    }

    updateInput(): void {
        const keyboardSource = this.deviceSourceManager.getDeviceSource(BABYLON.DeviceType.Keyboard);
        if (keyboardSource && this.players && this.inputConfig) {
            this.handleInput(keyboardSource, this.players, this.inputConfig);
        }
    }

    private handleInput(keyboardSource: any, players: any, input: any): void {
        // Player Left
        if (keyboardSource.getInput(input.playerLeft.left) === 1) {
            this.moveLeft(players.left);
        } else if (keyboardSource.getInput(input.playerLeft.right) === 1) {
            this.moveRight(players.left);
        }

        // Player Right  
        if (keyboardSource.getInput(input.playerRight.left) === 1) {
            this.moveLeft(players.right);
        } else if (keyboardSource.getInput(input.playerRight.right) === 1) {
            this.moveRight(players.right);
        }
    }

    private moveLeft(player: any): void {
        if (player.position.x > this.boundaries.left) {
            player.position.x -= GAME_CONFIG.playerSpeed;
        }
    }

    private moveRight(player: any): void {
        if (player.position.x < this.boundaries.right) {
            player.position.x += GAME_CONFIG.playerSpeed;
        }
    }

    getFollowTarget(player: any) {
        const followLimit = GAME_CONFIG.fieldBoundary - GAME_CONFIG.edgeBuffer;
        let targetX = Math.max(-followLimit, Math.min(followLimit, player.position.x));
        return new BABYLON.Vector3(targetX, player.position.y, player.position.z);
    }

    dispose(): void {
        this.deviceSourceManager?.dispose();
    }
}