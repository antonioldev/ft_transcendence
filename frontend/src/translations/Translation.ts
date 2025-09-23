/**
 * Represents the structure of a translation object for different languages.
 * Each property corresponds to a translatable string in the application.
 */
export interface Translation {
<<<<<<< HEAD
    appTitle: string;
	classicMode: string;
=======
    classicMode: string;
>>>>>>> 69cb0189936c263692e2cb0a3b7fc421f0119e5a
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
<<<<<<< HEAD
	tournamentTitle: string;
	escToClose: string;
=======
>>>>>>> 69cb0189936c263692e2cb0a3b7fc421f0119e5a
    
    // Validation error messages
    errorEnterEmailOrUsername: string;
    errorEnterPassword: string;
    errorEnterUsername: string;
    errorEnterEmail: string;
    errorEnterValidEmail: string;
    errorPasswordMinLength: string;
    errorConfirmPassword: string;
    errorPasswordsDoNotMatch: string;
}

export type TranslationKey = keyof Translation;