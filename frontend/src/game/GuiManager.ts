// gui.ts - Single file for all GUI logic
declare var BABYLON: any;

export class GUIManager {
    private scene: any;
    private engine: any;
    private advancedTexture: any;
    private fpsUpdateFunction: (() => void) | null = null;

    constructor(scene: any, engine: any) {
        this.scene = scene;
        this.engine = engine;
        this.advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    }

    createFPSDisplay(): void {
        const fpsText = new BABYLON.GUI.TextBlock();
        fpsText.text = "FPS: 0";
        fpsText.color = "white";
        fpsText.fontSize = 16;
        fpsText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        fpsText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        fpsText.top = "1px";
        fpsText.left = "-20px";
        fpsText.width = "200px";
        fpsText.height = "40px";
        
        this.advancedTexture.addControl(fpsText);
        
        this.fpsUpdateFunction = () => {
            fpsText.text = "FPS: " + this.engine.getFps().toFixed(0);
        };
    }

    public updateFPS(): void {
        if (this.fpsUpdateFunction) {
            this.fpsUpdateFunction();
        }
    }

    dispose(): void {
        this.advancedTexture?.dispose();
        this.fpsUpdateFunction = null;
    }
}