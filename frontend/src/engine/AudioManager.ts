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
    private paddleHitSound: any = null;
    private ballBounceSound: any = null;
    private scoreSound: any = null;
    private gameStartSound: any = null;

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
    playPaddleHit(): void {
        if (this.paddleHitSound && this.paddleHitSound.isReady)
            this.paddleHitSound.play();
    }

    playBallBounce(): void {
        if (this.ballBounceSound && this.ballBounceSound.isReady)
            this.ballBounceSound.play();
    }

    playScore(): void {
        if (this.scoreSound && this.scoreSound.isReady)
            this.scoreSound.play();
    }

    playGameStart(): void {
        if (this.gameStartSound && this.gameStartSound.isReady)
            this.gameStartSound.play();
    }

    dispose(): void {
        Logger.info('Disposing audio manager...', 'BabylonAudioManager');

        try {
            this.gameMusic?.dispose();
            this.gameMusic = null;

            this.paddleHitSound?.dispose();
            this.paddleHitSound = null;

            this.ballBounceSound?.dispose();
            this.ballBounceSound = null;

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