import { Scene, Sound } from "@babylonjs/core";
import { Logger } from '../utils/LogManager.js';

export class AudioManager {
    private scene: Scene | null = null;
    private gameMusic: Sound | null = null;
    private isInitialized: boolean = false;
    private basePlaybackRate: number = 1.0;
    private maxPlaybackRate: number = 1.8;
    private maxRally: number = 50;
    private currentRally: number = 1;

    // Sound effects
    private gameStartSound: Sound | null = null;
    private countdownSound: Sound | null = null;
    private paddleHitSound: Sound | null = null;
    private scoreSound: Sound | null = null;

    constructor(scene: Scene) {
        this.scene = scene;
        
    }

    async initialize(): Promise<void> {
        try {
            if (!this.scene)
                Logger.error('Scene required', 'BabylonAudioManager');
            this.gameMusic = new Sound(
                "gameMusic",
                "/assets/audio/bg/retro2.mp3",
                this.scene,
                null,
                {
                    loop: true,
                    autoplay: false,
                    volume: 0.5,
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
                    volume: 0.6,
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
                    volume: 0.6,
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
                    volume: 0.7,
                    playbackRate: this.basePlaybackRate
                }
            );

            this.isInitialized = true;
        } catch (error) {
            Logger.error('Error initializing Babylon audio', 'BabylonAudioManager', error);
        }
    }

    // Start playing the game music
    startGameMusic(): void {
        if (!this.gameMusic || !this.isInitialized) {
            Logger.warn('Game music not ready', 'BabylonAudioManager');
            return;
        }

        try {
            if (this.gameMusic.isPlaying)
                this.gameMusic.stop();

            this.gameMusic.play();
        } catch (error) {
            Logger.error('Error starting game music', 'BabylonAudioManager', error);
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
    playGameStart(): void {
        if (this.gameStartSound && this.gameStartSound.isReady())
            this.gameStartSound.play();
    }

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

    stopCountdown(): void {
        this.countdownSound?.stop();
    }

    dispose(): void {
        Logger.info('Disposing audio manager...', 'BabylonAudioManager');

        try {
            this.gameMusic?.dispose();
            this.gameMusic = null;

            this.paddleHitSound?.dispose();
            this.paddleHitSound = null;

            this.countdownSound?.dispose();
            this.countdownSound = null;

            this.scoreSound?.dispose();
            this.scoreSound = null;

            this.gameStartSound?.dispose();
            this.gameStartSound = null;

            this.scene = null;
            this.isInitialized = false;

            Logger.info('Audio manager disposed successfully', 'BabylonAudioManager');
        } catch (error) {
            Logger.error('Error disposing audio manager', 'BabylonAudioManager', error);
        }
    }
}