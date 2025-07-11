import { GameMode } from '../shared/constants.js';

//TODO try to implement this https://nerdcave.com/tailwind-cheat-sheet

// The UIManager class is a singleton responsible for managing the UI styles and behavior of the application.
// It provides methods to initialize styles, manage screens, and handle user interactions.
class UIManager {
    // Singleton instance
    private static instance: UIManager;

    // Get the singleton instance of UIManager
    static getInstance(): UIManager {
        if (!UIManager.instance)
            UIManager.instance = new UIManager()
        return UIManager.instance;
    }

    // Simplified color palette for consistent theming
    private readonly colors = {
        primary: '#ff6b6b',      // Red accent
        background: '#1a1a1a',   // Dark background
        surface: '#333',         // Input backgrounds
        text: 'white',
        textSecondary: '#ccc',
        overlay: 'rgba(0, 0, 0, 0.9)'
    };

    // Centralized styles for UI elements
    private readonly styles = {
        // Base screen styling
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

        // Main menu screen styling
        mainScreen: {
            display: 'block',
            backgroundColor: 'black'
        },

        // Container styling for modals and overlays
        container: {
            backgroundColor: this.colors.background,
            padding: '3rem',
            borderRadius: '10px',
            textAlign: 'center' as const,
            border: `2px solid ${this.colors.primary}`
        },

        // Title styling for screens
        title: {
            fontSize: '2rem',
            color: this.colors.primary,
            marginBottom: '2rem',
            fontFamily: '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace',
            fontWeight: 'bold',
            textAlign: 'center' as const,
            userSelect: 'none' as const
        },

        // Main title with larger font size
        mainTitle: {
            fontSize: '4rem'
        },

        // Primary button styling for main actions
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

        // Secondary button styling for navigation
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

        // Language navigation button styling
        navButton: {
            background: 'none',
            border: 'none',
            cursor: 'pointer' as const,
            fontSize: '2rem',
            color: this.colors.text,
            margin: '0 10px'
        },

        buttonGroup: {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center' as const,
            gap: '15px',
            margin: '2rem 0'
        },

        // Language selector container styling
        selectorContainer: {
            display: 'inline-flex',
            alignItems: 'center' as const,
            justifyContent: 'space-between' as const,
            width: '350px',
            height: '50px',
            fontSize: '1rem',
            fontWeight: 'bold',
            fontFamily: '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace'
        },

        selectorDisplay: {
            fontWeight: 'bold',
            textAlign: 'center' as const,
            userSelect: 'none' as const,
            flex: '1',
            color: this.colors.text
        },

        // Form elements styling
        setupForm: {
            display: 'none',
            margin: '1rem 0'
        },

        label: {
            fontSize: '1rem',
            fontFamily: '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace',
            color: this.colors.text,
            marginTop: '15px',
            marginBottom: '5px',
            display: 'block'
        },

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

        info: {
            fontSize: '0.9rem',
            fontFamily: '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace',
            color: this.colors.textSecondary,
            fontStyle: 'italic' as const
        },

        // Pause dialog styling
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
        },
    };

    // Utility method to apply styles to a single element
    private applyStyles(element: HTMLElement, styles: Record<string, any>): void {
        Object.assign(element.style, styles);
    }

    // Utility method to apply styles to all elements matching a selector
    private applyStylesToAll(selector: string, styles: Record<string, any>): void {
        document.querySelectorAll(selector).forEach((element) => {
            this.applyStyles(element as HTMLElement, styles);
        });
    }

    // Initialize all styles for the application
    initializeStyles(): void {
        this.setupScreens();
        this.setupButtons();
        this.setupForms();
        this.setupSelectors();
        this.setupPauseDialogs();
    }

    // Setup styles for screens
    private setupScreens(): void {
        // Apply base screen styling to all screens
        this.applyStylesToAll('.screen', this.styles.screen);
        
        // Special styling for the main menu
        const mainMenu = document.getElementById('main-menu');
        if (mainMenu) {
            this.applyStyles(mainMenu, this.styles.mainScreen);
        }
        
        // Apply container styling
        this.applyStylesToAll('.screen-container', this.styles.container);
        
        this.applyStylesToAll('.button-group', this.styles.buttonGroup);

        // Apply title styling
        this.applyStylesToAll('.screen-title', this.styles.title);

        // Special styling for the main title
        const mainTitle = document.getElementById('main-title');
        if (mainTitle) {
            this.applyStyles(mainTitle, this.styles.title);
            this.applyStyles(mainTitle, this.styles.mainTitle);
            mainTitle.textContent = '🏓 PONG';
        }
    }

    // Setup styles for buttons
    private setupButtons(): void {
        // Apply primary button styling
        this.applyStylesToAll('.button-primary', this.styles.primaryButton);

        // Apply secondary button styling  
        this.applyStylesToAll('.button-secondary', this.styles.secondaryButton);

        // Apply navigation button styling
        this.applyStylesToAll('.button-nav', this.styles.navButton);

        // Apply disabled button styling
        this.applyStylesToAll('.button-disabled', { opacity: '0.5', cursor: 'not-allowed' });
    }

    // Setup styles for forms
    private setupForms(): void {
        this.applyStylesToAll('.setup-form', this.styles.setupForm);
        this.applyStylesToAll('.input-label', this.styles.label);
        this.applyStylesToAll('.input', this.styles.input);
        this.applyStylesToAll('.setup-info', this.styles.info);
    }

    // Setup styles for language navigation
    private setupSelectors(): void {
        this.applyStylesToAll('.selector-container', this.styles.selectorContainer);
        this.applyStylesToAll('.selector-display', this.styles.selectorDisplay);
    }

    // Setup styles for pause dialogs
    private setupPauseDialogs(): void {
        this.applyStylesToAll('.pause-dialog', this.styles.pauseDialog);
    }

    // Screen management methods
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
        if (dialog)
            dialog.style.display = 'flex';
    }

    hidePauseDialog(dialogId: string): void {
        const dialog = document.getElementById(dialogId);
        if (dialog)
            dialog.style.display = 'none';
    }

    // Utility methods for player setup and validation
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
        // const names = this.getPlayerNames(gameMode);
        
        // if (!names.player1 || names.player1.length === 0) {
        //     alert(getAlert('player1'));
        //     return false;
        // }

        // if (gameMode === 'local' && (!names.player2 || names.player2.length === 0)) {
        //     alert(getAlert('player2'));
        //     return false;
        // }

        return true;
    }
}

// Export singleton instance
export const uiManager = UIManager.getInstance();
