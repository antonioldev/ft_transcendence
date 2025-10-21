import { Logger } from '../utils/LogManager.js';
import { AppState} from '../shared/constants.js';
import { uiManager } from '../ui/UIManager.js';
import { getCurrentTranslation } from '../translations/translations.js';
import { EL, requireElementById} from '../ui/elements.js';
import { initializeGoogleSignIn, renderGoogleButton } from './GoogleSignIn.js';
import { appManager } from './AppManager.js';
import { sendPOST } from './HTTPRequests.js';
import { AuthCode } from '../shared/constants.js';
import { Translation } from '../translations/Translation.js';

// Declare the type for Google Response to avoid TypeScript errors
type GoogleCredentialResponse = {
    credential: string;
    select_by?: string;
};

/**
 * Manages user authentication state, login/logout workflows, and user registration.
 * Handles the transition between guest and authenticated user states, including
 * form validation, UI updates, and navigation control.
 */
export class AuthManager {
	// private static instance: AuthManager;
	private currentUser: {username: string} | null = null;
	private readonly loginFields = [EL.AUTH.LOGIN_USERNAME, EL.AUTH.LOGIN_PASSWORD];
	private readonly registrationFields = [EL.AUTH.REGISTER_USERNAME, EL.AUTH.REGISTER_EMAIL, EL.AUTH.REGISTER_PASSWORD, EL.AUTH.REGISTER_CONFIRM_PASSWORD];

	// Gets the singleton instance of AuthManager.
	// static getInstance(): AuthManager {
	// 	if (!AuthManager.instance)
	// 		AuthManager.instance = new AuthManager();
	// 	return AuthManager.instance;
	// }

	// Initializes the AuthManager by setting up event listeners.
	initialize(): void {
		// const authManager = AuthManager.getInstance();
		authManager.setupEventListeners();
		// authManager.restoreSessionOnBoot();
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
			appManager.navigateTo(AppState.LOGIN);
			this.prepareGoogleLogin();
		});

		registerBtn?.addEventListener('click', () => {
			appManager.navigateTo(AppState.REGISTER);
			this.prepareGoogleLogin();
		});

		logoutBtn?.addEventListener('click', () => {
			this.logout();
		});

		playBtn?.addEventListener('click', () => {
			appManager.navigateTo(AppState.GAME_MODE);
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
			appManager.navigateTo(AppState.REGISTER);
			this.prepareGoogleLogin();
		});

		showLogin?.addEventListener('click', () => {
			appManager.navigateTo(AppState.LOGIN);
			this.prepareGoogleLogin();
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
			appManager.navigateTo(AppState.MAIN_MENU);
		});

		registerBack?.addEventListener('click', () => {
			appManager.navigateTo(AppState.MAIN_MENU);
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
        // const loginSubmit = document.getElementById(EL.BUTTONS.LOGIN_SUBMIT);
        // const registerSubmit = document.getElementById(EL.BUTTONS.REGISTER_SUBMIT);

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

        // // Also handle form submit events for Enter key
        // const loginForm = loginSubmit?.closest('form');
        // const registerForm = registerSubmit?.closest('form');

        // loginForm?.addEventListener('submit', (e) => {
        //     e.preventDefault();
        //     this.handleLoginSubmit();
        // });

        // registerForm?.addEventListener('submit', (e) => {
        //     e.preventDefault();
        //     this.handleRegisterSubmit();
        // });
    }

	// ========================================
	// AUTHENTICATION HANDLERS
	// ========================================

    private async restoreSessionOnBoot(): Promise<void> {
        try {
            // 1) Try classic cookie session
            const res = await fetch('/api/auth/session/me', {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store',
            });

            if (res.ok) {
                const data = await res.json(); // expected: { ok: true, user: {...} }
                if (data?.ok && data.user?.username) {
                    this.currentUser = { username: data.user.username };
                    uiManager.showUserInfo(this.currentUser.username);
                    appManager.navigateTo(AppState.MAIN_MENU);
                    return;
                }
            }

            // 2) Fallback: try Google restore if you kept the Google token
            const googleIdToken = localStorage.getItem('google_id_token'); // set this on Google login success
            if (googleIdToken) {
                console.log('Found Google token, attempting restore');
                // Hit your Google restore endpoint that verifies the Google token
                // and SETS the same 'sid' cookie as classic login
                const data = await sendPOST("google", JSON.stringify({ token: googleIdToken }));
                console.log(data.message);
                if (!data.success) {
                    localStorage.removeItem('google_id_token');
                }
            } 
            else {
                console.log('No Google token found in local storage');
            }

            console.log('No valid session found, remaining in guest mode');
            this.currentUser = null;
        } catch (e) {
            console.log('Session restore failed (expected on first visit)');
            this.currentUser = null;
        }
    }

    // Handles the login form submission process. Validates input fields, processes authentication, and updates UI state.
    private async handleLoginSubmit(): Promise<void> {
        const usernameInput = requireElementById<HTMLInputElement>(EL.AUTH.LOGIN_USERNAME);
        const passwordInput = requireElementById<HTMLInputElement>(EL.AUTH.LOGIN_PASSWORD);
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const translation = getCurrentTranslation();
        
        // Basic validation
        if (!username || !password) {
            alert(translation.pleaseFilllAllFields);
            uiManager.clearForm(this.loginFields);
            return;
        }    

        const responseData = await sendPOST("login", { username, password });
        this.handleLoginResponse(responseData.result, responseData.message, username, translation);

	}

    // Handles the registration form submission process.
    // Validates input fields, processes registration, and provides user feedback.
    private async handleRegisterSubmit() {
        const username = requireElementById<HTMLInputElement>(EL.AUTH.REGISTER_USERNAME).value.trim();
        const email = requireElementById<HTMLInputElement>(EL.AUTH.REGISTER_EMAIL).value;
        const password = requireElementById<HTMLInputElement>(EL.AUTH.REGISTER_PASSWORD).value;
        const confirmPassword = requireElementById<HTMLInputElement>(EL.AUTH.REGISTER_CONFIRM_PASSWORD).value;
        const translation = getCurrentTranslation();

        // Clear previous errors
        this.clearValidationErrors(['register-username', 'register-email', 'register-password', 'register-confirm-password']);
        
        if (!username) {
            this.showFieldError('register-username', translation.errorEnterUsername);
            return;
        }

        // Validate email
        if (!email) {
            this.showFieldError('register-email', translation.errorEnterEmail);
            return;
        } 
        else if (!this.isValidEmail(email)) {
            this.showFieldError('register-email', translation.errorEnterValidEmail);
            return;
        }

        // Validate password
        if (!password) {
            this.showFieldError('register-password', translation.errorEnterPassword);
            return;
        } 
        else if (password.length < 6) {
            this.showFieldError('register-password', translation.errorPasswordMinLength);
            return;
        }

        if (password !== confirmPassword) {
            alert(translation.passwordsDoNotMatch);
            uiManager.clearForm(this.registrationFields);
            return;
        }

        Logger.info('Register attempt', 'AuthManager', { username, email });
        const responseData = await sendPOST("register", { username, email, password });
        this.handleRegistrationResponse(responseData.result, responseData.message);

		// // register the callback in case of success or failure
		// webSocketClient.registerCallback(WebSocketEvent.REGISTRATION_FAILURE, (msg: string) => {
		// 	this.authState = AuthState.LOGGED_FAILED;
		// 	uiManager.clearForm(this.registrationFields);
		// 	if (msg === "Username is already registered") {
		// 		alert(msg || 'Registration failed. Username already register. Please choose another one');
		// 	} else {
		// 		alert(msg || 'Registration failed. User already exist. Please login');
		// 		setTimeout(() => {
		// 			appManager.navigateTo(AppState.LOGIN);
		// 		}, 500);
		// 	}
		// });

		// webSocketClient.registerCallback(WebSocketEvent.ERROR, (msg: string) => {
		// 	this.authState = AuthState.LOGGED_FAILED;
		// 	uiManager.clearForm(this.registrationFields);
		// 	alert(msg || 'Registration failed. An error occured. Please try again');
		// 	setTimeout(() => {
		// 		appManager.navigateTo(AppState.LOGIN);
		// 	}, 500);
		// });

        // wsClient.registerCallback(WebSocketEvent.REGISTRATION_SUCCESS, (msg: string) => {
        //     this.authState = AuthState.LOGGED_IN;
        //     this.currentUser = { username };
        //     uiManager.clearForm(this.registrationFields);
        //     uiManager.showUserInfo(username);
        //     alert(msg || 'Registration successful! Welcome to the game!');
        //     setTimeout(() => {
        //         appManager.navigateTo(AppState.GAME_MODE);
        //     }, 500);
        // });

        // Apptempt to register new user
    }

    handleLoginResponse(result: AuthCode, message: string, username: string, translation: Translation) {
        if (result === AuthCode.OK) {
            // await bindSessionCookie(sid);
            this.currentUser = { username: username };
            uiManager.clearForm(this.loginFields);
            appManager.navigateTo(AppState.MAIN_MENU);
            uiManager.showUserInfo(this.currentUser.username);
            Logger.info(message, 'AuthManager');
            return ;
        }

        if (result == AuthCode.NOT_FOUND) {
            alert(translation.dontHaveAccount);
            setTimeout(() => { appManager.navigateTo(AppState.REGISTER); }, 500);
        } 
        else if (AuthCode.ALREADY_LOGIN) {
            alert(translation.alreadyLogin)
        }
        else {
            alert(translation.passwordsDoNotMatch);
        }
        uiManager.clearForm(this.loginFields); 
    }

    handleRegistrationResponse(result: AuthCode, message: string) {
        if (result === AuthCode.OK) {
            // this.authState = AuthState.LOGGED_IN;
            // this.currentUser = { username };
            uiManager.clearForm(this.registrationFields);
            // uiManager.showUserInfo(username);
            alert(message || 'Registration successful! Welcome to the game!');
            setTimeout(() => { appManager.navigateTo(AppState.GAME_MODE); }, 500);
        }
        else {
            uiManager.clearForm(this.registrationFields);
            alert(message);
            if (result === AuthCode.USERNAME_TAKEN) {
                setTimeout(() => { appManager.navigateTo(AppState.LOGIN); }, 500);
            }
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

	    const handleAuthSuccess = async (googleResponse: GoogleCredentialResponse) => {
            console.log("Google token received, sending to backend...");
            try {
                // 1) Hit your backend; allow cookies to be set
                const authRes = await fetch('/api/google', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: googleResponse.credential })
                });

                if (!authRes.ok) {
                    const errorData = await authRes.json();
                    throw new Error(`Backend authentication failed: ${errorData.message || errorData.error || 'Unknown error'}`);
                }

                
                // // Decodes the session token and updates the current user and authentication state
                // const decodedToken = JSON.parse(atob(sessionToken.split('.')[1]));
                // this.currentUser = { username: decodedToken.user.username };
                // this.authState = AuthState.LOGGED_IN;

                // Parses the response to get the user data from your application
                const { user, success } = await authRes.json();
                console.log("Backend responded with user data:", user, "success:", success);

                // Updates the current user and authentication state
                this.currentUser = { username: user.username };
                
                // Store Google token for session restore if needed
                localStorage.setItem('google_id_token', googleResponse.credential);
                
                // Updates the UI to show user information and navigates to game mode selection
                uiManager.showUserInfo(this.currentUser.username);
                // uiManager.hideOverlays('login-modal');
                appManager.navigateTo(AppState.GAME_MODE);

		} catch (error) {
			console.error("Backend communication failed:", error);
			alert("Could not complete login.");
		}
	};

    initializeGoogleSignIn(googleClientId, handleAuthSuccess)
        .then(() => {
            renderGoogleButton('google-login-btn-container');
            renderGoogleButton('google-register-btn-container');
        })
        .catch(error => {
            console.error("Failed  to initialize or render Google button due to an error:", error);
        });
    }

	// ========================================
	// STATE GETTERS
	// ========================================

	// Gets the current user information.
	getCurrentUser(): {username: string; email?: string} | null {
		return this.currentUser;
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
        sendPOST("logout");
		this.currentUser = null;
		
		// Clear Google token from localStorage
		localStorage.removeItem('google_id_token');
		
		uiManager.showAuthButtons();
		appManager.navigateTo(AppState.MAIN_MENU);
	}

	// Checks the current authentication state and updates UI accordingly. Should be called after page loads or state changes to ensure UI consistency.
	checkAuthState(): void {
		if (this.currentUser) {
			uiManager.showUserInfo(this.currentUser.username);
            uiManager.setButtonState(
					[EL.BUTTONS.LOGIN, EL.BUTTONS.REGISTER],
					'disabled'
				);
        }
		else {
            uiManager.showAuthButtons();
        }
	}

    isUserAuthenticated() {
        return (this.currentUser ? true : false);
    }
}

export const authManager = new AuthManager;