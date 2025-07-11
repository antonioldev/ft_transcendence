import { AuthState } from '../shared/constants.js';
import { uiManager } from '../ui/UIManager.js';
import { getCurrentTranslation } from '../translations/translations.js';
import { historyManager } from './HistoryManager.js';

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
        // Main menu authentication buttons (top-right)
        const registerBtn = document.getElementById('register-btn');
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');

        // NEW: PLAY button - main game entry point
        const playBtn = document.getElementById('play-btn');

        // Top-right auth buttons - USE HISTORY MANAGER
        loginBtn?.addEventListener('click', () => {
            historyManager.goToLogin();
        });

        registerBtn?.addEventListener('click', () => {
            historyManager.goToRegister();
        });

        logoutBtn?.addEventListener('click', () => {
            this.logout();
        });

        // NEW: PLAY button logic - USE HISTORY MANAGER
        playBtn?.addEventListener('click', () => {
            historyManager.goToGameMode();
        });

        // Modal switching buttons
        const showRegister = document.getElementById('show-register');
        const showLogin = document.getElementById('show-login');

        showRegister?.addEventListener('click', () => {
            historyManager.goToRegister();
        });

        showLogin?.addEventListener('click', () => {
            historyManager.goToLogin();
        });

        // Modal back buttons - USE HISTORY MANAGER
        const loginBack = document.getElementById('login-back');
        const registerBack = document.getElementById('register-back');

        loginBack?.addEventListener('click', () => {
            historyManager.closeModal();
        });

        registerBack?.addEventListener('click', () => {
            historyManager.closeModal();
        });

        // Form submissions
        const loginSubmit = document.getElementById('login-submit');
        const registerSubmit = document.getElementById('register-submit');
        const googleLoginBtn = document.getElementById('google-login-btn');

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

    // NEW: Handle PLAY button click - main entry point
    private handlePlayButtonClick(): void {
        // Always go to game mode selection regardless of auth state
        // Game modes will be filtered based on auth state
        historyManager.goToGameMode();
    }

    private handleLoginSubmit(): void {
        const usernameOrEmail = (document.getElementById('login-username') as HTMLInputElement)?.value.trim();
        const password = (document.getElementById('login-password') as HTMLInputElement)?.value;
        const t = getCurrentTranslation();
        
        // Basic validation
        if (!usernameOrEmail || !password) {
            alert(t.pleaseFilllAllFields);
            return;
        }

        // TODO: Implement actual login logic with backend
        console.log('Login attempt:', { usernameOrEmail });
        
        // For now, simulate successful login
        this.currentUser = { username: usernameOrEmail };
        this.authState = AuthState.LOGGED_IN;
        
        // Update UI to show logged in state
        uiManager.showUserInfo(this.currentUser.username);
        
        // Clear form
        this.clearLoginForm();
        
        // UPDATED: Use history manager to go back to main menu
        historyManager.goToMainMenu();
        
        console.log('Login successful - user can now access online modes');
    }

    private handleRegisterSubmit(): void {
        const username = (document.getElementById('register-username') as HTMLInputElement)?.value.trim();
        const email = (document.getElementById('register-email') as HTMLInputElement)?.value;
        const password = (document.getElementById('register-password') as HTMLInputElement)?.value;
        const confirmPassword = (document.getElementById('register-confirm-password') as HTMLInputElement)?.value;
        const t = getCurrentTranslation();

        // Basic validation
        if (!username || !email || !password || !confirmPassword) {
            alert(t.pleaseFilllAllFields);
            return;
        }

        if (password !== confirmPassword) {
            alert(t.passwordsDoNotMatch);
            return;
        }

        // TODO: Implement actual registration logic with backend
        console.log('Register attempt:', { username, email });
        
        // NEW: No auto-login after registration
        this.clearRegisterForm();
        
        // Show success message (could be improved with a toast/notification)
        alert('Registration successful! You can now login.');
        
        // UPDATED: Use history manager to go to login
        setTimeout(() => {
            historyManager.goToLogin();
        }, 500);
    }

    private handleGoogleLogin(): void {
        // TODO: Implement Google OAuth
        console.log('Google login clicked - to be implemented');
        alert('Google login will be implemented later');
        
        // After successful Google login:
        // this.currentUser = { username: googleUser.name, email: googleUser.email };
        // this.authState = AuthState.LOGGED_IN;
        // uiManager.showUserInfo(this.currentUser.username);
        // uiManager.hideModal('login-modal');
    }

    private proceedToGameSelection(): void {
        // Import here to avoid circular dependency
        import('./GameModeManager.js').then(({ GameModeManager }) => {
            GameModeManager.showGameModeSelection();
        });
    }

    // NEW: Form clearing methods
    private clearLoginForm(): void {
        const usernameInput = document.getElementById('login-username') as HTMLInputElement;
        const passwordInput = document.getElementById('login-password') as HTMLInputElement;
        
        if (usernameInput) usernameInput.value = '';
        if (passwordInput) passwordInput.value = '';
    }

    private clearRegisterForm(): void {
        const usernameInput = document.getElementById('register-username') as HTMLInputElement;
        const emailInput = document.getElementById('register-email') as HTMLInputElement;
        const passwordInput = document.getElementById('register-password') as HTMLInputElement;
        const confirmPasswordInput = document.getElementById('register-confirm-password') as HTMLInputElement;
        
        if (usernameInput) usernameInput.value = '';
        if (emailInput) emailInput.value = '';
        if (passwordInput) passwordInput.value = '';
        if (confirmPasswordInput) confirmPasswordInput.value = '';
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
        return this.authState === AuthState.LOGGED_OUT; // Simplified - logged out = offline mode
    }

    logout(): void {
        this.authState = AuthState.LOGGED_OUT;
        this.currentUser = null;
        uiManager.hideUserInfo(); // This will show auth buttons again
        historyManager.goToMainMenu(); // Use history manager
        console.log('Logged out - user now in offline mode');
    }

    checkAuthState(): void {
        if (this.authState === AuthState.LOGGED_IN && this.currentUser) {
            uiManager.showUserInfo(this.currentUser.username);
        } else {
            uiManager.showAuthButtons();
        }
    }
}

// Export singleton instance for easy access
export const authManager = AuthManager.getInstance();