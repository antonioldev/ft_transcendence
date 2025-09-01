import { AdvancedDynamicTexture, Control, Rectangle, TextBlock, Grid, Image} from "@babylonjs/gui";
import { Scene, KeyboardEventTypes} from "@babylonjs/core";
import { Logger } from '../utils/LogManager.js';
import { GameConfig } from './GameConfig.js';
import { GameMode, ViewMode } from '../shared/constants.js';
import { getCurrentTranslation } from '../translations/translations.js';
import { spawnFireworksInFrontOfCameras, FINAL_FIREWORKS, PARTIAL_FIREWORKS } from './scene/fireworks.js';
import { TextBlockOptions } from './utils.js';
import { AnimationManager, Motion } from "./AnimationManager.js";

/**
 * Manages all GUI elements for the game including HUD, scores, FPS display, rally and animations
 */
export class GUIManager {
    private readonly H_CENTER = Control.HORIZONTAL_ALIGNMENT_CENTER;
    private readonly V_CENTER = Control.VERTICAL_ALIGNMENT_CENTER;
    private readonly V_BOTTOM = Control.VERTICAL_ALIGNMENT_BOTTOM;
    private advancedTexture: AdvancedDynamicTexture | null = null;
    private animationManager : AnimationManager | null = null;
    isInitialized: boolean = false;
    private hudGrid!: Grid;
    private fpsText!: TextBlock;
    private score1Text!: TextBlock;
    private score2Text!: TextBlock;
    private player1Label!: TextBlock;
    private player2Label!: TextBlock;
    private rallyText!: TextBlock;
    private rally!: TextBlock;
    private previousRally: number = 1;
    private countdownText!: TextBlock;
    private countdownContainer!: Rectangle;
    private endGameOverlay!: Grid;
    private endGameWinnerText!: TextBlock;
    private partialEndGameOverlay!: Rectangle;
    private partialTransitionFill!: Rectangle;
    private partialWinnerLabel!: TextBlock;
    private partialWinnerName!: TextBlock;
    private continueText!: TextBlock;

    private pauseOverlay!: Rectangle;
    private pauseGrid!: Grid;
    private pauseTitle!: TextBlock;
    private pauseInstruction!: TextBlock;
    private pauseHint!: TextBlock;
    private muteIcon?: Image;
    private toggleMuteCallback?: () => boolean;



    // Initialize and create all GUI elements
    createGUI(scene: Scene, config: GameConfig): void {
        if (this.isInitialized) {
            Logger.warn('GUI already initialized, skipping creation', 'GUIManager');
            return;
        }

        try {
            // Create the main GUI texture
            this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);
            this.advancedTexture!.layer!.layerMask = 0x20000000;

            this.animationManager  = new AnimationManager(scene);
            this.createHUD(config);
            this.createPauseOverlay();
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

    setPauseVisible(visible: boolean): void {
        if (!this.pauseOverlay) return;
        this.pauseOverlay.isVisible = visible;
    }

    private createHUD(config: GameConfig): void {
        this.hudGrid = this.createGrid("hudGrid", "20%", this.V_BOTTOM);
        this.hudGrid.background = "rgba(0, 0, 0, 0.55)"
        this.hudGrid.zIndex = 8;

        this.hudGrid.addColumnDefinition(0.10, false); // FPS
        this.hudGrid.addColumnDefinition(0.15, false); // P1 instructions
        this.hudGrid.addColumnDefinition(0.25, false); // P1 score
        this.hudGrid.addColumnDefinition(0.25, false); // P2 score
        this.hudGrid.addColumnDefinition(0.15, false); // P2 instructions
        this.hudGrid.addColumnDefinition(0.10, false); // Rally

        this.advancedTexture!.addControl(this.hudGrid);

        // FPS (col 0)
        this.fpsText = this.createTextBlock("fpsText", { text: "FPS: 0", fontSize: 18 });
        this.hudGrid.addControl(this.fpsText, 0, 0);

        // P1 controls (col 1)
        this.hudGrid.addControl(this.createPlayerControls(config, 1), 0, 1);

        // P1 score+label (col 2)
        const p1Cell = new Grid();
        p1Cell.addRowDefinition(1, false);
        p1Cell.addRowDefinition(1, false);
        p1Cell.addColumnDefinition(1, false);

        this.player1Label = this.createTextBlock("player1Label", {
        text: "Player 1", fontSize: 48, applyRichEffects: true
        });
        this.score1Text = this.createTextBlock("score1Text", {
        text: "0", fontSize: 56, verticalAlignment: this.V_BOTTOM, applyRichEffects: true
        });
        p1Cell.addControl(this.player1Label, 0, 0);
        p1Cell.addControl(this.score1Text,  1, 0);
        this.hudGrid.addControl(p1Cell, 0, 2);

        // P2 score+label (col 3)
        const p2Cell = new Grid();
        p2Cell.addRowDefinition(1, false);
        p2Cell.addRowDefinition(1, false);
        p2Cell.addColumnDefinition(1, false);

        this.player2Label = this.createTextBlock("player2Label", {
        text: "Player 2", fontSize: 48, applyRichEffects: true
        });
        this.score2Text = this.createTextBlock("score2Text", {
        text: "0", fontSize: 56, verticalAlignment: this.V_BOTTOM, applyRichEffects: true
        });
        p2Cell.addControl(this.player2Label, 0, 0);
        p2Cell.addControl(this.score2Text,  1, 0);
        this.hudGrid.addControl(p2Cell, 0, 3);

        // P2 controls (col 4)
        this.hudGrid.addControl(this.createPlayerControls(config, 2), 0, 4);

        // Rally (col 5)
        const rallyCell = new Grid();
        rallyCell.addRowDefinition(1, false);
        rallyCell.addRowDefinition(1, false);
        rallyCell.addColumnDefinition(1, false);

        this.rallyText = this.createTextBlock("rallyText", { text: "Rally", fontSize: 48 });
        this.rally = this.createTextBlock("rallyValue", { text: "0", fontSize: 56, verticalAlignment: this.V_BOTTOM });
        this.rally.transformCenterY = 1;
        this.rally.scaleX = 1; this.rally.scaleY = 1;

        rallyCell.addControl(this.rallyText, 0, 0);
        rallyCell.addControl(this.rally,     1, 0);
        this.hudGrid.addControl(rallyCell, 0, 5);

        this.rally.transformCenterY = 1;
        this.rally.scaleX = 1;
        this.rally.scaleY = 1;

        // const animationScaleX = this.createAnimation("scaleX", 1, 1.3);
        // const animationScaleY = this.createAnimation("scaleY", 1, 1.3);
        // this.rally.animations = [animationScaleX, animationScaleY];

    }

    private createPlayerControls(config: GameConfig, player: number): TextBlock {
        const pControls = this.createTextBlock(`PlayerControls_p${player}`, {
            text: this.getControlsText(config.viewMode, player),
            lineSpacing: "10px",
            color: "rgba(0, 0, 0, 0)",
            fontSize: 30
        });
        pControls.name = `PlayerControls_p${player}`;
        return pControls;
    }

    private createPauseOverlay(): void {
        if (!this.advancedTexture) return;

        const t = getCurrentTranslation();
        this.pauseOverlay = this.createRect("pauseOverlay", "100%", 11, this.V_CENTER ,"rgba(2, 2, 2, 0.74)");
        this.pauseOverlay.isVisible = false;
        this.advancedTexture.addControl(this.pauseOverlay);

        this.pauseGrid = this.createGrid("pauseGrid", "50%");

        this.pauseGrid.addRowDefinition(0.5, false);
        this.pauseGrid.addRowDefinition(0.2, false);
        this.pauseGrid.addRowDefinition(0.1, false);
        this.pauseGrid.addRowDefinition(0.1, false);
        this.pauseOverlay.addControl(this.pauseGrid);

        this.pauseTitle = this.createTextBlock("pauseTitle",{ text: t.gamePaused, fontWeight: "bold", fontSize: 42, });
        this.pauseGrid.addControl(this.pauseTitle, 0, 0);


        this.pauseInstruction = this.createTextBlock("pauseInstruction",{ text: t.exitGame, });
        this.pauseGrid.addControl(this.pauseInstruction, 1, 0);

        this.pauseHint = this.createTextBlock("pauseHint", { text: t.pauseControls, });
        this.pauseGrid.addControl(this.pauseHint, 2, 0);

        this.muteIcon = new Image("muteIcon", "assets/icons/sound_on.png");
        this.muteIcon.stretch = Image.STRETCH_UNIFORM;
        this.muteIcon.paddingTop = "16px";
        this.muteIcon.onPointerClickObservable.add(() => {
            this.animateMuteIcon();
            if (this.toggleMuteCallback) {
                    const isMuted = this.toggleMuteCallback();
                    this.muteIcon!.source = isMuted
                        ? "assets/icons/sound_off.png"
                        : "assets/icons/sound_on.png";
                }
        });
        this.pauseGrid.addControl(this.muteIcon, 3, 0);

    }

    private createViewModeElements(config: GameConfig): void {
        if (config.viewMode === ViewMode.MODE_3D && 
            (config.gameMode === GameMode.TWO_PLAYER_LOCAL || config.gameMode === GameMode.TOURNAMENT_LOCAL)) {
            const dividerLine = this.createRect("divider", "100%", 6, this.V_CENTER, "#000000ff")
            dividerLine.widthInPixels = 5;

            this.advancedTexture!.addControl(dividerLine);
            Logger.info('Split screen divider created', 'GUIManager');
        }
    }

    private createCountdownDisplay(): void {
        this.countdownContainer = this.createRect("countdownContainer", "100%", 10);
        this.countdownContainer.thickness = 0;
        this.countdownContainer.isVisible = false;

        this.countdownText = this.createTextBlock("5", { fontSize: 72, applyRichEffects: true });
        this.countdownContainer.addControl(this.countdownText);
        this.advancedTexture!.addControl(this.countdownContainer);
    }

    private createPartialEndGameOverlay(): void {
        this.partialEndGameOverlay = this.createRect("partialWinnerLayer", "100%", 7);
        this.partialEndGameOverlay.isVisible = false;
        this.advancedTexture!.addControl(this.partialEndGameOverlay);

        this.partialTransitionFill = this.createRect("partialTransitionFill", "100%", 8, this.V_BOTTOM, "#000000ff");
        this.partialTransitionFill.alpha = 0;
        this.partialEndGameOverlay.addControl(this.partialTransitionFill);

        const centerColumn = this.createGrid("winnerGrid", "100%");
        centerColumn.zIndex = 9;

        centerColumn.addRowDefinition(0.3);
        centerColumn.addRowDefinition(0.5);
        centerColumn.addRowDefinition(0.2);
        this.partialEndGameOverlay.addControl(centerColumn);

        const t = getCurrentTranslation();
        this.partialWinnerLabel = this.createTextBlock("winnerLabel", {
            text: t.winner,
            outlineWidth: 2,
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
    private createEndGameOverlay(): void {
        this.endGameOverlay = this.createGrid("endGameOverlay", "20%", this.V_BOTTOM);
        this.endGameOverlay.background = "rgba(0, 0, 0, 0.9)";
        this.endGameOverlay.isVisible = false;
        this.endGameOverlay.addColumnDefinition(1.0);

        this.endGameWinnerText = this.createTextBlock("endGameWinnerText", {
            fontSize: 72,
            color: "#FFD700",
            applyRichEffects: true
        });
        this.endGameOverlay.addControl(this.endGameWinnerText, 0, 0);
        this.advancedTexture!.addControl(this.endGameOverlay);
    }


    //API to update the GUI
    showCountdown(show: boolean, count?: number): void {
        this.countdownContainer.isVisible = show;

        if (show && count !== undefined) {
            this.countdownText.text = count.toString();
            this.animationManager?.pulse(this.countdownText, Motion.F.xSlow);
            return;
        }
        this.countdownText.animations = [];
        // if (!show) {
        //     this.countdownText.animations = [];
        // } else if (count !== undefined) {
        //     this.countdownText.text = count.toString();
        //     this.countdownContainer.isVisible = true;
        //     this.animationManager?.pulse(this.countdownText, Motion.F.xSlow);
            // this.countdownText.scaleX = 1;
            // this.countdownText.scaleY = 1;

            // const animationScaleX = this.createAnimation("scaleX", 1, 2);
            // const animationScaleY = this.createAnimation("scaleY", 1, 2);
            // this.countdownText.animations = [animationScaleX, animationScaleY];
            
            // if (this.advancedTexture && this.advancedTexture.getScene) {
            //     const scene = this.advancedTexture.getScene();
            //     scene?.beginAnimation(this.countdownText, 0, 60, false);
            // }
        // }
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

            this.animationManager?.pop(this.rally, Motion.F.base);
        }
        this.previousRally = rally;
    }

    updateScores(leftScore: number, rightScore: number): void {
        if (this.score1Text && this.score2Text) {
            const oldLeft = parseInt(this.score1Text.text);
            const oldRight = parseInt(this.score2Text.text);
            
            this.score1Text.text = leftScore.toString();
            this.score2Text.text = rightScore.toString();
            
            // Animate score changes
            if (leftScore > oldLeft)
                this.animationManager?.pop(this.score1Text, Motion.F.fast);
            else if (rightScore > oldRight)
                this.animationManager?.pop(this.score2Text, Motion.F.fast);
        }
    }

    updatePlayerNames(player1Name: string, player2Name: string): void {
        this.player1Label.text = player1Name;
        this.player2Label.text = player2Name;
    }

    async showWinner(winner: string): Promise<void> {
        if (!this.endGameOverlay || !this.endGameWinnerText)
            return;

        if (this.hudGrid)
            this.hudGrid.isVisible = false;
        this.endGameWinnerText.text = `🏆 ${winner} WINS! 🏆`;
        this.endGameOverlay.isVisible = true;
        const scene = this.advancedTexture!.getScene();
        const cams = scene?.activeCameras?.length ? scene.activeCameras : scene?.activeCamera;
        spawnFireworksInFrontOfCameras(scene!, FINAL_FIREWORKS, cams);
        await new Promise(resolve => setTimeout(resolve, 5000));

        if (this.hudGrid)
            this.hudGrid.isVisible = true;
        if (this.endGameOverlay)
            this.endGameOverlay.isVisible = false;
    }

    // async animateBackground(show: boolean): Promise<void> {
    //     if (!this.advancedTexture || !this.partialTransitionFill || !this.partialEndGameOverlay) return;

    //     const scene  = this.advancedTexture.getScene();
    //     const frames = 15;

    //     if (show) {
    //         this.partialEndGameOverlay.isVisible = true;
    //         this.hudGrid.isVisible = false;
    //     }

    //     const current = this.partialTransitionFill.alpha ?? 0;
    //     const end = show ? 0.50 : 0.0;

    //     const alpha = this.createAnimation("alpha", current, end, frames, false);
    //     this.partialTransitionFill.animations = [alpha];

    //     scene?.beginAnimation(this.partialTransitionFill, 0, frames, false, 1, () => {
    //         if (!show) {
    //             this.partialEndGameOverlay.isVisible = false;
    //             this.hudGrid.isVisible = true;
    //         }
    //     });

    // }
    async animateBackground(show: boolean): Promise<void> {
        if (!this.partialTransitionFill || !this.partialEndGameOverlay) return;

        if (show) {
            this.partialEndGameOverlay.isVisible = true;
            this.hudGrid.isVisible = false;
            await this.animationManager?.fadeIn(this.partialTransitionFill, Motion.F.slow);
        } else {
            await this.animationManager?.fadeOut(this.partialTransitionFill, Motion.F.fast);
            this.partialEndGameOverlay.isVisible = false;
            this.hudGrid.isVisible = true;
        }
    }

    // async showPartialWinner(winner: string): Promise<void> {
    //     if (!this.advancedTexture) return;

    //     const scene = this.advancedTexture.getScene();
    //     const totalFrames = 180;

    //     this.partialWinnerName.text  = winner;
    //     this.partialWinnerLabel.isVisible = true;
    //     this.partialWinnerName.isVisible = true;
    //     this.partialWinnerName.alpha = 0;
    //     this.partialWinnerName.transformCenterY = 1;
    //     this.partialWinnerName.scaleX = 1;
    //     this.partialWinnerName.scaleY = 1;

    //     this.partialEndGameOverlay.isVisible = true;
    //     this.partialEndGameOverlay.isPointerBlocker = true;

    //     const fadeIn = this.createAnimation("alpha", 0.5, 1);
    //     const animationScaleX = this.createAnimation("scaleX", 1, 1.1);
    //     const animationScaleY = this.createAnimation("scaleY", 1, 1.1);

    //     this.partialWinnerName.animations = [fadeIn, animationScaleX, animationScaleY];

    //     const cams = scene?.activeCameras?.length ? scene.activeCameras : scene?.activeCamera;
    //     spawnFireworksInFrontOfCameras(scene!, PARTIAL_FIREWORKS, cams);
    //     scene?.beginAnimation(this.partialWinnerName!, 0, 60, true, 1);
    //     await new Promise(r => setTimeout(r, totalFrames));

    // }

    async showPartialWinner(winner: string): Promise<void> {
        if (!this.advancedTexture) return;

        const scene = this.advancedTexture.getScene();
        this.partialWinnerName.text = winner;
        
        // Modern entrance animation
        this.partialWinnerLabel.isVisible = true;
        this.partialWinnerName.isVisible = true;
        this.partialEndGameOverlay.isVisible = true;
        this.partialEndGameOverlay.isPointerBlocker = true;

        // Slide in with fade
        await this.animationManager?.slideInY(this.partialWinnerLabel, -50, Motion.F.base);
        await this.animationManager?.slideInY(this.partialWinnerName, 50, Motion.F.slow);
        
        // Add breathing effect while displayed
        this.animationManager?.breathe(this.partialWinnerName, Motion.F.breath);

        const cams = scene?.activeCameras?.length ? scene.activeCameras : scene?.activeCamera;
        spawnFireworksInFrontOfCameras(scene!, PARTIAL_FIREWORKS, cams);
        
        await new Promise(r => setTimeout(r, 180));
    }

    async waitForSpaceToContinue(ms: number): Promise<void> {
        if (!this.advancedTexture) return;
        const scene = this.advancedTexture.getScene();
        await new Promise<void>(res => setTimeout(res, ms));
        if (this.continueText) {
            this.continueText.isVisible = true;
            this.animationManager?.twinkle(this.continueText, Motion.F.slow);
        }

        return new Promise<void>((resolve) => {
            const sub = scene?.onKeyboardObservable.add((kbInfo: any) => {
                if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
                    const e = kbInfo.event as KeyboardEvent;
                    if (e.code === "Space" || e.key === " ") {
                        scene.onKeyboardObservable.remove(sub);
                        this.continueText.isVisible = false;
                        this.partialWinnerLabel.isVisible = false;
                        this.partialWinnerName.isVisible = false;
                        resolve();
                    }
                }
            }) ?? null;
        });
    }

    // async hidePartialWinner(): Promise<void> {
    //     if (!this.partialEndGameOverlay) return;
    //     const scene = this.advancedTexture!.getScene();
    //     const totalFrames = 60;

    //     const fadeOut = this.createAnimation("alpha", 1, 0, 60, false);
    //     this.partialWinnerName.animations = [fadeOut];
    //     scene?.beginAnimation(this.partialWinnerName!, 0, totalFrames, false, 1);
    //     this.partialEndGameOverlay.isPointerBlocker = false;
    //     this.partialEndGameOverlay.isVisible = false;
    // }

    async hidePartialWinner(): Promise<void> {
        if (!this.partialEndGameOverlay) return;
        
        // Modern exit animations
        await Promise.all([
            this.animationManager?.slideOutY(this.partialWinnerLabel, -50, Motion.F.fast),
            this.animationManager?.slideOutY(this.partialWinnerName, 50, Motion.F.fast)
        ]);
        
        this.partialEndGameOverlay.isPointerBlocker = false;
        this.partialEndGameOverlay.isVisible = false;
    }

    // private animateMuteIcon(): void {
    //     if (!this.muteIcon || !this.advancedTexture) return;
    //     const scene = this.advancedTexture.getScene();

    //     const animX = this.createAnimation("scaleX", 1, 0.90, 12, true);
    //     const animY = this.createAnimation("scaleY", 1, 0.90, 12, true);

    //     this.muteIcon.animations = [animX, animY];

    //     scene?.beginAnimation(this.muteIcon, 0, 12, false);
    // }
    private async animateMuteIcon(): Promise<void> {
        if (!this.muteIcon) return;
        await this.animationManager?.pop(this.muteIcon, Motion.F.xFast);
    }

    //Helper functions to create Gui objects
    createGrid(name: string, h: string, verticalAlign?: number): Grid {
        const grid = new Grid(name);
        grid.width = "100%";
        grid.height = h;
        grid.horizontalAlignment = this.H_CENTER;
        grid.verticalAlignment = verticalAlign || this.V_CENTER;
        return grid;
    }

    createRect(name: string, h: string, zIndex:number, verticalAlign?: number, background?: string): Rectangle {
        const r = new Rectangle(name);
        r.width = "100%";
        r.height = h;
        r.horizontalAlignment = this.H_CENTER;
        r.verticalAlignment = verticalAlign ?? this.V_CENTER;
        r.thickness = 0;
        r.isPointerBlocker = true;
        r.zIndex = zIndex;
        if (background !== undefined) r.background = background;
        return r;
    }

    private createTextBlock(name: string, options: TextBlockOptions = {}): TextBlock {
        const textBlock = new TextBlock();

        textBlock.fontFamily = 'Poppins, Arial, sans-serif';
        textBlock.text = options.text || name;
        textBlock.fontSize = options.fontSize || 24;
        textBlock.color = options.color || "#FFFFFF";
        textBlock.fontWeight = options.fontWeight || "normal";
        textBlock.width = options.width || "100%";
        textBlock.height = options.height || "100%";
        textBlock.alpha = 1;

        textBlock.textHorizontalAlignment = options.horizontalAlignment || this.H_CENTER;
        textBlock.textVerticalAlignment = options.verticalAlignment || this.V_CENTER;

        if (options.alpha !== undefined) textBlock.alpha = options.alpha;

        if (options.lineSpacing) textBlock.lineSpacing = options.lineSpacing;
        if (options.resizeToFit !== undefined) textBlock.resizeToFit = options.resizeToFit;

        // Apply rich text effects if requested
        if (options.applyRichEffects) {
            textBlock.shadowOffsetX = 3;
            textBlock.shadowOffsetY = 3;
            textBlock.shadowBlur = 8;
            textBlock.shadowColor = "rgba(255, 107, 107, 0.5)";
            textBlock.fontWeight = "bold";
            textBlock.outlineWidth = options.outlineWidth || 2;
            textBlock.outlineColor = options.outlineColor || "black";
        }

        return textBlock;
    }

    updateControlVisibility(player1: boolean, player2: boolean): void {
        const p1 = this.advancedTexture?.getControlByName("PlayerControls_p1") as TextBlock | null;
        const p2 = this.advancedTexture?.getControlByName("PlayerControls_p2") as TextBlock | null;

        if (p1) p1.color = player1 ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0)";
        if (p2) p2.color = player2 ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0)";

    }
    private getControlsText(viewMode: ViewMode, player: number): string {
        const t = getCurrentTranslation();
        const move = t.controls;
        
        if (viewMode === ViewMode.MODE_2D)
            return player === 1 ? move + "\nP1: W / S" : move + "\nP2: ↑ / ↓";
        else
            return player === 1 ? move + "\nP1: A / D" : move + "\nP2: ← / →";
    }

    // private createAnimation(property: string, from: number, end: number, frames: number = 60, pingPong: boolean = true): Animation {

    //     const fps: number = 60;
    //     const anim = Animation.CreateAnimation(
    //         property, Animation.ANIMATIONTYPE_FLOAT, fps, new SineEase());
    //     anim.loopMode = Animation.ANIMATIONLOOPMODE_CYCLE;

    //     if (pingPong) {
    //         const mid = Math.floor(frames / 2);
    //         anim.setKeys([
    //         { frame: 0,      value: from },
    //         { frame: mid,    value: end },
    //         { frame: frames, value: from },
    //         ]);
    //     } else {
    //         anim.setKeys([
    //         { frame: 0,      value: from },
    //         { frame: frames, value: end },
    //         ]);
    //     }
    //     return anim;
    // }

    // Callbacks
    setToggleMuteCallback(callback: () => boolean): void {
        this.toggleMuteCallback = callback;
    }

    // Clean up all GUI resources
    dispose(): void {
        if (!this.isInitialized) return;

        try {
            this.animationManager  = null;
            this.fpsText.dispose();
            this.score1Text.dispose();
            this.score2Text.dispose();
            this.countdownText.dispose();
            this.countdownContainer.dispose();
            this.player1Label.dispose();
            this.player2Label.dispose();
            this.rallyText.dispose();
            this.rally.dispose();
            this.endGameWinnerText.dispose();
            this.endGameOverlay.dispose();
            this.hudGrid.dispose();
            this.partialEndGameOverlay.dispose();
            this.partialWinnerLabel.dispose();
            this.partialWinnerName.dispose();
            this.continueText.dispose();
            this.muteIcon?.dispose()
            this.pauseHint.dispose();
            this.pauseInstruction.dispose();
            this.pauseTitle.dispose();
            this.pauseGrid.dispose();
            this.pauseOverlay.dispose();


            this.advancedTexture?.dispose();
            this.advancedTexture = null;
            

            this.isInitialized = false;
        } catch (error) {
            Logger.error('Error disposing GUI', 'GUIManager', error);
        }
    }
}