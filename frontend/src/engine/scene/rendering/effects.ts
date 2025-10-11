import { Color3, Vector3, Scene, LensFlare, LensFlareSystem} from "@babylonjs/core";
import { ParticleSystem, Texture, Color4, CreateSphere } from "@babylonjs/core";

export function createDustParticleSystem(scene: Scene): ParticleSystem {
	const dust = new ParticleSystem("dust", 1000, scene);
	dust.particleTexture = new Texture("assets/textures/particle/flare_transparent.png", scene);

	dust.emitter = new Vector3(0, 2, 0);
	dust.minEmitBox = new Vector3(-10, 0, -20);
	dust.maxEmitBox = new Vector3(10, 4, 20);

	dust.direction1 = new Vector3(-0.5, -0.1, -0.5);
	dust.direction2 = new Vector3(0.5, 0.3, 0.5);

	dust.minSize = 0.05;
	dust.maxSize = 0.1;
	dust.minLifeTime = 8;
	dust.maxLifeTime = 14;

	dust.emitRate = 200;
	dust.color1 = new Color4(0.8, 0.8, 0.8, 0.3);
	dust.color2 = new Color4(0.5, 0.5, 0.5, 0.1);

	dust.blendMode = ParticleSystem.BLENDMODE_ADD;

	dust.start();

	return dust;
}

export function createFog(scene: Scene, fogColor: Color3, density: number): void {
	if (fogColor) {
		scene.fogMode = Scene.FOGMODE_EXP2;
		scene.fogColor = fogColor;
		scene.fogDensity = density;
	} else {
		scene.fogMode = Scene.FOGMODE_NONE;
	}
}

export function createSnow(scene: Scene): ParticleSystem {
	const snow = new ParticleSystem("snow", 5000, scene);
	snow.particleTexture = new Texture("assets/textures/particle/bubble.png", scene);

	snow.emitter = new Vector3(0, 30, 0);
	snow.minEmitBox = new Vector3(-50, 0, -50);
	snow.maxEmitBox = new Vector3(50, 0, 50);

	snow.direction1 = new Vector3(-2, -3, -2);
	snow.direction2 = new Vector3(2, -6, 2);

	snow.minSize = 0.05;
	snow.maxSize = 0.1;
	snow.minLifeTime = 4;
	snow.maxLifeTime = 8;
	
	const snowColor = new Color4(1, 1, 1, 0.8);
	snow.color1 = snowColor;
	snow.color2 = snowColor;
	
	snow.emitRate = 2000;
	snow.gravity = new Vector3(0, -2, 0);
	
	snow.minAngularSpeed = -0.5;
	snow.maxAngularSpeed = 0.5;
	
	snow.start();

	return snow;
}

export function createLensFlare(scene: Scene): LensFlareSystem {
	const emitter = CreateSphere("flareEmitter", { diameter: 0.1 }, scene);
	emitter.position = new Vector3(8, 3, 0);
	emitter.isVisible = false;
	const lensFlareSystem = new LensFlareSystem("lensFlareSystem", emitter, scene);

	const texture = "assets/textures/particle/flare_transparent.png";
	
	new LensFlare(0.15, 0, new Color3(0.6, 0.8, 1), texture, lensFlareSystem);
	new LensFlare(0.1, 0.1, new Color3(0.61, 0.30, 0.86), texture,lensFlareSystem);
	new LensFlare(0.05, 0.2, new Color3(1, 0.9, 0.6), texture, lensFlareSystem);

	return lensFlareSystem;
}

export function createRainParticles(scene: Scene): ParticleSystem {
	const density = 1500;
	const speed = -50;
	const color = new Color4(0, 1, 1, 0);

	const rain = new ParticleSystem("rain", density, scene);
	rain.particleTexture = new Texture("assets/textures/particle/raindrop.png", scene);

	rain.emitter = new Vector3(0, 20, 0);
	rain.minEmitBox = new Vector3(-50, 0, -50);
	rain.maxEmitBox = new Vector3(50, 0, 50);

	// rain.minEmitBox = new Vector3(-rainConfig.width/2, 0, -rainConfig.height/2);
	// rain.maxEmitBox = new Vector3(rainConfig.width/2, 0, rainConfig.height/2);

	rain.direction1 = new Vector3(-1, speed, -1);
	rain.direction2 = new Vector3(1, speed, 1);

	rain.minSize = 0.2;
	rain.maxSize = 0.3;
	rain.minLifeTime = 1;
	rain.maxLifeTime = 2;
	
	const rainColor = color;
	rain.color1 = rainColor;
	rain.color2 = rainColor;
	
	rain.emitRate = density;
	rain.gravity = new Vector3(0, -9.81, 0);
	
	rain.start();

	
	return rain;
}

export function createUnderwaterParticles(scene: Scene): ParticleSystem {
	const particles = new ParticleSystem("underwater", 1000, scene);
	particles.particleTexture = new Texture("assets/textures/particle/bubble.png", scene);

	particles.emitter = new Vector3(0, 3, 0);
	particles.minEmitBox = new Vector3(-15, -5, -25);
	particles.maxEmitBox = new Vector3(15, 10, 25);

	particles.direction1 = new Vector3(-0.2, -0.1, -0.2);
	particles.direction2 = new Vector3(0.2, 0.2, 0.2);

	particles.minSize = 0.05;
	particles.maxSize = 0.3;
	particles.minLifeTime = 10;
	particles.maxLifeTime = 20;

	particles.emitRate = 100;
	particles.color1 = new Color4(0.5, 0.7, 1.0, 0.4);
	particles.color2 = new Color4(0.3, 0.5, 0.8, 0.2);

	particles.gravity = new Vector3(0, 1, 0);

	particles.blendMode = ParticleSystem.BLENDMODE_ADD;
	particles.start();

	return particles;
}