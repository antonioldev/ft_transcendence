
declare var BABYLON: any;

import { GameObjects } from './sceneBuilder.js';
import { InputManager } from './InputManager.js';
import { GAME_CONFIG } from './gameConfig.js';
import { GUIManager } from './GuiManager.js';

export class GameLoopManager {
    private scene: any;
    private gameObjects: GameObjects;
    private inputManager: InputManager;
    private guiManager: GUIManager | null = null;
    private isRunning = false;

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
            if (!this.isRunning) return;
            
            this.inputManager.updateInput();
            if (this.guiManager)
                this.guiManager.updateFPS();
            this.updateGame();
        });
    }

    private updateGame(): void {
        if (this.gameObjects.cameras.length > 1)
            this.update3DCameras();
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

    stop(): void {
        this.isRunning = false;
    }

    dispose(): void {
        this.stop();
        this.inputManager.dispose();
    }
}