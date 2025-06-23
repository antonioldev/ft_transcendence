declare var BABYLON: any;

import { GAME_CONFIG, getPlayerBoundaries } from './gameConfig.js';

const PLAYER_BOUNDARIES = getPlayerBoundaries();

function moveLeft(player: any): void {
    if (player.position.x > PLAYER_BOUNDARIES.left)
        player.position.x -= GAME_CONFIG.playerSpeed;
}

function moveRight(player: any): void {
    if (player.position.x < PLAYER_BOUNDARIES.right)
        player.position.x += GAME_CONFIG.playerSpeed;
}

export function handlePlayerInput(keyboardSource: any, playerLeft: any, playerRight: any): void {
    if (keyboardSource.getInput(87) === 1)
        moveLeft(playerLeft);
    else if (keyboardSource.getInput(83) === 1)
        moveRight(playerLeft);

    if (keyboardSource.getInput(40) === 1)
        moveRight(playerRight);
    else if (keyboardSource.getInput(38) === 1)
        moveLeft(playerRight);

}