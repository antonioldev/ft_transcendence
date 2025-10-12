import { Engine, Scene, Vector3 } from "@babylonjs/core";
import { ViewMode } from '../../shared/constants.js';
import { GAME_CONFIG } from '../../shared/gameConfig.js';
import { GameObjects } from "../../shared/types.js";
import { Logger } from '../../utils/LogManager.js';
import { AnimationManager } from "./AnimationManager.js";

/**
 * The RenderManager class is responsible for managing the rendering loop,
 * camera updates, and screen resizing. It ensures smooth rendering of the
 * game scene, handles camera animations, and updates the active cameras
 * based on the game state and player controls.
 */
export class RenderManager {
	private isInitialized: boolean = false;
	isRunning: boolean = false;
	private lastFrameTime: number = 0;
	private fpsLimit: number = 60;
	private camerasAnimation: any[] = [];
	private resizeHandler: (() => void) | null = null;
	private targetLeft: Vector3 = new Vector3();
	private targetRight: Vector3 = new Vector3();

// ====================			CONSTRUCTOR			   ====================
	constructor(
		private engine: Engine,
		private scene: Scene,
		// private guiManager: GUIManager,
		private animationManager: AnimationManager,
		private gameObjects: GameObjects) {

		this.attachResizeHandler();
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
					// this.updateFPSDisplay(deltaTime);
					this.lastFrameTime = currentTime;
				} catch (error) {
					Logger.error('Error in render loop', 'RenderManager', error);
				}
			}
		});
	}

	stopRendering(): void {
		if (!this.isRunning) return;

		this.isRunning = false;
		if (this.engine)
			this.engine.stopRenderLoop();

	}

	// private updateFPSDisplay(deltaTime: number): void {
	// 	if (this.guiManager && this.guiManager.isReady()) {
	// 		const fps = 1000 / deltaTime;
	// 		this.guiManager.hud.updateFPS(fps);
	// 	}
	// }

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

	startCameraAnimation(cameras: any, viewMode: ViewMode, controlledSides: number[] = [], isLocalMultiplayer: boolean = false) {
		if (!this.scene || !cameras || viewMode === ViewMode.MODE_2D)
			return;

		const gameCameras = cameras;
		gameCameras.forEach((camera: any, index: number) => {
			if (!camera) return;

			if (isLocalMultiplayer || controlledSides.includes(index) || controlledSides.length === 0) {
				const positionAnimation = this.animationManager.createCameraMoveAnimation(camera.name);
				const targetAnimation   = this.animationManager.createCameraTargetAnimation();
				camera.animations = [positionAnimation, targetAnimation];
				const animationGroup = this.scene?.beginAnimation(camera, 0, 180, false);
				this.camerasAnimation.push(animationGroup);
			}
		});
	}

	stopCameraAnimation(): void {
		this.camerasAnimation.forEach(animation => {
			animation?.stop();
		});
		this.camerasAnimation = [];
	}

	// Update 3D camera targets to follow players
	update3DCameras(): void {
		if (!this.isInitialized || !this.gameObjects?.cameras) return;

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

// ====================			RESIZE HANDLING		   ====================
	attachResizeHandler(): void {
		if (this.resizeHandler) return;
		this.resizeHandler = () => {
			if (this.engine && !this.engine.isDisposed)
				this.engine.resize();
		};
		window.addEventListener("resize", this.resizeHandler);
	}

	private detachResizeHandler(): void {
		if (this.resizeHandler) {
			window.removeEventListener("resize", this.resizeHandler);
			this.resizeHandler = null;
		}
	}

// ====================			CLEANUP				   ====================
	dispose(): void {
		if (!this.isInitialized) return;

		// Stop rendering if active
		this.stopRendering();
		this.stopCameraAnimation();
		this.detachResizeHandler();

		this.isInitialized = false;

		Logger.debug('Class disposed', 'RenderManager');
	}
}