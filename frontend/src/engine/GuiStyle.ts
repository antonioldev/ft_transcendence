import { Control, Image } from "@babylonjs/gui";

const H_LEFT = Control.HORIZONTAL_ALIGNMENT_LEFT;
const H_CENTER = Control.HORIZONTAL_ALIGNMENT_CENTER;
const H_RIGHT = Control.HORIZONTAL_ALIGNMENT_RIGHT;
const V_TOP = Control.VERTICAL_ALIGNMENT_TOP;
const V_CENTER = Control.VERTICAL_ALIGNMENT_CENTER;
const V_BOTTOM = Control.VERTICAL_ALIGNMENT_BOTTOM;
const FONT_FAMILY = 'Poppins, Arial, sans-serif';

// Color constants
const COLORS = {
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
    TRANSPARENT: "transparent"
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
        background: COLORS.BLACK,
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
        horizontalAlignment: Control.HORIZONTAL_ALIGNMENT_LEFT,
        verticalAlignment: Control.VERTICAL_ALIGNMENT_CENTER,
        widthInPixels: 160,
        clipChildren: false
    },

    bracketCellRect: {
        widthInPixels: 150,
        paddingTop: "5px",
        paddingBottom: "5px",
        paddingLeft: "6px",
        horizontalAlignment: Control.HORIZONTAL_ALIGNMENT_CENTER,
        verticalAlignment: Control.VERTICAL_ALIGNMENT_CENTER,
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
        textHorizontalAlignment: Control.HORIZONTAL_ALIGNMENT_LEFT,
        textVerticalAlignment: Control.VERTICAL_ALIGNMENT_CENTER
    }
} as const;