/**
 * Represents the structure of a translation object for different languages.
 * Each property corresponds to a translatable string in the application.
 */
export interface Translation {
    // appTitle: string;
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
	next: string;
    startGame: string;
    gamePaused: string;
    exitGame: string;
    pauseControls: string;
    pauseControls3D: string;
    alertPlayer1: string;
    alertPlayer2: string;
    register: string;
    login: string;
    loginSubmit: string;
    loginTitle: string;
    registerTitle: string;
    greeting: string;
    username: string;
    email: string;
    password: string;
    forgotPassword: string;
    notRegistered: string;
    alreadyRegistered: string;
    confirmPassword: string;
    usernameOrEmail: string;
    createAccount: string;
    enterUsername: string;
    enterEmail: string;
    enterPassword: string;
    confirmPasswordPlaceholder: string;
    enterUsernameOrEmail: string;
    viewMode: string;
    backToMain: string;
    pleaseFilllAllFields: string;
    passwordFormat: string,
    alreadyLogin: string,
    passwordsDoNotMatch: string;
    dontHaveAccount: string;
    alreadyHaveAccount: string;
    availableOnlyOffline: string;
    loginRequired: string;
    logout: string;
    tournamentOnline: string;
    play: string;
    loading: string;
    waiting: string;
	countPlayer: string;
    controls: string;
    easy: string;
    medium: string;
    hard: string;
    impossible: string;
    winner: string;
    continue: string;
	tournamentTitle: string;
    spectatorWaitingmessage: string;
	escToClose: string;
    miniGameRules: string;
    
    // Validation error messages
    errorEnterEmailOrUsername: string;
    errorEnterPassword: string;
    errorEnterUsername: string;
    errorEnterEmail: string;
    errorEnterValidEmail: string;
    errorPasswordMinLength: string;
    errorConfirmPassword: string;
    errorPasswordsDoNotMatch: string;
	spectator: string,
	spectatorInstruction: string;
	spectatorQuestion: string;


    //PAUSE MENU TRANSLATION
    pauseControlsTitle: string;
    pauseMovementTitle: string;
    pausePowerupsTitle: string;
    pauseObjectiveTitle: string;
    pauseMovementP1_2D: string;
    pauseMovementP2_2D: string;
    pauseMovementP1_3D: string;
    pauseMovementP2_3D: string;
    pauseMovementSolo_2D: string;
    pauseMovementSolo_3D: string;
    pausePowerupsMulti_P1: string;
    pausePowerupsMulti_P2: string;
    pausePowerupsSolo: string;
    pauseObjectiveText: string;

    // Settings Menu
    settings: string;
    language: string;
    scene3d: string;
    music: string;
    soundEffects: string;
    backToMainMenu: string;
}

// export type TranslationKey = keyof Translation;