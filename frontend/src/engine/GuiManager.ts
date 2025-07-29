declare var BABYLON: typeof import('@babylonjs/core') & {
    GUI: typeof import('@babylonjs/gui');
}; //declare var BABYLON: any;

import { GameConfig } from './GameConfig.js';
import { GameMode } from '../shared/constants.js';
import { ViewMode } from '../shared/constants.js';
import { Logger } from '../core/LogManager.js';

/**
 * Manages all GUI elements for the game including HUD, scores, FPS display
 * 
 * Responsibilities:
 * - Creating and managing Babylon.js GUI elements
 * - Updating score displays
 * - Managing FPS counter
 * - Handling view mode specific UI (like split screen divider)
 * - GUI cleanup and disposal
 */
export class GUIManager {
    private advancedTexture: any = null;

    private fpsText: any = null;
    
    private score1Text: any = null;
    private score2Text: any = null;
    
    private countdownText: any = null;
    private countdownContainer: any = null;
    
    private isInitialized: boolean = false;

    // Initialize and create all GUI elements
    createGUI(scene: any, config: GameConfig): void {
        if (this.isInitialized) {
            Logger.warn('GUI already initialized, skipping creation', 'GUIManager');
            return;
        }

        try {
            // Create the main GUI texture
            this.advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);
            this.advancedTexture.layer.layerMask = 0x20000000;

            // Create common HUD elements
            this.createContainerScore();
            this.createFPSDisplay();
            this.createScoreDisplay();

            // Create view mode specific elements
            this.createViewModeElements(config);

            // Create countdown container
            this.createCountdownDisplay();

            this.isInitialized = true;
            Logger.info('GUI created successfully', 'GUIManager');

        } catch (error) {
            Logger.error('Error creating GUI', 'GUIManager', error);
            throw error;
        }
    }

    // Create view mode specific GUI elements (like split screen divider)
    private createViewModeElements(config: GameConfig): void {
        if (config.viewMode === ViewMode.MODE_3D && config.gameMode === GameMode.TWO_PLAYER_LOCAL) {
            const dividerLine = new BABYLON.GUI.Rectangle();
            dividerLine.widthInPixels = 5;
            dividerLine.height = "100%";
            dividerLine.color = "black";
            dividerLine.background = "black";
            dividerLine.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
            dividerLine.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
            
            this.advancedTexture.addControl(dividerLine);
            Logger.info('Split screen divider created', 'GUIManager');
        }
    }

    // Create FPS display counter
    private createFPSDisplay(): void {
        this.fpsText = new BABYLON.GUI.TextBlock();
        this.fpsText.text = "FPS: 0";
        this.fpsText.color = "white";
        this.fpsText.fontSize = 16;
        this.fpsText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.fpsText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.fpsText.top = "1px";
        this.fpsText.left = "-20px";
        this.fpsText.width = "200px";
        this.fpsText.height = "40px";
        
        this.advancedTexture.addControl(this.fpsText);
        Logger.debug('FPS display created', 'GUIManager');
    }

    private createContainerScore(): void {
        const hudPanel = new BABYLON.GUI.Rectangle("hudPanel");
        hudPanel.width = "100%";
        hudPanel.height = "20%";
        hudPanel.cornerRadius = 0;
        hudPanel.color = "white";
        hudPanel.thickness = 0; // No border
        hudPanel.background = "rgba(50, 50, 50, 0.6)"; // grey semi-transparent
        hudPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        hudPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.advancedTexture.addControl(hudPanel);
    }

    // Create score display with player names and scores
    private createScoreDisplay(): void {
        // Create score container
        const scoreContainer = new BABYLON.GUI.StackPanel();
        scoreContainer.isVertical = true;
        scoreContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        scoreContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        scoreContainer.top = "-30px";
        scoreContainer.height = "80px";

        // Player names row
        const playersRow = this.createPlayersRow();
        
        // Scores row
        const scoresRow = this.createScoresRow();

        // Add rows to container
        scoreContainer.addControl(playersRow);
        scoreContainer.addControl(scoresRow);

        this.advancedTexture.addControl(scoreContainer);
        Logger.debug('Score display created', 'GUIManager');
    }

    // Create the player names row
    private createPlayersRow(): any {
        const playersRow = new BABYLON.GUI.StackPanel();
        playersRow.isVertical = false;
        playersRow.height = "30px";

        const player1Label = new BABYLON.GUI.TextBlock();
        player1Label.text = "Player 1";
        player1Label.color = "white";
        player1Label.fontSize = 18;
        player1Label.width = "120px";

        const player2Label = new BABYLON.GUI.TextBlock();
        player2Label.text = "Player 2";
        player2Label.color = "white";
        player2Label.fontSize = 18;
        player2Label.width = "120px";

        playersRow.addControl(player1Label);
        playersRow.addControl(player2Label);

        return playersRow;
    }

    // Create the scores row
    private createScoresRow(): any {
        const scoresRow = new BABYLON.GUI.StackPanel();
        scoresRow.isVertical = false;
        scoresRow.height = "40px";

        this.score1Text = new BABYLON.GUI.TextBlock();
        this.score1Text.text = "0";
        this.score1Text.color = "white";
        this.score1Text.fontSize = 24;
        this.score1Text.width = "120px";

        this.score2Text = new BABYLON.GUI.TextBlock();
        this.score2Text.text = "0";
        this.score2Text.color = "white";
        this.score2Text.fontSize = 24;
        this.score2Text.width = "120px";

        scoresRow.addControl(this.score1Text);
        scoresRow.addControl(this.score2Text);

        return scoresRow;
    }

    private createCountdownDisplay(): void {
        this.countdownContainer = new BABYLON.GUI.Rectangle("countdownContainer");
        this.countdownContainer.width = "300px";
        this.countdownContainer.height = "150px";
        this.countdownContainer.cornerRadius = 20;
        this.countdownContainer.color = "white";
        this.countdownContainer.thickness = 3;
        this.countdownContainer.background = "rgba(0, 0, 0, 0.8)";
        this.countdownContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.countdownContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this.countdownContainer.isVisible = false;

        // Create countdown text
        this.countdownText = new BABYLON.GUI.TextBlock();
        this.countdownText.text = "3";
        this.countdownText.color = "white";
        this.countdownText.fontSize = 72;
        this.countdownText.fontWeight = "bold";

        this.countdownContainer.addControl(this.countdownText);
        this.advancedTexture.addControl(this.countdownContainer);
    }

    showCountdown(count: number): void {
        if (this.countdownText && this.countdownContainer) {
            this.countdownText.text = count.toString();
            this.countdownContainer.isVisible = true;

            // Reset scales first
            this.countdownText.scaleX = 1;
            this.countdownText.scaleY = 1;

            const animationScaleX = this.createAnimation("scaleX");
            const animationScaleY = this.createAnimation("scaleY");

            // Start animations
            this.countdownText.animations = [animationScaleX, animationScaleY];
            
            if (this.advancedTexture && this.advancedTexture.getScene) {
                const scene = this.advancedTexture.getScene();
                scene.beginAnimation(this.countdownText, 0, 60, false);
            }
        }
    }

    private createAnimation(property: string): any {
        const scale = BABYLON.Animation.CreateAnimation(
            property, BABYLON.Animation.ANIMATIONTYPE_FLOAT, 60, new BABYLON.SineEase());
        const keys = [
            { frame: 0, value: 1},
            { frame: 30, value: 2},
            { frame: 60, value: 1}
        ];
        scale.setKeys(keys);
        return scale;
    }

    hideCountdown(): void {
        if (this.countdownContainer)
            this.countdownContainer.isVisible = false;
    }

    // Update the FPS display
    updateFPS(fps: number): void {
        if (this.fpsText) {
            this.fpsText.text = `FPS: ${Math.round(fps)}`;
        }
    }

    // Update player scores
    updateScores(leftScore: number, rightScore: number): void {
        if (this.score1Text && this.score2Text) {
            this.score1Text.text = leftScore.toString();
            this.score2Text.text = rightScore.toString();
        }
    }

    // Update player names
    updatePlayerNames(player1Name: string, player2Name: string): void {
        // This could be implemented if player names become dynamic
        Logger.debug(`Player names updated: ${player1Name} vs ${player2Name}`, 'GUIManager');
    }

    // Check if GUI is properly initialized
    isReady(): boolean {
        return this.isInitialized && 
               this.advancedTexture !== null && 
               this.fpsText !== null && 
               this.score1Text !== null && 
               this.score2Text !== null &&
               this.countdownContainer !== null &&
               this.countdownText !== null;
    }

    // Get the advanced texture
    getAdvancedTexture(): any {
        return this.advancedTexture;
    }

    // Clean up all GUI resources
    dispose(): void {
        if (!this.isInitialized) return;

        try {
            Logger.info('Disposing GUI...', 'GUIManager');

            this.fpsText = null;
            this.score1Text = null;
            this.score2Text = null;

            this.countdownText = null;
            this.countdownContainer = null;

            // Dispose the main texture
            if (this.advancedTexture) {
                this.advancedTexture.dispose();
                this.advancedTexture = null;
            }

            this.isInitialized = false;
            Logger.info('GUI disposed successfully', 'GUIManager');

        } catch (error) {
            Logger.error('Error disposing GUI', 'GUIManager', error);
        }
    }
}