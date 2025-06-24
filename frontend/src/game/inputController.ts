declare var BABYLON: any;

import { GAME_CONFIG, getPlayerBoundaries } from "./gameConfig.js";

const PLAYER_BOUNDARIES = getPlayerBoundaries();

function moveLeft(player: any): void {
    if (player.position.x > PLAYER_BOUNDARIES.left)
        player.position.x -= GAME_CONFIG.playerSpeed;
}

function moveRight(player: any): void {
    if (player.position.x < PLAYER_BOUNDARIES.right)
        player.position.x += GAME_CONFIG.playerSpeed;
}

export function handlePlayerInput(keyboardSource: any, playerLeft: any, playerRight: any, input: any): void {
    // Player Left
    if (keyboardSource.getInput(input.playerLeft.left) === 1)
        moveLeft(playerLeft);
    else if (keyboardSource.getInput(input.playerLeft.right) === 1)
        moveRight(playerLeft);

    // Player Right  
    if (keyboardSource.getInput(input.playerRight.left) === 1)
        moveLeft(playerRight);
    else if (keyboardSource.getInput(input.playerRight.right) === 1)
        moveRight(playerRight);
}

export function getFollowTarget(player: any) {
    const followLimit = GAME_CONFIG.fieldBoundary - GAME_CONFIG.edgeBuffer;
    
    let targetX = player.position.x;
    if (targetX > followLimit)
        targetX = followLimit;
    else if (targetX < -followLimit)
        targetX = -followLimit;

    return new BABYLON.Vector3(targetX, player.position.y, player.position.z);
}