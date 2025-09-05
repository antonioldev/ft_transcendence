import { AdvancedDynamicTexture, Control, Rectangle, TextBlock, Grid, Image, StackPanel, ScrollViewer} from "@babylonjs/gui";
import { Scene, KeyboardEventTypes} from "@babylonjs/core";
import { Logger } from '../utils/LogManager.js';
import { GameConfig } from './GameConfig.js';
import { GameMode, ViewMode } from '../shared/constants.js';
import { getCurrentTranslation } from '../translations/translations.js';
import { spawnFireworksInFrontOfCameras, FINAL_FIREWORKS, spawnGUISparkles } from './scene/fireworks.js';
import { TextBlockOptions } from './utils.js';
import { AnimationManager, Motion } from "./AnimationManager.js";
import { AudioManager } from "./AudioManager.js";

// interface TournamentMatchCard {
//     container: Rectangle;
//     leftPlayerText: TextBlock;
//     rightPlayerText: TextBlock;
//     statusIndicator: Rectangle;
//     match: TournamentMatch;
// }

// enum MatchStatus {
//     UPCOMING,
//     PLAYING,
//     COMPLETED
// }

// interface TournamentMatch {
//     roundIndex: number;
//     matchIndex: number;
//     leftPlayer: string;
//     rightPlayer: string;
//     winner?: string;
//     status: MatchStatus;
// }

// interface TournamentRound {
//     roundIndex: number;
//     matches: TournamentMatch[];
// }

// interface MatchCardRefs {
//     container: Rectangle;
//     leftText: TextBlock;
//     rightText: TextBlock;
//     statusText: TextBlock;
//     loserXLeft: Rectangle;
//     loserXRight: Rectangle;
// }

/**
 * Manages all GUI elements for the game
 */
export class GUIManager {
    private readonly H_CENTER = Control.HORIZONTAL_ALIGNMENT_CENTER;
    private readonly V_CENTER = Control.VERTICAL_ALIGNMENT_CENTER;
    private readonly V_BOTTOM = Control.VERTICAL_ALIGNMENT_BOTTOM;
    private advancedTexture: AdvancedDynamicTexture | null = null;
    private isInitialized: boolean = false;
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


    private bracketText: TextBlock | null = null;
    private bracketRoundTotals = new Map<number, number>(); // round -> match_total
    private bracketStore = new Map<number, Map<number, { left: string | null; right: string | null }>>();

    constructor(private scene: Scene, config: GameConfig, private animationManager: AnimationManager, audioManager: AudioManager) {
        try {
            this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this.scene);
            this.advancedTexture!.layer!.layerMask = 0x20000000;

            this.createHUD(config);
            this.createPauseOverlay();
            this.createViewModeElements(config);
            this.createCountdownDisplay();
            this.createPartialEndGameOverlay();
            this.createEndGameOverlay();
            this.setToggleMuteCallback(() => audioManager.toggleMute());

            this.isInitialized = true;
        } catch (error) {
            Logger.error('Error creating GUI', 'GUIManager', error);
            throw error;
        }
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

        rallyCell.addControl(this.rallyText, 0, 0);
        rallyCell.addControl(this.rally,     1, 0);
        this.hudGrid.addControl(rallyCell, 0, 5);

        this.rally.transformCenterX = 0.5;
        this.rally.transformCenterY = 0.5;
    }

    private createPlayerControls(config: GameConfig, player: number): TextBlock {
        const pControls = this.createTextBlock(`PlayerControls_p${player}`, {
            text: this.getControlsText(config.viewMode, player),
            lineSpacing: "10px", color: "rgba(0, 0, 0, 0.55)", fontSize: 30
        });
        pControls.name = `PlayerControls_p${player}`;
        return pControls;
    }

    // private createPauseOverlay(): void {
    //     if (!this.advancedTexture) return;

    //     const t = getCurrentTranslation();
    //     this.pauseOverlay = this.createRect("pauseOverlay", "100%", 11, this.V_CENTER ,"rgba(2, 2, 2, 0.98)");
    //     this.pauseOverlay.color = "rgba(255, 255, 255, 1)";
    //     this.pauseOverlay.isVisible = false;
    //     this.advancedTexture.addControl(this.pauseOverlay);

    //     this.pauseGrid = this.createGrid("pauseGrid", "50%");

    //     this.pauseGrid.addRowDefinition(0.5, false);
    //     this.pauseGrid.addRowDefinition(0.2, false);
    //     this.pauseGrid.addRowDefinition(0.1, false);
    //     this.pauseGrid.addRowDefinition(0.1, false);
    //     this.pauseOverlay.addControl(this.pauseGrid);

    //     this.pauseTitle = this.createTextBlock("pauseTitle",{ text: t.gamePaused, fontWeight: "bold", fontSize: 42, });
    //     this.pauseGrid.addControl(this.pauseTitle, 0, 0);


    //     this.pauseInstruction = this.createTextBlock("pauseInstruction",{ text: t.exitGame, });
    //     this.pauseGrid.addControl(this.pauseInstruction, 1, 0);

    //     this.pauseHint = this.createTextBlock("pauseHint", { text: t.pauseControls, });
    //     this.pauseGrid.addControl(this.pauseHint, 2, 0);

    //     this.muteIcon = new Image("muteIcon", "assets/icons/sound_on.png");
    //     this.muteIcon.stretch = Image.STRETCH_UNIFORM;
    //     this.muteIcon.paddingTop = "16px";
    //     this.muteIcon.onPointerClickObservable.add(() => {
    //         this.animateMuteIcon();
    //         if (this.toggleMuteCallback) {
    //                 const isMuted = this.toggleMuteCallback();
    //                 if (this.muteIcon)
    //                     this.muteIcon.source = isMuted ? "assets/icons/sound_off.png" : "assets/icons/sound_on.png";
    //             }
    //     });
    //     this.pauseGrid.addControl(this.muteIcon, 3, 0);
    // }

    private createPauseOverlay(): void {
        if (!this.advancedTexture) return;

        const t = getCurrentTranslation();

        // Overlay (unchanged)
        this.pauseOverlay = this.createRect("pauseOverlay", "100%", 11, this.V_CENTER, "rgba(2, 2, 2, 0.98)");
        this.pauseOverlay.color = "rgba(255, 255, 255, 1)";
        this.pauseOverlay.isVisible = false;
        this.advancedTexture.addControl(this.pauseOverlay);

        // Main grid: 1 row, 2 columns (left old stuff, right bracket)
        this.pauseGrid = this.createGrid("pauseGrid", "50%"); // tweak width if you want more room
        this.pauseGrid.addRowDefinition(1, false);            // single row
        this.pauseGrid.addColumnDefinition(0.6, false);       // left column (60%)
        this.pauseGrid.addColumnDefinition(0.4, false);       // right column (40%)
        this.pauseOverlay.addControl(this.pauseGrid);

        // -------- LEFT COLUMN: your existing content, vertically centered --------
        const pauseLeftGrid = this.createGrid("pauseLeftGrid", "100%");
        pauseLeftGrid.addRowDefinition(0.5, false); // 0: title
        pauseLeftGrid.addRowDefinition(0.2, false); // 1: instruction
        pauseLeftGrid.addRowDefinition(0.1, false); // 2: hint
        pauseLeftGrid.addRowDefinition(0.1, false); // 3: mute
        pauseLeftGrid.verticalAlignment = this.V_CENTER;
        pauseLeftGrid.horizontalAlignment = this.H_CENTER;
        this.pauseGrid.addControl(pauseLeftGrid, 0, 0);

        this.pauseTitle = this.createTextBlock("pauseTitle", {
            text: t.gamePaused,
            fontWeight: "bold",
            fontSize: 42,
        });
        pauseLeftGrid.addControl(this.pauseTitle, 0, 0);

        this.pauseInstruction = this.createTextBlock("pauseInstruction", {
            text: t.exitGame,
        });
        pauseLeftGrid.addControl(this.pauseInstruction, 1, 0);

        this.pauseHint = this.createTextBlock("pauseHint", {
            text: t.pauseControls,
        });
        pauseLeftGrid.addControl(this.pauseHint, 2, 0);

        this.muteIcon = new Image("muteIcon", "assets/icons/sound_on.png");
        this.muteIcon.stretch = Image.STRETCH_UNIFORM;
        this.muteIcon.paddingTop = "16px";
        this.muteIcon.onPointerClickObservable.add(() => {
            this.animateMuteIcon();
            if (this.toggleMuteCallback) {
                const isMuted = this.toggleMuteCallback();
                if (this.muteIcon)
                    this.muteIcon.source = isMuted ? "assets/icons/sound_off.png" : "assets/icons/sound_on.png";
            }
        });
        pauseLeftGrid.addControl(this.muteIcon, 3, 0);

        const bracketGrid = this.createGrid("bracketGrid", "100%");
        // Row 0: 40px (title), Row 1: stretch (content)
        bracketGrid.addRowDefinition(40, true);
        bracketGrid.addRowDefinition(1, false);
        // Single column
        bracketGrid.addColumnDefinition(1, false);
        this.pauseGrid.addControl(bracketGrid, 0, 1);

        // Title row
        const bracketTitle = this.createTextBlock("bracketTitle", {
        text: t.tournamentTitle ?? "Tournament",
        fontSize: 24,
        fontWeight: "bold",
        color: "rgba(255, 215, 0, 1)"
        });
        bracketTitle.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        bracketTitle.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        bracketGrid.addControl(bracketTitle, 0, 0);

        // Scrollable content row
        const scroll = new ScrollViewer();
        scroll.name = "bracketScroll";
        scroll.thickness = 0;
        scroll.width = 1;   // fill the cell
        scroll.height = 1;  // fill the cell
        scroll.barSize = 8;
        // (optional styling)
        // scroll.verticalBar.color = "rgba(255,255,255,0.35)";
        // scroll.verticalBar.background = "rgba(255,255,255,0.12)";
        bracketGrid.addControl(scroll, 1, 0);

        // The actual text (monospace). Important: no % height, and enable resizeToFit.
        const tb = new TextBlock("bracketText", "");
        tb.textWrapping = true;
        tb.resizeToFit = true;                 // lets the text determine content height
        tb.fontFamily = "monospace";
        tb.fontSize = 18;
        tb.color = "white";
        tb.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        tb.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        tb.paddingRight = "12px";              // avoid text under the scrollbar
        scroll.addControl(tb);

        // store and draw once
        this.bracketText = tb;
        this.renderBracket();
    }

    private createViewModeElements(config: GameConfig): void {
        if (config.viewMode === ViewMode.MODE_3D && 
            (config.gameMode === GameMode.TWO_PLAYER_LOCAL || config.gameMode === GameMode.TOURNAMENT_LOCAL)) {
            const dividerLine = this.createRect("divider", "100%", 6, this.V_CENTER, "#000000ff")
            dividerLine.widthInPixels = 5;
            this.advancedTexture!.addControl(dividerLine);
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
        this.partialEndGameOverlay = this.createRect("partialWinnerLayer", "100%", 8, this.V_BOTTOM, "rgba(0, 0, 0, 1)");
        this.partialEndGameOverlay.background = "rgba(0, 0, 0, 1)";
        this.partialEndGameOverlay.isVisible = false;
        this.advancedTexture!.addControl(this.partialEndGameOverlay);

        const centerColumn = this.createGrid("winnerGrid", "100%");
        centerColumn.zIndex = 9;

        centerColumn.addRowDefinition(0.2);
        centerColumn.addRowDefinition(0.6);
        centerColumn.addRowDefinition(0.2);
        this.partialEndGameOverlay.addControl(centerColumn);

        const t = getCurrentTranslation();
        this.partialWinnerLabel = this.createTextBlock("winnerLabel", {
            text: t.winner, outlineWidth: 2, fontSize: 80, zIndex: 10, alpha: 0
        });
        centerColumn.addControl(this.partialWinnerLabel, 0, 0);

        this.partialWinnerName = this.createTextBlock("winnerName", {
            text: "", color: "rgb(255, 215, 0)", outlineWidth: 2, outlineColor: "rgb(255, 255, 255)",
            fontSize: 110, fontWeight: "bold", zIndex: 10, alpha: 0, applyGlowEffects: true
        });
        centerColumn.addControl(this.partialWinnerName, 1, 0);

        this.continueText = this.createTextBlock("continue_text", {
            text: t.continue, color: "rgb(255, 255, 255)", outlineWidth: 2, outlineColor: "rgb(255, 215, 0)", zIndex: 10,
        });
        centerColumn.addControl(this.continueText, 2, 0);
    }

    private createEndGameOverlay(): void {
        this.endGameOverlay = this.createGrid("endGameOverlay", "20%", this.V_BOTTOM);
        this.endGameOverlay.background = "rgba(0, 0, 0, 0.9)";
        this.endGameOverlay.isVisible = false;
        this.endGameOverlay.addColumnDefinition(1.0);

        this.endGameWinnerText = this.createTextBlock("endGameWinnerText", {
            fontSize: 72, applyRichEffects: true
        });
        this.endGameOverlay.addControl(this.endGameWinnerText, 0, 0);
        this.advancedTexture!.addControl(this.endGameOverlay);
    }

    setPauseVisible(visible: boolean): void {
        if (!this.isReady || !this.animationManager) return;

        if (visible) {
            this.pauseOverlay.isVisible = true;
            this.pauseOverlay.alpha = 0;
            this.pauseOverlay.thickness = 0;

            const frames = Motion.F.base;
            this.pauseOverlay.animations = [
            this.animationManager.createFloat("alpha", 0, 1, frames, false, Motion.ease.quadOut()),
            this.animationManager.createFloat("thickness", 0, 4, frames, false, Motion.ease.quadOut()),
            ];
            this.animationManager.play(this.pauseOverlay, frames, false);
        } else {
            const frames = Motion.F.fast;
            this.pauseOverlay.animations = [
            this.animationManager.createFloat("alpha", 1, 0, frames, false, Motion.ease.quadOut()),
            this.animationManager.createFloat("thickness", 4, 0, frames, false, Motion.ease.quadOut()),
            ];
            this.animationManager.play(this.pauseOverlay, frames, false).then(() => {
            this.pauseOverlay.isVisible = false;
            this.pauseOverlay.alpha = 0;
            this.pauseOverlay.thickness = 0;
            });
        }
    }
    showCountdown(show: boolean, count?: number): void {
        if (!this.isReady) return;
        this.countdownContainer.isVisible = show;

        if (show && count !== undefined) {
            this.countdownText.text = count.toString();
            this.animationManager?.pulse(this.countdownText, Motion.F.xSlow);
            return;
        }
        this.countdownText.animations = [];
    }

    updateFPS(fps: number): void {
        if (!this.isReady) return;
        this.fpsText.text = `FPS: ${Math.round(fps)}`;
    }

    updateRally(rally: number): void {
        if (!this.isReady) return;
        if (this.rally && (this.previousRally < rally) || rally === 1) {
            this.rally.text = `${Math.round(rally)}`;

            const maxRally = 10;
            const intensity = Math.min(rally / maxRally, 1);
            const r = 255;
            const g = Math.round(255 * (1 - intensity));
            const b = Math.round(255 * (1 - intensity));
            this.rally.color = `rgb(${r}, ${g}, ${b})`;

            if (rally > 0 && rally % 5 === 0)
                this.animationManager?.rotatePulse(this.rally, 1, Motion.F.slow);
            else
                this.animationManager?.pop(this.rally, Motion.F.base, 1.4);
        }
        this.previousRally = rally;
    }

    updateScores(leftScore: number, rightScore: number): void {
        if (!this.isReady) return;
        const oldLeft = parseInt(this.score1Text.text);
        const oldRight = parseInt(this.score2Text.text);

        this.score1Text.text = leftScore.toString();
        this.score2Text.text = rightScore.toString();

        if (leftScore > oldLeft)
            this.animationManager?.pop(this.score1Text, Motion.F.fast, 0.9);
        else if (rightScore > oldRight)
            this.animationManager?.pop(this.score2Text, Motion.F.fast, 0.9);
    }

    updatePlayerNames(player1Name: string, player2Name: string): void {
        if (!this.isReady) return;
        this.player1Label.text = player1Name;
        this.player2Label.text = player2Name;
        this.hudGrid.isVisible = true;
    }

    async showWinner(winner: string): Promise<void> {
        if (!this.isReady) return;
        this.hudGrid.isVisible = false;
        this.endGameWinnerText.text = `🏆 ${winner} WINS! 🏆`;
        this.endGameWinnerText.color = "rgba(255, 255, 255, 1)";
        this.endGameOverlay.isVisible = true;
        this.animationManager?.pop(this.endGameWinnerText, Motion.F.fast, 0.9);
        const scene = this.scene;
        const cams = scene.activeCameras?.length ? scene.activeCameras : scene.activeCamera;
        spawnFireworksInFrontOfCameras(scene, FINAL_FIREWORKS, cams);
        await new Promise(resolve => setTimeout(resolve, 5000));

        this.hudGrid.isVisible = true;
        this.endGameOverlay.isVisible = false;
    }

    async animateBackground(show: boolean): Promise<void> {
        if (!this.isReady) return;
        if (show) {
            this.partialEndGameOverlay.isVisible = true;
            this.hudGrid.isVisible = false;
            await this.animationManager?.fadeIn(this.partialEndGameOverlay, Motion.F.slow);
        } else {
            await this.animationManager?.fadeOut(this.partialEndGameOverlay, Motion.F.fast);
            this.partialEndGameOverlay.isVisible = false;
            this.hudGrid.isVisible = true;
        }
    }

    async showPartialWinner(winner: string): Promise<void> {
        if (!this.isReady || !this.advancedTexture) return;

        // const scene = this.scene;
        this.partialWinnerName.text = winner;
        this.partialEndGameOverlay.isVisible = true;
        this.partialWinnerLabel.isVisible = true;
        this.partialWinnerName.isVisible = true;
        this.partialEndGameOverlay.isPointerBlocker = true;

        spawnGUISparkles(this.advancedTexture, this.animationManager);

        await this.animationManager?.slideInY(this.partialWinnerLabel, -200, Motion.F.base);
        await new Promise(r => setTimeout(r, 60));
        await this.animationManager?.slideInY(this.partialWinnerName, 50, Motion.F.slow);
        this.animationManager?.breathe(this.partialWinnerName, Motion.F.breath);

        // const cams = scene.activeCameras?.length ? scene.activeCameras : scene.activeCamera;
        // spawnFireworksInFrontOfCameras(scene, PARTIAL_FIREWORKS, cams);

        await new Promise(r => setTimeout(r, 180));
    }

    async waitForSpaceToContinue(ms: number): Promise<void> {
        if (!this.isReady || !this.advancedTexture) return;
        const scene = this.scene;
        await new Promise<void>(res => setTimeout(res, ms));
        this.continueText.isVisible = true;
        this.animationManager?.twinkle(this.continueText, Motion.F.slow);

        return new Promise<void>((resolve) => {
            const sub = scene.onKeyboardObservable.add((kbInfo: any) => {
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

    async hidePartialWinner(): Promise<void> {
        if (!this.isReady) return;
        await Promise.all([
            this.animationManager?.slideOutY(this.partialWinnerLabel, -50, Motion.F.fast),
            this.animationManager?.slideOutY(this.partialWinnerName, 50, Motion.F.fast)
        ]);

        this.partialEndGameOverlay.isPointerBlocker = false;
        this.partialEndGameOverlay.isVisible = false;
    }

    private async animateMuteIcon(): Promise<void> {
        if (!this.isReady || !this.muteIcon) return;
        await this.animationManager?.pop(this.muteIcon, Motion.F.xFast, 0.9);
    }

    //Helper functions to create Gui objects
    private createGrid(name: string, h: string, verticalAlign?: number): Grid {
        const grid = new Grid(name);
        grid.width = "100%";
        grid.height = h;
        grid.horizontalAlignment = this.H_CENTER;
        grid.verticalAlignment = verticalAlign || this.V_CENTER;
        return grid;
    }

    private createRect(name: string, h: string, zIndex:number, verticalAlign?: number, background?: string): Rectangle {
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

        if (options.applyGlowEffects) {
            textBlock.shadowBlur = 20;
            textBlock.shadowColor = "rgba(255, 215, 0, 0.8)";
        }

        if (options.applyRichEffects) {
            textBlock.shadowOffsetX = 1;
            textBlock.shadowOffsetY = 1;
            textBlock.shadowBlur = 8;
            textBlock.shadowColor = "rgba(255, 217, 0, 0.80)";
            textBlock.fontWeight = "bold";
            textBlock.outlineWidth = options.outlineWidth || 2;
            textBlock.outlineColor = options.outlineColor || "rgba(0, 0, 0, 0.66)";
        }
        return textBlock;
    }

    updateControlVisibility(player1: boolean, player2: boolean): void {
        if (!this.isReady) return;
        const p1 = this.advancedTexture?.getControlByName("PlayerControls_p1") as TextBlock | null;
        const p2 = this.advancedTexture?.getControlByName("PlayerControls_p2") as TextBlock | null;

        if (p1) p1.color = player1 ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0)";
        if (p2) p2.color = player2 ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0)";

    }
    private getControlsText(viewMode: ViewMode, player: number): string {
        const t = getCurrentTranslation();
        const move = t.controls;
        
        if (viewMode === ViewMode.MODE_2D)
            return player === 1 ? move + "\nP1: W / S" : move + "\nP2: ↑ / ↓";
        else
            return player === 1 ? move + "\nP1: A / D" : move + "\nP2: ← / →";
    }

    // Callbacks
    setToggleMuteCallback(callback: () => boolean): void {
        if (!this.isReady) return;
        this.toggleMuteCallback = callback;
    }

    // Check if gui is initialised
    isReady(): boolean {
        return this.isInitialized;
    }

    // Clean up all GUI resources
    dispose(): void {
        if (!this.isReady()) return;
        
        try {
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


            this.bracketText?.dispose();
            this.bracketText = null;
            this.bracketRoundTotals.clear();
            this.bracketStore.clear();

            this.advancedTexture?.dispose();
            this.advancedTexture = null;

            this.isInitialized = false;
            Logger.debug('Class disposed', 'GUIManager');
        } catch (error) {
            Logger.error('Error disposing GUI', 'GUIManager', error);
        }
    }

    public mountBracket(pauseContent: StackPanel): void {
        if (this.bracketText) return; // already mounted

        // Small title
        const title = new TextBlock("bracket_title", "Tournament");
        title.fontSize = 24;
        title.color = "white";
        title.fontWeight = "bold";
        title.height = "40px";
        title.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        pauseContent.addControl(title);

        // The bracket text area
        const tb = new TextBlock("bracket_text", "");
        tb.textWrapping = true;
        tb.fontFamily = "monospace";    // keeps columns aligned
        tb.fontSize = 18;
        tb.color = "white";
        tb.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        tb.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        pauseContent.addControl(tb);

        this.bracketText = tb;
        this.renderBracket();
    }

    public insertMatch(
        roundIndex: number,
        matchIndex: number,
        left: string | null,
        right: string | null,
        matchTotal?: number
        ): void {
        if (typeof matchTotal === "number" && matchTotal > 0) {
            this.bracketRoundTotals.set(roundIndex, matchTotal);
        }

        let roundMap = this.bracketStore.get(roundIndex);
        if (!roundMap) {
            roundMap = new Map();
            this.bracketStore.set(roundIndex, roundMap);
        }

        const prev = roundMap.get(matchIndex) ?? { left: null, right: null };
        roundMap.set(matchIndex, {
            left: left ?? prev.left,
            right: right ?? prev.right
        });

        this.renderBracket();
    }

    private renderBracket(): void {
        if (!this.bracketText) return;

        const rounds = Array.from(this.bracketStore.keys()).sort((a, b) => a - b);
        if (rounds.length === 0) {
            this.bracketText.text = "—";
            return;
        }

        const lines: string[] = [];
        for (const r of rounds) {
            const matchesMap = this.bracketStore.get(r)!;
            const knownIndices = Array.from(matchesMap.keys());
            const maxKnown = knownIndices.length ? Math.max(...knownIndices) + 1 : 0;
            const total = Math.max(this.bracketRoundTotals.get(r) ?? 0, maxKnown);

            lines.push(`Round ${r}`);
            for (let i = 0; i < total; i++) {
            const m = matchesMap.get(i);
            const left  = m?.left  ?? "TBD";
            const right = m?.right ?? "TBD";
            lines.push(`  [${i}] ${this.pad(left, 14)} vs ${right}`);
            }
            lines.push(""); // blank line between rounds
        }

        this.bracketText.text = lines.join("\n");
    }

        // tiny padding helper for monospace alignment
    private pad(s: string, width: number): string {
        if (s.length >= width) return s.slice(0, width);
        return s + " ".repeat(width - s.length);
    }




}

