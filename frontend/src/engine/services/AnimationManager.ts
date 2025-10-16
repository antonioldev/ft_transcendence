import { Color3, Color4 } from "@babylonjs/core";
import { Animation } from "@babylonjs/core/Animations/animation";
import { EasingFunction, QuadraticEase, SineEase } from "@babylonjs/core/Animations/easing";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import type { Control } from "@babylonjs/gui/2D/controls/control";
import { GAME_CONFIG } from "../../shared/gameConfig.js";
import { getCamera2DPosition, getCamera3DPlayer1Position, getCamera3DPlayer2Position } from '../utils.js';
import { ViewMode } from "../../shared/constants.js";

type FloatProp =
  | "alpha"
  | "scaleX" | "scaleY"
  | "leftInPixels" | "topInPixels"
  | "widthInPixels" | "heightInPixels"
  | "rotation"
  | "thickness";

export const Motion = {
	fps: 60,
	F: {
		xFast: 8,
		fast: 12,
		base: 16,
		slow: 24,
		xSlow: 60,  // 1 second
		breath: 120
	},
	ease: {
		sine: () => new SineEase(),
		quadOut: () => { const e = new QuadraticEase(); e.setEasingMode(EasingFunction.EASINGMODE_EASEOUT); return e; },
		quadInOut: () => { const e = new QuadraticEase(); e.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT); return e; },
	}
};

/**
 * Manages animations for UI controls and camera movements, providing utility methods
 * for creating and playing various types of animations with customizable properties.
 */
export class AnimationManager {
	private activeAnimationGroups: Set<any> = new Set();
	private activeCameraAnimations: any[] = [];
	constructor(private scene: Scene) {}

	// ==================== LOW-LEVEL ANIMATION CREATION ====================
	private createFloat(
		property: FloatProp,
		from: number,
		to: number,
		frames = Motion.F.base,
		pingPong = false,
		ease: EasingFunction = Motion.ease.sine(),
		loopMode: number = Animation.ANIMATIONLOOPMODE_CONSTANT
	): Animation {
		const anim = Animation.CreateAnimation(property, Animation.ANIMATIONTYPE_FLOAT, Motion.fps, ease);
		anim.loopMode = loopMode;
		if (pingPong) {
			const mid = Math.floor(frames / 2);
			anim.setKeys([
				{ frame: 0, value: from },
				{ frame: mid, value: to },
				{ frame: frames, value: from }
			]);
		} else {
			anim.setKeys([
				{ frame: 0, value: from },
				{ frame: frames, value: to }
			]);
		}
		return anim;
	}

	private play(target: Control, frames: number, loop = false): Promise<void> {
		return new Promise((resolve) => {
			const animationGroup = this.scene.beginAnimation(target, 0, frames, loop, 1, () => {
				this.activeAnimationGroups.delete(animationGroup);
				resolve();
			});
			this.activeAnimationGroups.add(animationGroup);
		});
	}

	twinkle(target: Control, frames = Motion.F.slow): Promise<void> {
		target.animations = [this.createFloat("alpha", 1, 0.6, frames, true, Motion.ease.sine(), Animation.ANIMATIONLOOPMODE_CYCLE)];
		return this.play(target, frames, true);
	}

	scale(target: Control, from: number, to: number, frames = Motion.F.breath, pingPong: boolean = false, loop: boolean = false): Promise<void> {
		target.animations = [
			this.createFloat("scaleX", from, to, frames, pingPong, Motion.ease.sine(), Animation.ANIMATIONLOOPMODE_CYCLE),
			this.createFloat("scaleY", from, to, frames, pingPong, Motion.ease.sine(), Animation.ANIMATIONLOOPMODE_CYCLE),
		];
		return this.play(target, frames, loop);
	}

	fade(
		target: Control, 
		type: 'in' | 'out' = 'in',
		frames = Motion.F.base
	): Promise<void> {
		if (type === 'in') {
			target.alpha = 0;
			target.animations = [this.createFloat("alpha", 0, 1, frames, false, Motion.ease.quadOut())];
		} else {
			target.animations = [this.createFloat("alpha", 1, 0, frames, false, Motion.ease.quadOut())];
		}
		
		return this.play(target, frames, false);
	}

	fadeInWithBorder(target: Control, frames = Motion.F.base, thicknessFrom = 0, thicknessTo = 4): Promise<void> {
		target.alpha = 0;
		(target as any).thickness = thicknessFrom;
		target.animations = [
			this.createFloat("alpha", 0, 1, frames, false, Motion.ease.quadOut()),
			this.createFloat("thickness", thicknessFrom, thicknessTo, frames, false, Motion.ease.quadOut()),
		];
		return this.play(target, frames, false);
	}

	fadeOutWithBorder(target: Control, frames = Motion.F.fast, thicknessFrom = 4, thicknessTo = 0): Promise<void> {
		target.animations = [
			this.createFloat("alpha", 1, 0, frames, false, Motion.ease.quadOut()),
			this.createFloat("thickness", thicknessFrom, thicknessTo, frames, false, Motion.ease.quadOut()),
		];
		return this.play(target, frames, false);
	}

	// Zoom in animation (scale from 0 to 1)
	zoomIn(target: Control, frames = Motion.F.xFast): Promise<void> {
		target.scaleX = 0;
		target.scaleY = 0;
		target.alpha = 0;
		target.animations = [
			this.createFloat("scaleX", 0, 1, frames, false, Motion.ease.quadOut()),
			this.createFloat("scaleY", 0, 1, frames, false, Motion.ease.quadOut()),
			this.createFloat("alpha", 0, 1, frames, false, Motion.ease.quadOut()),
		];
		return this.play(target, frames, false);
	}

	// Zoom out animation (scale from 1 to 0)
	zoomOut(target: Control, frames = Motion.F.fast): Promise<void> {
		target.animations = [
			this.createFloat("scaleX", 1, 0, frames, false, Motion.ease.quadOut()),
			this.createFloat("scaleY", 1, 0, frames, false, Motion.ease.quadOut()),
			this.createFloat("alpha", 1, 0, frames, false, Motion.ease.quadOut()),
		];
		return this.play(target, frames, false);
	}

	// Glow animation (scale with alpha variation)
	glow(target: Control, frames = Motion.F.breath, glowScale = 1.05): Promise<void> {
		target.animations = [
			this.createFloat("scaleX", 1, glowScale, frames, true, Motion.ease.sine(), Animation.ANIMATIONLOOPMODE_CYCLE),
			this.createFloat("scaleY", 1, glowScale, frames, true, Motion.ease.sine(), Animation.ANIMATIONLOOPMODE_CYCLE),
			this.createFloat("alpha", 1, 0.8, frames, true, Motion.ease.sine(), Animation.ANIMATIONLOOPMODE_CYCLE),
		];
		return this.play(target, frames, true);
	}

	async smashEffect(target: Control, frames = Motion.F.fast): Promise<void> {
		target.animations = [];

		const smashFrames = Math.floor(frames * 0.6);
		const settleFrames = Math.floor(frames * 0.4);
		
		const smashAnim = this.createFloat("scaleX", 0.1, 1.3, smashFrames, false, Motion.ease.quadOut());
		const smashAnimY = this.createFloat("scaleY", 0.1, 1.3, smashFrames, false, Motion.ease.quadOut());

		const settleAnim = this.createFloat("scaleX", 1.3, 1.0, settleFrames, false, Motion.ease.quadOut());
		const settleAnimY = this.createFloat("scaleY", 1.3, 1.0, settleFrames, false, Motion.ease.quadOut());

		target.animations = [smashAnim, smashAnimY];
		
		return this.play(target, smashFrames, false).then(() => {
			target.animations = [settleAnim, settleAnimY];
			return this.play(target, settleFrames, false);
		});
	}

	// Slide in from any direction with custom distance
	slideFromDirection(
		target: Control, 
		direction: 'up' | 'down' | 'left' | 'right', 
		type: 'in' | 'out' = 'in',
		distance = 100, 
		frames = Motion.F.base, 
		withFade = true
	): Promise<void> {
		target.alpha = withFade ? (type === 'in' ? 0 : 1) : target.alpha;
		
		let property: FloatProp;
		let startValue: number;
		let endValue: number;
		
		const isVertical = direction === 'up' || direction === 'down';
		property = isVertical ? 'topInPixels' : 'leftInPixels';
		
		if (type === 'in') {
			endValue = 0;
			switch (direction) {
				case 'up': startValue = distance; break;
				case 'down': startValue = -distance; break;
				case 'left': startValue = distance; break;
				case 'right': startValue = -distance; break;
			}
			if (property === 'topInPixels') target.topInPixels = startValue;
			else target.leftInPixels = startValue;
		} else {
			startValue = 0;
			switch (direction) {
				case 'up': endValue = -distance; break;
				case 'down': endValue = distance; break;
				case 'left': endValue = -distance; break;
				case 'right': endValue = distance; break;
			}
		}
		
		const animations: Animation[] = [
			this.createFloat(property, startValue, endValue, frames, false, Motion.ease.quadOut())
		];
		
		if (withFade) {
			const alphaFrom = type === 'in' ? 0 : 1;
			const alphaTo = type === 'in' ? 1 : 0;
			animations.push(this.createFloat("alpha", alphaFrom, alphaTo, frames, false, Motion.ease.quadOut()));
		}
		
		target.animations = animations;
		return this.play(target, frames, false);
	}

// CAMERA ANIMATION
	createCameraMoveAnimation(cameraName: string): Animation {
		const startPosition = getCamera2DPosition();
		const endPosition = cameraName === "camera1"
			? getCamera3DPlayer1Position()
			: getCamera3DPlayer2Position();

		const ease = new QuadraticEase();
		ease.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);

		const anim = Animation.CreateAnimation("position", Animation.ANIMATIONTYPE_VECTOR3, 60, ease);
		anim.setKeys([
			{ frame: 0, value: startPosition },
			{ frame: 180, value: endPosition },
		]);
		return anim;
	}

	createCameraTargetAnimation(): Animation {
		const startTarget = Vector3.Zero();
		const endTarget = Vector3.Zero();

		const ease = new QuadraticEase();
		ease.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);

		const anim = Animation.CreateAnimation("target", Animation.ANIMATIONTYPE_VECTOR3, 60, ease);
		anim.setKeys([
			{ frame: 0, value: startTarget },
			{ frame: 180, value: endTarget },
		]);
		return anim;
	}

	startCameraAnimations(scene: Scene, cameras: any, viewMode: ViewMode, controlledSides: number[] = [], isLocalMultiplayer: boolean = false): void {
		if (!scene || !cameras || viewMode === ViewMode.MODE_2D) return;

		this.stopCameraAnimations();

		cameras.forEach((camera: any, index: number) => {
			if (!camera) return;

			if (isLocalMultiplayer || controlledSides.includes(index) || controlledSides.length === 0) {
				const positionAnimation = this.createCameraMoveAnimation(camera.name);
				const targetAnimation = this.createCameraTargetAnimation();
				
				camera.animations = [positionAnimation, targetAnimation];
				const animationGroup = scene.beginAnimation(camera, 0, 180, false);
				this.activeCameraAnimations.push(animationGroup);
			}
		});
	}

	stopCameraAnimations(): void {
		this.activeCameraAnimations.forEach(animation => {
			try {
				animation?.stop();
			} catch (error) {
				console.warn('Error stopping camera animation:', error);
			}
		});
		this.activeCameraAnimations = [];
	}

// GAME OBJECT ANIMATION
	private animateMesh(target: any, property: string, from: number, to: number,frames: number,
		ease: EasingFunction = Motion.ease.quadOut(), loop: boolean = false, pingPong: boolean = false): Promise<void> {

		return new Promise((resolve) => {
			const animation = Animation.CreateAnimation(property, Animation.ANIMATIONTYPE_FLOAT, Motion.fps, ease);
			if (loop)
				animation.loopMode = Animation.ANIMATIONLOOPMODE_CYCLE;

			if (pingPong) {
				const mid = Math.floor(frames / 2);
				animation.setKeys([
					{ frame: 0, value: from },
					{ frame: mid, value: to },
					{ frame: frames, value: from }
				]);
			} else {
				animation.setKeys([
					{ frame: 0, value: from },
					{ frame: frames, value: to }
				]);
			}

			target.animations = [animation];
			this.scene.beginAnimation(target, 0, frames, loop, Motion.fps / frames, () => {
				this.activeAnimationGroups.delete(animation);
				resolve();
			})
		});
	}

	async glowEffect(target: any, color: Color3, edgeColor?: Color4): Promise<void> {
		if (!target.material) return;

		target.material.emissiveColor = color;
		if (edgeColor)
			target.edgesColor = edgeColor;
		target.visibility = 0;

		await this.animateMesh(target, "visibility", 0, 1, Motion.F.fast, Motion.ease.quadOut(), false);
		return this.animateMesh(target, "visibility", 1, 0.6, Motion.F.xFast, Motion.ease.sine(), true);
	}

	async pulse(target: any, color: Color3, edgeColor?: Color4): Promise<void> {
		if (!target.material) return;

		target.material.emissiveColor = color;
		if (edgeColor)
			target.edgesColor = edgeColor;
		target.visibility = 0;

		await this.animateMesh(target, "visibility", 0, 1, Motion.F.fast, Motion.ease.quadOut(), false);
		await Promise.all([
			this.animateMesh(target.scaling, "x", 1, 1.4, Motion.F.fast, Motion.ease.sine(), true, true),
			this.animateMesh(target.scaling, "y", 1, 1.4, Motion.F.fast, Motion.ease.sine(), true, true),
			this.animateMesh(target.scaling, "z", 1, 1.4, Motion.F.fast, Motion.ease.sine(), true, true)
		]);
	}

	async stopEffect(target: any): Promise<void> {
		if (!target.material) return;
		
		target.animations = [];
		if (target.scaling) {
			target.scaling.x = 1;
			target.scaling.y = 1;
			target.scaling.z = 1;
		}

		await this.animateMesh(target, "visibility", target.visibility, 0, Motion.F.fast, Motion.ease.quadOut(), false);
		target.visibility = 0;
	}

	scaleWidthPaddle(target: any, from: number, to: number, frames = Motion.F.fast, ease: EasingFunction = Motion.ease.quadOut()): Promise<void> {
		const baseWidth = GAME_CONFIG.paddleWidth;
		const fromScale = from / baseWidth;
		const toScale = to / baseWidth;
		
		return this.animateMesh(target, "scaling.y", fromScale, toScale, frames, ease, false);
	}

	async blinkInvisibility(target: any, duration: number = 3000, blinkInterval:number = 600): Promise<void> {
		const blinkDuration: number = 100;

		if (!target.material) return;

		const start = Date.now();
		let lastBlink = 0;

		return new Promise<void>((resolve) => {
			const animationLoop = () => {
				const elapsed = Date.now() - start;

				if (elapsed >= duration) {
					target.material.alpha = 1;
					resolve();
					return;
				}

				const timeSinceLastBlink = elapsed - lastBlink;
				if (timeSinceLastBlink >= blinkInterval) {
					target.material.alpha = 1;
					lastBlink = elapsed;

					setTimeout(() => {
						if (Date.now() - start < duration) {
							target.material.alpha = 0;
						}
					}, blinkDuration);
				}
				
				requestAnimationFrame(animationLoop);
			};
			
			target.material.alpha = 0;
			animationLoop();
		});
	}

	dispose(): void {
		this.stopCameraAnimations();
		this.activeAnimationGroups.forEach(group => {
			try {
				group.stop();
			} catch (error) {
				console.warn('Error disposing animation group:', error);
			}
		});
		this.activeAnimationGroups.clear();
	}
}


