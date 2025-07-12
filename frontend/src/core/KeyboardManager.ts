import { appStateManager } from './AppStateManager.js';
import { disposeCurrentGame } from './utils.js';

/**
 * Manages global keyboard input for the application, particularly
 * game control keys like ESC for pause/resume and Y/N for confirmations.
 */
export class KeyboardManager {
    private static instance: KeyboardManager;

    /**
     * Gets the singleton instance of KeyboardManager.
     * @returns The singleton instance.
     */
    static getInstance(): KeyboardManager {
        if (!KeyboardManager.instance) {
            KeyboardManager.instance = new KeyboardManager();
        }
        return KeyboardManager.instance;
    }

    /**
     * Initializes the KeyboardManager by setting up event listeners.
     * This ensures the keyboard manager is properly instantiated.
     */
    static initialize(): void {
        KeyboardManager.getInstance();
    }

    /**
     * Private constructor that sets up event listeners when instance is created.
     */
    private constructor() {
        this.setupEventListeners();
    }

    // ========================================
    // EVENT SETUP
    // ========================================
    /**
     * Sets up the main keyboard event listeners for the application.
     */
    private setupEventListeners(): void {
        document.addEventListener('keydown', (event) => this.handleKeyDown(event));
        console.log('🎮 KeyboardManager: Event listeners set up'); // Debug log
    }

    // ========================================
    // INPUT PROCESSING
    // ========================================
    /**
     * Main keyboard input handler that routes keys to specific handlers.
     * @param event - The keyboard event to process.
     */
    private handleKeyDown(event: KeyboardEvent): void {
        // Handle escape key for game pause and resume
        if (event.key === 'Escape')
            this.handleEscKey();
        
        // Handle Y/N keys for pause dialog confirmation
        if (event.key === 'Y' || event.key === 'y' || event.key === 'N' || event.key === 'n')
            this.handleYesNoKey(event);
    }

    // ========================================
    // GAME CONTROL HANDLERS
    // ========================================
    /**
     * Handles escape key presses for game pause and resume functionality.
     */
    private handleEscKey(): void {
        console.log('🎮 ESC key pressed', { 
            isInGame: appStateManager.isInGame(), 
            isPaused: appStateManager.isPaused() 
        });
        
        if (appStateManager.isInGame())
            appStateManager.pauseCurrentGame();
        else if (appStateManager.isPaused())
            appStateManager.resumeGame();
    }

    /**
     * Handles Y/N key presses for pause dialog confirmation.
     * @param event - The keyboard event containing the pressed key.
     */
    private handleYesNoKey(event: KeyboardEvent): void {
        if (appStateManager.isPaused()) {
            console.log(`🎮 ${event.key} key pressed in pause state`);
            
            if (event.key === 'Y' || event.key === 'y')
                appStateManager.exitToMenu();
            else if (event.key === 'N' || event.key === 'n')
                appStateManager.resumeGame();
        }
    }

    /**
     * Adds a custom key handler for specific key presses.
     * @param key - The key to listen for.
     * @param handler - The function to call when the key is pressed.
     */
    addKeyHandler(key: string, handler: (event: KeyboardEvent) => void): void {
        document.addEventListener('keydown', (event) => {
            if (event.key === key) {
                handler(event);
            }
        });
    }
}

export const keyboardManager = KeyboardManager.getInstance();