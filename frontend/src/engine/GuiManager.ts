declare var BABYLON: typeof import('@babylonjs/core') & {
    GUI: typeof import('@babylonjs/gui');
}; //declare var BABYLON: any;

import { GameConfig } from './GameConfig.js';
import { GameMode } from '../shared/constants.js';
import { ViewMode } from '../shared/constants.js';
import { Logger } from '../utils/LogManager.js';
import { getCurrentTranslation } from '../translations/translations.js';
import { spawnFireworksInFrontOfCameras, FINAL_FIREWORKS, PARTIAL_FIREWORKS } from './scene/fireworks.js'

/**
 * Manages all GUI elements for the game including HUD, scores, FPS display, rally and animations
 */
export class GUIManager {
    private advancedTexture: any = null;
    private isInitialized: boolean = false;

    private hudGrid: any = null;
    private hudColor: string = "rgba(0, 0, 0, 0.50)";

    private fpsText: any = null;

    private score1Text: any = null;
    private score2Text: any = null;
    private player1Label: any = null;
    private player2Label: any = null;

    private rallyText: any | null;
    private rally: any = null;
    private previousRally: number = 1;

    private countdownText: any = null;
    private countdownContainer: any = null;

    private endGameOverlay: any = null;
    private endGameWinnerText: any = null;

    private partialEndGameOverlay: any = null;
    private partialTransitionFill: any = null;
    private partialText: any = null;


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
            this.createPartialEndGameOverlay();
            this.createEndGameOverlay();

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

    private addHUDBox(col: number, controls: any | any[]): void {
        const box = new BABYLON.GUI.Rectangle();
        box.background = this.hudColor;
        box.thickness = 0;

        const list = Array.isArray(controls) ? controls : [controls];
        for (const items of list)
            box.addControl(items);

        this.hudGrid.addControl(box, 0, col);
    }

    private applyRichTextEffects(textBlock: any): void {
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

    private createTextBlock(name: string, size: number, h_align: any, v_align: any) {
        const label = new BABYLON.GUI.TextBlock();
        label.text = name;
        label.color = "white";
        label.textHorizontalAlignment = h_align;
        label.textVerticalAlignment = v_align;
        label.fontSize = size;
        label.height = "100%";
        label.width = "100%";
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
        this.hudGrid.zIndex = 8;

        this.hudGrid.addColumnDefinition(0.10); // FPS
        this.hudGrid.addColumnDefinition(0.15); // P1 instructions
        this.hudGrid.addColumnDefinition(0.25); // P1 score
        this.hudGrid.addColumnDefinition(0.25); // P2 score
        this.hudGrid.addColumnDefinition(0.15); // P2 instructions
        this.hudGrid.addColumnDefinition(0.10); // Rally

        this.advancedTexture.addControl(this.hudGrid);

        // Box 1: FPS
        this.fpsText = this.createTextBlock("FPS: 0", 18, BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER, BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER);
        this.addHUDBox(0, this.fpsText);

        // Box 2: Instructions P1
        this.addHUDBox(1, this.createPlayerControls(config, 1));

        // Box 3: P1 score + label
        this.player1Label = this.createTextBlock("Player 1", 48, BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER, BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER);
        this.applyRichTextEffects(this.player1Label);

        this.score1Text = this.createTextBlock("0", 56, BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER, BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM);
        this.applyRichTextEffects(this.score1Text);

        this.addHUDBox(2, [this.player1Label, this.score1Text]);

        // Box 4: P2 score + label  
        this.player2Label = this.createTextBlock("Player 2", 48, BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER, BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER);
        this.applyRichTextEffects(this.player2Label);

        this.score2Text = this.createTextBlock("0", 56, BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER, BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM);
        this.applyRichTextEffects(this.score2Text);

        this.addHUDBox(3, [this.player2Label, this.score2Text]);

        // Box 5: Instructions P2
        this.addHUDBox(4, this.createPlayerControls(config, 2));

        // Box 6: Rally
        this.rallyText = this.createTextBlock("Rally", 48, BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER, BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER);

        this.rally = this.createTextBlock("0", 56, BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER, BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM);
        this.rally.transformCenterY = 1;
        this.rally.scaleX = 1;
        this.rally.scaleY = 1;

        const animationScaleX = this.createAnimation("scaleX", 1, 1.3);
        const animationScaleY = this.createAnimation("scaleY", 1, 1.3);
        this.rally.animations = [animationScaleX, animationScaleY];

        this.addHUDBox(5, [this.rallyText, this.rally]);
    }

    private createCountdownDisplay(config: GameConfig): void {
        this.countdownContainer = new BABYLON.GUI.Rectangle("countdownContainer");
        this.countdownContainer.width = "200px";
        this.countdownContainer.height = "200px";
        this.countdownContainer.cornerRadius = 60;
        this.countdownContainer.thickness = 0;
        this.countdownContainer.background = "transparent";
        if (config.viewMode === ViewMode.MODE_2D)
            console.log(); // TODO remove
        // if (config.viewMode === ViewMode.MODE_2D)
        //     this.countdownContainer.background = "rgba(0, 0, 0, 1)";
        // else
        //     this.countdownContainer.background = "rgba(0, 0, 0, 0.8)";
        this.countdownContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.countdownContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this.countdownContainer.isVisible = false;
        this.countdownContainer.zIndex = 10;

        // Create countdown text
        this.countdownText = this.createTextBlock("5", 72, BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER, BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER);
        this.applyRichTextEffects(this.countdownText);
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

    hideCountdown(): void {
        if (this.countdownContainer)
            this.countdownContainer.isVisible = false;
        this.countdownText.animations = [];
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

    updateFPS(fps: number): void {
        if (this.fpsText)
            this.fpsText.text = `FPS: ${Math.round(fps)}`;
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

    //instructions for movement
    private getControlsText(viewMode: ViewMode, player: number): string {
        const t = getCurrentTranslation();
        const move = t.controls;
        
        if (viewMode === ViewMode.MODE_2D)
            return player === 1 ? move + "\nP1: W / S" : move + "\nP2: ↑ / ↓";
        else
            return player === 1 ? move + "\nP1: A / D" : move + "\nP2: ← / →";
    }

    private createEndGameOverlay(): void {
        this.endGameOverlay = new BABYLON.GUI.Grid();
        this.endGameOverlay.width = "100%";
        this.endGameOverlay.height = "20%";
        this.endGameOverlay.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.endGameOverlay.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.endGameOverlay.background = "rgba(0, 0, 0, 0.9)";
        this.endGameOverlay.isVisible = false;

        // Add one column for the winner text
        this.endGameOverlay.addColumnDefinition(1.0);

        // Create winner text
        this.endGameWinnerText = this.createTextBlock("", 72, BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER, BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER);
        this.endGameWinnerText.color = "#FFD700";
        this.endGameWinnerText.fontWeight = "bold";
        this.applyRichTextEffects(this.endGameWinnerText);
        this.endGameOverlay.addControl(this.endGameWinnerText, 0, 0);
        this.advancedTexture.addControl(this.endGameOverlay);
    }

    private createPartialEndGameOverlay(): void {
        this.partialEndGameOverlay = new BABYLON.GUI.Rectangle("partialWinnerLayer");
        this.partialEndGameOverlay.thickness = 0;
        this.partialEndGameOverlay.width = "100%";
        this.partialEndGameOverlay.height = "100%";
        this.partialEndGameOverlay.isPointerBlocker = true;
        this.partialEndGameOverlay.isVisible = false;
        this.partialEndGameOverlay.zIndex = 9;
        this.advancedTexture.addControl(this.partialEndGameOverlay);

        this.partialText = new BABYLON.GUI.TextBlock("pw_text", "");
        this.partialText.fontSize = 72;
        this.partialText.color = "#FFD700";
        this.partialText.outlineWidth = 2;
        this.partialText.outlineColor = "#ffffffee";  
        this.partialText.alpha = 0;
        this.partialText.zIndex = 11;
        this.partialEndGameOverlay.addControl(this.partialText);

        this.partialTransitionFill = new BABYLON.GUI.Rectangle("partialTransitionFill");
        this.partialTransitionFill.thickness = 0;
        this.partialTransitionFill.width = "100%";
        this.partialTransitionFill.heightInPixels = 0;
        this.partialTransitionFill.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.partialTransitionFill.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.partialTransitionFill.background = this.hudColor;
        this.partialEndGameOverlay.addControl(this.partialTransitionFill);
    }

    async showWinner(winner: string): Promise<void> {
        if (!this.endGameOverlay || !this.endGameWinnerText)
            return;

        if (this.hudGrid)
            this.hudGrid.isVisible = false;
        this.endGameWinnerText.text = `🏆 ${winner} WINS! 🏆`;
        this.endGameOverlay.isVisible = true;
        const scene = this.advancedTexture.getScene();
        if (scene) {
            const cams = scene.activeCameras?.length ? scene.activeCameras : scene.activeCamera;
            spawnFireworksInFrontOfCameras(scene, FINAL_FIREWORKS, cams);
            // this.createCameraBasedFireworks(scene);
        }
        await new Promise(resolve => setTimeout(resolve, 5000));

        if (this.hudGrid)
            this.hudGrid.isVisible = true;
        if (this.endGameOverlay)
            this.endGameOverlay.isVisible = false;
    }

    async animateBackground(show: boolean): Promise<void> {
        if (!this.advancedTexture || !this.partialTransitionFill || !this.partialEndGameOverlay) return;

        const scene = this.advancedTexture.getScene();
        const fps = 60;
        const frames = 30;
        const target = Math.round(this.advancedTexture.getSize().height);

        const current = this.partialTransitionFill.heightInPixels ?? 0;
        const end     = show ? target : 0;
        if (show) {
            this.partialEndGameOverlay.isVisible = true;
            if (this.hudGrid) this.hudGrid.isVisible = false;
        }

        if (current === end) {
            if (!show) this.partialEndGameOverlay.isVisible = false;
            return;
        }

        const ease = new BABYLON.QuadraticEase();
        ease.setEasingMode(show
            ? BABYLON.EasingFunction.EASINGMODE_EASEOUT // grow fast then slow
            : BABYLON.EasingFunction.EASINGMODE_EASEIN   // shrink slow then fast
        );

        const anim = BABYLON.Animation.CreateAnimation("heightInPixels",
            BABYLON.Animation.ANIMATIONTYPE_FLOAT, fps, ease);
        anim.setKeys([{ frame: 0, value: current }, { frame: frames, value: end }]);
        this.partialTransitionFill.animations = [anim];
        scene.beginAnimation(this.partialTransitionFill, 0, frames, false);
        // await new Promise<void>(r => scene.beginAnimation(this.partialTransitionFill, 0, frames, false, 1, r));
        if (!show) {
            this.partialEndGameOverlay.isVisible = false;
            this.hudGrid.isVisible = true;
        }
    }
    

    async showPartialWinner(winner: string): Promise<void> {
        if (!this.advancedTexture) return;

        const scene = this.advancedTexture.getScene();
        const fps = 60;
        const totalFrames = 180;

        this.partialText.text = `Winner: ${winner}`;
        this.partialText.alpha = 0;

        this.partialEndGameOverlay.isVisible = true;
        this.partialEndGameOverlay.isPointerBlocker = true;

        const fadeIn = BABYLON.Animation.CreateAnimation("alpha", BABYLON.Animation.ANIMATIONTYPE_FLOAT, fps, new BABYLON.QuadraticEase());
        fadeIn.setKeys([{frame:0,value:0},{frame:10,value:1}]);
        this.partialText.animations = [fadeIn];

        const cams = scene.activeCameras?.length ? scene.activeCameras : scene.activeCamera;
        spawnFireworksInFrontOfCameras(scene, PARTIAL_FIREWORKS, cams);
        await new Promise(r => scene.beginAnimation(this.partialText!, 0, 10, false, 1, r));
        await new Promise(r => setTimeout(r, totalFrames));

    }

    async hidePartialWinner(): Promise<void> {
        if (!this.partialEndGameOverlay || !this.partialText) return;
        const scene = this.advancedTexture.getScene();
        const fps = 60;
        const totalFrames = 60;

        const fadeOut = BABYLON.Animation.CreateAnimation("alpha", BABYLON.Animation.ANIMATIONTYPE_FLOAT, fps, new BABYLON.QuadraticEase());
        fadeOut.setKeys([{frame:0,value:1},{frame:totalFrames,value:0}]);

        this.partialText.animations = [fadeOut];

        await new Promise(r => scene.beginAnimation(this.partialText!, 0, totalFrames, false, 1, r));

        this.partialEndGameOverlay.isPointerBlocker = false;
        this.partialEndGameOverlay.isVisible = false;
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
            this.partialEndGameOverlay = null;
            this.partialText = null;

            this.advancedTexture?.dispose();
            this.advancedTexture = null;

            this.isInitialized = false;
        } catch (error) {
            Logger.error('Error disposing GUI', 'GUIManager', error);
        }
    }
}