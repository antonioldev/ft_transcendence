import { Control, Grid, Image, Rectangle, StackPanel, TextBlock, Checkbox } from "@babylonjs/gui";

export const H_LEFT = Control.HORIZONTAL_ALIGNMENT_LEFT;
export const H_CENTER = Control.HORIZONTAL_ALIGNMENT_CENTER;
export const H_RIGHT = Control.HORIZONTAL_ALIGNMENT_RIGHT;
export const V_TOP = Control.VERTICAL_ALIGNMENT_TOP;
export const V_CENTER = Control.VERTICAL_ALIGNMENT_CENTER;
export const V_BOTTOM = Control.VERTICAL_ALIGNMENT_BOTTOM;
const FONT_FAMILY = 'Poppins, Tiny5, sans-serif';

export const COLORS = {
    BLACK: "rgba(0, 0, 0, 1)",
    TRANSPARENT_BLACK_DARK: "rgba(0, 0, 0, 0.9)",
    TRANSPARENT_BLACK: "rgba(0, 0, 0, 0.6)",

    WHITE: "rgba(255, 255, 255, 1)",
    TRANSPARENT_WHITE_50: "rgba(255, 255, 255, 0.5)",
    TRANSPARENT_WHITE_15: "rgba(255, 255, 255, 0.15)",
    TRANSPARENT: "transparent",

    DARK_BLUE: "rgba(20, 61, 96, 1)",
    LIGHT_BLUE: "rgba(90, 125, 184, 1)",
    
    GOLD: "rgba(255, 215, 0, 1)",
    GOLD_SHADOW: "rgba(255, 217, 0, 0.80)",
    GREEN: "rgba(34, 197, 94, 1)",
    LIGHT_GREEN: "rgba(160, 200, 120, 1)",
    GRAY: "rgba(153, 153, 153, 1)",
    ORANGE: "rgba(235, 91, 0, 1)",
    SPECTATOR_RED: "rgba(255, 0, 0, 0.3)",

} as const;

export const Z_INDEX = { 
    GAMEPLAY: 5,
    HUD: 10,
    POWERUPS: 12,
    ENDGAME: 15,
    BRACKET: 43,
    CURTAIN: 30,
    LOBBY: 31,
    MODAL: 42,

} as const;

export const SPECTATOR_STYLE = {
    spectatorOverlay: {
        width: "100%",
        height: "100%",
        background: COLORS.TRANSPARENT,
        thickness: 10,
        color: COLORS.SPECTATOR_RED,
        zIndex: Z_INDEX.HUD,
        isVisible: false
    },
    spectatorBanner: {
        width: "100%",
        height: "40px",
        thickness: 0,
        background: COLORS.SPECTATOR_RED,
        verticalAlignment: V_TOP
    },
    spectatorText: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        fontSize: 20,
        fontWeight: "bold",
        textHorizontalAlignment: H_LEFT,
        paddingLeft: "20px",
        width: "300px"
    },
    spectatorControls: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        fontSize: 18,
        textHorizontalAlignment: H_RIGHT,
        width: "1000px"
    },
    bannerContent: {
        width: "100%",
        height: "100%",
        isVertical: false
    }
} as const;

export const HUD_STYLES = {
    hudGrid: {
        width: "100%",
        height: "20%",
        background: COLORS.DARK_BLUE,
        verticalAlignment: V_BOTTOM,
        zIndex: Z_INDEX.HUD
    },

    player1Label: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        fontSize: 48,
        fontWeight: "bold",
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowBlur: 2,
        shadowOpacity: 0.5,
        shadowColor: COLORS.BLACK,
        // shadowOffsetX: 2,
        // shadowOffsetY: 2,
        // shadowBlur: 0,
        // shadowColor: COLORS.GOLD_SHADOW,
        // outlineWidth: 2,
        // outlineColor: COLORS.TRANSPARENT_BLACK,
        // thickness: 2,
        resizeToFit: true
    },

    player2Label: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        fontSize: 48,
        fontWeight: "bold",
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowBlur: 2,
        shadowOpacity: 0.5,
        shadowColor: COLORS.BLACK,
        // shadowOffsetX: 2,
        // shadowOffsetY: 2,
        // shadowBlur: 0,
        // shadowColor: COLORS.GOLD_SHADOW,
        // outlineWidth: 2,
        // outlineColor: COLORS.TRANSPARENT_BLACK,
        resizeToFit: true,
    },

    score1Text: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        textVerticalAlignment: V_BOTTOM,
        fontSize: 56,
        fontWeight: "bold",
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowBlur: 2,
        shadowOpacity: 0.5,
        shadowColor: COLORS.BLACK,
        // shadowOffsetX: 2,
        // shadowOffsetY: 2,
        // shadowBlur: 0,
        // shadowColor: COLORS.GOLD_SHADOW,
        // outlineWidth: 2,
        // outlineColor: COLORS.TRANSPARENT_BLACK
    },

    score2Text: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        textVerticalAlignment: V_BOTTOM,
        fontSize: 56,
        fontWeight: "bold",
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowBlur: 2,
        shadowOpacity: 0.5,
        shadowColor: COLORS.BLACK,
        // shadowOffsetX: 3,
        // shadowOffsetY: 3,
        // shadowBlur: 0,
        // shadowColor: COLORS.GOLD_SHADOW,
        // outlineWidth: 2,
        // outlineColor: COLORS.TRANSPARENT_BLACK
    },

    rallyText: {
        fontFamily: FONT_FAMILY,
        color: COLORS.TRANSPARENT_WHITE_50,
        textVerticalAlignment: V_BOTTOM,
        fontSize: 16,
        top: "-8px" 
    },

    rallyValue: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        textVerticalAlignment: V_TOP,
        fontSize: 40,
        fontWeight: "bold",
        top: "4px",
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowBlur: 6,
        shadowColor: COLORS.ORANGE
    },
} as const;

export const POWER_UP_STYLES = {
    powerUpSlot: {
        background: COLORS.TRANSPARENT,
        thickness: 0,
        width: "100%",
        height: "100%",
    },

    powerUpCell: {
        width: "33%",
        height: "90%",
        color: COLORS.WHITE,
        thickness: 0,
        cornerRadius: 8,
        horizontalAlignment: H_LEFT,
        zIndex: Z_INDEX.POWERUPS,
        alpha: 0
    },

    powerUpIcon: {
        stretch: Image.STRETCH_UNIFORM,
        width: "90%",
        height: "85%",
        verticalAlignment: V_TOP,
        top: "15%"
    },

    powerUpLetter: {
        width: "100%",
        height: "15%",
        paddingTop: "2%",
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.WHITE,
        verticalAlignment: V_TOP,
    },

    powerUpHd: {
        widthInPixels: 200,
        heightInPixels: 200,
        stretch: Image.STRETCH_UNIFORM,
        verticalAlignment: V_TOP,
        isVisible: false,
        top: 100,
        alpha: 0
    }
} as const;

export const PAUSE_MENU_STYLES = {
    pauseOverlay: {
        width: "100%",
        height: "100%",
        background: COLORS.TRANSPARENT_BLACK_DARK,
        zIndex: Z_INDEX.MODAL,
        color: COLORS.WHITE,
        isVisible: false
    },

    pauseBox: {
        width: "50%",
        height: "80%",
        cornerRadius: 12,
        thickness: 2,
    },

    grid: {
        width: "100%",
        height: "100%",
    },

    // exitInstruction: {
    //     fontFamily: FONT_FAMILY,
    //     color: COLORS.WHITE,
    //     height: "30px",
    //     fontSize: 20,
    // },

    stack: {
        isVertical: true,
        paddingTop: "30px",
        paddingBottom: "10px",
        spacing: 10
    },

    // audioStack: {
    //     isVertical: true,
    //     paddingTop: "10px",
    //     paddingBottom: "10px"
    // },

    muteCheckbox: {
        width: "20px",
        height: "20px",
        horizontalAlignment: H_CENTER,
        color: COLORS.LIGHT_GREEN,
        background: COLORS.TRANSPARENT,
        thickness: 1,
        checkSizeRatio: 0.6
    },

    gridRows: {
        gameInstructions: 0.65,
        exitInstruction: 0.20,
        audio: 0.15
    },

    // instructionsStack: {
    //     width: "90%",
    //     height: "100%",
    //     isVertical: true,
    //     spacing: 10,
    //     paddingTop: "30px",
    //     paddingBottom: "10px"
    // },

    pauseTitle: {
        fontFamily: FONT_FAMILY,
        color: COLORS.LIGHT_GREEN,
        fontSize: 36,
        fontWeight: "bold",
        height: "40px"
    },

    pauseHeader: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        fontSize: 24,
        fontWeight: "bold",
        height: "35px",
        paddingTop: "10px"
    },

    pauseDetails: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        fontSize: 20,
        height: "60px",
        textWrapping: true
    },

    spectatorPauseBox: {
        widthInPixels: 400,
        heightInPixels: 100,
        background: COLORS.TRANSPARENT_BLACK,
        thickness: 3,
        color: COLORS.SPECTATOR_RED,
        cornerRadius: 12,
        zIndex: Z_INDEX.MODAL - 1,
        isVisible: false,
        shadowBlur: 20,
        shadowColor: COLORS.SPECTATOR_RED
    },
    
    spectatorPauseText: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        fontSize: 36,
        fontWeight: "bold",
        // outlineWidth: 2,
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowBlur: 2,
        shadowOpacity: 0.5,
        shadowColor: COLORS.BLACK,
        // outlineColor: COLORS.BLACK
    }
} as const;

export const LOBBY_STYLES = {
    overlay: {
        width: "50%",
        height: "80%",
        color: COLORS.LIGHT_GREEN,
        background: COLORS.DARK_BLUE,
        shadowBlur: 15,
        shadowColor: COLORS.TRANSPARENT_BLACK_DARK,
        zIndex: Z_INDEX.LOBBY,
        isVisible: false,
        thickness: 2,
        cornerRadius: 12
    },
    
    title: {
        fontFamily: FONT_FAMILY,
        fontSize: 42,
        color: COLORS.ORANGE,
        height: "60px",
        fontWeight: "bold",
        // shadowOffsetX: 1,
        // shadowOffsetY: 1,
        // shadowBlur: 2,
        // shadowOpacity: 0.5,
        // shadowColor: COLORS.BLACK,
        // outlineWidth: 2,
        // outlineColor: COLORS.WHITE
    },
    
    // subtitle: {
    //     // fontFamily: "monospace",
    //     fontFamily: FONT_FAMILY,
    //     textHorizontalAlignment: H_LEFT,
    //     fontSize: 24,
    //     color: COLORS.LIGHT_GREEN,
    //     fontWeight: "bold",
    //     height: "40px",
    //     width: "100%",
    // },
    
    count: {
        fontFamily: FONT_FAMILY,
        fontSize: 20,
        color: COLORS.WHITE,
        height: "30px",
    },
    
    lobbyList: {
        isVertical: true,
        width: "85%",
        spacing: 6,
        adaptHeightToChildren: true
    },
    
    rowRect: {
        height: "38px",
        width: "95%",
        thickness: 1,
        cornerRadius: 6,
        color: COLORS.WHITE,
    },
    
    rowText: {
        fontFamily: FONT_FAMILY,
        width: "90%",
        fontSize: 22,
        alpha: 0,
        textWrapping: true
    },
};

export const COUNTDOWN_STYLES = {
    countdownContainer: {
        width: "100%",
        height: "80%",
        verticalAlignment: V_TOP,
        thickness: 0,
        isVisible: false,
        zIndex: Z_INDEX.HUD,
    },

    countdownText: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        fontSize: 72,
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowBlur: 5,
        shadowColor: COLORS.GOLD_SHADOW,
        fontWeight: "bold",
        outlineWidth: 2,
        outlineColor: COLORS.TRANSPARENT_BLACK
    },

    namePlayerLeft: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        fontSize: 100,
        shadowOffsetX: 6,
        shadowOffsetY: 6,
        shadowBlur: 0,
        shadowColor: COLORS.LIGHT_GREEN,
        fontWeight: "bold",
        outlineWidth: 3,
        outlineColor: COLORS.TRANSPARENT_BLACK,
        leftInPixels: -300,
        topInPixels: -150,
        isVisible: false,
        alpha: 0
    },

    vsText: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        fontSize: 60,
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowBlur: 0,
        shadowColor: COLORS.SPECTATOR_RED,
        fontWeight: "bold",
        outlineWidth: 5,
        outlineColor: COLORS.BLACK,
        topInPixels: -50,
        isVisible: false,
        alpha: 0
    },

    namePlayerRight: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        fontSize: 100,
        shadowOffsetX: 6,
        shadowOffsetY: 6,
        shadowBlur: 0,
        shadowColor: COLORS.LIGHT_GREEN,
        fontWeight: "bold",
        outlineWidth: 3,
        outlineColor: COLORS.TRANSPARENT_BLACK,
        leftInPixels: 300,
        topInPixels: 50,
        isVisible: false,
        alpha: 0
    },

    readyText: {
        fontFamily: FONT_FAMILY,
        color: COLORS.GOLD,
        fontSize: 120,
        shadowOffsetX: 2,
        shadowOffsetY: 2,
        shadowBlur: 0,
        shadowColor: COLORS.GOLD_SHADOW,
        fontWeight: "bold",
        outlineWidth: 4,
        outlineColor: COLORS.TRANSPARENT_BLACK,
        topInPixels: -50,
        isVisible: false,
        alpha: 0
    }

} as const;

export const VIEW_MODE_STYLES = {
    dividerLine: {
        width: "5px",
        height: "100%",
        background: COLORS.BLACK,
        zIndex: Z_INDEX.GAMEPLAY,
        thickness: 0
    }
} as const;

export const PARTIAL_END_GAME_STYLES = {
    partialEndGameOverlay: {
        width: "100%",
        height: "100%",
        background: COLORS.BLACK,
        verticalAlignment: V_BOTTOM,
        zIndex: Z_INDEX.ENDGAME,
        isVisible: false
    },

    winnerGrid: {
        width: "100%",
        height: "100%",
    },

    gridRows: {
        label: 0.2,
        name: 0.6,
        continue: 0.2
    },

    partialWinnerLabel: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        fontSize: 80,
        outlineWidth: 2,
        alpha: 0,
        zIndex: Z_INDEX.ENDGAME + 1,
    },

    partialWinnerName: {
        fontFamily: FONT_FAMILY,
        color: COLORS.GOLD,
        fontSize: 110,
        fontWeight: "bold",
        shadowOffsetX: 3,
        shadowOffsetY: 3,
        // shadowBlur: 2,
        // shadowOpacity: 0.5,
        // shadowColor: COLORS.BLACK,
        // outlineWidth: 2,
        // outlineColor: COLORS.WHITE,
        alpha: 0,
        shadowBlur: 10,
        shadowColor: COLORS.GOLD
    },

    continueText: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowBlur: 2,
        shadowOpacity: 0.5,
        shadowColor: COLORS.BLACK,
        // outlineWidth: 2,
        // outlineColor: COLORS.GOLD,
        isVisible: false,
    }
} as const;

export const END_GAME_STYLES = {
    endGameOverlay: {
        width: "100%",
        height: "20%",
        background: COLORS.TRANSPARENT_BLACK,
        verticalAlignment: V_BOTTOM,
        isVisible: false,
        zIndex: Z_INDEX.ENDGAME,
    },

    endGameWinnerText: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        fontSize: 72,
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowBlur: 8,
        shadowColor: COLORS.GOLD_SHADOW,
        fontWeight: "bold",
        outlineWidth: 2,
        outlineColor: COLORS.TRANSPARENT_BLACK
    }
} as const;

export const BRACKET_STYLES = {
    bracketOverlay: {
        width: "550px",
        height: "700px",
        background: COLORS.TRANSPARENT,
        horizontalAlignment: H_RIGHT,
        verticalAlignment: V_CENTER,
        cornerRadius: 12,
        isVisible: false,
        zIndex: Z_INDEX.BRACKET,
        padding: "8px",
        thickness: 0
    },

    containerRows: {
        header: 0.2,
        content: 0.8
    },

    headerGrid: {
        height: "80px"
    },

    gridColumns: {
        icon: 70,
        title: 1
    },

    bracketIcon: {
        width: "68px",
        height: "68px",
        stretch: Image.STRETCH_UNIFORM
    },

    bg: {
        width: "100%", 
        height: "100%",
        stretch: Image.STRETCH_FILL,
        isPointerBlocker: false
    },

    bracketTitle: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        fontSize: 36,
        shadowBlur: 20,
        fontWeight: "bold",
        shadowColor: COLORS.GOLD
    },

    bracketGrid: {
        width: "100%",
        height: "100%",
        paddingLeft: "2px"
    },

    winnerCell: {
        background: COLORS.LIGHT_GREEN,
        thickness: 2,
        color: COLORS.GREEN
    },
    
    winnerText: {
        fontWeight: "bold",
        fontSize: "18px",
        color: COLORS.WHITE,
        // shadowOffsetX: 1,
        // shadowOffsetY: 1,
        // shadowBlur: 2,
        // shadowOpacity: 0.5,
        // shadowColor: COLORS.BLACK,
        // outlineWidth: 2,
        // outlineColor: COLORS.BLACK,
        // shadowOffsetX: 2,
        // shadowOffsetY: 2,
        // shadowBlur: 0,
        // shadowColor: COLORS.TRANSPARENT_BLACK
    },
    
    loserCell: {
        background: COLORS.TRANSPARENT_BLACK,
        thickness: 1,
        color: COLORS.TRANSPARENT_WHITE_50
    },
    
    loserText: {
        alpha: 0.6,
        color: COLORS.GRAY
    },

    tabsRoot: {
        isVertical: true,
        width: "100%",
        height: "100%",
    },
    
    tabsBar: {
        width: "100%",
        heightInPixels: 44,
    },
    
    roundPanelsWrap: {
        isVertical: true,
        width: "100%",
        height: "100%"
    },
    
    roundPanel: {
        isVertical: true,
        width: "100%",
        height: "100%"
    },

    tabHeaderRect: {
        width: "100%",
        heightInPixels: 30,
        background: COLORS.GRAY,
        thickness: 0
    },

    tabHeader: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        fontSize: 20,
        fontWeight: "bold",
        heightInPixels: 30
    },

    tabButton: {
        height: "85%",
        thickness: 0,
        background: COLORS.LIGHT_BLUE,
        cornerRadiusW: 8,
        cornerRadiusZ: 8,
        verticalAlignment: V_TOP
    },

    tabButtonActive: {
        height: "100%",
        thickness: 0,
        background: COLORS.TRANSPARENT,
        cornerRadiusW: 8,
        cornerRadiusZ: 8,
        shadowOffsetY: 2,
        shadowBlur: 4,
        shadowColor: COLORS.WHITE,
        verticalAlignment: V_TOP
    },

    tabLabelInactive: {
        color: COLORS.DARK_BLUE,
        background: COLORS.TRANSPARENT,
        fontSize: 16,
    },

    tabLabelActive: {
        color: COLORS.WHITE,
        fontSize: 16,
        fontWeight: "bold",
        // shadowOffsetX: 1,
        // shadowOffsetY: 1,
        // shadowBlur: 2,
        // shadowOpacity: 0.5,
        // shadowColor: COLORS.BLACK,
        // outlineWidth: 1,
        // outlineColor: COLORS.DARK_BLUE,
    },

    matchRowRect: {
        width: "100%",
        heightInPixels: 48,
        paddingLeft: "4px",
        paddingRight: "4px",
        paddingTop: "1px",
        paddingBottom: "1px",
        thickness: 0,
        alpha: 0
    },

    matchRowPanel: {
        isVertical: false,
        width: "100%",
        height: "100%",
        spacing: 8
    },

    matchPlayerRect: {
        widthInPixels: 240,
        cornerRadius: 6,
        thickness: 1,
        color: COLORS.WHITE,
        background: COLORS.TRANSPARENT,
        clipChildren: false
    },
    
    matchPlayerText: {
        color: COLORS.WHITE,
        height: "100%",
        resizeToFit: true,
        fontSize: 16
    },

    matchVsText: {
        widthInPixels: 70,
        height: "100%",
        text: "← vs →",
        color: COLORS.GRAY,
        fontSize: 16,
        fontWeight: "bold",
        background: COLORS.WHITE,
        cornerRadius: 20
    }
} as const;

export const CURTAIN_STYLES = {
    leftBackground: {
        background: COLORS.DARK_BLUE,
        height: "100%",
        width: "100%",
        thickness: 0,
        horizontalAlignment: H_LEFT,
        verticalAlignment: V_TOP,
        isVisible: false,
        zIndex: Z_INDEX.CURTAIN
    },
    
    rightBackground: {
        background: COLORS.DARK_BLUE,
        height: "100%",
        width: "100%",
        thickness: 0,
        horizontalAlignment: H_LEFT,
        verticalAlignment: V_TOP,
        isVisible: false,
    },
    
    leftPaddle: {
        background: COLORS.ORANGE,
        thickness: 0,
        widthInPixels: 80,
        height: "100%",
        horizontalAlignment: H_RIGHT,
        verticalAlignment: V_TOP,
        isVisible: false,
        // shadowBlur: 60,
        // shadowColor: COLORS.WHITE,
        zIndex: Z_INDEX.CURTAIN + 1
    },
    
    rightPaddle: {
        background: COLORS.ORANGE,
        thickness: 0,
        widthInPixels: 80,
        height: "100%",
        horizontalAlignment: H_LEFT,
        verticalAlignment: V_TOP,
        isVisible: false,
        // shadowBlur: 60,
        // shadowColor: COLORS.WHITE,
        zIndex: Z_INDEX.CURTAIN + 1
    },

    spectatorWaitingBox: {
        widthInPixels: 500,
        heightInPixels: 120,
        background: COLORS.TRANSPARENT_BLACK,
        thickness: 2,
        color: COLORS.SPECTATOR_RED,
        cornerRadius: 12,
        zIndex: Z_INDEX.CURTAIN + 2,
        isVisible: false,
        shadowBlur: 20,
        shadowColor: COLORS.SPECTATOR_RED
    },
    
    spectatorWaitingText: {
        fontFamily: "monospace",
        color: COLORS.WHITE,
        fontSize: 28,
        fontWeight: "bold",
        // shadowOffsetX: 1,
        // shadowOffsetY: 1,
        // shadowBlur: 2,
        // shadowOpacity: 0.5,
        // shadowColor: COLORS.BLACK,
        // outlineWidth: 2,
        // outlineColor: COLORS.BLACK
    }
} as const;

export const CARD_GAME_STYLES = {
    mainContainer: {
        width: "100%",
        height: "100%",
        background: COLORS.TRANSPARENT,
        zIndex: Z_INDEX.LOBBY,
        isVisible: false,
        thickness: 0
    },

    stack: {
        width: "100%",
        height: "95%",
        isVertical: true,
        spacing: 20,
    },
    title: {
        fontSize: 40,
        color: COLORS.ORANGE,
        height: "60px",
        // top: "-300px",
        fontWeight: "bold",
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowBlur: 2,
        shadowOpacity: 0.5,
        shadowColor: COLORS.BLACK,
        // outlineWidth: 2,
        // outlineColor: COLORS.WHITE,
    },

    instructions: {
        fontSize: 20,
        color: COLORS.WHITE,
        height: "30px"
        // top: "-260px",
    },

    cardsGrid: {
        width: "65%",
        height: "65%",
        top: "20px",
    },

    cardRect: {
        width: `140px`,
        height: `120px`,
        padding: "5px",
        thickness: 0,
        cornerRadius: 8,
        background: COLORS.TRANSPARENT
    },

    cardBack: {
        width: "100%",
        height: "100%",
        background: COLORS.ORANGE,
        cornerRadius: 8,
        thickness: 2,
        color: COLORS.WHITE,
        shadowBlur: 5,
        shadowColor: COLORS.BLACK,
        stretch: Image.STRETCH_FILL
    },

    cardFront: {
        width: "100%",
        height: "100%",
        background: COLORS.WHITE,
        cornerRadius: 8,
        thickness: 2,
        color: COLORS.DARK_BLUE,
        stretch: Image.STRETCH_UNIFORM,
        isVisible: false 
    }
} as const;

export function applyStyles(control: any, styles: any): void {
    Object.entries(styles).forEach(([key, value]) => {
        if (value !== undefined && key in control) {
            (control as any)[key] = value;
        }
    });
}

export function createRect(name: string, styles: any): Rectangle {
    const rect = new Rectangle(name);
    applyStyles(rect, styles);
    return rect;
}

export function createTextBlock(name: string, styles: any, text?: string): TextBlock {
    const textBlock = new TextBlock(name, text);
    applyStyles(textBlock, styles);
    return textBlock;
}

export function createGrid(name: string, styles: any): Grid {
    const grid = new Grid(name);
    applyStyles(grid, styles);
    return grid;
}

export function createImage(name: string, styles: any, source?: string): Image {
    const image = new Image(name, source);
    applyStyles(image, styles);
    return image;
}

export function createStackPanel(name: string, styles: any): StackPanel {
    const stackPanel = new StackPanel(name);
    applyStyles(stackPanel, styles);
    return stackPanel;
}

export function createCheckbox(name: string, styles: any, isChecked: boolean = false): Checkbox {
    const checkbox = new Checkbox(name);
    checkbox.isChecked = isChecked;
    applyStyles(checkbox, styles);
    return checkbox;
}