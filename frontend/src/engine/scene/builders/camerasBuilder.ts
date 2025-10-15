import { Camera, FreeCamera, Scene, Vector3, Viewport } from "@babylonjs/core";
import { GameMode, ViewMode } from '../../../shared/constants.js';
import { get3DCamera1Viewport, get3DCamera2Viewport, getCamera2DPosition, getSoloCameraViewport } from '../../utils.js';

export function createCameras(scene: Scene, name: string, viewMode: ViewMode, gameMode: GameMode): any[] {
	let cameras = [];

	const position = getCamera2DPosition();
	if (viewMode === ViewMode.MODE_2D) {
		const camera = new FreeCamera(name  + "1", position, scene);
		camera.setTarget(new Vector3(3, 0, 0));
		camera.viewport = getSoloCameraViewport();
		camera.rotation.z = -(Math.PI / 2);
		camera.fov = 1.1;
		cameras.push(camera);
	} else {
		if (gameMode === GameMode.SINGLE_PLAYER) {
			const camera = new FreeCamera(name  + "1", position, scene);
			camera.setTarget(Vector3.Zero());
			camera.viewport = getSoloCameraViewport();
			cameras.push(camera);
		} else {
			const camera1 = new FreeCamera(name + "1", position, scene);
			camera1.setTarget(Vector3.Zero());

			const camera2 = new FreeCamera(name + "2", position, scene);
			camera2.setTarget(Vector3.Zero());

			if (gameMode === GameMode.TOURNAMENT_LOCAL || gameMode === GameMode.TWO_PLAYER_LOCAL) {
				camera1.viewport = get3DCamera1Viewport();
				camera2.viewport = get3DCamera2Viewport();
			} else {
				camera1.viewport = getSoloCameraViewport()
				camera2.viewport = getSoloCameraViewport()
			}
			cameras.push(camera1, camera2);
		}
	}

	return cameras;
}

export function createGuiCamera(scene: any, name: string) {
	let camera;
	camera = new FreeCamera(name, Vector3.Zero(), scene);
	camera.setTarget(Vector3.Zero());
	camera.viewport = new Viewport(0, 0, 1, 1);
	camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
	camera.orthoTop = 1;
	camera.orthoBottom = -1;
	camera.orthoLeft = -1;
	camera.orthoRight = 1;
	camera.layerMask = 0x20000000;

	return camera;
}