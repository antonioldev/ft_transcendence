import { Engine, Scene, Vector3 } from "@babylonjs/core";
import { ViewMode } from '../../shared/constants.js';
import { GAME_CONFIG } from '../../shared/gameConfig.js';
import { GameObjects } from "../../shared/types.js";
import { Logger } from '../../utils/LogManager.js';

/**
 * The RenderManager class is responsible for managing the rendering loop,
 * camera updates, and screen resizing. It ensures smooth rendering of the
 * game scene, handles camera animations, and updates the active cameras
 * based on the game state and player controls.
 */
export class RenderManager {
	private isInitialized: boolean = false;
	private isRunning: boolean = false;
	private lastFrameTime: number = 0;
	private fpsLimit: number = 60;
	private targetLeft: Vector3 = new Vector3();
	private targetRight: Vector3 = new Vector3();

// ====================			CONSTRUCTOR			   ====================
	constructor(
		private engine: Engine,
		private scene: Scene,
		private gameObjects: GameObjects) {
		this.isInitialized = true;
	}

// ====================			RENDER LOOP			   ====================
	startRendering(): void {
		if (!this.isInitialized || this.isRunning || !this.engine || !this.scene)
			return;

		this.isRunning = true;
		this.lastFrameTime = performance.now();
		
		const frameInterval = 1000 / this.fpsLimit;
		
		this.engine.runRenderLoop(() => {
			if (!this.isRunning) return;

			const currentTime = performance.now();
			const deltaTime = currentTime - this.lastFrameTime;

			if (deltaTime >= frameInterval) {
				try {
					if (this.scene && this.scene.activeCamera) {
						this.scene.render();
					}
					this.lastFrameTime = currentTime;
				} catch (error) {
					Logger.error('Error in render loop', 'RenderManager', error);
				}
			}
		});
	}

// ====================			CAMERA MANAGEMENT		 ====================
	updateActiveCameras(viewMode: ViewMode, controlledSides: number[], isLocalMultiplayer: boolean): void {
		if (!this.scene || !this.gameObjects?.cameras || viewMode === ViewMode.MODE_2D) return;

		const cameras = this.gameObjects.cameras;
		const guiCamera = this.gameObjects.guiCamera;

		if (isLocalMultiplayer) {
			this.scene.activeCameras = [cameras[0], cameras[1], guiCamera];
			return;
		}

		let activeGameCamera = cameras[0];
		if (controlledSides.includes(0)) activeGameCamera = cameras[0];
		else if (controlledSides.includes(1)) activeGameCamera = cameras[1];

		if (activeGameCamera && guiCamera)
			this.scene.activeCameras = [activeGameCamera, guiCamera];
	}

	// Update 3D camera targets to follow players
	update3DCameras(viewMode: ViewMode): void {
		if (!this.isInitialized || !this.gameObjects?.cameras) return;

		if (viewMode === ViewMode.MODE_3D) return

		try {
			const [camera1, camera2] = this.gameObjects.cameras;
			const cameraFollowLimit = GAME_CONFIG.cameraFollowLimit;

			if (camera1 &&this.gameObjects.players.left) {
				this.targetLeft.copyFrom(this.gameObjects.players.left.position);
				this.targetLeft.x = Math.max(-cameraFollowLimit, Math.min(cameraFollowLimit, this.targetLeft.x));
				camera1.setTarget(Vector3.Lerp(camera1.getTarget(), this.targetLeft, GAME_CONFIG.followSpeed));
				
			}
			if (camera2 && this.gameObjects.players.right) {
				this.targetRight.copyFrom(this.gameObjects.players.right.position);
				this.targetRight.x = Math.max(-cameraFollowLimit, Math.min(cameraFollowLimit, this.targetRight.x));
				camera2.setTarget(Vector3.Lerp(camera2.getTarget(), this.targetRight, GAME_CONFIG.followSpeed));
			}
		} catch (error) {
			Logger.errorAndThrow('Error updating 3D cameras', 'Game', error);
		}
	}

// ====================			CLEANUP				   ====================
	dispose(): void {
		if (!this.isInitialized || !this.isRunning) return;

		this.isRunning = false;
		if (this.engine)
			this.engine.stopRenderLoop();

		this.isInitialized = false;

		Logger.debug('Class disposed', 'RenderManager');
	}
}