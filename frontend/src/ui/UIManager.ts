import { ConnectionStatus } from '../shared/constants.js';
import { UI_STYLES } from './styles.js';
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
    // STYLE APPLICATION UTILITIES
    // ========================================
    private applyStyles(element: HTMLElement, styles: Record<string, any>): void {
        Object.assign(element.style, styles);
    }

    private applyStylesToAll(selector: string, styles: Record<string, any>): void {
        document.querySelectorAll(selector).forEach((element) => {
            this.applyStyles(element as HTMLElement, styles);
        });
    }

    // ========================================
    // INITIALIZATION
    // ========================================
    initializeStyles(): void {
        // Global font and reset
        const globalFont = '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace';
        document.body.style.fontFamily = globalFont;
        document.documentElement.style.fontFamily = globalFont;
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.documentElement.style.margin = '0';
        document.documentElement.style.padding = '0';
        
        // Layout & containers
        this.applyStylesToAll('.screen', UI_STYLES.screen);
        this.applyStylesToAll('.overlay', UI_STYLES.overlay);
        this.applyStylesToAll('.container', UI_STYLES.container);

        // Form elements
        this.applyStylesToAll('.button-group, .input-group', UI_STYLES.formGroup);
        this.applyStylesToAll('fieldset', UI_STYLES.fieldset);
        this.applyStylesToAll('.input', UI_STYLES.input);
        this.applyStylesToAll('.label', UI_STYLES.label);

        // Buttons
        this.applyStylesToAll('.button', UI_STYLES.button);
        this.applyStylesToAll('.play-button', UI_STYLES.playButton);
        this.applyStylesToAll('.secondary', UI_STYLES.secondary);
        this.applyStylesToAll('.nav-button', UI_STYLES.navButton);
        this.applyStylesToAll('.solo-mode-container', UI_STYLES.soloModeContainer);
        this.applyStylesToAll('.difficulty-button', UI_STYLES.difficultyButton);
        this.applyStylesToAll('.solo-button-in-container', UI_STYLES.soloButtonInContainer);

        // Typography
        this.applyStylesToAll('.title', UI_STYLES.title);
        this.applyStylesToAll('.info-text', UI_STYLES.infoText);

        // Selectors & navigation
        this.applyStylesToAll('.selector', UI_STYLES.selector);
        this.applyStylesToAll('.selector-text', UI_STYLES.selectorText);

        // Authentication & user info
        this.applyStylesToAll('#auth-buttons, #user-info', UI_STYLES.authArea);
        this.applyStylesToAll('#user-info', UI_STYLES.userInfo);
        this.applyStylesToAll('#user-name', UI_STYLES.userName);

        // Connection status
        this.applyStylesToAll('.connection-status', UI_STYLES.connectionStatus);

        // Game dialogs & overlays
        this.applyStylesToAll('.game-overlay', UI_STYLES.gameOverlay);
        this.applyStylesToAll('.setup-form', UI_STYLES.setupForm);

        this.applyStylesToAll('.loading-content', UI_STYLES.loadingContent);
        this.applyStylesToAll('.progress-bar', UI_STYLES.progressBar);
        this.applyStylesToAll('#progress-fill', UI_STYLES.progressFill);

        // Special cases
        const mainMenu = document.getElementById('main-menu');
        if (mainMenu) {
            mainMenu.style.display = 'block';
            mainMenu.style.backgroundColor = 'black';
            mainMenu.style.position = 'relative';
        }

        const mainTitle = document.getElementById('main-title');
        if (mainTitle) {
            this.applyStyles(mainTitle, UI_STYLES.mainTitle);
        }
    }

    // ========================================
    // SCREEN & LAYOUT MANAGEMENT
    // ========================================
    showScreen(screenId: string): void {
        this.applyStylesToAll('.screen', { display: 'none' });
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.style.display = screenId === 'main-menu' ? 'block' : 'flex';
        }
    }

    showSetupForm(formType: string): void {
        this.applyStylesToAll('.setup-form', { display: 'none' });
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