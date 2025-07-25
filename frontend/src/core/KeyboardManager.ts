import { Logger } from './LogManager.js';
import { appStateManager } from './AppStateManager.js';

/**
 * Manages global keyboard input for the application, particularly
 * game control keys like ESC for pause/resume and Y/N for confirmations.
 */
export class KeyboardManager {
    private static instance: KeyboardManager;

    // Gets the singleton instance of KeyboardManager.
    static getInstance(): KeyboardManager {
        if (!KeyboardManager.instance) {
            KeyboardManager.instance = new KeyboardManager();
        }
        return KeyboardManager.instance;
    }

    // Initializes the KeyboardManager by setting up event listeners. This ensures the keyboard manager is properly instantiated.
    static initialize(): void {
        const keybord = KeyboardManager.getInstance();
        keybord.setupEventListeners();
    }

    // ========================================
    // EVENT SETUP
    // ========================================

    // Sets up the main keyboard event listeners for the application.
    private setupEventListeners(): void {
        document.addEventListener('keydown', (event) => this.handleKeyDown(event));
        Logger.debug('Event listeners set up', 'KeyboardManager');
    }

    // ========================================
    // INPUT HANDLERS
    // ========================================

    // Main keyboard input handler that routes keys to specific handlers.
    private handleKeyDown(event: KeyboardEvent): void {
        // Handle escape key for game pause and resume
        if (event.key === 'Escape')
            this.handleEscKey();
        
        // Handle Y/N keys for pause dialog confirmation
        if (event.key === 'Y' || event.key === 'y' || event.key === 'N' || event.key === 'n')
            this.handleYesNoKey(event);
    }

    // Handles escape key presses for game pause and resume functionality.
    private handleEscKey(): void {
        Logger.debug('ESC key pressed', 'KeyboardManager', { 
            isInGame: appStateManager.isInGame(), 
            isPaused: appStateManager.isPaused() 
        });
        
        const currentGame = appStateManager.getCurrentGame();
        if (appStateManager.isInGame())
            currentGame?.pause();
        else if (appStateManager.isPaused())
            currentGame?.resume();
    }

    // Handles Y/N key presses for pause dialog confirmation.
    private handleYesNoKey(event: KeyboardEvent): void {
        if (appStateManager.isPaused()) {
            Logger.debug('${event.key} key pressed in pause state', 'KeyboardManager');    
            
            if (event.key === 'Y' || event.key === 'y')
                appStateManager.exitToMenu();
            else if (event.key === 'N' || event.key === 'n') {
                const currentGame = appStateManager.getCurrentGame();
                currentGame?.resume();
            }
        }
    }
}

export const keyboardManager = KeyboardManager.getInstance();