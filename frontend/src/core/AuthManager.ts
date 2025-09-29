import { Logger } from '../utils/LogManager.js';
import { AuthState, AppState, WebSocketEvent } from '../shared/constants.js';
import { uiManager } from '../ui/UIManager.js';
import { getCurrentTranslation } from '../translations/translations.js';
import { WebSocketClient } from './WebSocketClient.js';
import { RegisterUser, LoginUser } from '../shared/types.js';
import { EL, requireElementById} from '../ui/elements.js';
import { initializeGoogleSignIn, renderGoogleButton } from './GoogleSignIn.js';
import { appStateManager } from './AppStateManager.js';

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
		authManager.restoreSessionOnBoot();
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
            this.prepareGoogleLogin();
		});

		showLogin?.addEventListener('click', () => {
			appStateManager.navigateTo(AppState.LOGIN);
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
                    this.authState = AuthState.LOGGED_IN;
                    this.currentUser = { username: data.user.username };
                    uiManager.showUserInfo(this.currentUser.username);
                    appStateManager.navigateTo(AppState.MAIN_MENU);
                    WebSocketClient.getInstance();
                    return;
                }
            }

            // 2) Fallback: try Google restore if you kept the Google token
            const googleIdToken = localStorage.getItem('google_id_token'); // set this on Google login success
            if (googleIdToken) {
                console.log('Found Google token, attempting restore');
                // Hit your Google restore endpoint that verifies the Google token
                // and SETS the same 'sid' cookie as classic login
                const gRes = await fetch('/api/auth/google/restore', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include', // <-- must include so cookie gets set
                    body: JSON.stringify({ token: googleIdToken }),
                });

                if (gRes.ok) {
                    console.log('Google restore successful, fetching user data');

                    // After cookie set, ask the unified "who am I" (classic) again
                    const res2 = await fetch('/api/auth/session/me', {
                    method: 'GET',
                    credentials: 'include',
                    cache: 'no-store',
                    });
                    if (res2.ok) {
                        const data2 = await res2.json();
                        if (data2?.ok && data2.user?.username) {
                            console.log('Session fully restored via Google');
                            this.authState = AuthState.LOGGED_IN;
                            this.currentUser = { username: data2.user.username };
                            uiManager.showUserInfo(this.currentUser.username);
                            appStateManager.navigateTo(AppState.MAIN_MENU);
                            WebSocketClient.getInstance();
                            return;
                        }
                    }
                } else {
                console.log('Google restore failed, token may be expired');
                // Remove invalid token
                localStorage.removeItem('google_id_token');
                }
            } else {
                console.log('No Google token found in local storage');
            }

            console.log('No valid session found, remaining in guest mode');
            this.authState = AuthState.GUEST;
            this.currentUser = null;
        } catch (e) {
            console.log('Session restore failed (expected on first visit)');
            this.authState = AuthState.GUEST;
            this.currentUser = null;
        }
    }

    // Handles the login form submission process. Validates input fields, processes authentication, and updates UI state.
    private handleLoginSubmit(): void {
        const usernameInput = requireElementById<HTMLInputElement>(EL.AUTH.LOGIN_USERNAME);
        const passwordInput = requireElementById<HTMLInputElement>(EL.AUTH.LOGIN_PASSWORD);
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const t = getCurrentTranslation();
        const wsClient = WebSocketClient.getInstance(); // or use a shared instance if you already have one
        
        // Basic validation
        if (!username || !password) {
            alert(t.pleaseFilllAllFields);
            uiManager.clearForm(this.loginFields);
            return;
        }    

        const user: LoginUser = { username, password };
        
        // --- Helper: set HttpOnly cookie via binder route ---
        const bindSessionCookie = async (sid: string) => {
        const res = await fetch('/api/auth/session/bind', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sid }),
            credentials: 'include',
        });
        if (!res.ok) throw new Error('bind_failed');
        };

        // --- Helper: parse the server string payload safely ---
        const parsePayload = (raw: unknown): { text: string; sid?: string; uname?: string } => {
            let payload: any = raw;
            if (typeof payload === 'string') {
                try {
                    payload = JSON.parse(payload);
                } catch {
                    return { text: payload };
                }
            }
            const text  = payload.text ?? payload.message ?? 'Login success';
            const sid   = payload.sid ?? payload.sessionId ?? payload.data?.sid;
            const uname = payload.username ?? payload.user?.username;
            return { text, sid, uname };
        };

        // SUCCESS: the callback still receives a string; we parse it here
        wsClient.registerCallback(WebSocketEvent.LOGIN_SUCCESS, async (raw: string) => {
            try {
                const { text, sid, uname } = parsePayload(raw);
                if (!sid) {
                    Logger.error('Missing sid in LOGIN_SUCCESS payload', 'AuthManager', { raw });
                    alert('Login succeeded but session binding failed (no sid).');
                    return;
                }

                await bindSessionCookie(sid);

                this.authState = AuthState.LOGGED_IN;
                this.currentUser = { username: uname ?? username };
                uiManager.clearForm(this.loginFields);
                appStateManager.navigateTo(AppState.MAIN_MENU);
                uiManager.showUserInfo(this.currentUser.username);
                Logger.info(text ?? 'Login ok', 'AuthManager');
            } catch (e) {
                Logger.error('Binder call failed', 'AuthManager', e);
                alert('Login succeeded but could not finalize session. Please retry.');
            }
        });

		wsClient.registerCallback(WebSocketEvent.LOGIN_FAILURE, (msg: string) => {
			this.authState = AuthState.LOGGED_FAILED;
			if (msg === "User doesn't exist") {
				alert(t.dontHaveAccount);
				uiManager.clearForm(this.loginFields); 
				setTimeout(() => {
					appStateManager.navigateTo(AppState.REGISTER);
				}, 500);
			} else if (msg === "User already login") {
				alert(t.alreadyLogin)
				uiManager.clearForm(this.loginFields); 
			} else {
				alert(t.passwordsDoNotMatch);
				uiManager.clearForm(this.loginFields); 
			}
		});

		try {
			wsClient.loginUser(user);
		} catch (error) {
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

        // Clear previous errors
        this.clearValidationErrors(['register-username', 'register-email', 'register-password', 'register-confirm-password']);
        
        if (!username) {
            this.showFieldError('register-username', t.errorEnterUsername);
            return;
        }

        // Validate email
        if (!email) {
            this.showFieldError('register-email', t.errorEnterEmail);
            return;
        } else if (!this.isValidEmail(email)) {
            this.showFieldError('register-email', t.errorEnterValidEmail);
            return;
        }

        // Validate password
        if (!password) {
            this.showFieldError('register-password', t.errorEnterPassword);
            return;
        } else if (password.length < 6) {
            this.showFieldError('register-password', t.errorPasswordMinLength);
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
            this.currentUser = { username };
            uiManager.clearForm(this.registrationFields);
            uiManager.showUserInfo(username);
            alert(msg || 'Registration successful! Welcome to the game!');
            setTimeout(() => {
                appStateManager.navigateTo(AppState.GAME_MODE);
            }, 500);
        });

        // Apptempt to register new user
        try {
            wsClient.registerNewUser(user);
            Logger.info('Register attempt', 'AuthManager', { username, email });
            // Keep the state as GUEST until registration confirmation
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

	    const handleAuthSuccess = async (googleResponse: GoogleCredentialResponse) => {
            console.log("Google token received, sending to backend...");
            try {
                // 1) Hit your backend; allow cookies to be set
                const authRes = await fetch('/api/auth/google', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',					  // ⬅️ IMPORTANT
                    body: JSON.stringify({ token: googleResponse.credential })
                });

                if (!authRes.ok) {
                    const errorData = await authRes.json();
                    throw new Error(`Backend authentication failed: ${errorData.message || errorData.error || 'Unknown error'}`);
                }

                // Parses the response to get the session token from your application
                // const { sessionToken } = await authRes.json();
                // console.log("Backend responded with session token:", sessionToken);

                // // TODO: Store the sessionToken
                
                // // Decodes the session token and updates the current user and authentication state
                // const decodedToken = JSON.parse(atob(sessionToken.split('.')[1]));
                // this.currentUser = { username: decodedToken.user.username };
                // this.authState = AuthState.LOGGED_IN;

                // Parses the response to get the user data from your application
                const { user, success } = await authRes.json();
                console.log("Backend responded with user data:", user, "success:", success);

                // Updates the current user and authentication state
                this.authState = AuthState.LOGGED_IN;
                this.currentUser = { username: user.username };
                
                // Store Google token for session restore if needed
                localStorage.setItem('google_id_token', googleResponse.credential);
                
                // Initialize WebSocket connection for authenticated user
                WebSocketClient.getInstance();
                
                // Updates the UI to show user information and navigates to game mode selection
                uiManager.showUserInfo(this.currentUser.username);
                // uiManager.hideOverlays('login-modal');
                appStateManager.navigateTo(AppState.GAME_MODE);

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
		const wsClient = WebSocketClient.getInstance();
		wsClient.logoutUser();
		this.authState = AuthState.GUEST;
		this.currentUser = null;
		
		// Clear Google token from localStorage
		localStorage.removeItem('google_id_token');
		
		uiManager.showAuthButtons();
		appStateManager.navigateTo(AppState.MAIN_MENU);
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