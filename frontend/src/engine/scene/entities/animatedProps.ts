import { Scene, SceneLoader, Vector3 } from "@babylonjs/core";
import { ActorConfig } from "../config/sceneTypes.js";

let cachedActorModels: Map<string, any> = new Map();

export async function createFlyingActor(
	scene: Scene, 
	actor: any,
	scale: number = 1,
	flyForward: boolean = false
): Promise<any> {
	actor.scaling = new Vector3(scale, scale, scale);
	
	const speed = 0.08 + Math.random() * 0.12;
	const height = 3 + Math.random() * 3;
	const sidePosition = -30 + Math.random() * 60;
	let positionZ = flyForward ? -50 : 50;
	const startOffset = Math.random() * 60;
	positionZ += flyForward ? -startOffset : startOffset;

	let time = Math.random() * Math.PI * 2;
	const verticalSpeed = 0.005 + Math.random() * 0.005;
	const verticalAmplitude = 0.5 + Math.random() * 1.5;

	scene.onBeforeRenderObservable.add(() => {
		if (flyForward) {
			positionZ += speed;
			if (positionZ > 50) positionZ = -70;
		} else {
			positionZ -= speed;
			if (positionZ < -50) positionZ = 70;
		}

		time += verticalSpeed;
		const verticalOffset = Math.sin(time) * verticalAmplitude;
		
		actor.position.x = sidePosition;
		actor.position.y = height + verticalOffset;
		actor.position.z = positionZ;
		
		actor.rotation.y = flyForward ? 0 : Math.PI;
		actor.rotation.z = Math.sin(time) * 0.1;
	});
	
	return actor;
}

export async function createSwimmingActor(
	scene: Scene, 
	actor: any,
	scale: number = 1,
	swimLeft: boolean = false
): Promise<any> {
	actor.scaling = new Vector3(scale, scale, scale);
	
	const speed = 0.02 + Math.random() * 0.03;
	const height = 1 + Math.random() * 7;
	const depth = -50 + Math.random() * 100;
	let positionX = swimLeft ? 30 : -30;
	const startOffset = Math.random() * 60;
	positionX += swimLeft ? -startOffset : startOffset;

	let time = Math.random() * Math.PI * 2;
	const verticalSpeed = 0.005 + Math.random() * 0.005;
	const verticalAmplitude = 0.1 + Math.random() * 0.5;

	scene.onBeforeRenderObservable.add(() => {
		if (swimLeft) {
			positionX -= speed;
			if (positionX < -30) positionX = 30;
		} else {
			positionX += speed;
			if (positionX > 30) positionX = -30;
		}

		time += verticalSpeed;
		const verticalOffset = Math.sin(time) * verticalAmplitude;
		
		actor.position.x = positionX;
		actor.position.y = height + verticalOffset;
		actor.position.z = depth;
	});
	
	return actor;
}

async function loadOrCloneActor(
	scene: Scene, 
	modelPath: string, 
	prefix: string
): Promise<any> {
	if (cachedActorModels.has(modelPath)) {
		const cached = cachedActorModels.get(modelPath);
		const actor = cached.clone(`${prefix}_${Date.now()}`);
		actor.setEnabled(true);
		return actor;
	} else {
		const result = await SceneLoader.ImportMeshAsync("", "", modelPath, scene);
		const actor = result.meshes[0];
		
		const cacheClone = actor.clone(`cache_${modelPath}`, null);
		cacheClone?.setEnabled(false);
		cachedActorModels.set(modelPath, cacheClone);
		
		return actor;
	}
}

export async function createFloatingActor(
	scene: Scene,
	actor: any,
	scale: number = 1,
	floatRight: boolean = false
): Promise<any> {
	actor.scaling = new Vector3(scale, scale, scale);

	const speed = 0.03 + Math.random() * 0.04;
	const height = Math.random() * 1;
	const positionX = floatRight ? 25 : -20;

	let positionZ = -50;

	const startOffset = Math.random() * 40;
	positionZ += floatRight ? -startOffset : startOffset;

	let time = Math.random() * Math.PI * 2;

	const floatSpeed = 0.003 + Math.random() * 0.003;
	const floatAmplitude = 0.2 + Math.random() * 0.3;

	scene.onBeforeRenderObservable.add(() => {
		positionZ += speed;
		if (positionZ > 50) positionZ = -50;

		time += floatSpeed;
		const floatOffset = Math.sin(time) * floatAmplitude;

		const distanceFromCenter = Math.abs(positionZ);
		const maxDistance = 30;
		
		const distanceScale = 1.0 - (distanceFromCenter / maxDistance) * 0.3;
		const finalScale = 1 * distanceScale;

		actor.position.x = positionX;
		actor.position.y = height + floatOffset;
		actor.position.z = positionZ;

		actor.scaling = new Vector3(finalScale, finalScale, finalScale);
	});

	return actor;
}

export async function createActor(
	scene: Scene,
	config: ActorConfig,
	index: number = 0
): Promise<any> {
	const scale = config.scale ?? 1;
	const actor = await loadOrCloneActor(scene, config.model, config.type);
	
	switch (config.type) {
		case 'flying':
			const flyLeft = !config.model.includes('bird1');
			return createFlyingActor(scene, actor, scale, flyLeft);
		case 'swimming':
			const swimLeft = config.model.includes('fish1');
			return createSwimmingActor(scene, actor, scale, swimLeft);
		case 'floating':
			const floatRight = index % 2 === 1;
			return createFloatingActor(scene, actor, scale, floatRight);
		default:
			throw new Error(`Unknown actor type: ${config.type}`);
	}
}