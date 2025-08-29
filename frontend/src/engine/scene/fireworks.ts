declare var BABYLON: typeof import('@babylonjs/core');

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
    colors: Array<{ c1: any; c2: any }>;
  };
  stopAfterMs: number;
  disposeDelayMs: number;
};

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
    blendMode: BABYLON.ParticleSystem.BLENDMODE_ONEONE,
    colors: [
      { c1: new BABYLON.Color4(1, 0.8, 0.2, 1), c2: new BABYLON.Color4(1, 0.8, 0.2, 1) },
      { c1: new BABYLON.Color4(0.2, 1, 0.3, 1), c2: new BABYLON.Color4(0.2, 1, 0.3, 1) },
      { c1: new BABYLON.Color4(0.3, 0.5, 1, 1), c2: new BABYLON.Color4(0.3, 0.5, 1, 1) },
      { c1: new BABYLON.Color4(1, 0.3, 0.8, 1), c2: new BABYLON.Color4(1, 0.3, 0.8, 1) },
      { c1: new BABYLON.Color4(0.8, 0.2, 1, 1), c2: new BABYLON.Color4(0.8, 0.2, 1, 1) },
    ],
  },
  stopAfterMs: 2000,
  disposeDelayMs: 3000,
};

export const PARTIAL_FIREWORKS: FireworkDetails = {
  bursts: 4,
  delay: { min: 120, max: 280 },
  distance: { min: 5, max: 8 },
  spread: 3,
  liftY: { min: 0.5, max: 1.5 },
  particle: {
    capacity: 800,
    texturePaths: [
      "assets/textures/particle/flare_transparent.png",
      "assets/textures/particle/flare.png"
    ],
    emitterSphereRadius: 1.2,
    emitRate: 400,
    size: { min: 0.05, max: 0.3 },
    lifeTime: { min: 0.7, max: 1.4 },
    power: { min: 4, max: 8 },
    gravityY: -6.0,
    blendMode: BABYLON.ParticleSystem.BLENDMODE_ONEONE,
    colors: [
      { c1: new BABYLON.Color4(1.0, 0.92, 0.5, 1.0), c2: new BABYLON.Color4(1.0, 1.0, 1.0, 1.0) },
    ],
  },
  stopAfterMs: 1200,
  disposeDelayMs: 2000,
};

function chooseColorPair(profile: FireworkDetails) {
    const colors = profile.particle.colors;
    const idx = Math.floor(Math.random() * colors.length);
    return colors[idx];
}

function spawnOneExplosion(scene: any, pos: any, profile: FireworkDetails): void {
    const p = profile.particle;
    const ps = new BABYLON.ParticleSystem(`fw_${Date.now()}`, p.capacity, scene);
    try {
        ps.particleTexture = new BABYLON.Texture("assets/textures/particle/flare_transparent.png", scene);
    } catch (error) {
        ps.particleTexture = new BABYLON.Texture("assets/textures/particle/flare.png", scene);
    }
    ps.emitter = pos;

    const pair = chooseColorPair(profile);
    ps.color1 = pair.c1;
    ps.color2 = pair.c2;
    ps.colorDead = new BABYLON.Color4(0, 0, 0, 0);

    ps.minSize = p.size.min;
    ps.maxSize = p.size.max;
    ps.minLifeTime = p.lifeTime.min;
    ps.maxLifeTime = p.lifeTime.max;
    ps.emitRate = p.emitRate;

    ps.createSphereEmitter(p.emitterSphereRadius);
    ps.minEmitPower = p.power.min;
    ps.maxEmitPower = p.power.max;
    ps.gravity = new BABYLON.Vector3(0, p.gravityY, 0);
    ps.blendMode = p.blendMode ?? BABYLON.ParticleSystem.BLENDMODE_ONEONE;

    ps.start();
    setTimeout(() => {
        ps.stop();
        setTimeout(() => ps.dispose(), profile.disposeDelayMs);
    }, profile.stopAfterMs);
}

function rand(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

function spawnBurstsForCamera(scene: any, camera: any, profile: FireworkDetails): void {
  for (let i = 0; i < profile.bursts; i++) {
    const dist   = rand(profile.distance.min, profile.distance.max);
    const spread = profile.spread;
    const lift   = rand(profile.liftY.min, profile.liftY.max);

    const forward = camera.getForwardRay ? camera.getForwardRay().direction : new BABYLON.Vector3(0, 0, 1);
    const x = camera.position.x + forward.x * dist + (Math.random() - 0.5) * spread;
    const y = camera.position.y + forward.y * dist + (Math.random() - 0.5) * 2 + lift;
    const z = camera.position.z + forward.z * dist + (Math.random() - 0.5) * spread;
    const pos = new BABYLON.Vector3(x, y, z);

    const delay = rand(profile.delay.min, profile.delay.max);
    setTimeout(() => spawnOneExplosion(scene, pos, profile), i * delay);
  }
}

// Public API
export function spawnFireworksInFrontOfCameras(
  scene: any,
  profile: FireworkDetails,
  activeCameras: any[] | any
): void {
  let cameras: any[] = [];
  if (Array.isArray(activeCameras) && activeCameras.length)
    cameras = activeCameras;
  else if (activeCameras)
    cameras = [activeCameras];

  cameras = cameras.filter(
    cam => cam.name !== "guiCamera" && cam.layerMask !== 0x20000000
  );
  
  cameras.forEach((cam) => spawnBurstsForCamera(scene, cam, profile));
}


