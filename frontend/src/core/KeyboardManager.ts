import { gameStateManager } from './GameStateManager.js';

export class KeyboardManager {
    private static instance: KeyboardManager;

    static getInstance(): KeyboardManager {
        if (!KeyboardManager.instance) {
            KeyboardManager.instance = new KeyboardManager();
        }
        return KeyboardManager.instance;
    }

    static initialize(): void {
        const keyboardManager = KeyboardManager.getInstance();
        keyboardManager.setupEventListeners();
    }

    private setupEventListeners(): void {
        document.addEventListener('keydown', (event) => this.handleKeyDown(event));
    }

    private handleKeyDown(event: KeyboardEvent): void {
        // Handle escape key for game pause/resume
        if (event.key === 'Escape') {
            this.handleEscKey();
        }
        
        // Handle Y/N keys for pause dialog
        if (event.key === 'Y' || event.key === 'y' || event.key === 'N' || event.key === 'n') {
            this.handleYesNoKey(event);
        }
    }

    private handleEscKey(): void {
        if (gameStateManager.isInGame()) {
            gameStateManager.pauseCurrentGame();
        } else if (gameStateManager.isPaused()) {
            gameStateManager.resumeGame();
        }
    }

    private handleYesNoKey(event: KeyboardEvent): void {
        if (gameStateManager.isPaused()) {
            if (event.key === 'Y' || event.key === 'y') {
                gameStateManager.exitToMenu();
            } else if (event.key === 'N' || event.key === 'n') {
                gameStateManager.resumeGame();
            }
        }
    }

    // Method to add custom key handlers if needed in the future
    addKeyHandler(key: string, handler: (event: KeyboardEvent) => void): void {
        document.addEventListener('keydown', (event) => {
            if (event.key === key) {
                handler(event);
            }
        });
    }
}

// Export singleton instance and setup function
export const keyboardManager = KeyboardManager.getInstance();
export const setupKeyboardListeners = KeyboardManager.initialize;