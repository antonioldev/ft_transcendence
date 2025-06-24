
declare var BABYLON: any;

import { GameObjects } from './sceneBuilder.js';
import { InputManager } from './InputManager.js';
import { GAME_CONFIG, getInitialBallVelocity } from './gameConfig.js';
import { GUIManager } from './GuiManager.js';

export class GameLoopManager {
    private scene: any;
    private gameObjects: GameObjects;
    private inputManager: InputManager;
    private guiManager: GUIManager | null = null;
    private isRunning = false;

    private ballVelocity = { 
        x: GAME_CONFIG.ballInitialVelocity.x, 
        z: GAME_CONFIG.ballInitialVelocity.z 
    };
    private score = { left: 0, right: 0 };

    constructor(scene: any, gameObjects: GameObjects, inputManager: InputManager, guiManager: GUIManager) {
        this.scene = scene;
        this.gameObjects = gameObjects;
        this.inputManager = inputManager;
        this.guiManager = guiManager;
    }

    start(): void {
        if (this.isRunning)
            return;
        this.isRunning = true;

        this.scene.registerBeforeRender(() => {
            if (!this.isRunning)
                return;
            this.inputManager.updateInput();
            if (this.guiManager)
                this.guiManager.updateFPS();
            this.updateGame();
        });
    }

    private updateGame(): void {
        this.updateBallMovement();
        this.checkWallCollisions();
        this.checkGoalCollisions();
        if (this.gameObjects.cameras.length > 1)
            this.update3DCameras();
    }

    private updateBallMovement(): void {
        const step = 1/60;
        this.gameObjects.ball.position.x += this.ballVelocity.x;
        this.gameObjects.ball.position.z += this.ballVelocity.z;
    }

    private checkWallCollisions(): void {
        const ballPosition = this.gameObjects.ball.position;
        
        // Left wall collision
        if (ballPosition.x <= GAME_CONFIG.wallBounds.minX + GAME_CONFIG.ballRadius) {
            ballPosition.x = GAME_CONFIG.wallBounds.minX + GAME_CONFIG.ballRadius;
            this.ballVelocity.x = Math.abs(this.ballVelocity.x);
            console.log("Ball hit top wall");
        }
        
        // Right wall collision
        if (ballPosition.x >= GAME_CONFIG.wallBounds.maxX - GAME_CONFIG.ballRadius) {
            ballPosition.x = GAME_CONFIG.wallBounds.maxX - GAME_CONFIG.ballRadius;
            this.ballVelocity.x = -Math.abs(this.ballVelocity.x);
            console.log("Ball hit bottom wall");
        }
    }

    private checkGoalCollisions(): void {
        const ballPosition = this.gameObjects.ball.position;
    
        // Top goal (bottom player scores)
        if (ballPosition.z <= GAME_CONFIG.goalBounds.topGoal) {
            this.score.right++;
            console.log(`Bottom player scores! Score: ${this.score.left} - ${this.score.right}`);
            this.resetBall('right');
        }
        
        // Bottom goal (top player scores)
        if (ballPosition.z >= GAME_CONFIG.goalBounds.bottomGoal) {
            this.score.left++;
            console.log(`Top player scores! Score: ${this.score.left} - ${this.score.right}`);
            this.resetBall('left');
        }
    }

    private resetBall(serveDirection: 'left' | 'right'): void {
        // Reset ball to center
        this.gameObjects.ball.position.x = 0;
        this.gameObjects.ball.position.z = 0;
        
        // Set velocity using config
        const newVelocity = getInitialBallVelocity(serveDirection);
        this.ballVelocity.x = newVelocity.x;
        this.ballVelocity.z = newVelocity.z;
        
        console.log(`Ball reset, serving ${serveDirection}`);
    }

    private update3DCameras(): void {
        const [camera1, camera2] = this.gameObjects.cameras;
        
        if (camera1 && camera2) {
            const targetLeft = this.inputManager.getFollowTarget(this.gameObjects.players.left);
            const targetRight = this.inputManager.getFollowTarget(this.gameObjects.players.right);

            camera1.setTarget(BABYLON.Vector3.Lerp(camera1.getTarget(), targetLeft, GAME_CONFIG.followSpeed));
            camera2.setTarget(BABYLON.Vector3.Lerp(camera2.getTarget(), targetRight, GAME_CONFIG.followSpeed));
        }
    }

    getScore(): { left: number, right: number } {
        return { left: this.score.left, right: this.score.right };
    }

    setBallSpeed(speed: number): void {
        const currentSpeed = Math.sqrt(this.ballVelocity.x ** 2 + this.ballVelocity.z ** 2);
        const ratio = speed / currentSpeed;
        this.ballVelocity.x *= ratio;
        this.ballVelocity.z *= ratio;
    }

    stop(): void {
        this.isRunning = false;
    }

    dispose(): void {
        this.stop();
        this.inputManager.dispose();
    }
}