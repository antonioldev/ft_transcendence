import { GameMode, ConnectionStatus } from '../shared/constants.js';
import { UI_COLORS, UI_STYLES } from './styles.js';
import { EL, requireElementById} from './elements.js';

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
        this.applyStylesToAll('.pause-title, .pause-text, .pause-controls', {
            color: UI_COLORS.text,
            textAlign: 'center' as const,
            userSelect: 'none' as const
        });
        this.applyStylesToAll('.pause-title', UI_STYLES.pauseLarge);
        this.applyStylesToAll('.pause-text', UI_STYLES.pauseMedium);
        this.applyStylesToAll('.pause-controls', UI_STYLES.pauseSmall);
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
    // OVERLAY & MODAL MANAGEMENT
    // ========================================
    setElementVisibility(elementId: string, visible: boolean): void {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = visible ? 'flex' : 'none';
        }
    }

    // ========================================
    // PLAYER INPUT & VALIDATION
    // ========================================
    getPlayerNames(gameMode: GameMode): { player1: string; player2?: string; player3?: string; player4?: string } {
        let player1Input: HTMLInputElement | null;
        let player2Input: HTMLInputElement | null = null;
        let player3Input: HTMLInputElement | null = null;
        let player4Input: HTMLInputElement | null = null;

        switch (gameMode) {
            case GameMode.SINGLE_PLAYER:
                player1Input = requireElementById<HTMLInputElement>(EL.PLAYER_SETUP.PLAYER1_NAME);
                break;
            case GameMode.TWO_PLAYER_LOCAL:
                player1Input = requireElementById<HTMLInputElement>(EL.PLAYER_SETUP.PLAYER1_NAME_LOCAL);
                player2Input = requireElementById<HTMLInputElement>(EL.PLAYER_SETUP.PLAYER2_NAME_LOCAL);
                break;
            case GameMode.TWO_PLAYER_REMOTE:
                player1Input = requireElementById<HTMLInputElement>(EL.PLAYER_SETUP.PLAYER1_NAME_ONLINE);
                break;
            case GameMode.TOURNAMENT_LOCAL:
            case GameMode.TOURNAMENT_REMOTE:
                player1Input = requireElementById<HTMLInputElement>(EL.PLAYER_SETUP.PLAYER1_NAME_TOURNAMENT);
                player2Input = requireElementById<HTMLInputElement>(EL.PLAYER_SETUP.PLAYER2_NAME_TOURNAMENT);
                player3Input = requireElementById<HTMLInputElement>(EL.PLAYER_SETUP.PLAYER3_NAME_TOURNAMENT);
                player4Input = requireElementById<HTMLInputElement>(EL.PLAYER_SETUP.PLAYER4_NAME_TOURNAMENT);
                break;
            default:
                return { player1: 'Player 1' };
        }

        const result: { player1: string; player2?: string; player3?: string; player4?: string } = {
            player1: player1Input?.value.trim() || 'Player 1'
        };

        if (player2Input)
            result.player2 = player2Input.value.trim() || 'Player 2';
        if (player3Input)
            result.player3 = player3Input.value.trim() || 'Player 3';
        if (player4Input)
            result.player4 = player4Input.value.trim() || 'Player 4';

        return result;
    }

    validatePlayerSetup(gameMode: GameMode): boolean {
        const names = this.getPlayerNames(gameMode);
        
        if (!names.player1.trim()) return false;
        if (gameMode === GameMode.TWO_PLAYER_LOCAL && !names.player2?.trim()) return false;
        if ((gameMode === GameMode.TOURNAMENT_LOCAL || gameMode === GameMode.TOURNAMENT_REMOTE))
            if (!names.player2?.trim() || !names.player3?.trim() || !names.player4?.trim()) return false;
        
        return true;
    }

    // ========================================
    // BUTTON STATE MANAGEMENT
    // ========================================
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
}

export const uiManager = UIManager.getInstance();