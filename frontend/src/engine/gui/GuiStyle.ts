import { Control, Image, StackPanel, Grid, TextBlock, Rectangle } from "@babylonjs/gui";

const H_LEFT = Control.HORIZONTAL_ALIGNMENT_LEFT;
const H_CENTER = Control.HORIZONTAL_ALIGNMENT_CENTER;
const H_RIGHT = Control.HORIZONTAL_ALIGNMENT_RIGHT;
const V_TOP = Control.VERTICAL_ALIGNMENT_TOP;
const V_CENTER = Control.VERTICAL_ALIGNMENT_CENTER;
const V_BOTTOM = Control.VERTICAL_ALIGNMENT_BOTTOM;
const FONT_FAMILY = 'Poppins, Arial, sans-serif';

// Color constants
export const COLORS = {
    WHITE: "rgba(255, 255, 255, 1)",
    BLACK: "rgba(0, 0, 0, 1)",
    TRANSPARENT_BLACK_55: "rgba(0, 0, 0, 0.55)",
    TRANSPARENT_BLACK_66: "rgba(0, 0, 0, 0.66)",
    TRANSPARENT_BLACK_90: "rgba(0, 0, 0, 0.9)",
    TRANSPARENT_BLACK_98: "rgba(2, 2, 2, 0.98)",
    TRANSPARENT_WHITE_50: "rgba(255, 255, 255, 0.5)",
    GOLD: "rgba(255, 215, 0, 1)",
    GOLD_SHADOW: "rgba(255, 217, 0, 0.80)",
    GOLD_GLOW: "rgba(255, 215, 0, 0.8)",
    TRANSPARENT: "transparent",
    WINNER_GREEN: "#22C55E",
    WINNER_GREEN_LIGHT: "rgba(34, 197, 94, 0.2)",
    LOSER_GRAY: "#999999",
    LOSER_GRAY_DARK: "rgba(0, 0, 0, 0.4)",
    LOSER_BORDER: "rgba(128, 128, 128, 0.5)",
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
        background: COLORS.TRANSPARENT_BLACK_55,
        verticalAlignment: V_BOTTOM,
        zIndex: 8
    },

    fpsText: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER,
        fontSize: 18
    },

    player1Label: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER,
        fontSize: 48,
        fontWeight: "bold",
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowBlur: 8,
        shadowColor: COLORS.GOLD_SHADOW,
        outlineWidth: 2,
        outlineColor: COLORS.TRANSPARENT_BLACK_66
    },

    player2Label: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER,
        fontSize: 48,
        fontWeight: "bold",
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowBlur: 8,
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
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowBlur: 8,
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
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowBlur: 8,
        shadowColor: COLORS.GOLD_SHADOW,
        outlineWidth: 2,
        outlineColor: COLORS.TRANSPARENT_BLACK_66
    },

    rallyText: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER,
        fontSize: 48
    },

    rallyValue: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_BOTTOM,
        fontSize: 56
    },

    playerControlsP1: {
        fontFamily: FONT_FAMILY,
        color: COLORS.TRANSPARENT_BLACK_55,
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER,
        fontSize: 30,
        lineSpacing: "10px"
    },

    playerControlsP2: {
        fontFamily: FONT_FAMILY,
        color: COLORS.TRANSPARENT_BLACK_55,
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER,
        fontSize: 30,
        lineSpacing: "10px"
    },

    gridColumns: {
        fps: 0.10,
        p1Controls: 0.15,
        p1Score: 0.25,
        p2Score: 0.25,
        p2Controls: 0.15,
        rally: 0.10
    }
} as const;

export const POWER_UP_STYLES = {
    powerUpSlot: {
        width: "110px",
        height: "280px",
        background: COLORS.TRANSPARENT,
        verticalAlignment: V_TOP,
        thickness: 0,
        isVisible: false
    },

    powerUpCell: {
        width: "100px",
        height: "80px",
        background: COLORS.BLACK,
        color: COLORS.TRANSPARENT_WHITE_50,
        thickness: 1,
        cornerRadius: 8,
        horizontalAlignment: H_LEFT,
        verticalAlignment: V_TOP,
        zIndex: 6
    },

    powerUpIcon: {
        stretch: Image.STRETCH_UNIFORM,
        width: "75px",
        height: "75px",
        verticalAlignment: V_CENTER,
        isVisible: false
    },

    powerUpLetter: {
        width: "100%",
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.WHITE,
        verticalAlignment: V_CENTER,
        textHorizontalAlignment: H_LEFT
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
        width: "50%",
        height: "100%",
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
        fontSize: 24,
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER
    },

    pauseHint: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        fontSize: 20,
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER
    },

    muteIcon: {
        stretch: Image.STRETCH_UNIFORM,
        paddingTop: "16px"
    },

    gridRows: {
        title: 0.5,
        instruction: 0.3,
        hint: 0.1,
        muteIcon: 0.1
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
        shadowBlur: 8,
        shadowColor: COLORS.GOLD_SHADOW,
        fontWeight: "bold",
        outlineWidth: 2,
        outlineColor: COLORS.TRANSPARENT_BLACK_66
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
        width: "55%",
        height: "80%",
        background: COLORS.TRANSPARENT_BLACK_98,
        horizontalAlignment: H_RIGHT,
        verticalAlignment: V_CENTER,
        cornerRadius: 12,
        isVisible: false,
        isPointerBlocker: true,
        zIndex: 20,
        padding: "8px",
        thickness: 0
    },

    bracketContainer: {
        width: "100%",
        height: "100%"
    },

    headerGrid: {
        height: "80px"
    },

    bracketIcon: {
        width: "68px",
        height: "68px",
        horizontalAlignment: H_LEFT,
        stretch: Image.STRETCH_UNIFORM
    },

    bracketTitle: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        textHorizontalAlignment: H_LEFT,
        textVerticalAlignment: V_CENTER,
        fontSize: 36,
        shadowBlur: 20,
        fontWeight: "bold",
        shadowColor: COLORS.GOLD_GLOW
    },

    bracketScroll: {
        width: "100%",
        height: "100%",
        thickness: 0,
        barSize: 8,
        background: "transparent",
        wheelPrecision: 20
    },

    contentWrap: {
        isVertical: false,
        height: "100%",
        width: "800px"
    },

    bracketGrid: {
        width: "800px",
        height: "100%"
    },

    gridColumns: {
        icon: 70,
        title: 1
    },

    bracketColPanel: {
        isVertical: true,
        horizontalAlignment: H_LEFT,
        verticalAlignment: V_CENTER,
        widthInPixels: 160,
        clipChildren: false
    },

    bracketCellRect: {
        widthInPixels: 150,
        paddingTop: "5px",
        paddingBottom: "5px",
        paddingLeft: "6px",
        horizontalAlignment: H_CENTER,
        verticalAlignment: V_CENTER,
        clipChildren: false
    },

    containerRows: {
        header: 0.2,
        content: 0.8
    },

    bracketCellText: {
        fontFamily: FONT_FAMILY,
        color: COLORS.WHITE,
        height: "100%",
        resizeToFit: true,
        textHorizontalAlignment: H_LEFT,
        textVerticalAlignment: V_CENTER
    },

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