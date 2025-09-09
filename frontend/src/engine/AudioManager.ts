import { Scene, Sound } from "@babylonjs/core";
import { Logger } from '../utils/LogManager.js';

/**
 * Manages audio playback for the game, including background music, sound effects,
 * volume control, and dynamic adjustments based on game events.
 */
export class AudioManager {
    private gameMusic: Sound | null = null;
    private isInitialized: boolean = false;
    private basePlaybackRate: number = 1.0;
    private maxPlaybackRate: number = 1.8;
    private maxRally: number = 50;
    private currentRally: number = 1;

    private muted = false;
    private volumes = {
        music: 0.5,
        countdown: 0.6,
        paddle: 0.6,
        score: 0.7,
    };

    // Sound effects
    private countdownSound: Sound | null = null;
    private paddleHitSound: Sound | null = null;
    private scoreSound: Sound | null = null;
    private powerup: Sound | null = null;

    constructor(private scene: Scene) {
    }

    async initialize(): Promise<void> {
        try {
            this.gameMusic = new Sound(
                "gameMusic",
                "/assets/audio/bg/retro2.mp3",
                this.scene,
                null,
                {
                    loop: true,
                    autoplay: false,
                    volume: this.volumes.music,
                    playbackRate: this.basePlaybackRate
                }
            );

            this.paddleHitSound = new Sound(
                "paddleHit",
                "/assets/audio/hit.mp3",
                this.scene,
                null,
                {
                    loop: false,
                    autoplay: false,
                    volume: this.volumes.paddle,
                    playbackRate: this.basePlaybackRate
                }
            );

            this.countdownSound = new Sound(
                "countdown",
                "/assets/audio/countdown.mp3",
                this.scene,
                null,
                {
                    loop: false,
                    autoplay: false,
                    volume: this.volumes.countdown,
                    playbackRate: this.basePlaybackRate
                }
            );

            this.scoreSound = new Sound(
                "score",
                "/assets/audio/score.mp3",
                this.scene,
                null,
                {
                    loop: false,
                    autoplay: false,
                    volume: this.volumes.score,
                    playbackRate: this.basePlaybackRate
                }
            );

            
            this.powerup = new Sound(
                "score",
                "/assets/audio/powerup.mp3",
                this.scene,
                null,
                {
                    loop: false,
                    autoplay: false,
                    volume: this.volumes.score,
                    playbackRate: this.basePlaybackRate
                }
            );

            this.isInitialized = true;
        } catch (error) {
            Logger.errorAndThrow('Error initializing Babylon audio', 'BabylonAudioManager', error);
        }
    }

    // Start playing the game music
    startGameMusic(): void {
        if (!this.gameMusic || !this.isInitialized) {
            return;
        }

        try {
            if (this.gameMusic.isPlaying !== true )
                this.gameMusic.play();
        } catch (error) {
            Logger.errorAndThrow('Error starting game music', 'BabylonAudioManager', error);
        }
    }

    // Stop the game music
    stopGameMusic(): void {
        this.gameMusic?.stop();
    }

    // Pause the game music
    pauseGameMusic(): void {
        this.gameMusic?.pause();
    }

    // Resume the game music
    resumeGameMusic(): void {
        this.gameMusic?.play();
    }

    // Update music speed based on rally count with gentler curve and pinch effect
    updateMusicSpeed(rallyCount: number): void {
        if (!this.gameMusic || !this.isInitialized) return;

        if (rallyCount === this.currentRally) return;
        this.playPaddleHit();
        this.currentRally = rallyCount;

        const speedCurve = Math.min(rallyCount / this.maxRally, 1.0);
        const newPlaybackRate = this.basePlaybackRate + 
            (speedCurve * (this.maxPlaybackRate - this.basePlaybackRate));

        this.gameMusic.setPlaybackRate(newPlaybackRate);
    }

    // Sound effects methods

    playPaddleHit(): void {
        this.paddleHitSound?.play();
    }

    playScore(): void {
        this.scoreSound?.play();
    }

    playCountdown(): void {
        this.countdownSound?.stop();
        this.countdownSound?.play();
    }

    playPowerup(): void {
        this.powerup?.play();
    }

    stopCountdown(): void {
        this.countdownSound?.stop();
    }

    isMuted(): boolean {
        return this.muted;
    }

    setMuted(m: boolean): void {
        this.muted = m;
        this.applyVolumes();
    }

    toggleMute(): boolean {
        this.muted = !this.muted;
        this.applyVolumes();
        return this.muted;
    }

    private applyVolumes(): void {
        const base = this.muted ? 0 : 1;

        this.gameMusic?.setVolume(base * this.volumes.music);
        this.countdownSound?.setVolume(base * this.volumes.countdown);
        this.paddleHitSound?.setVolume(base * this.volumes.paddle);
        this.scoreSound?.setVolume(base * this.volumes.score);
    }

    dispose(): void {
        try {
            this.gameMusic?.dispose();
            this.gameMusic = null;

            this.paddleHitSound?.dispose();
            this.paddleHitSound = null;

            this.countdownSound?.dispose();
            this.countdownSound = null;

            this.scoreSound?.dispose();
            this.scoreSound = null;

            this.powerup?.dispose();
            this.powerup = null;

            this.isInitialized = false;

            Logger.debug('Class disposed', 'BabylonAudioManager');
        } catch (error) {
            Logger.error('Error disposing audio manager', 'BabylonAudioManager', error);
        }
    }
}