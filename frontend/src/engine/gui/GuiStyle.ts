import { Control, Image, StackPanel, Grid, TextBlock, Rectangle} from "@babylonjs/gui";

export const H_LEFT = Control.HORIZONTAL_ALIGNMENT_LEFT;
export const H_CENTER = Control.HORIZONTAL_ALIGNMENT_CENTER;
export const H_RIGHT = Control.HORIZONTAL_ALIGNMENT_RIGHT;
export const V_TOP = Control.VERTICAL_ALIGNMENT_TOP;
export const V_CENTER = Control.VERTICAL_ALIGNMENT_CENTER;
export const V_BOTTOM = Control.VERTICAL_ALIGNMENT_BOTTOM;
const FONT_FAMILY = 'Poppins, Tiny5, sans-serif';

export const COLORS = {
    WHITE: "rgba(255, 255, 255, 1)",
    BLACK: "rgba(0, 0, 0, 1)",
    TRANSPARENT_BLACK_55: "rgba(0, 0, 0, 0.55)",
    TRANSPARENT_BLACK_66: "rgba(0, 0, 0, 0.66)",
    TRANSPARENT_BLACK_90: "rgba(0, 0, 0, 0.9)",
    TRANSPARENT_BLACK_98: "rgba(2, 2, 2, 0.98)",
    TRANSPARENT_WHITE_50: "rgba(255, 255, 255, 0.5)",
    DARK_BLUE: "rgba(20, 61, 96, 1)",
    LIGHT_GREEN: "rgba(160, 200, 120, 1)",
    ORANGE: "rgba(235, 91, 0, 1)",
    LIGHT_BROWN: "rgba(129, 82, 63, 1)",
    DARK_BROWN: "rgba(63, 42, 43, 1)",
    GOLD: "rgba(255, 215, 0, 1)",
    GOLD_SHADOW: "rgba(255, 217, 0, 0.80)",
    GOLD_GLOW: "rgba(255, 215, 0, 0.8)",
    TRANSPARENT: "transparent",
    WINNER_GREEN: "#22C55E",
    WINNER_GREEN_LIGHT: "rgba(34, 197, 94, 0.2)",
    LOSER_GRAY: "#999999",
    LOSER_GRAY_DARK: "rgba(0, 0, 0, 0.4)",
    LOSER_BORDER: "rgba(128, 128, 128, 0.5)",

    BLACK_STRING: "#000000",
    BLUE_LIGHT_STRING: "#8db1f0ff",
    CYAN_LIGHT_STRING: "#79d7eeff",

    SPECTATOR_BLUE: "#143D60",
    SPECTATOR_RED: "rgba(255, 0, 0, 0.3)",
    SPECTATOR_YELLOW: "rgba(255, 255, 0, 1)",
    GREEN: "#A0C878"
} as const;


export const SPECTATOR_STYLE = {
    spectatorOverlay: {
        width: "100%",
        height: "100%",
        background: COLORS.TRANSPARENT,
        thickness: 10,
        color: COLORS.SPECTATOR_RED,
        zIndex: 19,
        isVisible: false
    },

    spectatorBanner: {
        width: "100%",
        height: "40px",
        background: COLORS.SPECTATOR_RED,
        alpha: 1,
        horizontalAlignment: H_CENTER,
        verticalAlignment: V_TOP,
    },

    spectatorText: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        fontSize: 18,
        fontWeight: "bold",
        textHorizontalAlignment: H_LEFT,
        textVerticalAlignment: V_CENTER,
        paddingLeft: "20px",
        width: "300px"
    },

    spectatorControls: {
        fontFamily: FONT_FAMILY,
        color: COLORS.SPECTATOR_YELLOW,
        fontSize: 14,
        textHorizontalAlignment: H_RIGHT,
        textVerticalAlignment: V_CENTER,
        width: "600px"
    },

    bannerContent: {
        width: "100%",
        height: "100%",
        isVertical: false
    }
} as const;

export const LOADING_STYLE = {
    overlay: {
        width: "100%",
        height: "100%",
        thickness: 1,
        verticalAlignment: V_CENTER,
        horizontalAlignment: H_CENTER,
        zIndex: 20
    },

    title: {
        text: "Loading",
        fontSize: 56,
        color:" #FFFFFF",
        top: "-50px"
    },

    bar: {
        width: "40%",
        height: "12px",
        thickness: 0,
        background: "rgba(255,255,255,0.15)",
        cornerRadius: 4
    },

    fill: {
        height: "100%",
        width: "0%",
        thickness: 0,
        background: "#22C55E",
        horizontalAlignment: H_LEFT,
        // left: 0
    },

    percentege: {
        fontSize: 18,
        color: "#FFFFFF",
        top: "24px"
    }
} as const;
export const HUD_STYLES = {
    hudGrid: {
        width: "100%",
        height: "20%",
        background: COLORS.DARK_BLUE,
        verticalAlignment: V_BOTTOM,
        horizontalAlignment: H_CENTER,
        zIndex: 8
    },

    player1Label: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER,
        fontSize: 48,
        fontWeight: "bold",
        shadowOffsetX: 2,
        shadowOffsetY: 2,
        shadowBlur: 0,
        shadowColor: COLORS.GOLD_SHADOW,
        outlineWidth: 2,
        outlineColor: COLORS.TRANSPARENT_BLACK_66,
        thickness: 2,
    },

    player2Label: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER,
        fontSize: 48,
        fontWeight: "bold",
        shadowOffsetX: 2,
        shadowOffsetY: 2,
        shadowBlur: 0,
        shadowColor: COLORS.GOLD_SHADOW,
        outlineWidth: 2,
        outlineColor: COLORS.TRANSPARENT_BLACK_66
    },

    score1Text: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_BOTTOM,
        fontSize: 56,
        fontWeight: "bold",
        shadowOffsetX: 2,
        shadowOffsetY: 2,
        shadowBlur: 0,
        shadowColor: COLORS.GOLD_SHADOW,
        outlineWidth: 2,
        outlineColor: COLORS.TRANSPARENT_BLACK_66
    },

    score2Text: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_BOTTOM,
        fontSize: 56,
        fontWeight: "bold",
        shadowOffsetX: 3,
        shadowOffsetY: 3,
        shadowBlur: 0,
        shadowColor: COLORS.GOLD_SHADOW,
        outlineWidth: 2,
        outlineColor: COLORS.TRANSPARENT_BLACK_66
    },

    rallyText: {
        fontFamily: FONT_FAMILY,
        color: COLORS.TRANSPARENT_WHITE_50,
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_BOTTOM,
        fontSize: 16,
        top: "-8px" 
    },

    rallyValue: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_TOP,
        fontSize: 40,
        fontWeight: "bold",
        top: "4px",
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowBlur: 6,
        shadowColor: "rgba(235, 91, 0, 0.6)"
    },

    // playerControlsP1: {
    //     fontFamily: FONT_FAMILY,
    //     color: COLORS.TRANSPARENT_BLACK_55,
    //     textHorizontalAlignment: H_CENTER,
    //     textVerticalAlignment: V_CENTER,
    //     fontSize: 30,
    //     lineSpacing: "10px"
    // },

    // playerControlsP2: {
    //     fontFamily: FONT_FAMILY,
    //     color: COLORS.TRANSPARENT_BLACK_55,
    //     textHorizontalAlignment: H_CENTER,
    //     textVerticalAlignment: V_CENTER,
    //     fontSize: 30,
    //     lineSpacing: "10px"
    // }
} as const;

export const POWER_UP_STYLES = {
    powerUpSlot: {
        background: COLORS.TRANSPARENT,
        verticalAlignment: V_CENTER,
        horizontalAlignment: H_CENTER,
        thickness: 0,
        width: "100%",
        height: "100%",
    },

    powerUpCell: {
        width: "33%",
        height: "90%",
        color: COLORS.WHITE,
        thickness: 1,
        cornerRadius: 8,
        verticalAlignment: V_CENTER,
        horizontalAlignment: H_LEFT,
        zIndex: 6,
        alpha: 0
    },

    powerUpIcon: {
        stretch: Image.STRETCH_UNIFORM,
        width: "90%",
        height: "85%",
        verticalAlignment: V_TOP,
        horizontalAlignment: H_CENTER,
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
        horizontalAlignment: H_CENTER,
        textHorizontalAlignment: H_CENTER,
    },

    powerUpHd: {
        widthInPixels: 200,
        heightInPixels: 200,
        stretch: Image.STRETCH_UNIFORM,
        horizontalAlignment: H_CENTER,
        verticalAlignment: V_TOP,
        isVisible: false,
        top: 100,
        alpha: 0,
        zIndex: 15
    }
} as const;
export const PAUSE_MENU_STYLES = {
    pauseOverlay: {
        width: "100%",
        height: "100%",
        background: COLORS.TRANSPARENT_BLACK_98,
        verticalAlignment: V_CENTER,
        zIndex: 11,
        color: COLORS.WHITE,
        isVisible: false
    },

    pauseGrid: {
        width: "100%",
        height: "95%",
        horizontalAlignment: H_CENTER,
        verticalAlignment: V_CENTER
    },

    pauseTitle: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER,
        fontSize: 42,
        fontWeight: "bold"
    },

    pauseInstruction: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        height: "30px",
        fontSize: 20,
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER
    },

    pauseHint: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        height: "30px",
        fontSize: 16,
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER
    },

    muteIcon: {
        stretch: Image.STRETCH_UNIFORM,
        paddingTop: "16px"
    },

    gridRows: {
        title: 0.2,
        gameInstructions: 0.6,
        exitInstruction: 0.15,
        muteIcon: 0.05
    },

    gameInstructionContainer: {
        width: "50%",
        cornerRadius: 12,
        thickness: 2,
        horizontalAlignment: H_CENTER,
        verticalAlignment: V_CENTER,
        color: COLORS.WHITE

    },

    instructionsStack: {
        width: "90%",
        height: "100%",
        horizontalAlignment: H_CENTER,
        verticalAlignment: V_CENTER,
        isVertical: true,
        spacing: 10,
        paddingTop: "50px",
        paddingBottom: "50px"
    },

    instructionTitle: {
        fontFamily: FONT_FAMILY,
        color: COLORS.LIGHT_GREEN,
        fontSize: 36,
        fontWeight: "bold",
        textHorizontalAlignment: H_CENTER,
        height: "40px"
    },

    instructionSectionHeader: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        fontSize: 22,
        fontWeight: "bold",
        textHorizontalAlignment: H_CENTER,
        height: "35px",
        paddingTop: "10px"
    },

    instructionDetails: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        fontSize: 18,
        textHorizontalAlignment: H_CENTER,
        height: "60px",
        textWrapping: true
    }
} as const;
export const LOBBY_STYLES = {
  overlay: {
    width: "100%",
    height: "100%",
    color: COLORS.WHITE,
    background: COLORS.TRANSPARENT_BLACK_90,
    horizontalAlignment: H_CENTER,
    verticalAlignment: V_CENTER,
    zIndex: 50,
    isVisible: false
  },
  title: {
    fontSize: 36,
    color: "white",
    height: "40px",
    fontWeight: "bold",
    shadowOffsetX: 1,
    shadowOffsetY: 1,
    shadowBlur: 4,
    shadowColor: COLORS.GOLD_SHADOW,
    textHorizontalAlignment: H_CENTER,
  },
  subtitle: {
    fontSize: 32,
    color: "#AAB",
    fontWeight: "bold",
    width: "30%",
    textHorizontalAlignment: H_LEFT,
  },
  count: {
    text: "",
    fontSize: 26,
    color: "#8A8",
    textHorizontalAlignment: H_CENTER,
  },
  lobbyList: {
    isVertical: true,
    width: "100%",
    spacing: 6,
    verticalAlignment: V_TOP,
    adaptHeightToChildren: true
  },
  rowRect: {
    height: "34px",
    width: "100%",
    thickness: 0,
    paddingLeft: "10px",
  },
  rowText: {
    width: "40%",
    fontSize: 20,
    color: "white",
    alpha: 0,
    textHorizontalAlignment: H_RIGHT
  },
};
export const COUNTDOWN_STYLES = {
    countdownContainer: {
        width: "100%",
        height: "100%",
        thickness: 0,
        isVisible: false,
        zIndex: 10,
        horizontalAlignment: H_CENTER,
        verticalAlignment: V_CENTER
    },

    countdownText: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER,
        fontSize: 72,
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowBlur: 5,
        shadowColor: COLORS.GOLD_SHADOW,
        fontWeight: "bold",
        outlineWidth: 2,
        outlineColor: COLORS.TRANSPARENT_BLACK_66
    },

    namePlayerLeft: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER,
        fontSize: 100,
        shadowOffsetX: 6,
        shadowOffsetY: 6,
        shadowBlur: 0,
        shadowColor: COLORS.GREEN,
        fontWeight: "bold",
        outlineWidth: 3,
        outlineColor: COLORS.TRANSPARENT_BLACK_66,
        horizontalAlignment: H_CENTER,
        verticalAlignment: V_CENTER,
        leftInPixels: -300,
        topInPixels: -150,
        isVisible: false,
        alpha: 0,
        zIndex: 11
    },

    vsText: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER,
        fontSize: 60,
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowBlur: 0,
        shadowColor: "rgba(255, 0, 0, 0.8)",
        fontWeight: "bold",
        outlineWidth: 5,
        outlineColor: COLORS.BLACK,
        horizontalAlignment: H_CENTER,
        verticalAlignment: V_CENTER,
        topInPixels: -50,
        isVisible: false,
        alpha: 0,
        zIndex: 11
    },

    namePlayerRight: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER,
        fontSize: 100,
        shadowOffsetX: 6,
        shadowOffsetY: 6,
        shadowBlur: 0,
        shadowColor: COLORS.GREEN,
        fontWeight: "bold",
        outlineWidth: 3,
        outlineColor: COLORS.TRANSPARENT_BLACK_66,
        horizontalAlignment: H_CENTER,
        verticalAlignment: V_CENTER,
        leftInPixels: 300,
        topInPixels: 50,
        isVisible: false,
        alpha: 0,
        zIndex: 11
    },

    readyText: {
        fontFamily: FONT_FAMILY,
        color: COLORS.GOLD,
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER,
        fontSize: 120,
        shadowOffsetX: 2,
        shadowOffsetY: 2,
        shadowBlur: 15,
        shadowColor: COLORS.GOLD_SHADOW,
        fontWeight: "bold",
        outlineWidth: 4,
        outlineColor: COLORS.TRANSPARENT_BLACK_66,
        horizontalAlignment: H_CENTER,
        verticalAlignment: V_CENTER,
        topInPixels: -50,
        isVisible: false,
        alpha: 0,
        zIndex: 11
    }

} as const;
export const VIEW_MODE_STYLES = {
    dividerLine: {
        width: "5px",
        height: "100%",
        background: COLORS.BLACK,
        horizontalAlignment: H_CENTER,
        verticalAlignment: V_CENTER,
        zIndex: 6,
        thickness: 0
    }
} as const;
export const PARTIAL_END_GAME_STYLES = {
    partialEndGameOverlay: {
        width: "100%",
        height: "100%",
        background: COLORS.BLACK,
        verticalAlignment: V_BOTTOM,
        zIndex: 8,
        isVisible: false
    },

    winnerGrid: {
        width: "100%",
        height: "100%",
        zIndex: 9,
        horizontalAlignment: H_CENTER,
        verticalAlignment: V_CENTER
    },

    gridRows: {
        label: 0.2,
        name: 0.6,
        continue: 0.2
    },

    partialWinnerLabel: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER,
        fontSize: 80,
        outlineWidth: 2,
        zIndex: 10,
        alpha: 0
    },

    partialWinnerName: {
        fontFamily: FONT_FAMILY,
        color: COLORS.GOLD,
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER,
        fontSize: 110,
        fontWeight: "bold",
        outlineWidth: 2,
        outlineColor: COLORS.WHITE,
        zIndex: 10,
        alpha: 0,
        shadowBlur: 20,
        shadowColor: COLORS.GOLD_GLOW
    },

    continueText: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER,
        outlineWidth: 2,
        outlineColor: COLORS.GOLD,
        isVisible: false,
        zIndex: 10
    }
} as const;
export const END_GAME_STYLES = {
    endGameOverlay: {
        width: "100%",
        height: "20%",
        background: COLORS.TRANSPARENT_BLACK_90,
        verticalAlignment: V_BOTTOM,
        isVisible: false,
        horizontalAlignment: H_CENTER
    },

    endGameWinnerText: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER,
        fontSize: 72,
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowBlur: 8,
        shadowColor: COLORS.GOLD_SHADOW,
        fontWeight: "bold",
        outlineWidth: 2,
        outlineColor: COLORS.TRANSPARENT_BLACK_66
    }
} as const;
export const BRACKET_STYLES = {
    bracketOverlay: {
        width: "560px",
        height: "650px",
        top: "40px",
        background: COLORS.TRANSPARENT_BLACK_98,
        horizontalAlignment: H_RIGHT,
        verticalAlignment: V_BOTTOM,
        cornerRadius: 12,
        isVisible: false,
        isPointerBlocker: true,
        zIndex: 20,
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
        horizontalAlignment: H_CENTER,
        verticalAlignment: V_CENTER,
        stretch: Image.STRETCH_UNIFORM
    },

    bg: {
        width: "100%", height: "100%",
		stretch: Image.STRETCH_FILL,
		isPointerBlocker: false,
		zIndex: 0,
    },

    bracketTitle: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER,
        fontSize: 36,
        shadowBlur: 20,
        fontWeight: "bold",
        shadowColor: COLORS.GOLD_GLOW
    },

    bracketGrid: {
        width: "100%",
        height: "100%",
        paddingLeft: "2px"
    },

    // Winner/Loser states
    winnerCell: {
        background: COLORS.WINNER_GREEN_LIGHT,
        thickness: 2,
        color: COLORS.WINNER_GREEN
    },
    
    winnerText: {
        fontWeight: "bold",
        fontSize: "18px",
        color: COLORS.WHITE,
        outlineWidth: 2,
        outlineColor: COLORS.BLACK,
        shadowOffsetX: 2,
        shadowOffsetY: 2,
        shadowBlur: 4,
        shadowColor: COLORS.TRANSPARENT_BLACK_66
    },
    
    loserCell: {
        background: COLORS.LOSER_GRAY_DARK,
        thickness: 1,
        color: COLORS.LOSER_BORDER
    },
    
    loserText: {
        alpha: 0.6,
        color: COLORS.LOSER_GRAY
    },

    tabsRoot: {
        isVertical: true,
        width: "100%",
        height: "100%",
        horizontalAlignment: H_CENTER
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
        background: "#5a7db8",
        thickness: 0
    },

    tabHeader: {
        fontFamily: FONT_FAMILY,
        color: "#FFFFFF",
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER,
        fontSize: 20,
        fontWeight: "bold",
        heightInPixels: 30
    },

    tabButton: {
        height: "85%",
        thickness: 0,
        background: "#5a7db8",
        isPointerBlocker: true,
        cornerRadiusW: 8,
        cornerRadiusZ: 8,
        verticalAlignment: V_TOP
    },

    tabButtonActive: {
        height: "100%",
        thickness: 0,
        background: "#4db8d4",
        isPointerBlocker: true,
        cornerRadiusW: 8,
        cornerRadiusZ: 8,
        shadowOffsetY: 2,
        shadowBlur: 4,
        shadowColor: "rgba(238, 236, 236, 0.6)",
        verticalAlignment: V_TOP
    },

    tabLabelInactive: {
        color: "#2D3748",
        fontSize: 16,
        textHorizontalAlignment: Control.HORIZONTAL_ALIGNMENT_CENTER,
        textVerticalAlignment: Control.VERTICAL_ALIGNMENT_CENTER
    },

    tabLabelActive: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "bold",
        outlineWidth: 1,
        outlineColor: "#1A202C",
        textHorizontalAlignment: Control.HORIZONTAL_ALIGNMENT_CENTER,
        textVerticalAlignment: Control.VERTICAL_ALIGNMENT_CENTER
    },

    // Match display
    matchRowRect: {
        width: "100%",
        heightInPixels: 48,
        paddingLeft: "4px",
        paddingRight: "4px",
        paddingTop: "2px",
        paddingBottom: "2px",
        thickness: 0,
        alpha: 0
    },

    matchRowPanel: {
        isVertical: false,
        width: "100%",
        height: "100%",
        horizontalAlignment: Control.HORIZONTAL_ALIGNMENT_CENTER,
        spacing: 8
    },

    matchPlayerRect: {
        widthInPixels: 240,
        height: "100%",
        paddingTop: "6px",
        paddingBottom: "6px",
        paddingLeft: "8px",
        paddingRight: "8px",
        verticalAlignment: Control.VERTICAL_ALIGNMENT_CENTER,
        horizontalAlignment: Control.HORIZONTAL_ALIGNMENT_CENTER,
        cornerRadius: 6,
        thickness: 1,
        color: "#555",
        background: "rgba(255,255,255,0.06)",
        clipChildren: false
    },
    
    matchPlayerText: {
        color: "#FFFFFF",
        height: "100%",
        resizeToFit: true,
        textHorizontalAlignment: Control.HORIZONTAL_ALIGNMENT_LEFT,
        textVerticalAlignment: Control.VERTICAL_ALIGNMENT_CENTER,
        fontSize: 16
    },

    matchVsText: {
        widthInPixels: 70,
        height: "100%",
        text: "← vs →",
        color: "#BBB",
        fontSize: 16,
        fontWeight: "bold",
        textHorizontalAlignment: Control.HORIZONTAL_ALIGNMENT_CENTER,
        textVerticalAlignment: Control.VERTICAL_ALIGNMENT_CENTER,
        background: "rgba(255,255,255,0.02)",
        cornerRadius: 20
    }
} as const;
export const CURTAIN_STYLES = {
    leftBackground: {
        background: '#143D60',
        height: "100%",
        width: "100%",
        thickness: 0,
        horizontalAlignment: H_LEFT,
        verticalAlignment: V_TOP,
        isVisible: false,
        zIndex: 0
    },
    
    rightBackground: {
        background: '#143D60',
        height: "100%",
        width: "100%",
        thickness: 0,
        horizontalAlignment: H_LEFT,
        verticalAlignment: V_TOP,
        isVisible: false,
        zIndex: 0
    },
    
    leftPaddle: {
        background: '#EB5B00',
        thickness: 0,
        widthInPixels: 80,
        height: "100%",
        horizontalAlignment: H_RIGHT,
        verticalAlignment: V_TOP,
        isVisible: false,
        shadowBlur: 60,
	    shadowColor: "rgba(245, 204, 179, 0.87)",
        zIndex: 1
    },
    
    rightPaddle: {
        background: '#EB5B00',
        thickness: 0,
        widthInPixels: 80,
        height: "100%",
        horizontalAlignment: H_LEFT,
        verticalAlignment: V_TOP,
        isVisible: false,
        shadowBlur: 60,
	    shadowColor: "rgba(245, 204, 179, 0.87)",
        zIndex: 1
    }
} as const;
export function applyStyles(control: any, styles: any): void {
    Object.entries(styles).forEach(([key, value]) => {
        if (value !== undefined && key in control) {
            (control as any)[key] = value;
        }
    });
}

export function  createRect(name: string, styles: any): Rectangle {
    const rect = new Rectangle(name);
    applyStyles(rect, styles);
    return rect;
}

export function   createTextBlock(name: string, styles: any, text?: string): TextBlock {
    const textBlock = new TextBlock(name, text);
    applyStyles(textBlock, styles);
    return textBlock;
}

export function  createGrid(name: string, styles: any): Grid {
    const grid = new Grid(name);
    applyStyles(grid, styles);
    return grid;
}

export function  createImage(name: string, styles: any, source?: string): Image {
    const image = new Image(name, source);
    applyStyles(image, styles);
    return image;
}

export function  createStackPanel(name: string, styles: any): StackPanel {
    const stackPanel = new StackPanel(name);
    applyStyles(stackPanel, styles);
    return stackPanel;
}