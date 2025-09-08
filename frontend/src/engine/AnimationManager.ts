import type { Scene } from "@babylonjs/core/scene";
import { Animation } from "@babylonjs/core/Animations/animation";
import { SineEase } from "@babylonjs/core/Animations/easing";
import { QuadraticEase, EasingFunction } from "@babylonjs/core/Animations/easing";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Control } from "@babylonjs/gui/2D/controls/control";
import { getCamera2DPosition, getCamera3DPlayer1Position, getCamera3DPlayer2Position,} from './utils.js';
import { GAME_CONFIG } from "../shared/gameConfig.js";

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
        xSlow: 60,  // 1seconds
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
    constructor(private scene: Scene) {}

    createFloat(
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

    play(target: Control, frames: number, loop = false): Promise<void> {
        return new Promise((resolve) => {
        this.scene.beginAnimation(target, 0, frames, loop, 1, () => resolve());
        });
    }

    fadeIn(target: Control, frames = Motion.F.base) {
        target.alpha = 0;
        target.animations = [ this.createFloat("alpha", 0, 1, frames, false, Motion.ease.quadOut()) ];
        return this.play(target, frames, false);
    }

    fadeOut(target: Control, frames = Motion.F.fast) {
        target.animations = [ this.createFloat("alpha", 1, 0, frames, false, Motion.ease.quadOut()) ];
        return this.play(target, frames, false);
    }

    pulse(target: Control, frames = Motion.F.slow) {
        target.animations = [
        this.createFloat("scaleX", 1, 2, frames, true, Motion.ease.quadOut()),
        this.createFloat("scaleY", 1, 2, frames, true, Motion.ease.quadOut()),
        ];
        return this.play(target, frames, false);
    }

    pop(target: Control, frames = Motion.F.fast, end: number) {
        target.animations = [
        this.createFloat("scaleX", 1, end, frames, true, Motion.ease.quadOut()),
        this.createFloat("scaleY", 1, end, frames, true, Motion.ease.quadOut()),
        ];
        return this.play(target, frames, false);
    }

    breathe(target: Control, frames = Motion.F.breath) {
        target.animations = [
        this.createFloat("scaleX", 1, 1.5, frames, true, Motion.ease.sine(), Animation.ANIMATIONLOOPMODE_CYCLE),
        this.createFloat("scaleY", 1, 1.5, frames, true, Motion.ease.sine(), Animation.ANIMATIONLOOPMODE_CYCLE),
        ];
        return this.play(target, frames, true);
    }

    slideInY(target: Control, fromPx = 40, frames = Motion.F.base) {
        target.topInPixels = fromPx;
        target.alpha = 0;
        target.animations = [
        this.createFloat("topInPixels", fromPx, 0, frames, false, Motion.ease.quadOut()),
        this.createFloat("alpha", 0, 1, frames, false, Motion.ease.quadOut()),
        ];
        return this.play(target, frames, false);
    }

    slideOutY(target: Control, toPx = 40, frames = Motion.F.fast) {
        target.animations = [
        this.createFloat("topInPixels", 0, toPx, frames, false, Motion.ease.quadOut()),
        this.createFloat("alpha", 1, 0, frames, false, Motion.ease.quadOut()),
        ];
        return this.play(target, frames, false);
    }

    slideInX(target: Control, fromPx = -400, frames = Motion.F.base) {
        target.leftInPixels = fromPx;
        target.alpha = 0;
        target.animations = [
            this.createFloat("leftInPixels", fromPx, 0, frames, false, Motion.ease.quadOut()),
            this.createFloat("alpha", 0, 1, frames, false, Motion.ease.quadOut()),
        ];
        return this.play(target, frames, false);
    }

    slideOutX(target: Control, toPx = 400, frames = Motion.F.fast) {
        target.animations = [
            this.createFloat("leftInPixels", 0, toPx, frames, false, Motion.ease.quadOut()),
            this.createFloat("alpha", 1, 0, frames, false, Motion.ease.quadOut()),
        ];
        return this.play(target, frames, false);
    }

    twinkle(target: Control, frames = Motion.F.slow) {
    target.animations = [ this.createFloat("alpha", 1, 0.6, frames, true, Motion.ease.sine(), Animation.ANIMATIONLOOPMODE_CYCLE) ];
    return this.play(target, frames, true);
    }

    rotatePulse(target: Control, turns = 1, frames = Motion.F.slow, pulseScale = 1.6) {
        const to = Math.PI * 2 * turns;
        target.animations = [
            this.createFloat("rotation", 0, to, frames, false, Motion.ease.quadInOut()),
            this.createFloat("scaleX", 1, pulseScale, frames, true, Motion.ease.quadInOut()),
            this.createFloat("scaleY", 1, pulseScale, frames, true, Motion.ease.quadInOut())
        ];
        return this.play(target, frames, false);
    }

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

    scaleWidth(
    target: any,
    from: number,  // Actual size value
    to: number,    // Actual size value
    frames = Motion.F.fast,
    ease: EasingFunction = Motion.ease.quadOut()
    ): Promise<void> {
        // Calculate scale factors based on the standard paddle width
        const baseWidth = GAME_CONFIG.paddleWidth;
        const fromScale = from / baseWidth;
        const toScale = to / baseWidth;
        
        // Create animation for x-axis scaling (corrected from my previous suggestion)
        const anim = new Animation(
            "widthAnimation",
            "scaling.y",
            Motion.fps,
            Animation.ANIMATIONTYPE_FLOAT,
            Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        
        anim.setEasingFunction(ease);
        anim.setKeys([
            { frame: 0, value: fromScale },
            { frame: frames, value: toScale }
        ]);
        
        target.animations = [anim];
        return this.play(target, frames, false);
    }

}


