import { AuthState, AppState, WebSocketEvent } from '../shared/constants.js';
import { uiManager } from '../ui/UIManager.js';
import { getCurrentTranslation } from '../translations/translations.js';
import { historyManager } from './HistoryManager.js';
import { clearForm } from './utils.js';
import { WebSocketClient } from './WebSocketClient.js';
import { RegisterUser, LoginUser } from '../shared/types.js';
import { EL, getElementById, requireElementById} from '../ui/elements.js';

/**
 * Manages user authentication state, login/logout workflows, and user registration.
 * Handles the transition between guest and authenticated user states, including
 * form validation, UI updates, and navigation control.
 */
export class AuthManager {
    private static instance: AuthManager;
    private authState: AuthState = AuthState.GUEST;
    private currentUser: {username: string; password: string; email?: string} | null = null;

    // Gets the singleton instance of AuthManager.
    static getInstance(): AuthManager {
        if (!AuthManager.instance) {
            AuthManager.instance = new AuthManager();
        }
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
        const googleLoginBtn = requireElementById(EL.BUTTONS.GOOGLE_LOGIN);

        this.setupFormSubmissionHandlers(loginSubmit, registerSubmit, googleLoginBtn);
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
            historyManager.navigateTo(AppState.LOGIN);
        });

        registerBtn?.addEventListener('click', () => {
            historyManager.navigateTo(AppState.REGISTER);
        });

        logoutBtn?.addEventListener('click', () => {
            this.logout();
        });

        playBtn?.addEventListener('click', () => {
            historyManager.navigateTo(AppState.GAME_MODE);
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
            historyManager.navigateTo(AppState.REGISTER);
        });

        showLogin?.addEventListener('click', () => {
            historyManager.navigateTo(AppState.LOGIN);
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
            historyManager.navigateTo(AppState.MAIN_MENU);
        });

        registerBack?.addEventListener('click', () => {
            historyManager.navigateTo(AppState.MAIN_MENU);
        });
    }

    /**
     * Sets up event handlers for form submissions and third-party login.
     * @param loginSubmit - Login form submit button.
     * @param registerSubmit - Register form submit button.
     * @param googleLoginBtn - Google login button.
     */
    private setupFormSubmissionHandlers(
        loginSubmit: HTMLElement | null,
        registerSubmit: HTMLElement | null,
        googleLoginBtn: HTMLElement | null
    ): void {
        loginSubmit?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLoginSubmit();
        });

        registerSubmit?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleRegisterSubmit();
        });

        googleLoginBtn?.addEventListener('click', () => {
            this.handleGoogleLogin();
        });
    }

    // ========================================
    // AUTHENTICATION HANDLERS
    // ========================================

    // Handles the login form submission process. Validates input fields, processes authentication, and updates UI state.
    private handleLoginSubmit(): void {
        const username = getElementById<HTMLInputElement>(EL.AUTH.LOGIN_USERNAME)?.value.trim();
        const password = getElementById<HTMLInputElement>(EL.AUTH.LOGIN_PASSWORD)?.value;
        const t = getCurrentTranslation();
        const wsClient = WebSocketClient.getInstance(); // or use a shared instance if you already have one
        
        // Basic validation
        if (!username || !password) {
            alert(t.pleaseFilllAllFields);
            clearForm([EL.AUTH.LOGIN_USERNAME, EL.AUTH.LOGIN_PASSWORD]);
            return;
        }

        const user: LoginUser = { username, password };
        // Register the callback function
        wsClient.registerCallback(WebSocketEvent.LOGIN_SUCCESS, (msg: string) => {
            this.authState = AuthState.LOGGED_IN;
            uiManager.showUserInfo(user.username);
            // Clear form and navigate back to main menu
            clearForm([EL.AUTH.LOGIN_USERNAME, EL.AUTH.LOGIN_PASSWORD]);
            historyManager.navigateTo(AppState.MAIN_MENU);;     
            console.log(msg);
        });

        wsClient.registerCallback(WebSocketEvent.LOGIN_FAILURE, (msg: string) => {
            this.authState = AuthState.LOGGED_FAILED;
            if (msg === "User doesn't exist") {
                alert(t.dontHaveAccount);
                clearForm([EL.AUTH.LOGIN_USERNAME, EL.AUTH.LOGIN_PASSWORD]); 
                setTimeout(() => {
                    historyManager.navigateTo(AppState.REGISTER);
                }, 500);
            } else {
                alert(t.passwordsDoNotMatch);
                clearForm([EL.AUTH.LOGIN_USERNAME, EL.AUTH.LOGIN_PASSWORD]); 
            }
        });

        console.log('Login attempt:', { username });
        try {
            wsClient.loginUser(user);
            console.log('Login attempt: ', { username});
            this.authState = AuthState.LOGGED_IN;
            uiManager.showUserInfo(user.username);
        } catch (error) {
            console.error('Error sending login request:', error);
            this.authState = AuthState.LOGGED_FAILED;
            alert('Loggin failed due to connection error.');  
        }

    }

    // Handles the registration form submission process.
    // Validates input fields, processes registration, and provides user feedback.
    private handleRegisterSubmit(): void {
        const username = getElementById<HTMLInputElement>(EL.AUTH.REGISTER_USERNAME)?.value.trim();
        const email = getElementById<HTMLInputElement>(EL.AUTH.REGISTER_EMAIL)?.value;
        const password = getElementById<HTMLInputElement>(EL.AUTH.REGISTER_PASSWORD)?.value;
        const confirmPassword = getElementById<HTMLInputElement>(EL.AUTH.REGISTER_CONFIRM_PASSWORD)?.value;
        const t = getCurrentTranslation();
        const wsClient = WebSocketClient.getInstance();

        // Check if fiels are all full
        if (!username || !email || !password || !confirmPassword) {
            alert(t.pleaseFilllAllFields);
            clearForm([ EL.AUTH.REGISTER_USERNAME, EL.AUTH.REGISTER_EMAIL,
                EL.AUTH.REGISTER_PASSWORD, EL.AUTH.REGISTER_CONFIRM_PASSWORD]);
            return;
        }

        if (password !== confirmPassword) {
            alert(t.passwordsDoNotMatch);
            clearForm([ EL.AUTH.REGISTER_USERNAME, EL.AUTH.REGISTER_EMAIL,
                EL.AUTH.REGISTER_PASSWORD, EL.AUTH.REGISTER_CONFIRM_PASSWORD]);
            return;
        }

        const user: RegisterUser = { username, email, password };

        // register the callback in case of success or failure
        wsClient.registerCallback(WebSocketEvent.REGISTRATION_FAILURE, (msg: string) => {
            this.authState = AuthState.LOGGED_FAILED;
            clearForm([ EL.AUTH.REGISTER_USERNAME, EL.AUTH.REGISTER_EMAIL,
            EL.AUTH.REGISTER_PASSWORD, EL.AUTH.REGISTER_CONFIRM_PASSWORD]);
            if (msg === "Username is already registered") {
                alert(msg || 'Registration failed. Username already register. Please choose another one');
            } else {
                alert(msg || 'Registration failed. User already exist. Please login');
                setTimeout(() => {
                    historyManager.navigateTo(AppState.LOGIN);
                }, 500);
            }
        });

        wsClient.registerCallback(WebSocketEvent.ERROR, (msg: string) => {
            this.authState = AuthState.LOGGED_FAILED;
            clearForm([ EL.AUTH.REGISTER_USERNAME, EL.AUTH.REGISTER_EMAIL,
            EL.AUTH.REGISTER_PASSWORD, EL.AUTH.REGISTER_CONFIRM_PASSWORD]);
            alert(msg || 'Registration failed. An error occured. Please try again');
            setTimeout(() => {
                historyManager.navigateTo(AppState.LOGIN);
            }, 500);
        });

        wsClient.registerCallback(WebSocketEvent.REGISTRATION_SUCCESS, (msg: string) => {
            this.authState = AuthState.LOGGED_IN;
            clearForm([ EL.AUTH.REGISTER_USERNAME, EL.AUTH.REGISTER_EMAIL,
            EL.AUTH.REGISTER_PASSWORD, EL.AUTH.REGISTER_CONFIRM_PASSWORD]);
            alert(msg || 'Registration successful! You can now login.');
            setTimeout(() => {
                historyManager.navigateTo(AppState.LOGIN);
            }, 500);
        });

        // Apptempt to register new user
        try {
            wsClient.registerNewUser(user);
            console.log('Register attempt: ', { username, email});
            this.authState = AuthState.LOGGED_IN;
        } catch (error) {
            console.error('Error sending registration request:', error);
            this.authState = AuthState.LOGGED_FAILED;
            clearForm([ EL.AUTH.REGISTER_USERNAME, EL.AUTH.REGISTER_EMAIL,
            EL.AUTH.REGISTER_PASSWORD, EL.AUTH.REGISTER_CONFIRM_PASSWORD]);
            alert('Registration failed due to connection error.');  
        }
        
    }

    // Handles Google OAuth login process.
    private handleGoogleLogin(): void {
        // TODO: Implement Google OAuth
        console.log('Google login clicked - to be implemented');
        alert('Google login will be implemented later');
        clearForm([EL.AUTH.LOGIN_USERNAME, EL.AUTH.LOGIN_PASSWORD]);
        // After successful Google login:
        // this.currentUser = { username: googleUser.name, email: googleUser.email };
        // this.authState = AuthState.LOGGED_IN;
        // uiManager.showUserInfo(this.currentUser.username);
        // uiManager.hideOverlays('login-modal');
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
        historyManager.navigateTo(AppState.MAIN_MENU);;
        console.log('Logged out - now in guest mode');
    }

    // Checks the current authentication state and updates UI accordingly. Should be called after page loads or state changes to ensure UI consistency.
    checkAuthState(): void {
        if (this.authState === AuthState.LOGGED_IN && this.currentUser) {
            uiManager.showUserInfo(this.currentUser.username);
        } else {
            uiManager.showAuthButtons();
        }
    }
}

export const authManager = AuthManager.getInstance();