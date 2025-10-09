import { Color3, Vector3, Scene} from "@babylonjs/core";
import { ParticleSystem, Texture, Color4 } from "@babylonjs/core";
import { RainConfig } from '../config/sceneTypes.js';

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

export function createFog(scene: Scene, fogColor: Color3): void {
	if (fogColor) {
		scene.fogMode = Scene.FOGMODE_EXP2;
		scene.fogColor = fogColor;
		scene.fogDensity = 0.02;
	} else {
		scene.fogMode = Scene.FOGMODE_NONE;
	}
}

export function createRainParticles(
	scene: Scene, 
	rainConfig: RainConfig
): ParticleSystem {
	const rain = new ParticleSystem("rain", rainConfig.density, scene);
	rain.particleTexture = new Texture("assets/textures/map0/raindrop.png", scene);

	rain.emitter = new Vector3(0, 20, 0);
	rain.minEmitBox = new Vector3(-rainConfig.width/2, 0, -rainConfig.height/2);
	rain.maxEmitBox = new Vector3(rainConfig.width/2, 0, rainConfig.height/2);

	rain.direction1 = new Vector3(-1, -rainConfig.speed, -1);
	rain.direction2 = new Vector3(1, -rainConfig.speed, 1);

	rain.minSize = 0.1;
	rain.maxSize = 0.2;
	rain.minLifeTime = 1;
	rain.maxLifeTime = 2;
	
	const rainColor = rainConfig.color;
	rain.color1 = rainColor;
	rain.color2 = rainColor;
	
	rain.emitRate = rainConfig.density;
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