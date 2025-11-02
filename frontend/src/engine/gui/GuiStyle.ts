import { Control, Grid, Image, Rectangle, StackPanel, TextBlock, Checkbox } from "@babylonjs/gui";

export const H_LEFT = Control.HORIZONTAL_ALIGNMENT_LEFT;
export const H_CENTER = Control.HORIZONTAL_ALIGNMENT_CENTER;
export const H_RIGHT = Control.HORIZONTAL_ALIGNMENT_RIGHT;
export const V_TOP = Control.VERTICAL_ALIGNMENT_TOP;
export const V_CENTER = Control.VERTICAL_ALIGNMENT_CENTER;
export const V_BOTTOM = Control.VERTICAL_ALIGNMENT_BOTTOM;
const FONT_FAMILY = 'Poppins, Tiny5, sans-serif';
const FONT_FAMILY_SEC = 'Tiny5, Poppins, sans-serif';

export const COLORS = {
    BLACK: "rgba(0, 0, 0, 1)",
    TRANSPARENT_BLACK_DARK: "rgba(0, 0, 0, 0.9)",
    TRANSPARENT_BLACK: "rgba(0, 0, 0, 0.6)",
    TRANSPARENT_BLACK_LIGHT: "rgba(0, 0, 0, 0.2)",

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
    ORANGE: "rgba(254, 94, 65, 1)",
    SPECTATOR_RED: "rgba(255, 0, 0, 0.3)",

} as const;

export const Z_INDEX = { 
    GAMEPLAY: 5,
    HUD: 10,
    POWERUPS: 12,
    ENDGAME: 15,
    LOBBY: 31,
    MODAL: 42,
    BRACKET: 43,
    CURTAIN: 45,

} as const;

export const SPECTATOR_STYLE = {
    spectatorOverlay: {
        width: "100%",
        height: "100%",
        background: COLORS.TRANSPARENT,
        thickness: 5,
        color: COLORS.SPECTATOR_RED,
        zIndex: Z_INDEX.HUD,
        isVisible: false
    },
    spectatorBanner: {
        widthInPixels: 1920,
        heightInPixels: 54,
        thickness: 0,
        background: COLORS.SPECTATOR_RED,
        verticalAlignment: V_TOP
    },
    bannerGrid: {
        widthInPixels: 1920,
        heightInPixels: 54,
    },
    spectatorText: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        fontSizeInPixels: 27,
        fontWeight: "bold",
        textHorizontalAlignment: H_LEFT,
        paddingLeftInPixels: 20,
    },
    spectatorControls: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        fontSizeInPixels: 27,
        textHorizontalAlignment: H_RIGHT,
        paddingRightInPixels: 20,
    },
    bannerContent: {
        width: "100%",
        height: "100%",
        isVertical: false
    }
} as const;

export const HUD_STYLES = {
    hudGrid: {
        widthInPixels: 1920,
        heightInPixels: 216, // 20% of 1080
        background: COLORS.DARK_BLUE,
        verticalAlignment: V_BOTTOM,
        zIndex: Z_INDEX.HUD,
        alpha: 0
    },

    grid: {
        width: "100%",
        height: "100%",
    },

    playerLabel: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        fontSizeInPixels: 56, // 40% of 216px HUD height
        fontWeight: "bold",
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowBlur: 2,
        shadowOpacity: 0.5,
        shadowColor: COLORS.BLACK
    },

    scoreText: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        fontSizeInPixels: 64, // 45% of 216px
        fontWeight: "bold",
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowBlur: 2,
        shadowOpacity: 0.5,
        shadowColor: COLORS.BLACK,
    },

    rallyText: {
        textVerticalAlignment: V_TOP,
        fontFamily: FONT_FAMILY,
        color: COLORS.TRANSPARENT_WHITE_50,
        fontSizeInPixels: 36, // 20% of 216px
    },

    rallyValue: {
        fontFamily: FONT_FAMILY,
        textVerticalAlignment: V_BOTTOM,
        color: COLORS.WHITE,
        fontSizeInPixels: 56, // 35% of 216px
        fontWeight: "bold",
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
        topInPixels: 29 // 15% of 194px
    },

    powerUpLetter: {
        width: "100%",
        height: "15%",
        paddingTopInPixels: 4, // 2% of 194px
        fontSizeInPixels: 19, // 10% of 194px
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
        widthInPixels: 960,
        heightInPixels: 864,
        cornerRadius: 12,
        thickness: 2,
    },

    grid: {
        width: "100%",
        height: "100%",
    },

    stack: {
        isVertical: true,
        paddingTopInPixels: 20,
        paddingBottomInPixels: 10,
        spacing: 8
    },

    muteCheckbox: {
        widthInPixels: 20,
        heightInPixels: 20,
        horizontalAlignment: H_CENTER,
        color: COLORS.LIGHT_GREEN,
        background: COLORS.TRANSPARENT,
        thickness: 1,
        checkSizeRatio: 0.6
    },
    pauseTitle: {
        fontFamily: FONT_FAMILY_SEC,
        color: COLORS.LIGHT_GREEN,
        fontSizeInPixels: 58,
        fontWeight: "bold",
        heightInPixels: 68,
        paddingBottomInPixels: 15
    },

    pauseHeader: {
        fontFamily: FONT_FAMILY_SEC,
        color: COLORS.WHITE,
        fontSizeInPixels: 30,
        fontWeight: "bold",
        heightInPixels: 38,
        paddingTopInPixels: 8,
        paddingBottomInPixels: 5
    },

    pauseDetails: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        fontSizeInPixels: 28,
        heightInPixels: 80,
        textWrapping: true,
        paddingBottomInPixels: 8
    },

    otherDetails: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        fontSizeInPixels: 20,
        heightInPixels: 25,
        textWrapping: true
    },

    spectatorPauseBox: {
        widthInPixels: 400,
        heightInPixels: 100,
        background: COLORS.TRANSPARENT_BLACK,
        thickness: 3,
        color: COLORS.SPECTATOR_RED,
        cornerRadius: 12,
        zIndex: Z_INDEX.HUD,
        isVisible: false,
        shadowBlur: 20,
        shadowColor: COLORS.SPECTATOR_RED
    },
    
    spectatorPauseText: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        fontSizeInPixels: 36,
        fontWeight: "bold",
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowBlur: 2,
        shadowOpacity: 0.5,
        shadowColor: COLORS.BLACK,
    }
} as const;

export const LOBBY_STYLES = {
    overlay: {
        width: "100%",
        height: "100%",
        background: COLORS.DARK_BLUE,
        zIndex: Z_INDEX.LOBBY,
        isVisible: false,
        thickness: 0,
    },

    box: {
        width: "50%",
        height: "80%",
        color: COLORS.LIGHT_GREEN,
        background: COLORS.DARK_BLUE,
        shadowBlur: 15,
        shadowColor: COLORS.TRANSPARENT_BLACK_DARK,
        thickness: 2,
        cornerRadius: 12
    },

    grid: {
        width: "100%",
        height: "100%"
    },
    
    title: {
        fontFamily: FONT_FAMILY_SEC,
        fontSizeInPixels: 56,
        color: COLORS.ORANGE,
        fontWeight: "bold",
        textWrapping: true
    },

    dots: {
        fontFamily: FONT_FAMILY,
        fontSizeInPixels: 64,
        color: COLORS.ORANGE,
    },
    
    count: {
        fontFamily: FONT_FAMILY,
        fontSizeInPixels: 36,
        color: COLORS.WHITE,
    },
    
    lobbyList: {
        isVertical: true,
        width: "85%",
        spacing: 6,
        adaptHeightToChildren: true
    },
    
    rowRect: {
        height: "100%",
        width: "95%",
        thickness: 1,
        cornerRadius: 6,
        color: COLORS.WHITE,
    },
    
    rowText: {
        fontFamily: FONT_FAMILY,
        width: "90%", // 90% of 816px
        fontSizeInPixels: 23, // 60% of 38px row height
        alpha: 0,
        clipContent: true
    },
} as const;

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
        fontSizeInPixels: 100, // 12% of 1080
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
        fontSizeInPixels: 130, // 12% of 1080
        shadowOffsetX: 4,
        shadowOffsetY: 4,
        shadowColor: COLORS.LIGHT_GREEN,
        fontWeight: "bold",
        outlineWidth: 3,
        outlineColor: COLORS.TRANSPARENT_BLACK,
        leftInPixels: -300,
        topInPixels: -150,
        isVisible: false,
        alpha: 0,
        zIndex: Z_INDEX.HUD,
    },

    vsText: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        fontSizeInPixels: 65, // 6% of 1080
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowColor: COLORS.SPECTATOR_RED,
        fontWeight: "bold",
        outlineWidth: 5,
        outlineColor: COLORS.BLACK,
        topInPixels: -50,
        isVisible: false,
        alpha: 0,
        zIndex: Z_INDEX.HUD,
    },

    namePlayerRight: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        fontSizeInPixels: 130, // 12% of 1080
        shadowOffsetX: 4,
        shadowOffsetY: 4,
        shadowBlur: 0,
        shadowColor: COLORS.LIGHT_GREEN,
        fontWeight: "bold",
        outlineWidth: 3,
        outlineColor: COLORS.TRANSPARENT_BLACK,
        leftInPixels: 300,
        topInPixels: 50,
        isVisible: false,
        alpha: 0,
        zIndex: Z_INDEX.HUD,

    },

    readyText: {
        fontFamily: FONT_FAMILY,
        color: COLORS.GOLD,
        fontSizeInPixels: 162, // 15% of 1080
        shadowOffsetX: 2,
        shadowOffsetY: 2,
        shadowBlur: 0,
        shadowColor: COLORS.GOLD_SHADOW,
        fontWeight: "bold",
        outlineWidth: 4,
        outlineColor: COLORS.TRANSPARENT_BLACK,
        topInPixels: -50,
        isVisible: false,
        alpha: 0,
        zIndex: Z_INDEX.HUD,
    }

} as const;

export const VIEW_MODE_STYLES = {
    dividerLine: {
        widthInPixels: 5,
        height: "100%",
        background: COLORS.BLACK,
        zIndex: Z_INDEX.GAMEPLAY,
        thickness: 0
    }
} as const;

export const END_GAME_STYLES = {
    overlay: {
        width: "100%",
        height: "100%",
        background: COLORS.TRANSPARENT_BLACK_DARK,
        isVisible: false,
        zIndex: Z_INDEX.ENDGAME,
    },
    championBackground: COLORS.TRANSPARENT_BLACK_LIGHT,
    winnerGrid: {
        widthInPixels: 1920,
        heightInPixels: 972,
        verticalAlignment: V_BOTTOM
    },
    gridRows: {
        label: 340,
        name: 292,
        continue: 146,
        timer: 97
    },
    winnerLabel: {
        fontFamily: FONT_FAMILY_SEC,
        color: COLORS.WHITE,
        fontSizeInPixels: 70,
        alpha: 0,
    },

    winnerName: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        fontSizeInPixels: 90,
        fontWeight: "bold",
        shadowOffsetX: 3,
        shadowOffsetY: 3,
        alpha: 0,
        shadowColor: COLORS.LIGHT_GREEN
    },

    continueText: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        fontSizeInPixels: 50,
        isVisible: false,
    },
} as const;

export const BRACKET_STYLES = {
    bracketOverlay: {
        width: "45%",
        height: "80%",
        background: COLORS.TRANSPARENT,
        horizontalAlignment: H_RIGHT,
        verticalAlignment: V_CENTER,
        cornerRadius: 12,
        isVisible: false,
        zIndex: Z_INDEX.BRACKET,
        paddingInPixels: 8,
        thickness: 0
    },

    containerRows: {
        header: 0.2,
        content: 0.8
    },

    gridColumns: {
        icon: 70,
        title: 1
    },

    bracketIcon: {
        widthInPixels: 68,
        heightInPixels: 68,
        stretch: Image.STRETCH_UNIFORM
    },

    bg: {
        width: "100%",
        height: "100%",
        stretch: Image.STRETCH_FILL,
        isPointerBlocker: false
    },

    bracketTitle: {
        fontFamily: FONT_FAMILY_SEC,
        color: COLORS.WHITE,
        fontSizeInPixels: 86
    },

    grid: {
        width: "100%",
        height: "100%",
        // paddingLeftInPixels: 2
    },

    winnerCell: {
        background: COLORS.LIGHT_GREEN,
    },
    
    winnerText: {
        fontWeight: "bold",
        fontSizeInPixels: 19, // 40% of 48px row height
        color: COLORS.WHITE,
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

    stackPanel: {
        isVertical: true,
        width: "100%",
        height: "100%",
    },
    panelGrid: {
        width: "100%",
    },
    
    tabsBar: {
        width: "100%",
        heightInPixels: 44,
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
        fontSizeInPixels: 15,
        fontWeight: "bold",
        heightInPixels: 30
    },

    tabButton: {
        heightInPixels: 37,
        thickness: 0,
        background: COLORS.LIGHT_BLUE,
        cornerRadiusW: 8,
        cornerRadiusZ: 8,
        verticalAlignment: V_TOP
    },

    tabButtonActive: {
        heightInPixels: 44,
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
        fontSizeInPixels: 18,
    },

    tabLabelActive: {
        color: COLORS.WHITE,
        fontSizeInPixels: 18,
        fontWeight: "bold",
    },

    matchRowRect: {
        width: "100%",
        heightInPixels: 48,
        paddingLeftInPixels: 4,
        paddingRightInPixels: 4,
        paddingTopInPixels: 1,
        paddingBottomInPixels: 1,
        thickness: 0,
        alpha: 0
    },

    matchRowGrid: {
        width: "100%",
        height: "100%",
        spacing: 8
    },

    matchPlayerRect: {
        cornerRadius: 6,
        thickness: 1,
        color: COLORS.WHITE,
        background: COLORS.TRANSPARENT,
        clipChildren: false
    },
    
    matchPlayerText: {
        color: COLORS.WHITE,
        heightInPixels: 48,
        resizeToFit: true,
        fontSizeInPixels: 19 // 40% of 48px
    },

    matchVsText: {
        text: "← vs →",
        color: COLORS.GRAY,
        fontSizeInPixels: 12, // 25% of 48px
        fontWeight: "bold",
        background: COLORS.WHITE,
        cornerRadius: 20
    }
} as const;

export const CURTAIN_STYLES = {
    background: {
        background: COLORS.DARK_BLUE,
        height: "100%",
        width: "50%",
        thickness: 0,
        alpha: 0,
        horizontalAlignment: H_LEFT,
        verticalAlignment: V_TOP,
        zIndex: Z_INDEX.CURTAIN
    },

    paddle: {
        background: COLORS.ORANGE,
        thickness: 0,
        height: "100%",
        widthInPixels: 40,
        horizontalAlignment: H_RIGHT,
        verticalAlignment: V_CENTER
    }
} as const;

export const CARD_GAME_STYLES = {
    mainContainer: {
        width: "100%",
        height: "100%",
        background: COLORS.DARK_BLUE,
        zIndex: Z_INDEX.LOBBY,
        isVisible: false,
        thickness: 0
    },

    layoutGrid: {
        widthInPixels: 1920,
        heightInPixels: 1026,
        paddingTopInPixels: 20,
    },
    
    title: {
        fontSizeInPixels: 40,
        color: COLORS.ORANGE,
        heightInPixels: 60,
        fontWeight: "bold",
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowBlur: 2,
        shadowOpacity: 0.5,
        shadowColor: COLORS.BLACK,
    },

    instructions: {
        fontSizeInPixels: 20,
        color: COLORS.WHITE,
        heightInPixels: 30,
        paddingTopInPixels: 10,
    },

    cardsGrid: {
        widthInPixels: 1248, // 65% of 1920
        heightInPixels: 702, // Remaining space
    },

    cardRect: {
        widthInPixels: 195,  // Bigger - fits nicely in 1248/6 = 208px per column
        heightInPixels: 165, // Bigger - fits nicely in 702/4 = 175.5px per row
        paddingInPixels: 5,
        thickness: 0,
        cornerRadius: 8,
        background: COLORS.TRANSPARENT
    },

    cardBack: {
        widthInPixels: 195,
        heightInPixels: 165,
        background: COLORS.ORANGE,
        cornerRadius: 8,
        thickness: 2,
        color: COLORS.WHITE,
        shadowBlur: 5,
        shadowColor: COLORS.BLACK,
        stretch: Image.STRETCH_FILL
    },

    cardFront: {
        widthInPixels: 195,
        heightInPixels: 165,
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

export function createTextBlock(name: string, styles: any, text: string): TextBlock {
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