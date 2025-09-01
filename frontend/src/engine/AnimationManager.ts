import type { Scene } from "@babylonjs/core/scene";
import { Animation } from "@babylonjs/core/Animations/animation";
import { EasingFunction } from "@babylonjs/core/Animations/easing";
import { SineEase } from "@babylonjs/core/Animations/easing";
import { QuadraticEase } from "@babylonjs/core/Animations/easing";
import type { Control } from "@babylonjs/gui/2D/controls/control";

type FloatProp =
  | "alpha"
  | "scaleX" | "scaleY"
  | "leftInPixels" | "topInPixels"
  | "widthInPixels" | "heightInPixels"
  | "rotation";

export const Motion = {
    fps: 60,
    F: {
        xFast: 8,   // ~133ms
        fast: 12,   // ~200ms
        base: 16,   // ~266ms
        slow: 24,   // ~400ms
        xSlow: 60,  // ~1s
        breath: 120 // ~2s
    },
    ease: {
        sine: () => new SineEase(),
        quadOut: () => { const e = new QuadraticEase(); e.setEasingMode(EasingFunction.EASINGMODE_EASEOUT); return e; },
        quadInOut: () => { const e = new QuadraticEase(); e.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT); return e; },
    }
};

export class AnimationManager {
    constructor(private scene: Scene) {}

    /** Core float animation builder (your helper generalized). */
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
        target.animations = [ this.createFloat("alpha", 0, 0.55, frames, false, Motion.ease.quadOut()) ];
        return this.play(target, frames, false);
    }

    fadeOut(target: Control, frames = Motion.F.fast) {
        target.animations = [ this.createFloat("alpha", 0.55, 0, frames, false, Motion.ease.quadOut()) ];
        return this.play(target, frames, false);
    }

    pulse(target: Control, frames = Motion.F.slow) {
        target.animations = [
        this.createFloat("scaleX", 1, 2, frames, true, Motion.ease.quadOut()),
        this.createFloat("scaleY", 1, 2, frames, true, Motion.ease.quadOut()),
        ];
        return this.play(target, frames, false);
    }

    /** Small press/pop feedback. */
    pop(target: Control, frames = Motion.F.fast) {
        target.animations = [
        this.createFloat("scaleX", 1, 0.9, frames, true, Motion.ease.quadOut()),
        this.createFloat("scaleY", 1, 0.9, frames, true, Motion.ease.quadOut()),
        ];
        return this.play(target, frames, false);
    }

    /** Gentle breathing loop (call .play with loop=true). */
    breathe(target: Control, frames = Motion.F.breath) {
        target.animations = [
        this.createFloat("scaleX", 1, 1.04, frames, true, Motion.ease.sine(), Animation.ANIMATIONLOOPMODE_CYCLE),
        this.createFloat("scaleY", 1, 1.04, frames, true, Motion.ease.sine(), Animation.ANIMATIONLOOPMODE_CYCLE),
        ];
        return this.play(target, frames, true);
    }

    /** Slide vertically (pixels) with fade. Positive from = below; negative = above. */
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

    /** Quick attention ping via alpha. */
    twinkle(target: Control, frames = Motion.F.slow) {
        target.animations = [ this.createFloat("alpha", 1, 0.6, frames, true, Motion.ease.sine(), Animation.ANIMATIONLOOPMODE_CYCLE) ];
        return this.play(target, frames, true);
    }

    /** Subtle error shake (horizontal jiggle). */
    shakeX(target: Control, amplitudePx = 10, frames = Motion.F.fast) {
        target.animations = [ this.createFloat("leftInPixels", 0, amplitudePx, frames, true, Motion.ease.sine()) ];
        return this.play(target, frames, false);
    }

    /** One-shot rotate (e.g., spinner tick). */
    rotateOnce(target: Control, turns = 1, frames = Motion.F.slow) {
        const to = Math.PI * 2 * turns;
        target.animations = [ this.createFloat("rotation", 0, to, frames, false, Motion.ease.quadInOut()) ];
        return this.play(target, frames, false);
    }
}
