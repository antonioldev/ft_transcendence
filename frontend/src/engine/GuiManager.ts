declare var BABYLON: typeof import('@babylonjs/core') & {
    GUI: typeof import('@babylonjs/gui');
}; //declare var BABYLON: any;

import { GameConfig } from './GameConfig.js';
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
    private previousRally: number = 1;
    private countdownText: any = null;
    private countdownContainer: any = null;
    private isInitialized: boolean = false;
    private endGameOverlay: any = null;
    private endGameWinnerText: any = null;
    private partialEndGameOverlay: any = null;
    private partialContainer: any = null;
    private partialText: any = null;
    private partialVisible = false;
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
            this.createEndGameOverlay();
            this.createPartialEndGameOverlay();

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
        box.background = "rgba(0, 0, 0, 0.83)";
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
        label.horizontalAlignment = h_align;
        label.verticalAlignment = v_align;
        label.fontSize = size;
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
        this.countdownContainer.color = "#ffffffff";
        this.countdownContainer.thickness = 3;
        if (config.viewMode === ViewMode.MODE_2D)
            this.countdownContainer.background = "rgba(0, 0, 0, 1)";
        else
            this.countdownContainer.background = "rgba(0, 0, 0, 0.8)";
        this.countdownContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.countdownContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this.countdownContainer.isVisible = false;

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

    private createEndGameOverlay(): void {
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
        this.partialEndGameOverlay.zIndex = 9999;
        this.advancedTexture.addControl(this.partialEndGameOverlay);

        this.partialContainer = new BABYLON.GUI.Rectangle("pw_circle");
        this.partialContainer.thickness = 10;
        this.partialContainer.cornerRadius = 60;
        this.partialContainer.color = "#FFD700";
        this.partialContainer.background = "#000000";
        this.partialContainer.alpha = 0.5;
        this.partialEndGameOverlay.addControl(this.partialContainer);

        this.partialText = new BABYLON.GUI.TextBlock("pw_text", "");
        this.partialText.fontSize = 72;
        this.partialText.color = "#FFD700";
        this.partialText.outlineWidth = 2;
        this.partialText.outlineColor = "#ffffffee";  
        this.partialText.alpha = 0;
        this.partialEndGameOverlay.addControl(this.partialText);

    }

    private createCameraBasedFireworks(scene: any): void {
        const cameras = this.getActiveCameras(scene);
        cameras.forEach((camera) => {
            this.createFireworksForCamera(scene, camera);
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

    private createFireworksForCamera(scene: any, camera: any): void {
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
            explosion.particleTexture = new BABYLON.Texture("assets/textures/particle/flare_transparent.png", scene);
        } catch (error) {
            explosion.particleTexture = new BABYLON.Texture("assets/textures/particle/flare.png", scene);
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

        if (this.hudGrid)
            this.hudGrid.isVisible = true;
        if (this.endGameOverlay)
            this.endGameOverlay.isVisible = false;
    }


    async showPartialWinner(winner: string): Promise<void> {
        if (!this.advancedTexture || this.partialVisible)
            return;

        const scene = this.advancedTexture.getScene();
        const maxScale = 1.5
        const fps = 60;
        const totalFrames = 180;

        this.partialText.text = `Winner: ${winner}`;
        this.partialText.alpha = 0;
        this.partialContainer.scaleX = 0.05;
        this.partialContainer.scaleY = 0.05;
        this.partialContainer.alpha  = 0.25;

        this.partialEndGameOverlay.isVisible = true;
        this.partialEndGameOverlay.isPointerBlocker = true;

        const fadeIn = BABYLON.Animation.CreateAnimation("alpha", BABYLON.Animation.ANIMATIONTYPE_FLOAT, fps, new BABYLON.QuadraticEase());
        fadeIn.setKeys([{frame:0,value:0},{frame:10,value:1}]);
        const ex = BABYLON.Animation.CreateAnimation("scaleX", BABYLON.Animation.ANIMATIONTYPE_FLOAT, fps, new BABYLON.QuadraticEase());
        const ey = BABYLON.Animation.CreateAnimation("scaleY", BABYLON.Animation.ANIMATIONTYPE_FLOAT, fps, new BABYLON.QuadraticEase());
        const ca = BABYLON.Animation.CreateAnimation("alpha", BABYLON.Animation.ANIMATIONTYPE_FLOAT, fps, new BABYLON.QuadraticEase());
        ex.setKeys([{frame:0,value:0.05},{frame:totalFrames,value:maxScale}]);
        ey.setKeys([{frame:0,value:0.05},{frame:totalFrames,value:maxScale}]);
        ca.setKeys([{ frame: 0, value: 0.25 }, { frame: totalFrames, value: 0.95 }]);


        this.partialText.animations = [fadeIn];
        this.partialContainer.animations = [ex, ey, ca];

        await Promise.all([
            new Promise(r => scene.beginAnimation(this.partialText!, 0, 10, false, 1, r)),
            new Promise(r => scene.beginAnimation(this.partialContainer!, 0, totalFrames, false, 1, r)),
        ]);

        const count = 64, radiusMin = 24, radiusMax = 120, dur = 0.45;
        const end = Math.round(dur * fps);

        for (let i = 0; i < count; i++) {
            const sp = new BABYLON.GUI.Ellipse("sp" + Math.random());
            const size = 6 + Math.random() * 6;
            sp.widthInPixels = size;
            sp.heightInPixels = size;
            sp.thickness = 1;
            sp.background = "#FFD700";
            sp.color = "#ffffffff";
            sp.alpha = 0.95;
            sp.leftInPixels = 0;
            sp.topInPixels = 0;

            const ang = Math.random() * Math.PI * 2;
            const r   = radiusMin + Math.random() * (radiusMax - radiusMin);
            const tx  = Math.cos(ang) * r;
            const ty  = Math.sin(ang) * r;

            const easeQ = new BABYLON.QuadraticEase();
            const easeS = new BABYLON.SineEase();

            const aX = BABYLON.Animation.CreateAnimation("leftInPixels", BABYLON.Animation.ANIMATIONTYPE_FLOAT, fps, easeQ);
            const aY = BABYLON.Animation.CreateAnimation("topInPixels",  BABYLON.Animation.ANIMATIONTYPE_FLOAT, fps, easeQ);
            const aA = BABYLON.Animation.CreateAnimation("alpha",        BABYLON.Animation.ANIMATIONTYPE_FLOAT, fps, easeS);

            aX.setKeys([{ frame: 0, value: 0 }, { frame: end, value: tx }]);
            aY.setKeys([{ frame: 0, value: 0 }, { frame: end, value: ty }]);
            aA.setKeys([{ frame: 0, value: 0.95 }, { frame: end, value: 0 }]);

            sp.animations = [aX, aY, aA];
            this.partialContainer.addControl(sp);
            scene.beginAnimation(sp, 0, end, false, 1, () => {
                this.partialContainer.removeControl(sp);
                sp.dispose();
            });
        }
    }

    async hidePartialWinner(): Promise<void> {
        if (!this.partialEndGameOverlay || !this.partialContainer || !this.partialText) return;
        const scene = this.advancedTexture.getScene();
        const fps = 60;
        const totalFrames = 60;

        const fadeOut = BABYLON.Animation.CreateAnimation("alpha", BABYLON.Animation.ANIMATIONTYPE_FLOAT, fps, new BABYLON.QuadraticEase());
        fadeOut.setKeys([{frame:0,value:1},{frame:totalFrames,value:0}]);

        const sx = BABYLON.Animation.CreateAnimation("scaleX", BABYLON.Animation.ANIMATIONTYPE_FLOAT, fps, new BABYLON.QuadraticEase());
        const sy = BABYLON.Animation.CreateAnimation("scaleY", BABYLON.Animation.ANIMATIONTYPE_FLOAT, fps, new BABYLON.QuadraticEase());
        const ca = BABYLON.Animation.CreateAnimation("alpha",  BABYLON.Animation.ANIMATIONTYPE_FLOAT, fps, new BABYLON.QuadraticEase());
        sx.setKeys([{frame:0,value:this.partialContainer.scaleX},{frame:totalFrames,value:0.05}]);
        sy.setKeys([{frame:0,value:this.partialContainer.scaleY},{frame:totalFrames,value:0.05}]);
        ca.setKeys([{ frame: 0, value: this.partialContainer.alpha }, { frame: totalFrames, value: 0.2 }]);

        this.partialText.animations = [fadeOut];
        this.partialContainer.animations = [sx, sy, ca];

        await Promise.all([
            new Promise(r => scene.beginAnimation(this.partialText!, 0, totalFrames, false, 1, r)),
            new Promise(r => scene.beginAnimation(this.partialContainer!, 0, totalFrames, false, 1, r)),
        ]);

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
            this.partialContainer = null;
            this.partialText = null;

            this.advancedTexture?.dispose();
            this.advancedTexture = null;

            this.isInitialized = false;
        } catch (error) {
            Logger.error('Error disposing GUI', 'GUIManager', error);
        }
    }
}