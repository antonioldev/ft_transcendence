class UIManager {
    private static instance: UIManager;

    static getInstance(): UIManager {
        if (!UIManager.instance)
            UIManager.instance = new UIManager()
        return UIManager.instance;
    }

    // Simplified color palette
    private readonly colors = {
        primary: '#ff6b6b',      // Red accent
        background: '#1a1a1a',   // Dark background
        surface: '#333',         // Input backgrounds
        text: 'white',
        textSecondary: '#ccc',
        overlay: 'rgba(0, 0, 0, 0.9)'
    };

    // Simplified styles - only what we really need
    private readonly styles = {
        // Base screen
        screen: {
            display: 'none',
            position: 'fixed' as const,
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            backgroundColor: this.colors.overlay,
            justifyContent: 'center' as const,
            alignItems: 'center' as const,
            zIndex: '10'
        },

        // Main menu (no overlay)
        mainScreen: {
            display: 'block',
            backgroundColor: 'black'
        },

        // All containers
        container: {
            backgroundColor: this.colors.background,
            padding: '3rem',
            borderRadius: '10px',
            textAlign: 'center' as const,
            border: `2px solid ${this.colors.primary}`
        },

        // All titles
        title: {
            fontSize: '2rem',
            color: this.colors.primary,
            marginBottom: '2rem',
            fontFamily: '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace',
            fontWeight: 'bold',
            textAlign: 'center' as const,
            userSelect: 'none' as const
        },

        // Main title is bigger
        mainTitle: {
            fontSize: '4rem'
        },

        // All tables
        table: {
            margin: '2rem auto',
            borderCollapse: 'separate' as const,
            borderSpacing: '10px'
        },

        // Primary buttons (main actions)
        primaryButton: {
            width: '350px',
            height: '50px',
            fontSize: '1rem',
            fontWeight: 'bold',
            fontFamily: '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace',
            cursor: 'pointer' as const,
            backgroundColor: this.colors.surface,
            color: this.colors.text,
            border: `2px solid ${this.colors.primary}`,
            borderRadius: '5px'
        },

        // Secondary buttons (back, navigation)
        secondaryButton: {
            width: '150px',
            height: '35px',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            fontFamily: '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace',
            cursor: 'pointer' as const,
            backgroundColor: '#666',
            color: this.colors.text,
            border: '2px solid white',
            borderRadius: '5px',
            margin: '10px'
        },

        // Language navigation (keep small)
        navButton: {
            background: 'none',
            border: 'none',
            cursor: 'pointer' as const,
            fontSize: '2rem',
            color: this.colors.text,
            margin: '0 10px'
        },

        // Language selector
        languageSelector: {
            display: 'inline-flex',
            alignItems: 'center' as const,
            justifyContent: 'space-between' as const,
            width: '350px',
            height: '50px',
            fontSize: '1rem',
            fontWeight: 'bold',
            fontFamily: '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace'
        },

        languageDisplay: {
            fontWeight: 'bold',
            textAlign: 'center' as const,
            userSelect: 'none' as const,
            flex: '1',
            color: this.colors.text
        },

        // Form elements
        setupForm: {
            display: 'none',
            margin: '1rem 0'
        },

        label: {
            fontSize: '1rem',
            fontFamily: '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace',
            color: this.colors.text,
            marginBottom: '10px',
            display: 'block'
        },

        input: {
            width: '300px',
            height: '40px',
            fontSize: '1rem',
            fontFamily: '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace',
            padding: '8px',
            border: `2px solid ${this.colors.primary}`,
            borderRadius: '5px',
            backgroundColor: this.colors.surface,
            color: this.colors.text,
            textAlign: 'center' as const
        },

        info: {
            fontSize: '0.9rem',
            fontFamily: '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace',
            color: this.colors.textSecondary,
            fontStyle: 'italic' as const
        },

        // Pause dialog
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
            fontSize: '1.5rem',
            textAlign: 'center' as const,
            userSelect: 'none' as const,
            zIndex: '100'
        }
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
        this.setupScreens();
        this.setupButtons();
        this.setupForms();
        this.setupLanguage();
        this.setupPauseDialogs();
    }

    private setupScreens(): void {
        // All screens get base screen styling
        this.applyStylesToAll('.screen', this.styles.screen);
        
        // Main menu is special (no overlay)
        const mainMenu = document.getElementById('main-menu');
        if (mainMenu) {
            this.applyStyles(mainMenu, this.styles.mainScreen);
        }

        // All containers
        this.applyStylesToAll('.screen-container', this.styles.container);
        
        // All tables
        this.applyStylesToAll('.button-table, .input-table', this.styles.table);

        // All titles
        this.applyStylesToAll('.screen-title', this.styles.title);

        // Main title special styling
        const mainTitle = document.getElementById('main-title');
        if (mainTitle) {
            this.applyStyles(mainTitle, this.styles.title);
            this.applyStyles(mainTitle, this.styles.mainTitle);
            mainTitle.textContent = '🏓 PONG';
        }
    }

    private setupButtons(): void {
        // Primary buttons (main actions)
        this.applyStylesToAll('.buttons', this.styles.primaryButton);
        
        // Secondary buttons (back buttons)
        // const backButtons = ['mode-back', 'setup-back'];
        // backButtons.forEach((buttonId) => {
        //     const button = document.getElementById(buttonId);
        //     if (button) {
        //         this.applyStyles(button, this.styles.secondaryButton);
        //     }
        // });
        this.applyStylesToAll('.secondary-btn', this.styles.secondaryButton);

        // Disabled buttons
        this.applyStylesToAll('.disabled', { opacity: '0.5', cursor: 'not-allowed' });
    }

    private setupForms(): void {
        this.applyStylesToAll('.setup-form', this.styles.setupForm);
        this.applyStylesToAll('.input-label', this.styles.label);
        this.applyStylesToAll('.name-input', this.styles.input);
        this.applyStylesToAll('.setup-info', this.styles.info);
    }

    private setupLanguage(): void {
        this.applyStylesToAll('.language-selector', this.styles.languageSelector);
        this.applyStylesToAll('.language-display', this.styles.languageDisplay);
        this.applyStylesToAll('.nav-btn', this.styles.navButton);
    }

    private setupPauseDialogs(): void {
        this.applyStylesToAll('.pause-dialog', this.styles.pauseDialog);
    }

    // Screen management (simplified)
    showScreen(screenId: string): void {
        // Hide all screens
        this.applyStylesToAll('.screen', { display: 'none' });
        
        // Show the requested screen
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

    showPauseDialog(dialogId: string): void {
        const dialog = document.getElementById(dialogId);
        if (dialog) {
            dialog.style.display = 'flex';
        }
    }

    hidePauseDialog(dialogId: string): void {
        const dialog = document.getElementById(dialogId);
        if (dialog) {
            dialog.style.display = 'none';
        }
    }

    // Utility methods (unchanged)
    getPlayerNames(gameMode: string): { player1: string; player2?: string } {
        let player1Input: HTMLInputElement | null;
        let player2Input: HTMLInputElement | null = null;

        switch (gameMode) {
            case 'solo':
                player1Input = document.getElementById('player1-name') as HTMLInputElement;
                break;
            case 'local':
                player1Input = document.getElementById('player1-name-local') as HTMLInputElement;
                player2Input = document.getElementById('player2-name-local') as HTMLInputElement;
                break;
            case 'online':
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

    validatePlayerSetup(gameMode: string): boolean {
        const names = this.getPlayerNames(gameMode);
        
        if (!names.player1 || names.player1.length === 0) {
            alert('Please enter a name for Player 1');
            return false;
        }

        if (gameMode === 'local' && (!names.player2 || names.player2.length === 0)) {
            alert('Please enter a name for Player 2');
            return false;
        }

        return true;
    }
}

// Export singleton instance
export const uiManager = UIManager.getInstance();
