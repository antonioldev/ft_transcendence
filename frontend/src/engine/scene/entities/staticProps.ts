import { AbstractMesh, Matrix, Mesh, Quaternion, Scene, SceneLoader, Vector3, Ray } from "@babylonjs/core";
import { StaticObject } from "../config/sceneTypes.js";

export async function createStaticObject(
	scene: Scene, 
	propData: StaticObject
): Promise<any> {
	const fullPath = propData.model;
	const mesh = await SceneLoader.ImportMeshAsync("", "", fullPath, scene);
	const obj = mesh.meshes[0];
	
	obj.position = new Vector3(propData.pos[0], propData.pos[2], propData.pos[1]);
	obj.scaling = new Vector3(propData.scale, propData.scale, propData.scale);
	obj.rotation.y = propData.rot;
	return obj;
}

export async function createStaticObjects(
	scene: Scene, 
	staticObjects: StaticObject[]
): Promise<any[]> {
	const groupedByModel = new Map<string, StaticObject[]>();
	
	for (const obj of staticObjects) {
		if (!groupedByModel.has(obj.model)) {
			groupedByModel.set(obj.model, []);
		}
		groupedByModel.get(obj.model)!.push(obj);
	}
	
	const createdObjects: any[] = [];
	
	for (const [modelPath, objects] of groupedByModel.entries()) {
		const result = await SceneLoader.ImportMeshAsync("", "", modelPath, scene);
		const baseMesh = result.meshes.find(m => m instanceof Mesh && m.getTotalVertices() > 0) as Mesh;
		
		if (!baseMesh) {
			console.error(`No valid mesh found in ${modelPath}`);
			continue;
		}
		
		const matrices: number[] = [];
		
		for (const propData of objects) {
			const matrix = Matrix.Compose(
				new Vector3(propData.scale, propData.scale, propData.scale),
				Quaternion.FromEulerAngles(0, propData.rot, 0),
				new Vector3(propData.pos[0], propData.pos[2], propData.pos[1])
			);
			matrices.push(...matrix.m);
		}
		
		baseMesh.thinInstanceSetBuffer("matrix", new Float32Array(matrices), 16);
		
		baseMesh.freezeWorldMatrix();
		if (baseMesh.material) baseMesh.material.freeze();
		baseMesh.doNotSyncBoundingInfo = true;
		baseMesh.isPickable = false;
		baseMesh.checkCollisions = false;
		baseMesh.cullingStrategy = AbstractMesh.CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY;
		baseMesh.freezeNormals();
		baseMesh.doNotSerialize = true;
		
		result.meshes.forEach(mesh => {
			mesh.isPickable = false;
			mesh.checkCollisions = false;
		});

		createdObjects.push(baseMesh);
	}
	
	return createdObjects;
}
