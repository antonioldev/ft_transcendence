import { Color3, Color4, CreateSphere, LensFlare, LensFlareSystem, ParticleSystem, Scene, Sprite, SpriteManager, Texture, Vector3 } from "@babylonjs/core";
import { PARTICLE_CONFIGS, ParticleEffectType, ParticleTexturePath } from "../config/effectSceneConfig.js";


export function createSmokeSprite(scene: Scene): SpriteManager {
	const smokeManager = new SpriteManager("playerManager", ParticleTexturePath.CANDLE_SMOKE, 4, {width: 1024/20, height:512/4}, scene);
		
	const positions: [number, number, number][] = [
		[3, 2, -21],
		[-4, 2, 21],
		[-11, 2, 11],
		[11, 2, -13]
	];

	for (let i = 0; i < positions.length; i++) {
		const [x, y, z] = positions[i];
		const smoke = new Sprite("smoke" + i, smokeManager);
		smoke.position = new Vector3(x, y, z);
		smoke.color = new Color4(1, 1, 1, 1);
		smoke.width = 8;
		smoke.height = 12;
		smoke.playAnimation(0, 79, true, 20 * i);
	}

	return smokeManager;
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

export function createLensFlare(scene: Scene): LensFlareSystem {
	const emitter = CreateSphere("flareEmitter", { diameter: 0.1 }, scene);
	emitter.position = new Vector3(5, 4, 0);

	emitter.isVisible = false;
	const lensFlareSystem = new LensFlareSystem("lensFlareSystem", emitter, scene);

	const texture = ParticleTexturePath.FLARE_TRANSPARENT;
	
	new LensFlare(0.15, 0.1, new Color3(0.6, 0.8, 1), texture, lensFlareSystem);
	new LensFlare(0.1, 0.14, new Color3(0.61, 0.30, 0.86), texture,lensFlareSystem);
	new LensFlare(0.05, 0.18, new Color3(1, 0.9, 0.6), texture, lensFlareSystem);

	return lensFlareSystem;
}

export function createParticleSystem(scene: Scene, type: ParticleEffectType): ParticleSystem | null {
	const config = PARTICLE_CONFIGS[type];
	if (!config) return null;

	const particles = new ParticleSystem(config.name, config.capacity, scene);
	particles.particleTexture = new Texture(config.texturePath, scene);

	particles.emitter = config.emitter.position;
	particles.minEmitBox = config.emitter.minBox;
	particles.maxEmitBox = config.emitter.maxBox;

	particles.direction1 = config.direction.dir1;
	particles.direction2 = config.direction.dir2;

	particles.minSize = config.size.min;
	particles.maxSize = config.size.max;
	particles.minLifeTime = config.lifetime.min;
	particles.maxLifeTime = config.lifetime.max;

	particles.emitRate = config.emitRate;
	particles.color1 = config.color.color1;
	particles.color2 = config.color.color2;
	if (config.color.colorDead) particles.colorDead = config.color.colorDead;

	particles.gravity = config.gravity;
	if (config.angularSpeed) {
		particles.minAngularSpeed = config.angularSpeed.min;
		particles.maxAngularSpeed = config.angularSpeed.max;
	}
	
	if (config.blendMode) particles.blendMode = config.blendMode;

	if (config.autoStart) particles.start();

	return particles;
}

export function createFireworks(scene: Scene, count: number = 8): ParticleSystem[] {
	const fireworks: ParticleSystem[] = [];

	const colors = [
		new Color4(1, 0.8, 0.2, 1),   // Gold
		new Color4(0.2, 1, 0.3, 1),   // Green
		new Color4(0.3, 0.5, 1, 1),   // Blue
		new Color4(1, 0.3, 0.8, 1),   // Pink
		new Color4(0.8, 0.2, 1, 1),   // Purple
	];
	
	for (let i = 0; i < count; i++) {
		const particles = createParticleSystem(scene, ParticleEffectType.FIREWORK);
		if (!particles) continue;

		const x = (Math.random() - 0.5) * 16;
		const y = 2 + Math.random() * 2;
		const z = (Math.random() - 0.5) * 30;
		particles.emitter = new Vector3(x, y, z);

		const color = colors[Math.floor(Math.random() * colors.length)];
		particles.color1 = color;
		particles.color2 = color;
		
		particles.minEmitPower = 8;
		particles.maxEmitPower = 15;
		particles.createSphereEmitter(10);

		fireworks.push(particles);
	}
	
	return fireworks;
}

export function startFireworks(effects: any[], delayBetweenBursts: number = 250): void {
	const fireworks = effects.filter(effect => 
		effect instanceof ParticleSystem && effect.name === ParticleEffectType.FIREWORK
	);
	
	fireworks.forEach((fw, index) => {
		setTimeout(() => {
			fw.start();
			setTimeout(() => {
				fw.stop();
			}, 2000);
		}, index * delayBetweenBursts);
	});
}
