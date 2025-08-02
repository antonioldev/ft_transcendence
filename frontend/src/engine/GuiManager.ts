declare var BABYLON: typeof import('@babylonjs/core') & {
    GUI: typeof import('@babylonjs/gui');
}; //declare var BABYLON: any;

import { GameConfig } from './GameConfig.js';
import { Game } from './Game.js';
import { GameMode } from '../shared/constants.js';
import { ViewMode } from '../shared/constants.js';
import { Logger } from '../utils/LogManager.js';
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

    private hudGrid: any = null;
    private fpsText: any = null;
    private score1Text: any = null;
    private score2Text: any = null;
    private player1Label: any = null;
    private player2Label: any = null;
    private rallyText: any | null;
    private rally: any = null;
    private previousRally: number = 0;
    private countdownText: any = null;
    private countdownContainer: any = null;
    private isInitialized: boolean = false;
    private endGameOverlay: any = null;
    private endGameWinnerText: any = null;
    private fireworkColorIndex: number = 0;

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

            this.createHUD(config);
            this.createViewModeElements(config);
            this.createCountdownDisplay(config);
            this.createEndGameOverlay(config);

            this.isInitialized = true;

        } catch (error) {
            Logger.error('Error creating GUI', 'GUIManager', error);
            throw error;
        }
    }

    // Create split screen divider if is in split screen mode
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
        box.thickness = 2; // Add outline thickness for debugging
        box.color = "red"; // Outline color for debugging
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
        label.width = "100%";
        if (fontWeight !== null && fontWeight !== undefined)
            label.fontWeight = fontWeight;
        return label;
    }

    private createPlayerControls(config: GameConfig, player: number): any {
        const pControls = new BABYLON.GUI.TextBlock();
        pControls.text = this.getControlsText(config.viewMode, player);
        pControls.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        pControls.lineSpacing = "10px";
        pControls.color = "rgba(0, 0, 0, 0)";
        pControls.fontSize = 30;
        return pControls;
    }

    updateControlVisibility(player1: boolean, player2: boolean): void {
        if (!this.hudGrid) return;

        const player1ControlBox = this.hudGrid.getChildrenAt(0, 1)[0];
        const player2ControlBox = this.hudGrid.getChildrenAt(0, 4)[0];

        if (player1ControlBox && player1ControlBox.children.length > 0) {
            const player1Controls = player1ControlBox.children[0];
            player1Controls.color = player1 ? "rgba(255,255,255,0.7)" : "rgba(0, 0, 0, 0)";
        }

        if (player2ControlBox && player2ControlBox.children.length > 0) {
            const player2Controls = player2ControlBox.children[0];
            player2Controls.color = player2 ? "rgba(255,255,255,0.7)" : "rgba(0, 0, 0, 0)";
        }
    }

    private createHUD(config: GameConfig): void {
        this.hudGrid = new BABYLON.GUI.Grid();
        this.hudGrid.width = "100%";
        this.hudGrid.height = "20%";
        this.hudGrid.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.hudGrid.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;

        this.hudGrid.addColumnDefinition(0.10); // FPS
        this.hudGrid.addColumnDefinition(0.15); // P1 instructions
        this.hudGrid.addColumnDefinition(0.25); // P1 score
        this.hudGrid.addColumnDefinition(0.25); // P2 score
        this.hudGrid.addColumnDefinition(0.15); // P2 instructions
        this.hudGrid.addColumnDefinition(0.10); // Rally

        this.advancedTexture.addControl(this.hudGrid);

        // Box 1: FPS
        const box1 = this.createHUDBox();
        this.fpsText = this.createTextBlock("FPS: 0", 18, "0px");
        box1.addControl(this.fpsText);
        this.hudGrid.addControl(box1, 0, 0);

        // Box 2: Instructions P1
        const box2 = this.createHUDBox();
        box2.addControl(this.createPlayerControls(config, 1));
        this.hudGrid.addControl(box2, 0, 1);

        // Box 3: P1 score + label
        const box3 = this.createHUDBox();
        this.player1Label = this.createTextBlock("Player 2", 48, "0px");
        this.player1Label.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.player1Label.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.applyRichTextEffects(this.player1Label, config);
        this.score1Text = this.createTextBlock("0", 56, "-15px");
        this.score1Text.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.score1Text.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.applyRichTextEffects(this.score1Text, config);
        box3.addControl(this.player1Label);
        box3.addControl(this.score1Text);
        this.hudGrid.addControl(box3, 0, 2);

        // Box 4: P2 score + label  
        const box4 = this.createHUDBox();
        this.player2Label = this.createTextBlock("Player 2", 48, "0px");
        this.player2Label.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.player2Label.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.applyRichTextEffects(this.player2Label, config);

        this.score2Text = this.createTextBlock("0", 56, "-15px");
        this.score2Text.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.score2Text.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.applyRichTextEffects(this.score2Text, config);
        box4.addControl(this.player2Label);
        box4.addControl(this.score2Text);
        this.hudGrid.addControl(box4, 0, 3);

        // Box 5: Instructions P2
        const box5 = this.createHUDBox();
        box5.addControl(this.createPlayerControls(config, 2));
        this.hudGrid.addControl(box5, 0, 4);

        // Box 6: Rally
        const box6 = this.createHUDBox();
        this.rallyText = this.createTextBlock("Rally", 48, "0px");
        this.rallyText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.rallyText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.rally = this.createTextBlock("0", 56, "-15px");
        this.rally.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.rally.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.rally.transformCenterY = 1;
        this.rally.scaleX = 1;
        this.rally.scaleY = 1;
        const animationScaleX = this.createAnimation("scaleX", 1, 1.3);
        const animationScaleY = this.createAnimation("scaleY", 1, 1.3);
        this.rally.animations = [animationScaleX, animationScaleY];
        box6.addControl(this.rallyText);
        box6.addControl(this.rally);
        this.hudGrid.addControl(box6, 0, 5);
    }

    private createCountdownDisplay(config: GameConfig): void {
        this.countdownContainer = new BABYLON.GUI.Rectangle("countdownContainer");
        this.countdownContainer.width = "300px";
        this.countdownContainer.height = "150px";
        this.countdownContainer.cornerRadius = 20;
        this.countdownContainer.color = "white";
        this.countdownContainer.thickness = 3;
        if (config.viewMode === ViewMode.MODE_2D)
            this.countdownContainer.background = "rgba(0, 0, 0, 1)";
        else
            this.countdownContainer.background = "rgba(0, 0, 0, 0.8)";
        this.countdownContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.countdownContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this.countdownContainer.isVisible = false;

        // Create countdown text
        this.countdownText = this.createTextBlock("5", 72, "0px", "bold");
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

            const animationScaleX = this.createAnimation("scaleX", 1, 2);
            const animationScaleY = this.createAnimation("scaleY", 1, 2);

            // Start animations
            this.countdownText.animations = [animationScaleX, animationScaleY];
            
            if (this.advancedTexture && this.advancedTexture.getScene) {
                const scene = this.advancedTexture.getScene();
                scene.beginAnimation(this.countdownText, 0, 60, false);
            }
        }
    }

    private createAnimation(property: string, start: number, end: number): any {
        const scale = BABYLON.Animation.CreateAnimation(
            property, BABYLON.Animation.ANIMATIONTYPE_FLOAT, 60, new BABYLON.SineEase());
        const keys = [
            { frame: 0, value: start},
            { frame: 30, value: end},
            { frame: 60, value: start}
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

    updateRally(rally: number): void {
        if (this.rally && (this.previousRally < rally) || rally === 1) {
            this.rally.text = `${Math.round(rally)}`;

            const maxRally = 10;
            const intensity = Math.min(rally / maxRally, 1);
            const r = 255;
            const g = Math.round(255 * (1 - intensity));
            const b = Math.round(255 * (1 - intensity));
            this.rally.color = `rgb(${r}, ${g}, ${b})`;

            const scene = this.advancedTexture.getScene();
            scene.beginAnimation(this.rally, 0, 60, false);
        }
        this.previousRally = rally;
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
            return player === 1 ? move + "\nP1: W / S" : move + "\nP2: ↑ / ↓";
        else
            return player === 1 ? move + "\nP1: A / D" : move + "\nP2: ← / →";
    }

    private createEndGameOverlay(config: GameConfig): void {
        this.endGameOverlay = new BABYLON.GUI.Grid(); // Use Grid like HUD
        this.endGameOverlay.width = "100%";
        this.endGameOverlay.height = "20%";
        this.endGameOverlay.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.endGameOverlay.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.endGameOverlay.background = "rgba(0, 0, 0, 0.9)";
        this.endGameOverlay.isVisible = false;

        // Add one column for the winner text
        this.endGameOverlay.addColumnDefinition(1.0);

        // Create winner text
        this.endGameWinnerText = new BABYLON.GUI.TextBlock();
        this.endGameWinnerText.text = "";
        this.endGameWinnerText.color = "#FFD700";
        this.endGameWinnerText.fontSize = 72;
        this.endGameWinnerText.fontWeight = "bold";
        this.endGameWinnerText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.endGameWinnerText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;

        this.applyRichTextEffects(this.endGameWinnerText, config);

        // Add text to grid at position (0, 0)
        this.endGameOverlay.addControl(this.endGameWinnerText, 0, 0);
        this.advancedTexture.addControl(this.endGameOverlay);
    }

    private createCameraBasedFireworks(scene: any): void {
        const cameras = this.getActiveCameras(scene);
        cameras.forEach((camera, cameraIndex) => {
            this.createFireworksForCamera(scene, camera, cameraIndex);
        });
    }

    private getActiveCameras(scene: any): any[] {
        // Return array of active cameras
        if (scene.activeCameras && scene.activeCameras.length > 0) {
            return scene.activeCameras; // Split screen mode
        } else if (scene.activeCamera) {
            return [scene.activeCamera]; // Single camera mode
        }
        return [];
    }

    private createFireworksForCamera(scene: any, camera: any, cameraIndex: number): void {
        const numberOfFireworks = 8;
        
        for (let i = 0; i < numberOfFireworks; i++) {
            const distance = 6 + Math.random() * 4;
            const spread = 4;

            const forward = camera.getForwardRay ? camera.getForwardRay().direction : new BABYLON.Vector3(0, 0, 1);
            const x = camera.position.x + forward.x * distance + (Math.random() - 0.5) * spread;
            const y = camera.position.y + forward.y * distance + Math.random() * 3;
            const z = camera.position.z + forward.z * distance + (Math.random() - 0.5) * spread;
            const pos = new BABYLON.Vector3(x, y, z);
            
            setTimeout(() => {
                this.createExplosion(scene, pos);
            }, i * (150 + Math.random() * 200)); // Faster timing
        }
    }
    private createExplosion(scene: any, pos: any): void {
        const explosion = new BABYLON.ParticleSystem(`gameEnd_explosion_${Date.now()}`, 1500, scene);
        try {
            explosion.particleTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/flare.png", scene);
        } catch (error) {
            console.log("Using default particles for game end explosion");
        }
        explosion.emitter = pos;

        const colorOptions = [
            [new BABYLON.Color4(1, 0.8, 0.2, 1), new BABYLON.Color4(1, 0.8, 0.2, 1)], // Gold
            [new BABYLON.Color4(0.2, 1, 0.3, 1), new BABYLON.Color4(0.2, 1, 0.3, 1)], // Green
            [new BABYLON.Color4(0.3, 0.5, 1, 1), new BABYLON.Color4(0.3, 0.5, 1, 1)], // Blue
            [new BABYLON.Color4(1, 0.3, 0.8, 1), new BABYLON.Color4(1, 0.3, 0.8, 1)], // Pink
            [new BABYLON.Color4(0.8, 0.2, 1, 1), new BABYLON.Color4(0.8, 0.2, 1, 1)], // Purple
        ];
        const selectedColor = colorOptions[this.fireworkColorIndex % colorOptions.length];
        this.fireworkColorIndex++;

        explosion.color1 = selectedColor[0];
        explosion.color2 = selectedColor[1];
        explosion.colorDead = new BABYLON.Color4(0, 0, 0, 0);

        explosion.minSize = 0.1;
        explosion.maxSize = 0.8;
        explosion.minLifeTime = 1.5;
        explosion.maxLifeTime = 3.0;
        explosion.emitRate = 600;
        explosion.createSphereEmitter(2);
        explosion.minEmitPower = 6;
        explosion.maxEmitPower = 12;
        explosion.gravity = new BABYLON.Vector3(0, -9.81, 0);
        explosion.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        
        explosion.start();
        
        // Auto cleanup
        setTimeout(() => {
            explosion.stop();
            setTimeout(() => {
                explosion.dispose();
            }, 3000);
        }, 2000);
    }

    async showWinner(winner: string): Promise<void> {
        if (!this.endGameOverlay || !this.endGameWinnerText)
            return;

        if (this.hudGrid)
            this.hudGrid.isVisible = false;
        this.endGameWinnerText.text = `🏆 ${winner} WINS! 🏆`;
        this.endGameOverlay.isVisible = true;
        const scene = this.advancedTexture.getScene();
        if (scene)
            this.createCameraBasedFireworks(scene);
        await new Promise(resolve => setTimeout(resolve, 5000));

        this.hudGrid.isVisible = true;
        this.endGameOverlay.isVisible = false;
    }


    // Clean up all GUI resources
    dispose(): void {
        if (!this.isInitialized) return;

        try {
            this.fpsText = null;
            this.score1Text = null;
            this.score2Text = null;
            this.countdownText = null;
            this.countdownContainer = null;
            this.player1Label = null;
            this.player2Label = null;
            this.rallyText = null;
            this.rally = null;
            this.endGameWinnerText = null;
            this.endGameOverlay = null;
            this.hudGrid = null;

            if (this.advancedTexture)
                this.advancedTexture.dispose();
            this.advancedTexture = null;

            this.isInitialized = false;
        } catch (error) {
            Logger.error('Error disposing GUI', 'GUIManager', error);
        }
    }
}