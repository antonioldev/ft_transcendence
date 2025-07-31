declare var BABYLON: typeof import('@babylonjs/core') & {
    GUI: typeof import('@babylonjs/gui');
}; //declare var BABYLON: any;

import { GameConfig } from './GameConfig.js';
import { GameMode } from '../shared/constants.js';
import { ViewMode } from '../shared/constants.js';
import { Logger } from '../core/LogManager.js';
import { getCurrentTranslation } from '../translations/translations.js';

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

    private player1Label: any = null;
    private player2Label: any = null;
    
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

            // Create HUD elements
            this.createHUD(config);

            // Create view mode specific elements
            this.createViewModeElements(config);

            // Create countdown container
            this.createCountdownDisplay(config);

            this.isInitialized = true;
            Logger.info('GUI created successfully', 'GUIManager');

        } catch (error) {
            Logger.error('Error creating GUI', 'GUIManager', error);
            throw error;
        }
    }

    // Create view mode specific GUI elements (like split screen divider)
    private createViewModeElements(config: GameConfig): void {
        if (config.viewMode === ViewMode.MODE_3D && 
            (config.gameMode === GameMode.TWO_PLAYER_LOCAL || config.gameMode === GameMode.TOURNAMENT_LOCAL)) {
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

    private createHUDBox(): any {
        const box = new BABYLON.GUI.Rectangle();
        box.thickness = 0;
        box.background = "rgba(0, 0, 0, 0.83)";
        return box;
    }

    private applyRichTextEffects(textBlock: any, config: GameConfig): void {
        if (config.viewMode === ViewMode.MODE_3D) {
            // Add shadow effect
            textBlock.shadowOffsetX = 3;
            textBlock.shadowOffsetY = 3;
            textBlock.shadowBlur = 8;
            textBlock.shadowColor = "rgba(255, 107, 107, 0.5)";
            
            // Make text bold and add outline
            textBlock.fontWeight = "bold";
            textBlock.outlineWidth = 2;
            textBlock.outlineColor = "black";  
        }
    }

    private createTextBlock(name: string, size: number, top: string, fontWeight?: string) {
        const label = new BABYLON.GUI.TextBlock();
        label.text = name;
        label.color = "white";
        label.top = top;
        label.fontSize = size;
        label.width = "120px";
        if (fontWeight)
            label.fontWeight = fontWeight;
        return label;
    }

    private createPlayerControls(config: GameConfig, player: number): any {
        const pControls = new BABYLON.GUI.TextBlock();
        pControls.text = this.getControlsText(config.viewMode, player);
        pControls.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        pControls.lineSpacing = "10px";
        if (player === 2 && (config.gameMode === GameMode.SINGLE_PLAYER ||
            config.gameMode === GameMode.TOURNAMENT_REMOTE || config.gameMode === GameMode.TWO_PLAYER_REMOTE))
            pControls.color = "rgba(0, 0, 0, 0)";
        else
            pControls.color = "rgba(255,255,255,0.7)";
        pControls.fontSize = 30;
        return pControls;
    }

    private createHUD(config: GameConfig): void {
        const hudGrid = new BABYLON.GUI.Grid();
        hudGrid.width = "100%";
        hudGrid.height = "20%";
        hudGrid.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        hudGrid.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;

        hudGrid.addColumnDefinition(0.10); // FPS
        hudGrid.addColumnDefinition(0.15); // P1 instructions
        hudGrid.addColumnDefinition(0.25); // P1 score
        hudGrid.addColumnDefinition(0.25); // P2 score
        hudGrid.addColumnDefinition(0.15); // P2 instructions
        hudGrid.addColumnDefinition(0.10); // Empty

        this.advancedTexture.addControl(hudGrid);

        // Box 1: FPS
        const box1 = this.createHUDBox();
        this.fpsText = this.createTextBlock("FPS: 0", 18, "0px");
        box1.addControl(this.fpsText);
        hudGrid.addControl(box1, 0, 0);

        // Box 2: Instructions P1
        const box2 = this.createHUDBox();
        box2.addControl(this.createPlayerControls(config, 1));
        hudGrid.addControl(box2, 0, 1);

        // Box 3: P1 score + label
        const box3 = this.createHUDBox();
        this.player1Label = this.createTextBlock("Player 1", 48, "-20px");
        this.applyRichTextEffects(this.player1Label, config);
        box3.addControl(this.player1Label);
        this.score1Text = this.createTextBlock("0", 48, "30px");
        this.applyRichTextEffects(this.score1Text, config);
        box3.addControl(this.score1Text);
        hudGrid.addControl(box3, 0, 2);

        // Box 4: P2 score + label  
        const box4 = this.createHUDBox();
        this.player2Label = this.createTextBlock("Player 2", 48, "-20px");
        this.applyRichTextEffects(this.player2Label, config);
        box4.addControl(this.player2Label);
        this.score2Text = this.createTextBlock("0", 48, "30px");
        this.applyRichTextEffects(this.score2Text, config);
        box4.addControl(this.score2Text);
        hudGrid.addControl(box4, 0, 3);

        // Box 5: Instructions P2
        const box5 = this.createHUDBox();
        box5.addControl(this.createPlayerControls(config, 2));
        hudGrid.addControl(box5, 0, 4);

        // Box 6: Empty
        const box6 = this.createHUDBox();
        hudGrid.addControl(box6, 0, 5);

        Logger.debug('HUD created with six boxes using Grid', 'GUIManager');
    }

    private createCountdownDisplay(config: GameConfig): void {
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
        this.countdownText = this.createTextBlock("5", 72, "0px", "bold")
        this.applyRichTextEffects(this.countdownText, config);

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
        this.countdownText.animations = [];
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
        this.player1Label.text = player1Name;
        this.player2Label.text = player2Name;
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

    //instructions for movement
    private getControlsText(viewMode: ViewMode, player: number): string {
        const t = getCurrentTranslation();
        const move = t.controls;
        
        if (viewMode === ViewMode.MODE_2D)
            return player === 1 ? move + "\nP1: W/S" : move + "\nP2: ↑/↓";
        else
            return player === 1 ? move + "\nP1: A/D" : move + "\nP2: ←/→";
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

            this.player1Label = null;
            this.player2Label = null;

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