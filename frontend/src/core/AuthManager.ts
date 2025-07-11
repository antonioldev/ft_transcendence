import { AuthState } from '../shared/constants.js';
import { uiManager } from '../ui/UIManager.js';

export class AuthManager {
    private static instance: AuthManager;
    private authState: AuthState = AuthState.LOGGED_OUT;
    private currentUser: {username: string; email?: string} | null = null;

    static getInstance(): AuthManager {
        if (!AuthManager.instance) {
            AuthManager.instance = new AuthManager();
        }
        return AuthManager.instance;
    }

    static initialize(): void {
        const authManager = AuthManager.getInstance();
        authManager.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Main menu authentication buttons
        const registerBtn = document.getElementById('register-btn');
        const loginBtn = document.getElementById('login-btn');
        const googleLoginBtn = document.getElementById('google-login-btn');
        const offlineBtn = document.getElementById('offline-btn');

        registerBtn?.addEventListener('click', () => {
            uiManager.showScreen('register-screen');
        });

        loginBtn?.addEventListener('click', () => {
            uiManager.showScreen('login-screen');
        });

        googleLoginBtn?.addEventListener('click', () => {
            this.handleGoogleLogin();
        });

        offlineBtn?.addEventListener('click', () => {
            this.handleOfflineMode();
        });

        // Register form listeners
        const registerSubmit = document.getElementById('register-submit');
        const registerBack = document.getElementById('register-back');

        registerSubmit?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleRegisterSubmit();
        });
        
        registerBack?.addEventListener('click', () => {
            uiManager.showScreen('main-menu');
        });

        // Login form listeners
        const loginSubmit = document.getElementById('login-submit');
        const loginBack = document.getElementById('login-back');

        loginSubmit?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLoginSubmit();
        });
        
        loginBack?.addEventListener('click', () => {
            uiManager.showScreen('main-menu');
        });
    }

    private handleRegisterSubmit(): void {
        const username = (document.getElementById('register-username') as HTMLInputElement)?.value.trim();
        const email = (document.getElementById('register-email') as HTMLInputElement)?.value.trim();
        const password = (document.getElementById('register-password') as HTMLInputElement)?.value;
        const confirmPassword = (document.getElementById('register-confirm-password') as HTMLInputElement)?.value;

        // Basic validation
        if (!username || !email || !password || !confirmPassword) {
            alert('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        // TODO: Implement actual registration logic with backend
        console.log('Register attempt:', { username, email });
        
        // For now, simulate successful registration
        this.currentUser = { username, email };
        this.authState = AuthState.LOGGED_IN;
        this.proceedToGameSelection();
    }

    private handleLoginSubmit(): void {
        const usernameOrEmail = (document.getElementById('login-username') as HTMLInputElement)?.value.trim();
        const password = (document.getElementById('login-password') as HTMLInputElement)?.value;

        // Basic validation
        if (!usernameOrEmail || !password) {
            alert('Please fill in all fields');
            return;
        }

        // TODO: Implement actual login logic with backend
        console.log('Login attempt:', { usernameOrEmail });
        
        // For now, simulate successful login
        this.currentUser = { username: usernameOrEmail };
        this.authState = AuthState.LOGGED_IN;
        this.proceedToGameSelection();
    }

    private handleGoogleLogin(): void {
        // TODO: Implement Google OAuth
        console.log('Google login clicked - to be implemented by KELLY');
        alert('Google login will be implemented by KELLY');
    }

    private handleOfflineMode(): void {
        this.authState = AuthState.OFFLINE;
        this.currentUser = null;
        console.log('Entering offline mode');
        this.proceedToGameSelection();
    }

    private proceedToGameSelection(): void {
        // Import here to avoid circular dependency
        import('./GameModeManager.js').then(({ GameModeManager }) => {
            GameModeManager.showGameModeSelection();
        });
    }

    // Public getters
    getAuthState(): AuthState {
        return this.authState;
    }

    getCurrentUser(): {username: string; email?: string} | null {
        return this.currentUser;
    }

    isUserAuthenticated(): boolean {
        return this.authState === AuthState.LOGGED_IN;
    }

    isInOfflineMode(): boolean {
        return this.authState === AuthState.OFFLINE;
    }

    logout(): void {
        this.authState = AuthState.LOGGED_OUT;
        this.currentUser = null;
        uiManager.showScreen('main-menu');
    }
}

// Export singleton instance for easy access
export const authManager = AuthManager.getInstance();