import { Engine, Scene, Vector3 } from "@babylonjs/core";
import { GAME_CONFIG } from '../../shared/gameConfig.js';
import { ViewMode } from '../../utils/constants.js';
import { Logger } from '../../utils/LogManager.js';
import type { GameObjects } from "../../utils/types.js";

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
					if (this.scene && this.scene.activeCamera)
						this.scene.render();
					this.lastFrameTime = currentTime;
				} catch (error) {
					Logger.error('Error in render loop', 'RenderManager', error);
				}
			}
		});
	}

// ====================			CAMERA MANAGEMENT		 ====================
	updateActiveCameras(viewMode: ViewMode, controlledSides: number[], isLocalMultiplayer: boolean): void {
		if (!this.scene || !this.gameObjects?.cameras || viewMode === ViewMode.MODE_2D || isLocalMultiplayer) return;

		const cameras = this.gameObjects.cameras;
		const guiCamera = this.gameObjects.guiCamera;

		const activeGameCamera = controlledSides.includes(1) ? cameras[1] : cameras[0];

		if (activeGameCamera && guiCamera)
			this.scene.activeCameras = [activeGameCamera, guiCamera];
	}

	updateCamerasAngle(viewMode: ViewMode): void {
	if (viewMode === ViewMode.MODE_2D || !this.gameObjects?.cameras) return;

	const [camera1, camera2] = this.gameObjects.cameras;
	const limit = GAME_CONFIG.cameraFollowLimit;
	const speed = GAME_CONFIG.followSpeed;
	const minDist = GAME_CONFIG.minUpdateDistance;

	// Update left camera
	if (camera1 && this.gameObjects.players.left) {
		const playerX = Math.max(-limit, Math.min(limit, this.gameObjects.players.left.position.x));
		this.targetLeft.set(playerX, this.gameObjects.players.left.position.y, this.gameObjects.players.left.position.z);
		
		if (Vector3.Distance(camera1.getTarget(), this.targetLeft) > minDist)
			camera1.setTarget(Vector3.Lerp(camera1.getTarget(), this.targetLeft, speed));
	}

	// Update right camera
	if (camera2 && this.gameObjects.players.right) {
		const playerX = Math.max(-limit, Math.min(limit, this.gameObjects.players.right.position.x));
		this.targetRight.set(playerX, this.gameObjects.players.right.position.y, this.gameObjects.players.right.position.z);
		
		if (Vector3.Distance(camera2.getTarget(), this.targetRight) > minDist)
			camera2.setTarget(Vector3.Lerp(camera2.getTarget(), this.targetRight, speed));
	}
}

// ====================			CLEANUP				   ====================
	dispose(): void {
		if (!this.isInitialized || !this.isRunning) return;

		this.isRunning = false;
		this.engine?.stopRenderLoop();

		this.isInitialized = false;

		Logger.debug('Class disposed', 'RenderManager');
	}
}