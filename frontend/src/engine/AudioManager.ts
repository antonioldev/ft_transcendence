declare var BABYLON: typeof import('@babylonjs/core');

import { Logger } from '../utils/LogManager.js';

export class AudioManager {
    private scene: any = null;
    private gameMusic: any = null;
    private isInitialized: boolean = false;
    private basePlaybackRate: number = 0.5;
    private maxPlaybackRate: number = 2.0;
    private maxRally: number = 50;
    private currentRally: number = 1;

    // Sound effects
    private gameStartSound: any = null;
    private countdownSound: any = null
    private paddleHitSound: any = null;

    constructor(scene: any) {
        this.scene = scene;
    }

    async initialize(): Promise<void> {
        if (!this.scene) {
            Logger.error('Scene required for Babylon audio initialization', 'BabylonAudioManager');
        }

        try {
            // Main game music
            await BABYLON.CreateAudioEngineAsync({ volume: 0.6 });

            this.gameMusic = await BABYLON.CreateSoundAsync(
                "gameMusic",
                "/assets/audio/music3.wav",
                {
                    loop: true,
                    autoplay: false,
                    volume: 0.6,
                    playbackRate: this.basePlaybackRate
                }
            );

            this.paddleHitSound = new BABYLON.Sound(
                "paddleHit",
                "/assets/audio/hit.mp3",
                this.scene,
                null,
                {
                    loop: false,
                    autoplay: false,
                    volume: 0.4,
                    spatialSound: false
                }
            );

            // this.countdownSound = new BABYLON.Sound(
            //     "countdown",
            //     "/assets/audio/countdown2.wav",
            //     this.scene,
            //     null,
            //     {
            //         loop: false,
            //         autoplay: false,
            //         volume: 1.0,
            //         spatialSound: false
            //     }
            // );

            this.countdownSound = await BABYLON.CreateSoundAsync(
                "countdown",
                "/assets/audio/countdown2.wav",
                {
                    loop: true,
                    autoplay: false,
                    volume: 0.4,
                    playbackRate: this.basePlaybackRate
                }
            );

            Logger.info('Game music loaded successfully', 'BabylonAudioManager');
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
        this.currentRally = rallyCount;

        const speedCurve = Math.min(rallyCount / this.maxRally, 1.0);
        const newPlaybackRate = this.basePlaybackRate + 
            (speedCurve * (this.maxPlaybackRate - this.basePlaybackRate));

        this.gameMusic.playbackRate = newPlaybackRate;
    }

    // Sound effects methods
    playGameStart(): void {
        if (this.gameStartSound && this.gameStartSound.isReady)
            this.gameStartSound.play();
    }

    playPaddleHit(): void {
        if (this.paddleHitSound && this.paddleHitSound.isReady)
            this.paddleHitSound.play();
    }

    playCountdown(): void {
        this.stopCountdown();
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