declare var BABYLON: any;

export function createFPSDisplay(advancedTexture: any, engine: any): () => void {
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
    
    advancedTexture.addControl(fpsText);
    
    // Return a function to update the FPS
    return () => {
        fpsText.text = "FPS: " + engine.getFps().toFixed(0);
    };
}