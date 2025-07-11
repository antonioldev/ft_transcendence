import { GameMode } from '../shared/constants.js';

class UIManager {
    private static instance: UIManager;

    static getInstance(): UIManager {
        if (!UIManager.instance)
            UIManager.instance = new UIManager()
        return UIManager.instance;
    }

    private readonly colors = {
        primary: '#ff6b6b',
        background: '#1a1a1a',
        surface: '#333',
        text: 'white',
        textSecondary: '#ccc',
        overlay: 'rgba(0, 0, 0, 0.9)'
    };

    private readonly styles = {
        screen: {
            display: 'none',
            position: 'fixed' as const,
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            backgroundColor: 'black',
            justifyContent: 'center' as const,
            alignItems: 'center' as const,
            zIndex: '10',
            padding: '20px',
            boxSizing: 'border-box' as const
        },

        overlay: {
            display: 'flex',
            backgroundColor: this.colors.overlay
        },

        container: {
            backgroundColor: this.colors.background,
            padding: '2rem',
            borderRadius: '10px',
            textAlign: 'center' as const,
            border: `2px solid ${this.colors.primary}`,
            width: '90vw',
            maxWidth: '500px',
            height: 'auto',
            maxHeight: '85vh',
            overflow: 'auto',
            margin: '20px auto',
            boxSizing: 'border-box' as const
        },

        title: {
            fontSize: '1.8rem',
            color: this.colors.primary,
            marginBottom: '1.5rem',
            fontWeight: 'bold',
            textAlign: 'center' as const,
            userSelect: 'none' as const
        },

        button: {
            fontWeight: 'bold',
            cursor: 'pointer' as const,
            backgroundColor: this.colors.surface,
            color: this.colors.text,
            border: `2px solid ${this.colors.primary}`,
            borderRadius: '5px',
            width: '100%',
            maxWidth: '350px',
            height: '50px',
            fontSize: '1rem',
            boxSizing: 'border-box' as const
        },

        input: {
            width: '100%',
            maxWidth: '400px',
            height: '50px',
            fontSize: '1rem',
            padding: '8px',
            border: `2px solid ${this.colors.primary}`,
            borderRadius: '5px',
            backgroundColor: this.colors.surface,
            color: this.colors.text,
            textAlign: 'center' as const,
            boxSizing: 'border-box' as const
        },

        label: {
            fontSize: '1rem',
            color: this.colors.text,
            marginTop: '5px',
            // marginBottom: 'px',
            display: 'block'
        },

        selector: {
            display: 'inline-flex',
            alignItems: 'center' as const,
            justifyContent: 'space-between' as const,
            width: '350px',
            height: '50px',
            fontSize: '1rem',
            fontWeight: 'bold'
        },

        pauseDialog: {
            position: 'absolute' as const,
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'none',
            flexDirection: 'column' as const,
            justifyContent: 'center' as const,
            alignItems: 'center' as const,
            color: this.colors.text,
            textAlign: 'center' as const,
            userSelect: 'none' as const,
            zIndex: '100'
        },

        // Auth area styling
        authArea: {
            position: 'fixed' as const,
            top: '20px',
            right: '20px',
            display: 'flex',
            gap: '10px',
            zIndex: '1000',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            padding: '5px',
            borderRadius: '8px'
        },

        userInfo: {
            flexDirection: 'column' as const,
            alignItems: 'center' as const,
            border: `1px solid ${this.colors.primary}`
        },
        
        userName: {
            color: this.colors.text,
            minWidth: '120px',
            fontSize: '1rem',
            fontWeight: 'bold',
            marginBottom: '5px',
            userSelect: 'none' as const,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: '5px 10px',
            borderRadius: '5px',
            border: `1px solid ${this.colors.primary}`
        },

        // Form groups - consolidates button-group and input-group
        formGroup: {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center' as const,
            gap: '15px',
            margin: '1rem auto',
            width: '100%',
            maxWidth: '400px'
        },
        
        fieldset: {
            border: 'none',
            padding: '0',
            margin: '0'
        },

        modalFooter: {
            marginTop: '2rem',
            paddingTop: '1rem',
            borderTop: `1px solid ${this.colors.surface}`
        },

        // VARIANTS - specific modifications to base styles
        mainTitle: { 
            fontSize: '4rem',
            marginBottom: '3rem'
        },
        
        secondary: { 
            width: '150px', 
            height: '35px', 
            fontSize: '0.8rem',
            backgroundColor: '#666',
            borderColor: 'white',
            margin: '10px'
        },

        playButton: {
            fontSize: '3rem',
            fontWeight: 'bold',
            width: '100%',
            maxWidth: '400px',
            height: '100px',
            marginBottom: '2rem',
            backgroundColor: this.colors.primary,
            color: 'white',
            borderColor: this.colors.primary,
            boxSizing: 'border-box' as const
        },
        
        navButton: {
            background: 'none',
            border: 'none',
            fontSize: '2rem',
            margin: '0 10px',
            width: 'auto',
            height: 'auto',
            color: this.colors.text
        },

        setupForm: { 
            display: 'none', 
            margin: '1rem 0' 
        },
        
        selectorText: {
            fontWeight: 'bold',
            textAlign: 'center' as const,
            userSelect: 'none' as const,
            flex: '1',
            color: this.colors.text
        },
        
        infoText: {
            fontSize: '0.9rem',
            color: this.colors.textSecondary,
            fontStyle: 'italic' as const
        },

        // Pause content size variants
        pauseLarge: { fontSize: '1.5rem', marginBottom: '1rem' },
        pauseMedium: { fontSize: '1.2rem', marginBottom: '0.5rem' },
        pauseSmall: { fontSize: '1rem' }
    };

    private applyStyles(element: HTMLElement, styles: Record<string, any>): void {
        Object.assign(element.style, styles);
    }

    private applyStylesToAll(selector: string, styles: Record<string, any>): void {
        document.querySelectorAll(selector).forEach((element) => {
            this.applyStyles(element as HTMLElement, styles);
        });
    }

    initializeStyles(): void {
        // Set global font family once
        const globalFont = '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace';
        document.body.style.fontFamily = globalFont;
        document.documentElement.style.fontFamily = globalFont;
        
        // Remove default margins and padding
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.documentElement.style.margin = '0';
        document.documentElement.style.padding = '0';
        
        // Base styles
        this.applyStylesToAll('.screen', this.styles.screen);
        this.applyStylesToAll('.overlay', this.styles.overlay);
        this.applyStylesToAll('.container', this.styles.container);
        this.applyStylesToAll('.title', this.styles.title);
        this.applyStylesToAll('.button', this.styles.button);
        this.applyStylesToAll('.input', this.styles.input);
        this.applyStylesToAll('.label', this.styles.label);
        this.applyStylesToAll('.selector', this.styles.selector);
        this.applyStylesToAll('.pause-dialog', this.styles.pauseDialog);
        this.applyStylesToAll('fieldset', this.styles.fieldset);

        // Consolidated: button-group AND input-group both use same styling
        this.applyStylesToAll('.button-group, .input-group', this.styles.formGroup);

        // Auth areas - both use same base with variants
        this.applyStylesToAll('#auth-buttons, #user-info', this.styles.authArea);
        this.applyStylesToAll('#user-info', this.styles.userInfo);
        this.applyStylesToAll('#user-name', this.styles.userName);

        // Pause elements - all get base color/alignment, then size variants
        this.applyStylesToAll('.pause-title, .pause-text, .pause-controls', {
            color: this.colors.text,
            textAlign: 'center' as const,
            userSelect: 'none' as const
        });
        this.applyStylesToAll('.pause-title', this.styles.pauseLarge);
        this.applyStylesToAll('.pause-text', this.styles.pauseMedium);
        this.applyStylesToAll('.pause-controls', this.styles.pauseSmall);

        // Specific variants
        this.applyStylesToAll('.play-button', this.styles.playButton);
        this.applyStylesToAll('.secondary', this.styles.secondary);
        this.applyStylesToAll('.nav-button', this.styles.navButton);
        this.applyStylesToAll('.setup-form', this.styles.setupForm);
        this.applyStylesToAll('.selector-text', this.styles.selectorText);
        this.applyStylesToAll('.info-text', this.styles.infoText);
        this.applyStylesToAll('.modal-footer', this.styles.modalFooter);

        // Special cases
        const mainMenu = document.getElementById('main-menu');
        if (mainMenu) {
            mainMenu.style.display = 'block';
            mainMenu.style.backgroundColor = 'black';
            mainMenu.style.position = 'relative';
        }

        const mainTitle = document.getElementById('main-title');
        if (mainTitle) {
            this.applyStyles(mainTitle, this.styles.mainTitle);
        }
    }

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

    showModal(modalId: string): void {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    hideModal(modalId: string): void {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    hideAllModals(): void {
        this.hideModal('login-modal');
        this.hideModal('register-modal');
    }

    showPauseDialog(dialogId: string): void {
        const dialog = document.getElementById(dialogId);
        if (dialog) dialog.style.display = 'flex';
    }

    hidePauseDialog(dialogId: string): void {
        const dialog = document.getElementById(dialogId);
        if (dialog) dialog.style.display = 'none';
    }

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

    setButtonState(buttonId: string, state: 'enabled' | 'disabled', tooltip?: string): void {
        const button = document.getElementById(buttonId) as HTMLButtonElement;
        if (!button) return;

        if (state === 'disabled') {
            button.disabled = true;
            button.classList.add('disabled');
            button.style.opacity = '0.5';
            button.style.cursor = 'not-allowed';
            if (tooltip) button.title = tooltip;
        } else {
            button.disabled = false;
            button.classList.remove('disabled');
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
            button.title = '';
        }
    }
}

export const uiManager = UIManager.getInstance();