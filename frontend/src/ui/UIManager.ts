import { GameMode, ConnectionStatus } from '../shared/constants.js';
import { UI_COLORS, UI_STYLES } from './styles.js';

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
        this.applyStylesToAll('.pause-dialog', UI_STYLES.pauseDialog);
        this.applyStylesToAll('.pause-title, .pause-text, .pause-controls', {
            color: UI_COLORS.text,
            textAlign: 'center' as const,
            userSelect: 'none' as const
        });
        this.applyStylesToAll('.pause-title', UI_STYLES.pauseLarge);
        this.applyStylesToAll('.pause-text', UI_STYLES.pauseMedium);
        this.applyStylesToAll('.pause-controls', UI_STYLES.pauseSmall);
        this.applyStylesToAll('.setup-form', UI_STYLES.setupForm);

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
        const authButtons = document.getElementById('auth-buttons');
        const userInfo = document.getElementById('user-info');
        
        if (authButtons) authButtons.style.display = 'flex';
        if (userInfo) userInfo.style.display = 'none';
    }

    showUserInfo(username: string): void {
        const authButtons = document.getElementById('auth-buttons');
        const userInfo = document.getElementById('user-info');
        const userName = document.getElementById('user-name');
        
        if (authButtons) authButtons.style.display = 'none';
        if (userInfo && userName) {
            userName.textContent = username;
            userInfo.style.display = 'flex';
        }
    }
    
    hideUserInfo(): void {
        this.showAuthButtons();
    }

    // ========================================
    // OVERLAY & MODAL MANAGEMENT
    // ========================================
    showOverlays(modalId: string): void { this.setElementVisibility(modalId, true); }
    hideOverlays(modalId: string): void { this.setElementVisibility(modalId, false); }
    showPauseOverlays(dialogId: string): void { this.setElementVisibility(dialogId, true); }
    hidePauseOverlays(dialogId: string): void { this.setElementVisibility(dialogId, false); }

    private setElementVisibility(elementId: string, visible: boolean): void {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = visible ? 'flex' : 'none';
        }
    }

    // ========================================
    // PLAYER INPUT & VALIDATION
    // ========================================
    getPlayerNames(gameMode: GameMode): { player1: string; player2?: string } {
        let player1Input: HTMLInputElement | null;
        let player2Input: HTMLInputElement | null = null;

        switch (gameMode) {
            case GameMode.SINGLE_PLAYER:
                player1Input = document.getElementById('player1-name') as HTMLInputElement;
                break;
            case GameMode.TWO_PLAYER_LOCAL:
                player1Input = document.getElementById('player1-name-local') as HTMLInputElement;
                player2Input = document.getElementById('player2-name-local') as HTMLInputElement;
                break;
            case GameMode.TWO_PLAYER_REMOTE:
                player1Input = document.getElementById('player1-name-online') as HTMLInputElement;
                break;
            default:
                return { player1: 'Player 1' };
        }

        const result: { player1: string; player2?: string } = {
            player1: player1Input?.value.trim() || 'Player 1'
        };

        if (player2Input) {
            result.player2 = player2Input.value.trim() || 'Player 2';
        }

        return result;
    }

    validatePlayerSetup(gameMode: GameMode): boolean {
        const names = this.getPlayerNames(gameMode);
        
        if (!names.player1.trim()) return false;
        if (gameMode === GameMode.TWO_PLAYER_LOCAL && !names.player2?.trim()) return false;
        
        return true;
    }

    // ========================================
    // BUTTON STATE MANAGEMENT
    // ========================================
    setButtonState(buttonId: string, state: 'enabled' | 'disabled', tooltip?: string): void {
        const button = document.getElementById(buttonId) as HTMLButtonElement;
        if (!button) return;

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
    }

    private setGameFeaturesEnabled(enable: boolean): void {
        const buttonIds = ['play-btn', 'login-btn', 'register-btn'];
        const disabled = enable;
        const opacity = '1';
        const title = '';
        
        buttonIds.forEach(id => {
            const button = document.getElementById(id) as HTMLButtonElement;
            if (button) {
                button.disabled = disabled;
                button.style.opacity = opacity;
                button.title = title;
            }
        });
    }

    // ========================================
    // CONNECTION STATUS
    // ========================================
    updateConnectionStatus(status: ConnectionStatus): void {
        const statusElement = document.getElementById('connection-status')!;
        if (!statusElement) return;
        statusElement.style.display = 'block';

        switch (status) {
            case ConnectionStatus.CONNECTING:
                statusElement.textContent = '🟡';
                this.setGameFeaturesEnabled(true);
                break;
                
            case ConnectionStatus.CONNECTED:
                statusElement.textContent = '🟢';
                this.setGameFeaturesEnabled(false);
                break;
                
            case ConnectionStatus.FAILED:
                statusElement.textContent = '🔴';
                this.setGameFeaturesEnabled(true);
                break;
        }
    }
}

export const uiManager = UIManager.getInstance();