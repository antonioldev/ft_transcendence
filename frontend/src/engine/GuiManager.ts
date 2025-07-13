declare var BABYLON: any;

/**
 * GUIManager is responsible for managing the graphical user interface (GUI) in the game.
 * It provides methods to create and update UI elements, such as an FPS display, 
 * and handles the disposal of GUI resources when they are no longer needed.
 */
export class GUIManager {
    private scene: any;
    private engine: any;
    private advancedTexture: any;
    private fpsText: any = null;

    constructor(scene: any, engine: any) {
        // Initialize the GUIManager with a scene and engine
        this.scene = scene;
        this.engine = engine;
        this.advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    }

    // ========================================
    // UI CREATION
    // ========================================

    // Creates an FPS display on the screen.
    createFPSDisplay(): void {
        this.fpsText = new BABYLON.GUI.TextBlock();
        this.fpsText.text = "FPS: 0";
        this.fpsText.color = "white";
        this.fpsText.fontSize = 16;
        this.fpsText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.fpsText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.fpsText.top = "1px";
        this.fpsText.left = "-20px";
        this.fpsText.width = "200px";
        this.fpsText.height = "40px";
        
        this.advancedTexture.addControl(this.fpsText);
    }

    // ========================================
    // UI UPDATES
    // ========================================

    // Updates the FPS display with the current FPS value.
    public updateFPS(): void {
        if (this.fpsText) {
            this.fpsText.text = "FPS: " + this.engine.getFps().toFixed(0);
        }
    }

    // ========================================
    // CLEANUP
    // ========================================

    // Disposes of the GUI resources.
    dispose(): void {
        this.advancedTexture?.dispose();
        this.fpsText = null;
    }
}