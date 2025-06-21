declare var BABYLON: any;
import { GAME_CONFIG } from './gameConfig.js';

export function moveLeft(player: any): void {
    if (player.position.x > -22)
        player.position.x -= GAME_CONFIG.playerSpeed;
}

export function moveRight(player: any): void {
    if (player.position.x < 22)
        player.position.x += GAME_CONFIG.playerSpeed;
}

export function handlePlayerInput(keyboardSource: any, playerLeft: any, playerRight: any) {
    if (keyboardSource.getInput(65) == 1) {
        moveLeft(playerLeft);
    }
    else if (keyboardSource.getInput(68) == 1) {
        moveRight(playerLeft);
    }
    if (keyboardSource.getInput(37) == 1) {
        moveRight(playerRight);
    }
    else if (keyboardSource.getInput(39) == 1) {
        moveLeft(playerRight);
    }
}