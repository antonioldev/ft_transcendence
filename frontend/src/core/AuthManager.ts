import { AuthState } from '../shared/constants.js';
import { uiManager } from '../ui/UIManager.js';
import { getCurrentTranslation } from '../translations/translations.js';
import { historyManager } from './HistoryManager.js';
import { clearInput } from './utils.js';
import { WebSocketClient } from './webSocketClient.js';

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
        const registerBtn = document.getElementById('register-btn');
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const playBtn = document.getElementById('play-btn');

        // Setup primary navigation handlers
        this.setupMainMenuHandlers(loginBtn, registerBtn, logoutBtn, playBtn);

        // Small windows for log in and register
        const showRegister = document.getElementById('show-register');
        const showLogin = document.getElementById('show-login');

        this.setupModalSwitchingHandlers(showRegister, showLogin);

        // Modal back buttons
        const loginBack = document.getElementById('login-back');
        const registerBack = document.getElementById('register-back');

        this.setupModalBackHandlers(loginBack, registerBack);

        // Form submission handlers
        const loginSubmit = document.getElementById('login-submit');
        const registerSubmit = document.getElementById('register-submit');
        const googleLoginBtn = document.getElementById('google-login-btn');

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
            historyManager.goToLogin();
        });

        registerBtn?.addEventListener('click', () => {
            historyManager.goToRegister();
        });

        logoutBtn?.addEventListener('click', () => {
            this.logout();
        });

        playBtn?.addEventListener('click', () => {
            historyManager.goToGameMode();
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
            historyManager.goToRegister();
        });

        showLogin?.addEventListener('click', () => {
            historyManager.goToLogin();
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
            historyManager.closeModal();
        });

        registerBack?.addEventListener('click', () => {
            historyManager.closeModal();
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
        const username = (document.getElementById('login-username') as HTMLInputElement)?.value.trim();
        const password = (document.getElementById('login-password') as HTMLInputElement)?.value;
        const t = getCurrentTranslation();
        
        // Basic validation
        if (!username || !password) {
            alert(t.pleaseFilllAllFields);
            this.clearLoginForm();
            return;
        }

        // TODO: Implement actual login logic with backend
        console.log('Login attempt:', { username });
        // For now we say yes you are in the database, simulate successful login
        this.currentUser = { username: username; password: password };
        try {
            WebSocketClient.loginUser(this.currentUser);
            console.log('Login attempt: ', { username});
            this.authState = AuthState.LOGGED_IN;
        } catch (error) {
            console.error('Error sending login request:', error);
            this.authState = AuthState.LOGGED_FAILED;
        }
        
        // Update UI to show logged in state
        uiManager.showUserInfo(this.currentUser.username);
        
        // Clear form and navigate back to main menu
        this.clearLoginForm();
        historyManager.goToMainMenu();
        
        console.log('Login successful - user can now access online modes');
    }

    // Handles the registration form submission process.
    // Validates input fields, processes registration, and provides user feedback.
    private handleRegisterSubmit(): void {
        const username = (document.getElementById('register-username') as HTMLInputElement)?.value.trim();
        const email = (document.getElementById('register-email') as HTMLInputElement)?.value;
        const password = (document.getElementById('register-password') as HTMLInputElement)?.value;
        const confirmPassword = (document.getElementById('register-confirm-password') as HTMLInputElement)?.value;
        const t = getCurrentTranslation();

        // Check if fiels are all full
        if (!username || !email || !password || !confirmPassword) {
            alert(t.pleaseFilllAllFields);
            this.clearRegisterForm();
            return;
        }

        if (password !== confirmPassword) {
            alert(t.passwordsDoNotMatch);
            this.clearRegisterForm();
            return;
        }

        // TODO: Implement actual registration logic with backend
        console.log('Register attempt:', { username, email });
        
        // Clear form and provide success feedback
        this.clearRegisterForm();
        alert('Registration successful! You can now login.');
        
        // Navigate to login after successful registration
        setTimeout(() => {
            historyManager.goToLogin();
        }, 500);
    }

    // Handles Google OAuth login process.
    private handleGoogleLogin(): void {
        // TODO: Implement Google OAuth
        console.log('Google login clicked - to be implemented');
        alert('Google login will be implemented later');
        this.clearLoginForm();
        // After successful Google login:
        // this.currentUser = { username: googleUser.name, email: googleUser.email };
        // this.authState = AuthState.LOGGED_IN;
        // uiManager.showUserInfo(this.currentUser.username);
        // uiManager.hideOverlays('login-modal');
    }

    // ========================================
    // FORM MANAGEMENT
    // ========================================

    // Clears all fields in the login form.
    private clearLoginForm(): void {
        clearInput('login-username');
        clearInput('login-password');
    }

    // Clears all fields in the registration form.
    private clearRegisterForm(): void {
        clearInput('register-username');
        clearInput('register-email');
        clearInput('register-password');
        clearInput('register-confirm-password');
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
        uiManager.hideUserInfo();
        historyManager.goToMainMenu();
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