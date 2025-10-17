import { Color4, Vector3, ParticleSystem } from "@babylonjs/core";

interface ParticleConfig {
	name: string;
	capacity: number;
	texturePath: string;
	emitter: {
		position: Vector3;
		minBox: Vector3;
		maxBox: Vector3;
	};
	direction: {
		dir1: Vector3;
		dir2: Vector3;
	};
	size: {
		min: number;
		max: number;
	};
	lifetime: {
		min: number;
		max: number;
	};
	emitRate: number;
	color: {
		color1: Color4;
		color2: Color4;
		colorDead?: Color4;
	};
	gravity: Vector3;
	angularSpeed?: {
		min: number;
		max: number;
	};
	blendMode?: number;
	autoStart?: boolean;
}

export enum ParticleEffectType {
	DUST = "dust",
	STARS = "stars",
	SNOW = "snow",
	RAIN = "rain",
	UNDERWATER = "underwater",
	SMOKE = 'smoke',
	LENS = 'lens'
}

export enum ParticleTexturePath {
	FLARE_TRANSPARENT = "assets/textures/particle/flare_transparent.png",
	FLARE = "assets/textures/particle/flare.png",
	BUBBLE = "assets/textures/particle/bubble.png",
	RAINDROP = "assets/textures/particle/raindrop.png",
	CANDLE_SMOKE = "assets/textures/particle/candleSmoke.tga"
}

export const PARTICLE_CONFIGS: Record<string, ParticleConfig> = {
	dust: {
		name: ParticleEffectType.DUST,
		capacity: 1000,
		texturePath: ParticleTexturePath.FLARE_TRANSPARENT,
		emitter: {
			position: new Vector3(0, 2, 0),
			minBox: new Vector3(-10, 0, -20),
			maxBox: new Vector3(10, 4, 20)
		},
		direction: {
			dir1: new Vector3(-0.5, -0.1, -0.5),
			dir2: new Vector3(0.5, 0.3, 0.5)
		},
		size: { min: 0.05, max: 0.1 },
		lifetime: { min: 8, max: 14 },
		emitRate: 200,
		color: {
			color1: new Color4(0.8, 0.8, 0.8, 0.3),
			color2: new Color4(0.5, 0.5, 0.5, 0.1)
		},
		blendMode: ParticleSystem.BLENDMODE_ADD,
		gravity: new Vector3(0, 0, 0),
		autoStart: true
	},

	stars: {
		name: ParticleEffectType.STARS,
		capacity: 3000,
		texturePath: ParticleTexturePath.FLARE_TRANSPARENT,
		emitter: {
			position: new Vector3(0, 0, -50),
			minBox: new Vector3(-20, 0, -10),
			maxBox: new Vector3(20, 4, 10)
		},
		direction: {
			dir1: new Vector3(2, 2, 60),
			dir2: new Vector3(2, 2, 80)
		},
		size: { min: 0.05, max: 0.15 },
		lifetime: { min: 4, max: 6 },
		emitRate: 500,
		color: {
			color1: new Color4(0.9, 0.95, 1.0, 1.0),
			color2: new Color4(0.9, 0.85, 1.0, 0.9),
			colorDead: new Color4(1.0, 1.0, 0.0, 1.0)
		},
		blendMode: ParticleSystem.BLENDMODE_ADD,
		gravity: new Vector3(0, 0, 0),
		autoStart: true
	},

	snow: {
		name: ParticleEffectType.SNOW,
		capacity: 5000,
		texturePath: ParticleTexturePath.BUBBLE,
		emitter: {
			position: new Vector3(0, 30, 0),
			minBox: new Vector3(-50, 0, -50),
			maxBox: new Vector3(50, 0, 50)
		},
		direction: {
			dir1: new Vector3(-2, -3, -2),
			dir2: new Vector3(2, -6, 2)
		},
		size: { min: 0.05, max: 0.1 },
		lifetime: { min: 4, max: 8 },
		emitRate: 2000,
		color: {
			color1: new Color4(1, 1, 1, 0.8),
			color2: new Color4(1, 1, 1, 0.8)
		},
		gravity: new Vector3(0, -2, 0),
		angularSpeed: { min: -0.5, max: 0.5 },
		autoStart: true
	},

	rain: {
		name: ParticleEffectType.RAIN,
		capacity: 1500,
		texturePath: ParticleTexturePath.RAINDROP,
		emitter: {
			position: new Vector3(0, 20, 0),
			minBox: new Vector3(-50, 0, -50),
			maxBox: new Vector3(50, 0, 50)
		},
		direction: {
			dir1: new Vector3(-1, -50, -1),
			dir2: new Vector3(1, -50, 1)
		},
		size: { min: 0.2, max: 0.3 },
		lifetime: { min: 1, max: 2 },
		emitRate: 1500,
		color: {
			color1: new Color4(0, 1, 1, 0.4),
			color2: new Color4(0, 1, 1, 0.4)
		},
		gravity: new Vector3(0, -9.81, 0),
		autoStart: true
	},

	underwater: {
		name: ParticleEffectType.UNDERWATER,
		capacity: 1000,
		texturePath: ParticleTexturePath.BUBBLE,
		emitter: {
			position: new Vector3(0, 3, 0),
			minBox: new Vector3(-15, -5, -25),
			maxBox: new Vector3(15, 10, 25)
		},
		direction: {
			dir1: new Vector3(-0.2, -0.1, -0.2),
			dir2: new Vector3(0.2, 0.2, 0.2)
		},
		size: { min: 0.05, max: 0.3 },
		lifetime: { min: 10, max: 20 },
		emitRate: 100,
		color: {
			color1: new Color4(0.5, 0.7, 1.0, 0.4),
			color2: new Color4(0.3, 0.5, 0.8, 0.2)
		},
		gravity: new Vector3(0, 1, 0),
		blendMode: ParticleSystem.BLENDMODE_STANDARD,
		autoStart: true
	}
};
