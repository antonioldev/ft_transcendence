import { ConnectionStatus, ViewMode } from '../shared/constants.js';
import { EL, getElementById, requireElementById, UI_CLASSES} from './elements.js';
import { getCurrentTranslation } from '../translations/translations.js';
import { webSocketClient } from '../core/WebSocketClient.js';
import { authManager } from '../core/AuthManager.js';

class UIManager {
	showScreen(
		screenId: string,
		options: {  hideUserInfo?: boolean; modal?: string; } = {}
	): void {
		Object.values(EL.SCREENS).forEach(id => {
			const element = getElementById(id);
			if (element) element.style.display = 'none';
		});

		if (options.hideUserInfo)
			this.showAuthButtons();
		
		// Handle modal display
		if (options.modal) {
			const mainMenu = requireElementById(EL.SCREENS.MAIN_MENU);
			mainMenu.style.display = 'block';
			this.setElementVisibility(options.modal, true);
		} else {
			const screen = document.getElementById(screenId);
			if (screen)
				screen.style.display = screenId === EL.SCREENS.MAIN_MENU ? 'block' : 'flex';
		}

		// Hide language selector during game screens
		const languageSelector = document.getElementById('language-selector');
		if (languageSelector)
			languageSelector.style.display = screenId === EL.SCREENS.GAME_3D ? 'none' : 'flex';
	
		const isLoggedIn = authManager.isUserAuthenticated();
		const isOnline = webSocketClient.isConnected();
		uiManager.updateGameModeButtonStates(isLoggedIn, isOnline);
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
		tournamentButton.textContent = `${t.tournamentMode} (${currentTournamentSize} x 👤)`;
	}

	updateOnlineTournamentSizeDisplay(currentOnlineTournamentSize: number): void {
		const tournamentOnlineButton = requireElementById(EL.GAME_MODES.TOURNAMENT_ONLINE);
		const t = getCurrentTranslation();
		tournamentOnlineButton.textContent = `${t.tournamentOnline} (${currentOnlineTournamentSize} x 👤)`;
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

	updateViewModeButtonStyles(selectedViewMode: ViewMode): void {
		const classicBtn = requireElementById<HTMLButtonElement>(EL.BUTTONS.VIEW_MODE_CLASSIC);
		const immersiveBtn = requireElementById<HTMLButtonElement>(EL.BUTTONS.VIEW_MODE_IMMERSIVE);

		// Reset both buttons to inactive state
		classicBtn.className = UI_CLASSES.BUTTON_UNSELECTED;
		immersiveBtn.className = UI_CLASSES.BUTTON_UNSELECTED;
		
		// Set active button style
		if (selectedViewMode === ViewMode.MODE_2D)
			classicBtn.className = UI_CLASSES.BUTTON_SELECTED;
		else
			immersiveBtn.className = UI_CLASSES.BUTTON_SELECTED;
	}

	// ========================================
	// CONNECTION STATUS
	// ========================================
	updateConnectionStatus(status: ConnectionStatus): void {
		const statusElements = document.querySelectorAll('.connection-status');

		let emoji = '🟡'
		let buttonState: 'enabled' | 'disabled' = 'disabled';

		switch (status) {
			case ConnectionStatus.CONNECTING:
				emoji = '🟡';
				buttonState = 'disabled';
				break;
			case ConnectionStatus.CONNECTED:
				emoji = '🟢';
				buttonState = 'enabled';
				break;
			case ConnectionStatus.FAILED:
				emoji = '🔴';
				buttonState = 'disabled';
				break;
		}

		statusElements.forEach(element => {
			element.textContent = emoji;
			(element as HTMLElement).style.display = 'block';
		});

		this.setButtonState([EL.BUTTONS.PLAY, EL.BUTTONS.LOGIN, EL.BUTTONS.REGISTER], buttonState);
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

export const uiManager = new UIManager;