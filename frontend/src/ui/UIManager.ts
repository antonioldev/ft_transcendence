import { ConnectionStatus } from '../shared/constants.js';
import { EL, requireElementById} from './elements.js';
import { getCurrentTranslation } from '../translations/translations.js';


class UIManager {
	private static instance: UIManager;

    static getInstance(): UIManager {
        if (!UIManager.instance)
            UIManager.instance = new UIManager()
        return UIManager.instance;
    }

    // ========================================
    // SCREEN & LAYOUT MANAGEMENT
    // ========================================
    showScreen(screenId: string): void {
        
        // Hide all main screens/overlays
        const screensToHide = [
            'main-menu',
            'login-modal', 
            'register-modal',
            'game-mode-overlay',
            'player-setup-overlay',
            'game-3d',
            'stats-dashboard'
        ];
        
        screensToHide.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = 'none';
            }
        });

        const screen = document.getElementById(screenId);
        if (screen) {
            const displayValue = screenId === 'main-menu' ? 'block' : 'flex';
            console.log(`Setting display to: ${displayValue}`);
            screen.style.display = displayValue;
        } else {
            console.error(`Screen element not found: ${screenId}`);
        }
    }

    showSetupForm(formType: string): void {
        // Hide all setup forms
        const setupForms = [
            'solo-setup',
            'two-players-setup', 
            'tournament-setup'
        ];
        
        setupForms.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = 'none';
            }
        });
        
        const targetForm = document.getElementById(`${formType}-setup`);
        if (targetForm) {
            targetForm.style.display = 'block';
        }
    }

	// ========================================
	// AUTHENTICATION UI
	// ========================================
	showAuthButtons(): void {
		const authButtons = requireElementById(EL.DISPLAY.AUTH_BUTTONS);
		const userInfo = requireElementById(EL.DISPLAY.USER_INFO);
		
		authButtons.style.display = 'flex';
		userInfo.style.display = 'none';
	}

	showUserInfo(username: string): void {
		const authButtons = requireElementById(EL.DISPLAY.AUTH_BUTTONS);
		const userInfo = requireElementById(EL.DISPLAY.USER_INFO);
		const userName = requireElementById(EL.DISPLAY.USER_NAME);
		
		authButtons.style.display = 'none';
		userName.textContent = username;
		userInfo.style.display = 'flex';
	}

	// ========================================
	// FORM MANAGEMENT
	// ========================================
	clearForm(fieldIds: string[]): void {
		fieldIds.forEach(id => {
			const input = document.getElementById(id) as HTMLInputElement;
			if (input)
				input.value = '';
		});
	}

	showFormValidationError(message: string): void {
		alert(message); // TODO we can create UI instead of alert
	}

	// ========================================
	// OVERLAY & MODAL MANAGEMENT
	// ========================================
	setElementVisibility(elementId: string, visible: boolean): void {
		const element = document.getElementById(elementId);
		if (element) {
			element.style.display = visible ? 'flex' : 'none';
		}
	}

	updateViewModeDisplay(displayText: string): void {
		const viewModeDisplay = requireElementById(EL.DISPLAY.VIEW_MODE_DISPLAY);
		viewModeDisplay.textContent = displayText;
	}

	updateAIDifficultyDisplay(currentDifficultyIndex: number): void {
		const soloButton = requireElementById(EL.GAME_MODES.SOLO);
		const t = getCurrentTranslation();
		const difficulties = [t.easy, t.medium, t.hard, t.impossible];
		soloButton.textContent = `vs AI${difficulties[currentDifficultyIndex]}`;
	}

	updateTournamentSizeDisplay(currentTournamentSize: number): void {
		const tournamentButton = requireElementById(EL.GAME_MODES.TOURNAMENT);
		const t = getCurrentTranslation();
		tournamentButton.textContent = `${t.tournamentMode} (${currentTournamentSize}x 𐦂𖨆𐀪𖠋)`;
	}

	updateOnlineTournamentSizeDisplay(currentOnlineTournamentSize: number): void {
		const tournamentOnlineButton = requireElementById(EL.GAME_MODES.TOURNAMENT_ONLINE);
		const t = getCurrentTranslation();
		tournamentOnlineButton.textContent = `${t.tournamentOnline} (${currentOnlineTournamentSize}x 🧑‍🧑‍🧒‍🧒)`;
	}

	// ========================================
	// BUTTON STATE MANAGEMENT
	// ========================================

	updateGameModeButtonStates(isLoggedIn: boolean, isOnline: boolean): void {
		const t = getCurrentTranslation();
		
		if (isOnline) {
			this.setButtonState([EL.GAME_MODES.SOLO], 'enabled');

			if (isLoggedIn) {
				this.setButtonState(
					[EL.GAME_MODES.ONLINE, EL.GAME_MODES.TOURNAMENT_ONLINE],
					'enabled'
				);
				this.setButtonState(
					[EL.GAME_MODES.LOCAL, EL.GAME_MODES.TOURNAMENT],
					'disabled',
					t.availableOnlyOffline
				);
			} else {
				this.setButtonState(
					[EL.GAME_MODES.LOCAL, EL.GAME_MODES.TOURNAMENT],
					'enabled'
				);
				this.setButtonState(
					[EL.GAME_MODES.ONLINE, EL.GAME_MODES.TOURNAMENT_ONLINE],
					'disabled',
					t.loginRequired
				);
			}
		}
	}

	setButtonState(buttonIds: string[], state: 'enabled' | 'disabled', tooltip?: string): void {
		buttonIds.forEach(buttonId => {
			const button = document.getElementById(buttonId) as HTMLButtonElement;

			if (!button)
				return;

			if (state === 'disabled') {
				button.disabled = true;
				button.classList.add('disabled');
				button.style.opacity = '0.5';
				button.style.cursor = 'not-allowed';
				if (tooltip)
					button.title = tooltip;
			} else {
				button.disabled = false;
				button.classList.remove('disabled');
				button.style.opacity = '1';
				button.style.cursor = 'pointer';
				button.title = '';
			}
		});
	}

	// ========================================
	// CONNECTION STATUS
	// ========================================
	updateConnectionStatus(status: ConnectionStatus): void {
		const statusElement = requireElementById(EL.DISPLAY.CONNECTION_STATUS);
		statusElement.style.display = 'block';

		switch (status) {
			case ConnectionStatus.CONNECTING:
				statusElement.textContent = '🟡';
				this.setButtonState([EL.BUTTONS.PLAY, EL.BUTTONS.LOGIN,
					EL.BUTTONS.REGISTER ], 'disabled');
				break;
				
			case ConnectionStatus.CONNECTED:
				statusElement.textContent = '🟢';
				this.setButtonState([EL.BUTTONS.PLAY, EL.BUTTONS.LOGIN,
					EL.BUTTONS.REGISTER ], 'enabled');
				break;
				
			case ConnectionStatus.FAILED:
				statusElement.textContent = '🔴';
				this.setButtonState([EL.BUTTONS.PLAY, EL.BUTTONS.LOGIN,
					EL.BUTTONS.REGISTER ], 'disabled');
				break;
		}
	}

	// ========================================
	// LOADING AND PROGRESS
	// ========================================
	updateLoadingProgress(progress: number): void {
		const progressBar = requireElementById(EL.GAME.PROGRESS_FILL);
		progressBar.style.width = progress + '%';
		const progressText = requireElementById(EL.GAME.PROGRESS_TEXT);
		progressText.textContent = progress + '%';
	}

	setLoadingScreenVisible(visible: boolean): void {
		const t = getCurrentTranslation();
		const loadingText = requireElementById(EL.GAME.LOADING_TEXT);
		loadingText.textContent = t.loading;
		const loadingScreen = requireElementById(EL.GAME.LOADING_SCREEN);
		loadingScreen.style.display = visible ? 'flex' : 'none';
		this.updateLoadingProgress(0);
	}

	updateLoadingText(): void {
		const t = getCurrentTranslation();
		const loadingText = requireElementById(EL.GAME.LOADING_TEXT);
		loadingText.textContent = t.waiting;
	}
}

export const uiManager = UIManager.getInstance();