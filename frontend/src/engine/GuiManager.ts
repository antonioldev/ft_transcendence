declare var BABYLON: typeof import('@babylonjs/core') & {
    GUI: typeof import('@babylonjs/gui');
}; //declare var BABYLON: any;

import { GameConfig } from './GameConfig.js';
import { GameMode } from '../shared/constants.js';
import { ViewMode } from '../shared/constants.js';
import { Logger } from '../utils/LogManager.js';
import { getCurrentTranslation } from '../translations/translations.js';
import { spawnFireworksInFrontOfCameras, FINAL_FIREWORKS, PARTIAL_FIREWORKS } from './scene/fireworks.js'
import { TextBlockOptions } from './utils.js';

/**
 * Manages all GUI elements for the game including HUD, scores, FPS display, rally and animations
 */
export class GUIManager {
    private readonly H_CENTER = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    private readonly V_CENTER = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    private readonly V_BOTTOM = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    private advancedTexture: any = null;
    private isInitialized: boolean = false;
    private hudGrid: any = null;
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
    private partialWinnerLabel: any = null;
    private partialWinnerName: any = null;
    private continueText: any = null;


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
            this.createCountdownDisplay();
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
            dividerLine.verticalAlignment = this.V_CENTER;
            dividerLine.horizontalAlignment = this.H_CENTER;
            
            this.advancedTexture.addControl(dividerLine);
            Logger.info('Split screen divider created', 'GUIManager');
        }
    }

    private addHUDBox(col: number, controls: any | any[]): void {
        const box = new BABYLON.GUI.Rectangle();
        box.background = "rgba(0, 0, 0, 0.50)";
        box.thickness = 0;

        const list = Array.isArray(controls) ? controls : [controls];
        for (const items of list)
            box.addControl(items);

        this.hudGrid.addControl(box, 0, col);
    }

    private createTextBlock(name: string, options: TextBlockOptions = {}): any {
        const textBlock = new BABYLON.GUI.TextBlock();

        textBlock.fontFamily = 'Poppins, Arial, sans-serif';
        textBlock.text = options.text || name;
        textBlock.fontSize = options.fontSize || 24;
        textBlock.color = options.color || "#FFFFFF";
        textBlock.fontWeight = options.fontWeight || "normal";
        textBlock.width = options.width || "100%";
        textBlock.height = options.height || "100%";

        textBlock.textHorizontalAlignment = options.horizontalAlignment || this.H_CENTER;
        textBlock.textVerticalAlignment = options.verticalAlignment || this.V_CENTER;

        if (options.alpha !== undefined) textBlock.alpha = options.alpha;
        if (options.lineSpacing) textBlock.lineSpacing = options.lineSpacing;
        if (options.resizeToFit !== undefined) textBlock.resizeToFit = options.resizeToFit;
        
        // Apply rich text effects if requested
        if (options.applyRichEffects) {
            textBlock.shadowOffsetX = options.shadowOffsetX || 3;
            textBlock.shadowOffsetY = options.shadowOffsetY || 3;
            textBlock.shadowBlur = options.shadowBlur || 8;
            textBlock.shadowColor = options.shadowColor || "rgba(255, 107, 107, 0.5)";
            textBlock.fontWeight = "bold";
            textBlock.outlineWidth = options.outlineWidth || 2;
            textBlock.outlineColor = options.outlineColor || "black";
        }

        return textBlock;
    }


    private createPlayerControls(config: GameConfig, player: number): any {
        const pControls = this.createTextBlock("PlayerControls", {
            text: this.getControlsText(config.viewMode, player),
            lineSpacing: "10px",
            color: "rgba(0, 0, 0, 0)",
            fontSize: 30
        });
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
        this.hudGrid.horizontalAlignment = this.H_CENTER;
        this.hudGrid.verticalAlignment = this.V_BOTTOM;
        this.hudGrid.zIndex = 8;

        this.hudGrid.addColumnDefinition(0.10); // FPS
        this.hudGrid.addColumnDefinition(0.15); // P1 instructions
        this.hudGrid.addColumnDefinition(0.25); // P1 score
        this.hudGrid.addColumnDefinition(0.25); // P2 score
        this.hudGrid.addColumnDefinition(0.15); // P2 instructions
        this.hudGrid.addColumnDefinition(0.10); // Rally

        this.advancedTexture.addControl(this.hudGrid);

        // Box 1: FPS
        this.fpsText = this.createTextBlock("FPS: 0", { fontSize: 18 });
        this.addHUDBox(0, this.fpsText);
        // Box 2: Instructions P1
        this.addHUDBox(1, this.createPlayerControls(config, 1));
        // Box 3: P1 score + label
        this.player1Label = this.createTextBlock("Player 1", { fontSize: 48, applyRichEffects: true });
        this.score1Text = this.createTextBlock("0", { fontSize: 56, verticalAlignment: this.V_BOTTOM, applyRichEffects: true });
        this.addHUDBox(2, [this.player1Label, this.score1Text]);
        // Box 4: P2 score + label  
        this.player2Label = this.createTextBlock("Player 2", { fontSize: 48, applyRichEffects: true });
        this.score2Text = this.createTextBlock("0", { fontSize: 56, verticalAlignment: this.V_BOTTOM, applyRichEffects: true });
        this.addHUDBox(3, [this.player2Label, this.score2Text]);
        // Box 5: Instructions P2
        this.addHUDBox(4, this.createPlayerControls(config, 2));
        // Box 6: Rally
        this.rallyText = this.createTextBlock("Rally", {fontSize: 48});
        this.rally = this.createTextBlock("0", { fontSize: 56, verticalAlignment: this.V_BOTTOM });
        this.rally.transformCenterY = 1;
        this.rally.scaleX = 1;
        this.rally.scaleY = 1;

        const animationScaleX = this.createAnimation("scaleX", 1, 1.3);
        const animationScaleY = this.createAnimation("scaleY", 1, 1.3);
        this.rally.animations = [animationScaleX, animationScaleY];

        this.addHUDBox(5, [this.rallyText, this.rally]);
    }

    private createCountdownDisplay(): void {
        this.countdownContainer = new BABYLON.GUI.Rectangle("countdownContainer");
        this.countdownContainer.width = "200px";
        this.countdownContainer.height = "200px";
        this.countdownContainer.cornerRadius = 60;
        this.countdownContainer.thickness = 0;
        this.countdownContainer.background = "transparent";
        this.countdownContainer.horizontalAlignment = this.H_CENTER;
        this.countdownContainer.verticalAlignment = this.V_CENTER;
        this.countdownContainer.isVisible = false;
        this.countdownContainer.zIndex = 10;

        this.countdownText = this.createTextBlock("5", { fontSize: 72, applyRichEffects: true });
        this.countdownContainer.addControl(this.countdownText);
        this.advancedTexture.addControl(this.countdownContainer);
    }

    showCountdown(count: number): void {
        if (this.countdownText && this.countdownContainer) {
            this.countdownText.text = count.toString();
            this.countdownContainer.isVisible = true;
            this.countdownText.scaleX = 1;
            this.countdownText.scaleY = 1;

            const animationScaleX = this.createAnimation("scaleX", 1, 2);
            const animationScaleY = this.createAnimation("scaleY", 1, 2);
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

    private createAnimation(property: string, from: number, end: number, frames: number = 60, pingPong: boolean = true): any {

        const fps: number = 60;
        const anim = BABYLON.Animation.CreateAnimation(
            property, BABYLON.Animation.ANIMATIONTYPE_FLOAT, fps, new BABYLON.SineEase());
        anim.loopMode = BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE;

        if (pingPong) {
            const mid = Math.floor(frames / 2);
            anim.setKeys([
            { frame: 0,      value: from },
            { frame: mid,    value: end },
            { frame: frames, value: from },
            ]);
        } else {
            anim.setKeys([
            { frame: 0,      value: from },
            { frame: frames, value: end },
            ]);
        }
        return anim;
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

    updateScores(leftScore: number, rightScore: number): void {
        if (this.score1Text && this.score2Text) {
            this.score1Text.text = leftScore.toString();
            this.score2Text.text = rightScore.toString();
        }
    }

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
    } // TODO add the rest

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
        this.endGameOverlay.horizontalAlignment = this.H_CENTER;
        this.endGameOverlay.verticalAlignment = this.V_BOTTOM;
        this.endGameOverlay.background = "rgba(0, 0, 0, 0.9)";
        this.endGameOverlay.isVisible = false;

        // Add one column for the winner text
        this.endGameOverlay.addColumnDefinition(1.0);

        // Create winner text
        this.endGameWinnerText = this.createTextBlock("endGameWinnerText", {
            fontSize: 72,
            color: "#FFD700",
            applyRichEffects: true
        });
        this.endGameOverlay.addControl(this.endGameWinnerText, 0, 0);
        this.advancedTexture.addControl(this.endGameOverlay);
    }

    private createPartialEndGameOverlay(): void {
        const t = getCurrentTranslation();
        this.partialEndGameOverlay = new BABYLON.GUI.Rectangle("partialWinnerLayer");
        this.partialEndGameOverlay.thickness = 0;
        this.partialEndGameOverlay.width = "100%";
        this.partialEndGameOverlay.height = "100%";
        this.partialEndGameOverlay.isPointerBlocker = true;
        this.partialEndGameOverlay.isVisible = false;
        this.partialEndGameOverlay.zIndex = 7;
        this.advancedTexture.addControl(this.partialEndGameOverlay);

        this.partialTransitionFill = new BABYLON.GUI.Rectangle("partialTransitionFill");
        this.partialTransitionFill.thickness = 0;
        this.partialTransitionFill.width = "100%";
        this.partialTransitionFill.height = "100%";
        this.partialTransitionFill.horizontalAlignment = this.H_CENTER;
        this.partialTransitionFill.verticalAlignment = this.V_BOTTOM;
        this.partialTransitionFill.background = "black";
        this.partialTransitionFill.alpha = 0;
        this.partialTransitionFill.zIndex = 8;
        this.partialEndGameOverlay.addControl(this.partialTransitionFill);

        const centerColumn = new BABYLON.GUI.Grid("winnerGrid");
        centerColumn.width = "100%";
        centerColumn.height = "100%";
        centerColumn.horizontalAlignment = this.H_CENTER;
        centerColumn.verticalAlignment = this.V_CENTER;
        centerColumn.zIndex = 9;

        centerColumn.addRowDefinition(0.3);
        centerColumn.addRowDefinition(0.5);
        centerColumn.addRowDefinition(0.2);
        this.partialEndGameOverlay.addControl(centerColumn);

        
        this.partialWinnerLabel = this.createTextBlock("winnerLabel", {
            text: t.winner,
            outlineWidth: 2,
            outlineColor: "#000000",
            fontSize: 48,
            zIndex: 10,
        });
        this.partialWinnerLabel.isVisible =  false;
        centerColumn.addControl(this.partialWinnerLabel, 0, 0);

        this.partialWinnerName = this.createTextBlock("winnerName", {
            text: "",
            color: "#FFD700",
            outlineWidth: 2,
            outlineColor: "#ffffffee",
            fontSize: 100,
            fontWeight: "bold",
            zIndex: 10,
            alpha: 0,
        });
        this.partialWinnerName.isVisible =  false;
        centerColumn.addControl(this.partialWinnerName, 1, 0);

        this.continueText = this.createTextBlock("continue_text", {
            text: t.continue,
            fontSize: 25,
            color: "#FFD700",
            outlineWidth: 2,
            outlineColor: "#ffffffee",
            zIndex: 10,
        });
        this.continueText.isVisible =  false;
        centerColumn.addControl(this.continueText, 2, 0);
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
        }
        await new Promise(resolve => setTimeout(resolve, 5000));

        if (this.hudGrid)
            this.hudGrid.isVisible = true;
        if (this.endGameOverlay)
            this.endGameOverlay.isVisible = false;
    }

    async animateBackground(show: boolean): Promise<void> {
        if (!this.advancedTexture || !this.partialTransitionFill || !this.partialEndGameOverlay) return;

        const scene  = this.advancedTexture.getScene();
        const frames = 15;

        if (show) {
            this.partialEndGameOverlay.isVisible = true;
            this.hudGrid.isVisible = false;
        }

        const current = this.partialTransitionFill.alpha ?? 0;
        const end = show ? 0.30 : 0.0;

        const alpha = this.createAnimation("alpha", current, end, frames, false);
        this.partialTransitionFill.animations = [alpha];

        scene.beginAnimation(this.partialTransitionFill, 0, frames, false, 1, () => {
            if (!show) {
                this.partialEndGameOverlay.isVisible = false;
                this.hudGrid.isVisible = true;
            }
        });

    }

    async showPartialWinner(winner: string): Promise<void> {
        if (!this.advancedTexture) return;

        const scene = this.advancedTexture.getScene();
        const totalFrames = 180;

        this.partialWinnerName.text  = winner;
        this.partialWinnerLabel.isVisible = true;
        this.partialWinnerName.isVisible = true;
        this.partialWinnerName.alpha = 0;
        this.partialWinnerName.transformCenterY = 1;
        this.partialWinnerName.scaleX = 1;
        this.partialWinnerName.scaleY = 1;

        this.partialEndGameOverlay.isVisible = true;
        this.partialEndGameOverlay.isPointerBlocker = true;

        const fadeIn = this.createAnimation("alpha", 0.5, 1);
        const animationScaleX = this.createAnimation("scaleX", 1, 1.1);
        const animationScaleY = this.createAnimation("scaleY", 1, 1.1);

        this.partialWinnerName.animations = [fadeIn, animationScaleX, animationScaleY];

        const cams = scene.activeCameras?.length ? scene.activeCameras : scene.activeCamera;
        spawnFireworksInFrontOfCameras(scene, PARTIAL_FIREWORKS, cams);
        new Promise(r => scene.beginAnimation(this.partialWinnerName!, 0, 60, true, 1, r));
        await new Promise(r => setTimeout(r, totalFrames));

    }

    async waitForSpaceToContinue(ms: number): Promise<void> {
        if (!this.advancedTexture) return;
        const scene = this.advancedTexture.getScene();
        new Promise<void>(res => setTimeout(res, ms));
        if (this.continueText)
            this.continueText.isVisible = true;

        return new Promise<void>((resolve) => {
            const sub = scene.onKeyboardObservable.add((kbInfo: any) => {
            if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
                const e = kbInfo.event as KeyboardEvent;
                if (e.code === "Space" || e.key === " ") {
                    scene.onKeyboardObservable.remove(sub);
                    this.continueText.isVisible = false;
                    this.partialWinnerLabel.isVisible = false;
                    this.partialWinnerName.isVisible = false;
                    resolve();
                }
            }
            });
        });
    }

    async hidePartialWinner(): Promise<void> {
        if (!this.partialEndGameOverlay) return;
        const scene = this.advancedTexture.getScene();
        const totalFrames = 60;

        const fadeOut = this.createAnimation("alpha", 1, 0, 60, false);
        this.partialWinnerName.animations = [fadeOut];
        await new Promise(r => scene.beginAnimation(this.partialWinnerName!, 0, totalFrames, false, 1, r));

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
            this.partialWinnerLabel = null;
            this.partialWinnerName = null;
            this.continueText = null;

            this.advancedTexture?.dispose();
            this.advancedTexture = null;

            this.isInitialized = false;
        } catch (error) {
            Logger.error('Error disposing GUI', 'GUIManager', error);
        }
    }
}