import { ParticleSystem, Texture, Color4, Vector3, Scene} from "@babylonjs/core";
import { Animation} from "@babylonjs/core/Animations/animation";
import { AdvancedDynamicTexture, Image} from "@babylonjs/gui";

interface FireworkDetails {
	bursts: number;
	delay: {min:number; max: number};
	distance: {min:number; max: number};
	spread: number;
	liftY: {min:number; max: number};
	particle: {
		capacity: number;
	texturePaths: string[];
	emitterSphereRadius: number;
	emitRate: number;
	size: { min: number; max: number };
	lifeTime: { min: number; max: number };
	power: { min: number; max: number };
	gravityY: number;
	blendMode?: number;
	colors: Array<{ c: Color4; }>;
  };
	stopAfterMs: number;
	disposeDelayMs: number;
};

// export const PARTIAL_FIREWORKS: FireworkDetails = {
//   bursts: 4,
//   delay: { min: 120, max: 280 },
//   distance: { min: 6, max: 12 },
//   spread: 10,
//   liftY: { min: 0.5, max: 1.5 },
//   particle: {
// 	capacity: 800,
// 	texturePaths: [
// 	  "assets/textures/particle/flare_transparent.png",
// 	  "assets/textures/particle/flare.png"
// 	],
// 	emitterSphereRadius: 1.2,
// 	emitRate: 400,
// 	size: { min: 0.05, max: 0.3 },
// 	lifeTime: { min: 0.7, max: 1.4 },
// 	power: { min: 4, max: 8 },
// 	gravityY: -6.0,
// 	blendMode: ParticleSystem.BLENDMODE_ONEONE,
// 	colors: [{ c: new Color4(1.0, 0.92, 0.5, 1.0) }],
//   },
//   stopAfterMs: 1200,
//   disposeDelayMs: 2000,
// };

export const FINAL_FIREWORKS: FireworkDetails = {
	bursts: 8,
	delay: { min: 150, max: 350 },
	distance: { min: 6, max: 10 },
	spread: 4,
	liftY: { min: 0, max: 3 },
	particle: {
	capacity: 1500,
	texturePaths: [
	  "assets/textures/particle/flare_transparent.png",
	  "assets/textures/particle/flare.png"
	],
	emitterSphereRadius: 2,
	emitRate: 600,
	size: { min: 0.1, max: 0.8 },
	lifeTime: { min: 1.5, max: 3.0 },
	power: { min: 6, max: 12 },
	gravityY: -9.81,
	blendMode: ParticleSystem.BLENDMODE_ONEONE,
	colors: [
		{ c: new Color4(1, 0.8, 0.2, 1) },
		{ c: new Color4(0.2, 1, 0.3, 1) },
		{ c: new Color4(0.3, 0.5, 1, 1) },
		{ c: new Color4(1, 0.3, 0.8, 1) },
		{ c: new Color4(0.8, 0.2, 1, 1) },
		],
	},
	stopAfterMs: 2000,
	disposeDelayMs: 3000,
};

export class Particles {
	private availableParticles: ParticleSystem[] = [];
	private activeParticles: Set<ParticleSystem> = new Set();
	private maxSize: number = 20;

	getParticle(scene: Scene, profile: FireworkDetails): ParticleSystem {
		let ps = this.availableParticles.pop();

		if (!ps) {
			ps = new ParticleSystem(`fw_pooled_${Date.now()}`, profile.particle.capacity, scene);
			this.configureParticleSystem(ps, profile);
		}
		this.activeParticles.add(ps);
		return ps;
	}

	returnParticle(ps: ParticleSystem): void {
		if (!this.activeParticles.has(ps)) return;
		
		ps.stop();
		ps.reset();
		this.activeParticles.delete(ps);
		
		if (this.availableParticles.length < this.maxSize)
			this.availableParticles.push(ps);
		else
			ps.dispose();
	}

	private configureParticleSystem(ps: ParticleSystem, profile: FireworkDetails): void {
		const p = profile.particle;
		try {
			ps.particleTexture = new Texture("assets/textures/particle/flare_transparent.png", ps.getScene());
		} catch (error) {
			ps.particleTexture = new Texture("assets/textures/particle/flare.png", ps.getScene());
		}
		
		ps.minSize = p.size.min;
		ps.maxSize = p.size.max;
		ps.minLifeTime = p.lifeTime.min;
		ps.maxLifeTime = p.lifeTime.max;
		ps.emitRate = p.emitRate;
		ps.createSphereEmitter(p.emitterSphereRadius);
		ps.minEmitPower = p.power.min;
		ps.maxEmitPower = p.power.max;
		ps.gravity = new Vector3(0, p.gravityY, 0);
		ps.blendMode = p.blendMode ?? ParticleSystem.BLENDMODE_ONEONE;
	}

	private chooseColorPair(profile: FireworkDetails) {
		const colors = profile.particle.colors;
		const idx = Math.floor(Math.random() * colors.length);
		return colors[idx];
	}

	spawnOneExplosion(scene: Scene, pos: Vector3, profile: FireworkDetails): void {
		const ps = this.getParticle(scene, profile);
		
		ps.emitter = pos;
		const pair = this.chooseColorPair(profile);
		ps.color1 = pair.c;
		ps.color2 = pair.c;
		ps.colorDead = new Color4(0, 0, 0, 0);

		ps.start();
		
		setTimeout(() => {
			ps.stop();
			setTimeout(() => {
				this.returnParticle(ps);
			}, profile.disposeDelayMs);
		}, profile.stopAfterMs);
	}

	spawnBurstsForCamera(scene: Scene, camera: any, profile: FireworkDetails): void {
		for (let i = 0; i < profile.bursts; i++) {
			const dist = randomInRange(profile.distance.min, profile.distance.max);
			const spread = profile.spread;
			const lift = randomInRange(profile.liftY.min, profile.liftY.max);

			const forward = camera.getForwardRay ? camera.getForwardRay().direction : new Vector3(0, 0, 1);
			const x = camera.position.x + forward.x * dist + (Math.random() - 0.5) * spread;
			const y = camera.position.y + forward.y * dist + (Math.random() - 0.5) * 2 + lift;
			const z = camera.position.z + forward.z * dist + (Math.random() - 0.5) * spread;
			const pos = new Vector3(x, y, z);

			const delay = randomInRange(profile.delay.min, profile.delay.max);
			createDelayedAction(() => this.spawnOneExplosion(scene, pos, profile), i * delay);
		}
	}

	spawnFireworksInFrontOfCameras( scene: Scene, activeCameras: any[] | any): void {
		let cameras: any[] = [];
		if (Array.isArray(activeCameras) && activeCameras.length)
			cameras = activeCameras;
		else if (activeCameras)
			cameras = [activeCameras];

		cameras = cameras.filter(
			cam => cam.name !== "guiCamera" && cam.layerMask !== 0x20000000
		);

		cameras.forEach((cam) => this.spawnBurstsForCamera(scene, cam, FINAL_FIREWORKS));
	}

	dispose(): void {
		this.activeParticles.forEach(ps => ps.dispose());
		this.availableParticles.forEach(ps => ps.dispose());
		this.activeParticles.clear();
		this.availableParticles = [];
	}
}

const activeTimeouts = new Set<number>();
const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
const randomFromArray = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const createDelayedAction = (action: () => void, delay: number) => {
	const timeoutId = window.setTimeout(() => {
		activeTimeouts.delete(timeoutId);
		action();
	}, delay);
	activeTimeouts.add(timeoutId);
	return timeoutId;
};

export function clearAllFireworkTimers(): void {
	activeTimeouts.forEach(timeoutId => {
		window.clearTimeout(timeoutId);
	});
	activeTimeouts.clear();
}

export interface SparkleDetails {
	asset: string;
	count: number;
	duration: number;
	size: { min: number; max: number };
	colors: string[];
	spread: { x: number; y: number };
	zIndex?: number;
}

export const PARTIAL_GUI_SPARKLES: SparkleDetails = {
	asset: "assets/textures/particle/flare_transparent.png",
	count: 48,
	duration: 3000,
	size: { min: 5, max: 40 },
	colors: [
		"#FFD700", // Gold
		"#FFF8DC", // Cornsilk  
		"#FFFFE0", // Light yellow
		"#F0E68C", // Khaki
		"#FFFFFF"  // White
	],
	spread: { x: 80, y: 60 }
};


export const PARTIAL_GUI_SPARKLES_LOSER: SparkleDetails = {
	asset: "assets/textures/particle/flare_red.png",
	count: 32,
	duration: 2000,
	size: { min: 3, max: 25 },
	colors: [
		"#CD5C5C", // Indian red
		"#A0522D", // Sienna  
		"#B22222", // Fire brick
		"#8B4513", // Saddle brown
		"#DC143C", // Crimson
		"#800000", // Maroon
		"#9B111E"  // Ruby red
	],
	spread: { x: 60, y: 50 }
};

function createSparkleElement(config: SparkleDetails, winner: boolean): Image {
	const sparkle = new Image("sparkle", config.asset);
	sparkle.stretch = Image.STRETCH_UNIFORM;

	const size = randomInRange(config.size.min, config.size.max);
	sparkle.widthInPixels = size;
	sparkle.heightInPixels = size;

	sparkle.color = randomFromArray(config.colors);

	if (!winner) {
		const startYOffset = -config.spread.y * 0.8;
		sparkle.top = `${randomInRange(startYOffset, startYOffset + config.spread.y * 0.4)}%`;
	} else {
		sparkle.top = `${randomInRange(-config.spread.y / 2, config.spread.y / 2)}%`;
	}
	
	sparkle.left = `${randomInRange(-config.spread.x / 2, config.spread.x / 2)}%`;

	sparkle.alpha = 0;
	sparkle.scaleX = 0;
	sparkle.scaleY = 0;

	sparkle.zIndex = Math.floor(randomInRange(7, 9));

	return sparkle;
}

function animateSparkle(sparkle: Image, animationManager: any, delay: number, duration: number, winner: boolean): void {
	createDelayedAction(() => {
		sparkle.animations = [
			animationManager.createFloat("alpha", 0, 1, 8, false, animationManager.Motion?.ease.quadOut()),
			animationManager.createFloat("scaleX", 0, 1, 8, false, animationManager.Motion?.ease.quadOut()),
			animationManager.createFloat("scaleY", 0, 1, 8, false, animationManager.Motion?.ease.quadOut()),
		];

		animationManager.play(sparkle, 8, false).then(() => {
			const LOOP_CYCLE = Animation.ANIMATIONLOOPMODE_CYCLE;
			sparkle.animations = [
				animationManager.createFloat("alpha", 1, 0.3, 20, true, animationManager.Motion?.ease.sine(), LOOP_CYCLE),
			];
			animationManager.play(sparkle, 20, true);

			createDelayedAction(() => {
				if (winner) {
					sparkle.animations = [
						animationManager.createFloat("alpha", sparkle.alpha, 0, 12, false, animationManager.Motion?.ease.quadOut()),
						animationManager.createFloat("scaleX", sparkle.scaleX, 0, 12, false, animationManager.Motion?.ease.quadOut()),
						animationManager.createFloat("scaleY", sparkle.scaleY, 0, 12, false, animationManager.Motion?.ease.quadOut()),
					];
					animationManager.play(sparkle, 12, false).then(() => {
						sparkle.dispose();
					});
				} else {
					// Loser sparkles fall faster and start falling immediately
					const fallDistance = 300 + Math.random() * 200; // Increased fall distance
					const fallDuration = 40 + Math.random() * 20; // Faster fall
					
					sparkle.animations = [
						animationManager.createFloat("alpha", 1, 0, fallDuration, false, animationManager.Motion?.ease.sine()),
						animationManager.createFloat("scaleX", 1, 0.1, fallDuration, false, animationManager.Motion?.ease.quadOut()),
						animationManager.createFloat("scaleY", 1, 0.1, fallDuration, false, animationManager.Motion?.ease.quadOut()),
						animationManager.createFloat("topInPixels", sparkle.topInPixels, sparkle.topInPixels + fallDistance, fallDuration, false, animationManager.Motion?.ease.quadIn()), // Use quadIn for faster acceleration
						animationManager.createFloat("rotation", 0, Math.PI / 2 + Math.random() * Math.PI, fallDuration, false, animationManager.Motion?.ease.sine())
					];
					animationManager.play(sparkle, fallDuration, false).then(() => {
						sparkle.dispose();
					});
				}
			}, Math.max(0, duration - (winner ? 500 : 300))); // Shorter delay for loser sparkles
		});
	}, delay);
}

export function spawnGUISparkles(
	advancedTexture: AdvancedDynamicTexture, 
	animationManager: any,
	winner: boolean
): void {
	const config = winner ? PARTIAL_GUI_SPARKLES : PARTIAL_GUI_SPARKLES_LOSER;
	for (let i = 0; i < config.count; i++) {
		const sparkle = createSparkleElement(config, winner);
		advancedTexture.addControl(sparkle);
		
		// Stagger the sparkles
		const delay = Math.random() * (winner ? 800 : 100);
		animateSparkle(sparkle, animationManager, delay, config.duration, winner);
	}
}

