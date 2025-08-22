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

        // Also handle form submit events for Enter key
        const loginForm = loginSubmit?.closest('form');
        const registerForm = registerSubmit?.closest('form');

        loginForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLoginSubmit();
        });

        registerForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegisterSubmit();
        });

        // Add real-time validation
        this.setupRealTimeValidation();
    }

    /**
     * Sets up real-time validation for form fields
     */
    private setupRealTimeValidation(): void {
        // Login form validation
        const loginUsername = document.getElementById('login-username');
        const loginPassword = document.getElementById('login-password');

        loginUsername?.addEventListener('blur', () => {
            const value = (loginUsername as HTMLInputElement).value.trim();
            const t = getCurrentTranslation();
            if (!value) {
                this.showFieldError('login-username', t.errorEnterEmailOrUsername);
            } else {
                this.clearValidationErrors(['login-username']);
            }
        });

        loginPassword?.addEventListener('blur', () => {
            const value = (loginPassword as HTMLInputElement).value;
            const t = getCurrentTranslation();
            if (!value) {
                this.showFieldError('login-password', t.errorEnterPassword);
            } else {
                this.clearValidationErrors(['login-password']);
            }
        });

        // Register form validation
        const registerUsername = document.getElementById('register-username');
        const registerEmail = document.getElementById('register-email');
        const registerPassword = document.getElementById('register-password');
        const registerConfirmPassword = document.getElementById('register-confirm-password');

        registerUsername?.addEventListener('blur', () => {
            const value = (registerUsername as HTMLInputElement).value.trim();
            const t = getCurrentTranslation();
            if (!value) {
                this.showFieldError('register-username', t.errorEnterUsername);
            } else {
                this.clearValidationErrors(['register-username']);
            }
        });

        registerEmail?.addEventListener('blur', () => {
            const value = (registerEmail as HTMLInputElement).value.trim();
            const t = getCurrentTranslation();
            if (!value) {
                this.showFieldError('register-email', t.errorEnterEmail);
            } else if (!this.isValidEmail(value)) {
                this.showFieldError('register-email', t.errorEnterValidEmail);
            } else {
                this.clearValidationErrors(['register-email']);
            }
        });

        registerPassword?.addEventListener('blur', () => {
            const value = (registerPassword as HTMLInputElement).value;
            const t = getCurrentTranslation();
            if (!value) {
                this.showFieldError('register-password', t.errorEnterPassword);
            } else if (value.length < 6) {
                this.showFieldError('register-password', t.errorPasswordMinLength);
            } else {
                this.clearValidationErrors(['register-password']);
            }
        });

        registerConfirmPassword?.addEventListener('blur', () => {
            const confirmValue = (registerConfirmPassword as HTMLInputElement).value;
            const passwordValue = (registerPassword as HTMLInputElement)?.value;
            const t = getCurrentTranslation();
            if (!confirmValue) {
                this.showFieldError('register-confirm-password', t.errorConfirmPassword);
            } else if (confirmValue !== passwordValue) {
                this.showFieldError('register-confirm-password', t.errorPasswordsDoNotMatch);
            } else {
                this.clearValidationErrors(['register-confirm-password']);
            }
        });
    }

    // ========================================
    // AUTHENTICATION HANDLERS
    // ========================================

    // Handles the login form submission process. Validates input fields, processes authentication, and updates UI state.
    private handleLoginSubmit(): void {
        const usernameInput = requireElementById<HTMLInputElement>(EL.AUTH.LOGIN_USERNAME);
        const passwordInput = requireElementById<HTMLInputElement>(EL.AUTH.LOGIN_PASSWORD);
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const t = getCurrentTranslation();
        const wsClient = WebSocketClient.getInstance();
        
        // Clear previous errors
        this.clearValidationErrors(['login-username', 'login-password']);
        
        let hasErrors = false;

        // Validate username/email
        if (!username) {
            this.showFieldError('login-username', t.errorEnterEmailOrUsername);
            hasErrors = true;
        }

        // Validate password
        if (!password) {
            this.showFieldError('login-password', t.errorEnterPassword);
            hasErrors = true;
        }

        if (hasErrors) {
            return;
        }

        const user: LoginUser = { username, password };
        // Register the callback function
        wsClient.registerCallback(WebSocketEvent.LOGIN_SUCCESS, (msg: string) => {
            this.authState = AuthState.LOGGED_IN;
            this.currentUser = {username};
            // Clear form and navigate to game mode selection
            uiManager.clearForm(this.loginFields);
            appStateManager.navigateTo(AppState.GAME_MODE);
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
        const usernameInput = requireElementById<HTMLInputElement>(EL.AUTH.REGISTER_USERNAME);
        const emailInput = requireElementById<HTMLInputElement>(EL.AUTH.REGISTER_EMAIL);
        const passwordInput = requireElementById<HTMLInputElement>(EL.AUTH.REGISTER_PASSWORD);
        const confirmPasswordInput = requireElementById<HTMLInputElement>(EL.AUTH.REGISTER_CONFIRM_PASSWORD);
        
        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const t = getCurrentTranslation();
        const wsClient = WebSocketClient.getInstance();

        // Clear previous errors
        this.clearValidationErrors(['register-username', 'register-email', 'register-password', 'register-confirm-password']);
        
        let hasErrors = false;

        // Validate username
        if (!username) {
            this.showFieldError('register-username', t.errorEnterUsername);
            hasErrors = true;
        }

        // Validate email
        if (!email) {
            this.showFieldError('register-email', t.errorEnterEmail);
            hasErrors = true;
        } else if (!this.isValidEmail(email)) {
            this.showFieldError('register-email', t.errorEnterValidEmail);
            hasErrors = true;
        }

        // Validate password
        if (!password) {
            this.showFieldError('register-password', t.errorEnterPassword);
            hasErrors = true;
        } else if (password.length < 6) {
            this.showFieldError('register-password', t.errorPasswordMinLength);
            hasErrors = true;
        }

        // Validate confirm password
        if (!confirmPassword) {
            this.showFieldError('register-confirm-password', t.errorConfirmPassword);
            hasErrors = true;
        } else if (password !== confirmPassword) {
            this.showFieldError('register-confirm-password', t.errorPasswordsDoNotMatch);
            hasErrors = true;
        }

        if (hasErrors) {
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
                const backendResponse = await fetch('http://localhost:3000/api/auth/google', {
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
                
                // Updates the UI to show user information and navigates to game mode selection
                uiManager.showUserInfo(this.currentUser.username);
                // uiManager.hideOverlays('login-modal');
                appStateManager.navigateTo(AppState.GAME_MODE);

            } catch (error) {
                console.error("Backend communication failed:", error);
                alert("Could not complete login.");
            }
        };

        // Initializes the Google service and then renders the sign-in button
        initializeGoogleSignIn(googleClientId, handleAuthSuccess)
            .then(() => {
                renderGoogleButton('google-login-btn-container');
                renderGoogleButton('google-register-btn-container');
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
    // FORM VALIDATION HELPERS
    // ========================================

    private showFieldError(fieldId: string, message: string): void {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId}-error`);
        
        if (field) {
            field.classList.add('field-error');
        }
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    private clearValidationErrors(fieldIds: string[]): void {
        fieldIds.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            const errorElement = document.getElementById(`${fieldId}-error`);
            
            if (field) {
                field.classList.remove('field-error');
            }
            
            if (errorElement) {
                errorElement.classList.remove('show');
            }
        });
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
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