import { Vector3,  HemisphericLight, PointLight, Color3 } from "@babylonjs/core";

// Creates a light source for the given scene
export function createLight(scene: any, name: string, position: any, intensity: number = 1): any {
	const light = new HemisphericLight(name, position, scene);
	light.intensity = intensity;
	light.diffuse = new Color3(1, 1, 1);
	return light;
}

export function create3DLighting(scene: any): any {
	let lights = [];

	// Use PointLight instead of DirectionalLight
	const mainLight = new PointLight(
		"mainLight", 
		new Vector3(20, 30, -20), // High sun position
		scene
	);
	mainLight.intensity = 1.2;
	mainLight.diffuse = new Color3(1, 1, 1);
	mainLight.specular = new Color3(0.2, 0.2, 0.2);
	lights.push(mainLight);
	
	const hemiLight = new HemisphericLight(
		"hemiLight",
		new Vector3(0, 1, 0),
		scene
	);
	hemiLight.intensity = 0.3;
	hemiLight.diffuse = new Color3(1, 1, 1);
	hemiLight.groundColor = new Color3(0.5, 0.5, 0.5);
	hemiLight.specular = new Color3(0, 0, 0);
	lights.push(hemiLight);

	return lights;
}