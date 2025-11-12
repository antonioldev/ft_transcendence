import { AbstractMesh, Scene, SceneLoader, Vector3 } from "@babylonjs/core";
import type { StaticObject } from "../config/sceneTypes.js";

let cachedStaticModels: Map<string, AbstractMesh> = new Map();

export async function createStaticObject(scene: Scene, propData: StaticObject): Promise<AbstractMesh> {
	const fullPath = propData.model;
	let obj: AbstractMesh;
	if (cachedStaticModels.has(fullPath)) {
		obj = cachedStaticModels.get(fullPath)!.clone(`static_${Date.now()}`, null)!;
		obj.setEnabled(true);
	} else {
		const mesh = await SceneLoader.ImportMeshAsync("", "", fullPath, scene);
		obj = mesh.meshes[0];
		
		const cacheClone = obj.clone(`cache_${fullPath}`, null);
		cacheClone?.setEnabled(false);
		cachedStaticModels.set(fullPath, cacheClone!);
	}
	
	obj.position = new Vector3(propData.pos[0], propData.pos[2], propData.pos[1]);
	obj.scaling = new Vector3(propData.scale, propData.scale, propData.scale);
	obj.rotation.y = propData.rot;

	obj.getChildMeshes().forEach(m => {
		m.freezeWorldMatrix(); 
		if (m.material) m.material.freeze(); 
		m.doNotSyncBoundingInfo = true;
		m.isPickable = false;
		m.checkCollisions = false;
		m.cullingStrategy = AbstractMesh.CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY;
		m.doNotSerialize = true;
	});

	return obj;
}

export function clearStaticModelCache() {
	cachedStaticModels.forEach(mesh => mesh.dispose());
	cachedStaticModels.clear();
}

