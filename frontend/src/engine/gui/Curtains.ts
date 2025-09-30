import { AdvancedDynamicTexture, Rectangle, TextBlock, Container, Ellipse, Control } from "@babylonjs/gui";
import { AnimationManager, Motion } from "../services/AnimationManager.js";

export class TransitionEffect {
    private readonly COLORS = {
        blueBackground: '#143D60',
        lightGreen: '#A0C878',
        orange: '#EB5B00'
    };
    private leftPaddle!: Rectangle;
    private rightPaddle!: Rectangle;
    private leftBackground!: Rectangle;
    private rightBackground!: Rectangle;
    
    constructor(private adt: AdvancedDynamicTexture, private animationManager: AnimationManager) {
        const { width, height } = this.adt.getSize();
        
        // Left background - stays on left side, follows left paddle
        this.leftBackground = new Rectangle("leftBackground");
        this.leftBackground.background = this.COLORS.blueBackground;
        this.leftBackground.widthInPixels = width; // Covers left half
        this.leftBackground.heightInPixels = height;
        this.leftBackground.leftInPixels = -width; // Start off-screen left
        this.leftBackground.topInPixels = 0;
        this.leftBackground.isVisible = false;
        this.leftBackground.zIndex = 0;
        this.adt.addControl(this.leftBackground);

        // Right background - stays on right side, follows right paddle
        this.rightBackground = new Rectangle("rightBackground");
        this.rightBackground.background = this.COLORS.blueBackground;
        this.rightBackground.widthInPixels = width; // Covers right half
        this.rightBackground.heightInPixels = height;
        this.rightBackground.leftInPixels = width; // Start off-screen right
        this.rightBackground.topInPixels = 0;
        this.rightBackground.isVisible = false;
        this.rightBackground.zIndex = 0;
        this.adt.addControl(this.rightBackground);
        
        // Left paddle (on top of left background)
        this.leftPaddle = new Rectangle("leftPaddle");
        this.leftPaddle.background = this.COLORS.orange;
        this.leftPaddle.widthInPixels = 80;
        this.leftPaddle.heightInPixels = height;
        this.leftPaddle.leftInPixels = -80;
        this.leftPaddle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.leftPaddle.topInPixels = 0;
        this.leftPaddle.isVisible = false;
        this.leftPaddle.zIndex = 1;
        this.adt.addControl(this.leftPaddle);
        
        // Right paddle (on top of right background)
        this.rightPaddle = new Rectangle("rightPaddle");
        this.rightPaddle.background = this.COLORS.orange;
        this.rightPaddle.widthInPixels = 80;
        this.rightPaddle.heightInPixels = height;
        this.rightPaddle.leftInPixels = width;
        this.rightPaddle.topInPixels = 0;
        this.rightPaddle.isVisible = false;
        this.rightPaddle.zIndex = 1;
        this.adt.addControl(this.rightPaddle);
    }

    async start(): Promise<void> {
    this.leftPaddle.isVisible = true;
    this.rightPaddle.isVisible = true;
    this.leftBackground.isVisible = true;
    this.rightBackground.isVisible = true;
    
    const { width } = this.adt.getSize();
    
    // Set the final positions first
    this.leftBackground.leftInPixels = 0;
    this.rightBackground.leftInPixels = width / 2;
    this.leftPaddle.leftInPixels = width / 2 - 40;
    this.rightPaddle.leftInPixels = width / 2 - 40;
    
    // Now animate from off-screen positions
    await Promise.all([
        // Left background slides from left
        this.animationManager.slideFromDirection(this.leftBackground, 'right', 'in', width / 2, Motion.F.fast),
        
        // Right background slides from right  
        this.animationManager.slideFromDirection(this.rightBackground, 'left', 'in', width / 2, Motion.F.fast),
        
        // Paddles slide from sides
        this.animationManager.slideFromDirection(this.leftPaddle, 'right', 'in', width / 2 + 40, Motion.F.fast),
        this.animationManager.slideFromDirection(this.rightPaddle, 'left', 'in', width / 2 + 40, Motion.F.fast)
    ]);
}

async stop(): Promise<void> {
    const { width } = this.adt.getSize();
    
    await Promise.all([
        // Slide elements back to off-screen positions
        this.animationManager.slideFromDirection(this.leftPaddle, 'left', 'out', width / 2 + 40, Motion.F.fast),
        this.animationManager.slideFromDirection(this.rightPaddle, 'right', 'out', width / 2 + 40, Motion.F.fast),
        this.animationManager.slideFromDirection(this.leftBackground, 'left', 'out', width / 2, Motion.F.fast),
        this.animationManager.slideFromDirection(this.rightBackground, 'right', 'out', width / 2, Motion.F.fast)
    ]);
    
    this.leftPaddle.isVisible = false;
    this.rightPaddle.isVisible = false;
    this.leftBackground.isVisible = false;
    this.rightBackground.isVisible = false;
    
    this.resetPositions();
}

    private resetPositions(): void {
        const { width } = this.adt.getSize();
        
        this.leftPaddle.leftInPixels = -80;
        this.rightPaddle.leftInPixels = width;
        this.leftBackground.leftInPixels = -width;
        this.rightBackground.leftInPixels = width;
    }
    
    dispose(): void {
        this.leftPaddle.dispose();
        this.rightPaddle.dispose();
        this.leftBackground.dispose();
        this.rightBackground.dispose();
    }
}

