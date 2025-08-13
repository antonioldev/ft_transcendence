import { Logger } from '../utils/LogManager.js';
import { AuthState, AppState, WebSocketEvent } from '../shared/constants.js';
import { uiManager } from '../ui/UIManager.js';
import { getCurrentTranslation } from '../translations/translations.js';
import { WebSocketClient } from './WebSocketClient.js';
import { RegisterUser, LoginUser } from '../shared/types.js';
import { EL, requireElementById} from '../ui/elements.js';
import { initializeGoogleSignIn, renderGoogleButton } from './GoogleSignIn.js';
import { appStateManager } from './AppStateManager.js';

/**
 * Manages user authentication state, login/logout workflows, and user registration.
 * Handles the transition between guest and authenticated user states, including
 * form validation, UI updates, and navigation control.
 */
export class AuthManager {
    private static instance: AuthManager;
    private authState: AuthState = AuthState.GUEST;
    private currentUser: {username: string} | null = null;
    private readonly loginFields = [EL.AUTH.LOGIN_USERNAME, EL.AUTH.LOGIN_PASSWORD];
    private readonly registrationFields = [EL.AUTH.REGISTER_USERNAME, EL.AUTH.REGISTER_EMAIL, EL.AUTH.REGISTER_PASSWORD, EL.AUTH.REGISTER_CONFIRM_PASSWORD];

    // Gets the singleton instance of AuthManager.
    static getInstance(): AuthManager {
        if (!AuthManager.instance)
            AuthManager.instance = new AuthManager();
        return AuthManager.instance;
    }

    // Initializes the AuthManager by setting up event listeners.
    static initialize(): void {
        const authManager = AuthManager.getInstance();
        authManager.setupEventListeners();
    }

    // ========================================
    // EVENT LISTENERS SETUP
    // ========================================

    // Sets up all event listeners for authentication-related UI elements.
    private setupEventListeners(): void {
        // Main menu authentication buttons (top-right)
        const registerBtn = requireElementById(EL.BUTTONS.REGISTER);
        const loginBtn = requireElementById(EL.BUTTONS.LOGIN);
        const logoutBtn = requireElementById(EL.BUTTONS.LOGOUT);
        const playBtn = requireElementById(EL.BUTTONS.PLAY);

        // Setup primary navigation handlers
        this.setupMainMenuHandlers(loginBtn, registerBtn, logoutBtn, playBtn);

        // Small windows for log in and register
        const showRegister = requireElementById(EL.BUTTONS.SHOW_REGISTER);
        const showLogin = requireElementById(EL.BUTTONS.SHOW_LOGIN);

        this.setupModalSwitchingHandlers(showRegister, showLogin);

        // Modal back buttons
        const loginBack = requireElementById(EL.BUTTONS.LOGIN_BACK);
        const registerBack = requireElementById(EL.BUTTONS.REGISTER_BACK);

        this.setupModalBackHandlers(loginBack, registerBack);

        // Form submission handlers
        const loginSubmit = requireElementById(EL.BUTTONS.LOGIN_SUBMIT);
        const registerSubmit = requireElementById(EL.BUTTONS.REGISTER_SUBMIT);

        this.setupFormSubmissionHandlers(loginSubmit, registerSubmit);
    }

    /**
     * Sets up event handlers for main menu authentication buttons.
     * @param loginBtn - Login button element.
     * @param registerBtn - Register button element.
     * @param logoutBtn - Logout button element.
     * @param playBtn - Play button element.
     */
    private setupMainMenuHandlers(
        loginBtn: HTMLElement | null,
        registerBtn: HTMLElement | null,
        logoutBtn: HTMLElement | null,
        playBtn: HTMLElement | null
    ): void {
        loginBtn?.addEventListener('click', () => {
            appStateManager.navigateTo(AppState.LOGIN);
            this.prepareGoogleLogin();
        });

        registerBtn?.addEventListener('click', () => {
            appStateManager.navigateTo(AppState.REGISTER);
            this.prepareGoogleLogin();
        });

        logoutBtn?.addEventListener('click', () => {
            this.logout();
        });

        playBtn?.addEventListener('click', () => {
            appStateManager.navigateTo(AppState.GAME_MODE);
        });
    }

    /**
     * Sets up event handlers for modal switching between login and register.
     * @param showRegister - Button to switch to register modal.
     * @param showLogin - Button to switch to login modal.
     */
    private setupModalSwitchingHandlers(
        showRegister: HTMLElement | null,
        showLogin: HTMLElement | null
    ): void {
        showRegister?.addEventListener('click', () => {
            appStateManager.navigateTo(AppState.REGISTER);
        });

        showLogin?.addEventListener('click', () => {
            appStateManager.navigateTo(AppState.LOGIN);
        });
    }

    /**
     * Sets up event handlers for modal back buttons.
     * @param loginBack - Back button in login modal.
     * @param registerBack - Back button in register modal.
     */
    private setupModalBackHandlers(
        loginBack: HTMLElement | null,
        registerBack: HTMLElement | null
    ): void {
        loginBack?.addEventListener('click', () => {
            appStateManager.navigateTo(AppState.MAIN_MENU);
        });

        registerBack?.addEventListener('click', () => {
            appStateManager.navigateTo(AppState.MAIN_MENU);
        });
    }

    /**
     * Sets up event handlers for form submissions and third-party login.
     * @param loginSubmit - Login form submit button.
     * @param registerSubmit - Register form submit button.
     */
    private setupFormSubmissionHandlers(
        loginSubmit: HTMLElement | null,
        registerSubmit: HTMLElement | null
    ): void {
        loginSubmit?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLoginSubmit();
        });

        registerSubmit?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleRegisterSubmit();
        });
    }

    // ========================================
    // AUTHENTICATION HANDLERS
    // ========================================

    // Handles the login form submission process. Validates input fields, processes authentication, and updates UI state.
    private handleLoginSubmit(): void {
        const username = requireElementById<HTMLInputElement>(EL.AUTH.LOGIN_USERNAME).value.trim();
        const password = requireElementById<HTMLInputElement>(EL.AUTH.LOGIN_PASSWORD).value;
        const t = getCurrentTranslation();
        const wsClient = WebSocketClient.getInstance(); // or use a shared instance if you already have one
        
        // Basic validation
        if (!username || !password) {
            alert(t.pleaseFilllAllFields);
            uiManager.clearForm(this.loginFields);
            return;
        }    

        const user: LoginUser = { username, password };
        // Register the callback function
        wsClient.registerCallback(WebSocketEvent.LOGIN_SUCCESS, (msg: string) => {
            this.authState = AuthState.LOGGED_IN;
            this.currentUser = {username};
            // Clear form and navigate back to main menu
            uiManager.clearForm(this.loginFields);
            appStateManager.navigateTo(AppState.MAIN_MENU);
            uiManager.showUserInfo(user.username);     
            Logger.info(msg, 'AuthManager');
        });

        wsClient.registerCallback(WebSocketEvent.LOGIN_FAILURE, (msg: string) => {
            this.authState = AuthState.LOGGED_FAILED;
            if (msg === "User doesn't exist") {
                alert(t.dontHaveAccount);
                uiManager.clearForm(this.loginFields); 
                setTimeout(() => {
                    appStateManager.navigateTo(AppState.REGISTER);
                }, 500);
            } else {
                alert(t.passwordsDoNotMatch);
                uiManager.clearForm(this.loginFields); 
            }
        });

        Logger.info('Login attempt', 'AuthManager', { username });
        try {
            wsClient.loginUser(user);
            Logger.info('Login attempt', 'AuthManager', { username });
        } catch (error) {
            Logger.error('Error sending login request', 'AuthManager', error);
            this.authState = AuthState.LOGGED_FAILED;
            alert('Loggin failed due to connection error.');  
        }

    }

    // Handles the registration form submission process.
    // Validates input fields, processes registration, and provides user feedback.
    private handleRegisterSubmit(): void {
        const username = requireElementById<HTMLInputElement>(EL.AUTH.REGISTER_USERNAME).value.trim();
        const email = requireElementById<HTMLInputElement>(EL.AUTH.REGISTER_EMAIL).value;
        const password = requireElementById<HTMLInputElement>(EL.AUTH.REGISTER_PASSWORD).value;
        const confirmPassword = requireElementById<HTMLInputElement>(EL.AUTH.REGISTER_CONFIRM_PASSWORD).value;
        const t = getCurrentTranslation();
        const wsClient = WebSocketClient.getInstance();

        // Check if fiels are all full
        if (!username || !email || !password || !confirmPassword) {
            alert(t.pleaseFilllAllFields);
            uiManager.clearForm(this.registrationFields);
            return;
        }

        // Validation for strong password
        // if password is not 8 length long, doesn't contain 1 letter (capital and small), 1 number and 1 character
        const strongPw = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/;

        if (!strongPw.test(password)) {
        alert(t.passwordFormat);
        uiManager.clearForm(this.registrationFields);
        return;
        } 

        if (password !== confirmPassword) {
            alert(t.passwordsDoNotMatch);
            uiManager.clearForm(this.registrationFields);
            return;
        }

        const user: RegisterUser = { username, email, password };

        // register the callback in case of success or failure
        wsClient.registerCallback(WebSocketEvent.REGISTRATION_FAILURE, (msg: string) => {
            this.authState = AuthState.LOGGED_FAILED;
            uiManager.clearForm(this.registrationFields);
            if (msg === "Username is already registered") {
                alert(msg || 'Registration failed. Username already register. Please choose another one');
            } else {
                alert(msg || 'Registration failed. User already exist. Please login');
                setTimeout(() => {
                    appStateManager.navigateTo(AppState.LOGIN);
                }, 500);
            }
        });

        wsClient.registerCallback(WebSocketEvent.ERROR, (msg: string) => {
            this.authState = AuthState.LOGGED_FAILED;
            uiManager.clearForm(this.registrationFields);
            alert(msg || 'Registration failed. An error occured. Please try again');
            setTimeout(() => {
                appStateManager.navigateTo(AppState.LOGIN);
            }, 500);
        });

        wsClient.registerCallback(WebSocketEvent.REGISTRATION_SUCCESS, (msg: string) => {
            this.authState = AuthState.LOGGED_IN;
            uiManager.clearForm(this.registrationFields);
            alert(msg || 'Registration successful! You can now login.');
            setTimeout(() => {
                appStateManager.navigateTo(AppState.LOGIN);
            }, 500);
        });

        // Apptempt to register new user
        try {
            wsClient.registerNewUser(user);
            Logger.info('Register attempt', 'AuthManager', { username, email });
            this.authState = AuthState.LOGGED_IN;
        } catch (error) {
            Logger.error('Error sending registration request', 'AuthManager', error);
            this.authState = AuthState.LOGGED_FAILED;
            uiManager.clearForm(this.registrationFields);
            alert('Registration failed due to connection error.');  
        }
        
    }

    public setupGoogleLoginButton(): void {
        this.prepareGoogleLogin();
    }

    // Prepares and initializes Google Sign-In for the application
    private prepareGoogleLogin(): void {
        const googleClientId = window.GOOGLE_CLIENT_ID;

        if (!googleClientId) {
            console.error("Google Client ID not found in global window.");
            return;
        }

        // Defines the asynchronous function to handle successful Google authentication responses
        const handleAuthSuccess = async (googleResponse: google.accounts.id.CredentialResponse) => {
            console.log("Google token received, sending to backend...");
            try {
                // Sends the Google credential token to the backend for verification
                const backendResponse = await fetch('/api/auth/google', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: googleResponse.credential })
                });

                if (!backendResponse.ok) {
                    const errorData = await backendResponse.json();
                    throw new Error(`Backend authentication failed: ${errorData.message || errorData.error || 'Unknown error'}`);
                }

                // Parses the response to get the session token from your application
                const { sessionToken } = await backendResponse.json();
                console.log("Backend responded with session token:", sessionToken);

                // TODO: Store the sessionToken
                
                // Decodes the session token and updates the current user and authentication state
                const decodedToken = JSON.parse(atob(sessionToken.split('.')[1]));
                this.currentUser = { username: decodedToken.user.username };
                this.authState = AuthState.LOGGED_IN;
                
                // Updates the UI to show user information and navigates to the main menu
                uiManager.showUserInfo(this.currentUser.username);
                // uiManager.hideOverlays('login-modal');
                appStateManager.navigateTo(AppState.MAIN_MENU);

            } catch (error) {
                console.error("Backend communication failed:", error);
                alert("Could not complete login.");
            }
        };

        // Initializes the Google service and then renders the sign-in button
        initializeGoogleSignIn(googleClientId, handleAuthSuccess)
            .then(() => {
                renderGoogleButton('google-login-btn-container');
                console.log("Attempted to render Google button in 'google-login-btn-container'.");

                renderGoogleButton('google-register-btn-container');
                console.log("Attempted to render Google button in 'google-register-btn-container'.");
            })
            .catch(error => {
                console.error("Failed to initialize or render Google button due to an error:", error);
            });
    }

    // ========================================
    // STATE GETTERS
    // ========================================

    // Gets the current authentication state.
    getAuthState(): AuthState {
        return this.authState;
    }

    // Gets the current user information.
    getCurrentUser(): {username: string; email?: string} | null {
        return this.currentUser;
    }

    // Checks if the user is currently authenticated.
    isUserAuthenticated(): boolean {
        return this.authState === AuthState.LOGGED_IN;
    }

    // Checks if the user is in guest mode.
    isGuest(): boolean {
        return this.authState === AuthState.GUEST;

    }

    // ========================================
    // STATE MANAGEMENT
    // ========================================

    // Logs out the current user and returns to guest state. Clears user data and updates UI accordingly.
    logout(): void {
        this.authState = AuthState.GUEST;
        this.currentUser = null;
        uiManager.showAuthButtons();
        appStateManager.navigateTo(AppState.MAIN_MENU);;
        Logger.info('Logged out - now in guest mode', 'AuthManager');
    }

    // Checks the current authentication state and updates UI accordingly. Should be called after page loads or state changes to ensure UI consistency.
    checkAuthState(): void {
        if (this.authState === AuthState.LOGGED_IN && this.currentUser)
            uiManager.showUserInfo(this.currentUser.username);
        else
            uiManager.showAuthButtons();
    }
}

export const authManager = AuthManager.getInstance();