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
            zIndex: '10'
        },

        // ALL overlays share this style (login, register, game modes, etc.)
        overlay: {
            display: 'flex',
            backgroundColor: this.colors.overlay
        },

        // ALL modal containers share this
        container: {
            backgroundColor: this.colors.background,
            padding: '3rem',
            borderRadius: '10px',
            textAlign: 'center' as const,
            border: `2px solid ${this.colors.primary}`
        },

        // ALL titles share this base (screen-title, main-title, mode-subtitle, pause-title)
        title: {
            fontSize: '2rem',
            color: this.colors.primary,
            marginBottom: '2rem',
            fontFamily: '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace',
            fontWeight: 'bold',
            textAlign: 'center' as const,
            userSelect: 'none' as const
        },

        // ALL buttons share this base (primary, secondary, nav buttons)
        button: {
            fontFamily: '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace',
            fontWeight: 'bold',
            cursor: 'pointer' as const,
            backgroundColor: this.colors.surface,
            color: this.colors.text,
            border: `2px solid ${this.colors.primary}`,
            borderRadius: '5px',
            width: '350px',
            height: '50px',
            fontSize: '1rem'
        },

        // ALL input fields share this (username, email, password, player names)
        input: {
            width: '400px',
            height: '50px',
            fontSize: '1rem',
            fontFamily: '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace',
            padding: '8px',
            border: `2px solid ${this.colors.primary}`,
            borderRadius: '5px',
            backgroundColor: this.colors.surface,
            color: this.colors.text,
            textAlign: 'center' as const
        },

        // ALL labels share this (input-label from all forms)
        label: {
            fontSize: '1rem',
            fontFamily: '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace',
            color: this.colors.text,
            marginTop: '15px',
            marginBottom: '5px',
            display: 'block'
        },

        // ALL selectors share this (language and view mode selectors)
        selector: {
            display: 'inline-flex',
            alignItems: 'center' as const,
            justifyContent: 'space-between' as const,
            width: '350px',
            height: '50px',
            fontSize: '1rem',
            fontWeight: 'bold',
            fontFamily: '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace'
        },

        // ALL pause dialog elements share base styles
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
            fontFamily: '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace',
            textAlign: 'center' as const,
            userSelect: 'none' as const,
            zIndex: '100'
        },

        userInfo: {
            position: 'fixed' as const,
            top: '20px',
            right: '20px',
            display: 'none', // Hidden by default
            flexDirection: 'column' as const,
            alignItems: 'center' as const,
            zIndex: '1000',
            fontFamily: '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace'
        },
        
        userName: {
            color: this.colors.text,
            fontSize: '1rem',
            fontWeight: 'bold',
            marginBottom: '5px',
            userSelect: 'none' as const
        },
        
        logoutButton: {
            fontFamily: '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace',
            fontSize: '0.8rem',
            padding: '5px 10px',
            backgroundColor: this.colors.surface,
            color: this.colors.text,
            border: `1px solid ${this.colors.primary}`,
            borderRadius: '3px',
            cursor: 'pointer' as const,
            fontWeight: 'normal'
        },

        // VARIANTS - only the differences
        mainTitle: { fontSize: '4rem' },
        subtitle: { fontSize: '1.5rem', marginBottom: '1rem' },
        
        secondary: { 
            width: '150px', 
            height: '35px', 
            fontSize: '0.8rem',
            backgroundColor: '#666',
            borderColor: 'white',
            margin: '10px'
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

        buttonGroup: {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center' as const,
            gap: '15px',
            margin: '2rem 0'
        },
        
        inputGroup: { marginBottom: '1rem' },
        
        setupForm: { display: 'none', margin: '1rem 0' },
        
        selectorText: {
            fontWeight: 'bold',
            textAlign: 'center' as const,
            userSelect: 'none' as const,
            flex: '1',
            color: this.colors.text
        },
        
        infoText: {
            fontSize: '0.9rem',
            fontFamily: '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace',
            color: this.colors.textSecondary,
            fontStyle: 'italic' as const
        },
        
        srOnly: {
            position: 'absolute' as const,
            width: '1px',
            height: '1px',
            padding: '0',
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap' as const,
            border: '0'
        },
        
        fieldset: {
            border: 'none',
            padding: '0',
            margin: '0'
        },
        
        pauseTitle: { fontSize: '1.5rem', marginBottom: '1rem' },
        pauseText: { fontSize: '1.2rem', marginBottom: '0.5rem' },
        pauseControls: { fontSize: '1rem' }
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
        // Base styles - applied to ALL elements of that type
        this.applyStylesToAll('.screen', this.styles.screen);
        this.applyStylesToAll('.overlay', this.styles.overlay);
        this.applyStylesToAll('.container', this.styles.container);
        this.applyStylesToAll('.title', this.styles.title);
        this.applyStylesToAll('.button', this.styles.button);
        this.applyStylesToAll('.input', this.styles.input);
        this.applyStylesToAll('.label', this.styles.label);
        this.applyStylesToAll('.selector', this.styles.selector);
        this.applyStylesToAll('.pause-dialog', this.styles.pauseDialog);
        this.applyStylesToAll('.sr-only', this.styles.srOnly);
        this.applyStylesToAll('fieldset', this.styles.fieldset);

        // Variants - only apply the differences
        this.applyStylesToAll('.subtitle', this.styles.subtitle);
        this.applyStylesToAll('.secondary', this.styles.secondary);
        this.applyStylesToAll('.nav-button', this.styles.navButton);
        this.applyStylesToAll('.button-group', this.styles.buttonGroup);
        this.applyStylesToAll('.input-group', this.styles.inputGroup);
        this.applyStylesToAll('.setup-form', this.styles.setupForm);
        this.applyStylesToAll('.selector-text', this.styles.selectorText);
        this.applyStylesToAll('.info-text', this.styles.infoText);
        this.applyStylesToAll('.pause-title', this.styles.pauseTitle);
        this.applyStylesToAll('.pause-text', this.styles.pauseText);
        this.applyStylesToAll('.pause-controls', this.styles.pauseControls);

        // Special cases
        const mainMenu = document.getElementById('main-menu');
        if (mainMenu) {
            mainMenu.style.display = 'block';
            mainMenu.style.backgroundColor = 'black';
        }

        const mainTitle = document.getElementById('main-title');
        if (mainTitle) {
            this.applyStyles(mainTitle, this.styles.mainTitle);
            mainTitle.textContent = '🏓 PONG';
        }

        const userInfo = document.getElementById('user-info');
        if (userInfo)
            this.applyStyles(userInfo, this.styles.userInfo);

        const userName = document.getElementById('user-name');
        if (userName)
            this.applyStyles(userName, this.styles.userName);

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn)
            this.applyStyles(logoutBtn, this.styles.logoutButton);
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

    showUserInfo(username: string): void {
        const userInfo = document.getElementById('user-info');
        const userName = document.getElementById('user-name');
        
        if (userInfo && userName) {
            userName.textContent = username;
            userInfo.style.display = 'flex';
        }
    }
    
    hideUserInfo(): void {
        const userInfo = document.getElementById('user-info');
        if (userInfo) {
            userInfo.style.display = 'none';
        }
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

    validatePlayerSetup(gameMode: GameMode): boolean { //TODO implement this
        return true;
    }
}

export const uiManager = UIManager.getInstance();