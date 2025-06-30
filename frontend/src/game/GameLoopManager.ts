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
    private halfPlayerWidth = GAME_CONFIG.playerWidth / 2;
    private halfPlayerDepth = GAME_CONFIG.playerDepth / 2;
    private wallMinX = GAME_CONFIG.wallBounds.minX + GAME_CONFIG.ballRadius;
    private wallMaxX = GAME_CONFIG.wallBounds.maxX - GAME_CONFIG.ballRadius;

    private ballVelocity = { x: 0, z: 0 };
    // private ballVelocity = { 
    //     x: GAME_CONFIG.ballInitialVelocity.x, 
    //     z: GAME_CONFIG.ballInitialVelocity.z 
    // };
    private score = { left: 0, right: 0 };

    constructor(scene: any, gameObjects: GameObjects, inputManager: InputManager, guiManager: GUIManager) {
        this.scene = scene;
        this.gameObjects = gameObjects;
        this.inputManager = inputManager;
        this.guiManager = guiManager;
        const initialVel = getInitialBallVelocity(1);
        this.ballVelocity.x = initialVel.x;
        this.ballVelocity.z = initialVel.z;
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
        if (!this.checkWallCollisions())
            if (!this.checkPaddleCollisions())
                this.checkGoalCollisions();
        if (this.gameObjects.cameras.length > 1)
            this.update3DCameras();
    }

    private updateBallMovement(): void {
        this.gameObjects.ball.position.x += this.ballVelocity.x;
        this.gameObjects.ball.position.z += this.ballVelocity.z;
    }

    private checkWallCollisions(): boolean {
        const ballPosition = this.gameObjects.ball.position;
        
        if (ballPosition.x <= this.wallMinX) {
            ballPosition.x = this.wallMinX;
            this.ballVelocity.x = Math.abs(this.ballVelocity.x);
            return true;
        }
        
        if (ballPosition.x >= this.wallMaxX) {
            ballPosition.x = this.wallMaxX;
            this.ballVelocity.x = -Math.abs(this.ballVelocity.x);
            return true;
        }
        return false;
    }

    private checkPaddleCollisions(): boolean {
        const ballPos = this.gameObjects.ball.position;
        const ballRadius = GAME_CONFIG.ballRadius;
        
        // Check collision with left player
        const leftPlayer = this.gameObjects.players.left;
        const leftPlayerPos = leftPlayer.position;
        
        if (ballPos.z + ballRadius >= leftPlayerPos.z - this.halfPlayerDepth &&
            ballPos.z - ballRadius <= leftPlayerPos.z + this.halfPlayerDepth &&
            ballPos.x + ballRadius >= leftPlayerPos.x - this.halfPlayerWidth &&
            ballPos.x - ballRadius <= leftPlayerPos.x + this.halfPlayerWidth) {
            
            // this.ballVelocity.z = Math.abs(this.ballVelocity.z);
            const currentSpeed = this.getCurrentBallSpeed();
        
            // Calculate new direction
            const hitPosition = (ballPos.x - leftPlayerPos.x) / this.halfPlayerWidth;
            const maxAngle = GAME_CONFIG.ballMaxAngle;
            const newAngleX = hitPosition * maxAngle;
            
            // Set new direction
            this.ballVelocity.x = Math.sin(newAngleX) * currentSpeed;
            this.ballVelocity.z = Math.abs(Math.cos(newAngleX) * currentSpeed);
            console.log("Ball hit left player");
            return true;
        }
        
        // Check collision with right player
        const rightPlayer = this.gameObjects.players.right;
        const rightPlayerPos = rightPlayer.position;
        
        if (ballPos.z + ballRadius >= rightPlayerPos.z - this.halfPlayerDepth &&
            ballPos.z - ballRadius <= rightPlayerPos.z + this.halfPlayerDepth &&
            ballPos.x + ballRadius >= rightPlayerPos.x - this.halfPlayerWidth &&
            ballPos.x - ballRadius <= rightPlayerPos.x + this.halfPlayerWidth) {
            
            // this.ballVelocity.z = Math.abs(this.ballVelocity.z);
            const currentSpeed = this.getCurrentBallSpeed();
            // this.ballVelocity.z = -Math.abs(this.ballVelocity.z);
            // Calculate new direction
            const hitPosition = (ballPos.x - rightPlayerPos.x) / this.halfPlayerWidth;
            const maxAngle = GAME_CONFIG.ballMaxAngle;
            const newAngleX = hitPosition * maxAngle;
            
            // Set new direction
            this.ballVelocity.x = Math.sin(newAngleX) * currentSpeed;
            this.ballVelocity.z = -Math.abs(Math.cos(newAngleX) * currentSpeed);
            console.log("Ball hit right player");
            return true;
        }
        
        return false;
    }


    private checkGoalCollisions(): void {
        const ballPosition = this.gameObjects.ball.position;
    
        // Right player's goal (behind right player at top, negative Z)
        if (ballPosition.z <= GAME_CONFIG.goalBounds.rightGoal) {
            this.score.right++;
            console.log(`Right player scores! Score: ${this.score.left} - ${this.score.right}`);
            this.resetBall(1);
        }
        
        // Left player's goal (behind left player at bottom, positive Z)
        if (ballPosition.z >= GAME_CONFIG.goalBounds.leftGoal) {
            this.score.left++;
            console.log(`Left player scores! Score: ${this.score.left} - ${this.score.right}`);
            this.resetBall(-1);
        }
    }

    private resetBall(serveDirection: number): void {
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

    private getCurrentBallSpeed(): number {
        return Math.sqrt(this.ballVelocity.x ** 2 + this.ballVelocity.z ** 2);
    }
    
    setBallSpeed(speed: number): void {
        const currentSpeed = this.getCurrentBallSpeed();
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