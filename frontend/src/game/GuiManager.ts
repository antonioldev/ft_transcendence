// gui.ts - Single file for all GUI logic
declare var BABYLON: any;

export class GUIManager {
    private scene: any;
    private engine: any;
    private advancedTexture: any;
    private fpsText: any = null;

    constructor(scene: any, engine: any) {
        this.scene = scene;
        this.engine = engine;
        this.advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    }

    createFPSDisplay(): void {
        this.fpsText = new BABYLON.GUI.TextBlock();
        this.fpsText.text = "FPS: 0";
        this.fpsText.color = "white";
        this.fpsText.fontSize = 16;
        this.fpsText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.fpsText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.fpsText.top = "1px";
        this.fpsText.left = "-20px";
        this.fpsText.width = "200px";
        this.fpsText.height = "40px";
        
        this.advancedTexture.addControl(this.fpsText);
    }

    public updateFPS(): void {
        if (this.fpsText) {
            this.fpsText.text = "FPS: " + this.engine.getFps().toFixed(0);
        }
    }

    dispose(): void {
        this.advancedTexture?.dispose();
        this.fpsText = null;
    }
}