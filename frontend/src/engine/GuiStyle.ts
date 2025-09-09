import { Control, Image } from "@babylonjs/gui";

const H_LEFT = Control.HORIZONTAL_ALIGNMENT_LEFT;
const H_CENTER = Control.HORIZONTAL_ALIGNMENT_CENTER;
const H_RIGHT = Control.HORIZONTAL_ALIGNMENT_RIGHT;
const V_TOP = Control.VERTICAL_ALIGNMENT_TOP;
const V_CENTER = Control.VERTICAL_ALIGNMENT_CENTER;
const V_BOTTOM = Control.VERTICAL_ALIGNMENT_BOTTOM;

export const HUD_STYLES = {
    hudGrid: {
        width: "100%",
        height: "20%",
        background: "rgba(0, 0, 0, 0.55)",
        verticalAlignment: V_BOTTOM,
        zIndex: 8
    },

    fpsText: {
        fontFamily: 'Poppins, Arial, sans-serif',
        color: "#FFFFFF",
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER,
        fontSize: 18
    },

    player1Label: {
        fontFamily: 'Poppins, Arial, sans-serif',
        color: "#FFFFFF",
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER,
        fontSize: 48,
        fontWeight: "bold",
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowBlur: 8,
        shadowColor: "rgba(255, 217, 0, 0.80)",
        outlineWidth: 2,
        outlineColor: "rgba(0, 0, 0, 0.66)"
    },

    player2Label: {
        fontFamily: 'Poppins, Arial, sans-serif',
        color: "#FFFFFF",
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER,
        fontSize: 48,
        fontWeight: "bold",
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowBlur: 8,
        shadowColor: "rgba(255, 217, 0, 0.80)",
        outlineWidth: 2,
        outlineColor: "rgba(0, 0, 0, 0.66)"
    },

    score1Text: {
        fontFamily: 'Poppins, Arial, sans-serif',
        color: "#FFFFFF",
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_BOTTOM,
        fontSize: 56,
        fontWeight: "bold",
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowBlur: 8,
        shadowColor: "rgba(255, 217, 0, 0.80)",
        outlineWidth: 2,
        outlineColor: "rgba(0, 0, 0, 0.66)"
    },

    score2Text: {
        fontFamily: 'Poppins, Arial, sans-serif',
        color: "#FFFFFF",
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_BOTTOM,
        fontSize: 56,
        fontWeight: "bold",
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowBlur: 8,
        shadowColor: "rgba(255, 217, 0, 0.80)",
        outlineWidth: 2,
        outlineColor: "rgba(0, 0, 0, 0.66)"
    },

    rallyText: {
        fontFamily: 'Poppins, Arial, sans-serif',
        color: "#FFFFFF",
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER,
        fontSize: 48
    },

    rallyValue: {
        fontFamily: 'Poppins, Arial, sans-serif',
        color: "#FFFFFF",
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_BOTTOM,
        fontSize: 56
    },

    playerControlsP1: {
        fontFamily: 'Poppins, Arial, sans-serif',
        color: "rgba(0, 0, 0, 0.55)",
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER,
        fontSize: 30,
        lineSpacing: "10px"
    },

    playerControlsP2: {
        fontFamily: 'Poppins, Arial, sans-serif',
        color: "rgba(0, 0, 0, 0.55)",
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
        background: "rgba(0, 0, 0, 1)",
        verticalAlignment: V_TOP,
        thickness: 0,
        isVisible: false
    },

    powerUpCell: {
        width: "100px",
        height: "80px",
        background: "rgba(0, 0, 0, 1)",
        color: "rgba(255, 255, 255, 0.5)",
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
        color: "rgba(255, 255, 255, 1)",
        verticalAlignment: V_CENTER,
        textHorizontalAlignment: H_LEFT
    }
} as const;

export const PAUSE_MENU_STYLES = {
    pauseOverlay: {
        width: "100%",
        height: "100%",
        background: "rgba(2, 2, 2, 0.98)",
        verticalAlignment: V_CENTER,
        zIndex: 11,
        color: "rgba(255, 255, 255, 1)",
        isVisible: false
    },

    pauseGrid: {
        width: "50%",
        height: "100%",
        horizontalAlignment: H_CENTER,
        verticalAlignment: V_CENTER
    },

    pauseTitle: {
        fontFamily: 'Poppins, Arial, sans-serif',
        color: "#FFFFFF",
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER,
        fontSize: 42,
        fontWeight: "bold"
    },

    pauseInstruction: {
        fontFamily: 'Poppins, Arial, sans-serif',
        color: "#FFFFFF",
        fontSize: 24,
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER
    },

    pauseHint: {
        fontFamily: 'Poppins, Arial, sans-serif',
        color: "#FFFFFF",
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
        fontFamily: 'Poppins, Arial, sans-serif',
        color: "#FFFFFF",
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER,
        fontSize: 72,
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowBlur: 8,
        shadowColor: "rgba(255, 217, 0, 0.80)",
        fontWeight: "bold",
        outlineWidth: 2,
        outlineColor: "rgba(0, 0, 0, 0.66)"
    }
} as const;

export const VIEW_MODE_STYLES = {
    dividerLine: {
        width: "5px",
        height: "100%",
        background: "#000000ff",
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
        background: "rgba(0, 0, 0, 1)",
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
        fontFamily: 'Poppins, Arial, sans-serif',
        color: "#FFFFFF",
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER,
        fontSize: 80,
        outlineWidth: 2,
        zIndex: 10,
        alpha: 0
    },

    partialWinnerName: {
        fontFamily: 'Poppins, Arial, sans-serif',
        color: "rgb(255, 215, 0)",
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER,
        fontSize: 110,
        fontWeight: "bold",
        outlineWidth: 2,
        outlineColor: "rgb(255, 255, 255)",
        zIndex: 10,
        alpha: 0,
        shadowBlur: 20,
        shadowColor: "rgba(255, 215, 0, 0.8)"
    },

    continueText: {
        fontFamily: 'Poppins, Arial, sans-serif',
        color: "rgb(255, 255, 255)",
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER,
        outlineWidth: 2,
        outlineColor: "rgb(255, 215, 0)",
        zIndex: 10
    }
} as const;

export const END_GAME_STYLES = {
    endGameOverlay: {
        width: "100%",
        height: "20%",
        background: "rgba(0, 0, 0, 0.9)",
        verticalAlignment: V_BOTTOM,
        isVisible: false,
        horizontalAlignment: H_CENTER
    },

    endGameWinnerText: {
        fontFamily: 'Poppins, Arial, sans-serif',
        color: "#FFFFFF",
        textHorizontalAlignment: H_CENTER,
        textVerticalAlignment: V_CENTER,
        fontSize: 72,
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowBlur: 8,
        shadowColor: "rgba(255, 217, 0, 0.80)",
        fontWeight: "bold",
        outlineWidth: 2,
        outlineColor: "rgba(0, 0, 0, 0.66)"
    }
} as const;

export const BRACKET_STYLES = {
    bracketOverlay: {
        width: "55%",
        height: "80%",
        background: "rgba(2, 2, 2, 0.98)",
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
        fontFamily: 'Poppins, Arial, sans-serif',
        color: "#FFFFFF",
        textHorizontalAlignment: H_LEFT,
        textVerticalAlignment: V_CENTER,
        fontSize: 36,
        shadowBlur: 20,
        fontWeight: "bold",
        shadowColor: "rgba(255, 215, 0, 0.8)"
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
        fontFamily: 'Poppins, Arial, sans-serif',
        color: "white",
        height: "100%",
        resizeToFit: true,
        textHorizontalAlignment: Control.HORIZONTAL_ALIGNMENT_LEFT,
        textVerticalAlignment: Control.VERTICAL_ALIGNMENT_CENTER
    }
} as const;