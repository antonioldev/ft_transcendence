/**
 * Represents the structure of a translation object for different languages.
 * Each property corresponds to a translatable string in the application.
 */
export interface Translation {
    appTitle: string;
    classicMode: string;
    immersiveMode: string;
    selectGameMode: string;
    soloMode: string;
    localMode: string;
    onlineMode: string;
    tournamentMode: string;
    back: string;
    playerSetup: string;
    playerName: string;
    player1Name: string;
    player2Name: string;
    enterName: string;
    enterPlayer1Name: string;
    enterPlayer2Name: string;
    onlineInfo: string;
    startGame: string;
    gamePaused: string;
    exitGame: string;
    pauseControls: string;
    pauseControls3D: string;
    alertPlayer1: string;
    alertPlayer2: string;
}