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
    if (keyboardSource.getInput(65) === 1)
        moveLeft(playerLeft);
    else if (keyboardSource.getInput(68) === 1)
        moveRight(playerLeft);

    if (keyboardSource.getInput(37) === 1)
        moveRight(playerRight);
    else if (keyboardSource.getInput(39) === 1)
        moveLeft(playerRight);
}

export function getFollowTarget(player: any) {
    const fieldBoundary = GAME_CONFIG.fieldWidth / 2;
    const followLimit = fieldBoundary - GAME_CONFIG.edgeBuffer;
    
    let targetX = player.position.x;
    if (targetX > followLimit)
        targetX = followLimit;
    else if (targetX < -followLimit)
        targetX = -followLimit;

    return new BABYLON.Vector3(targetX, player.position.y, player.position.z);
}