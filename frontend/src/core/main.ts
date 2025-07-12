import { updateLanguageDisplay, previousLanguage, nextLanguage } from '../translations/translations.js';
import { uiManager } from '../ui/UIManager.js';
import { webSocketClient } from '../game/WebSocketClient.js';
import { AuthManager } from './AuthManager.js';
import { GameModeManager } from './GameModeManager.js';
import { KeyboardManager } from './KeyboardManager.js';
import { HistoryManager } from './HistoryManager.js';

function loadPage() {
    // Initialize classes
    uiManager.initializeStyles();
    AuthManager.initialize();
    GameModeManager.initialize();
    KeyboardManager.initialize();
    HistoryManager.initialize();

    // Setup language system
    updateLanguageDisplay();
    setupLanguageListeners();

    // Setup WebSocket monitoring
    webSocketClient.onStatusChange((status) => {
        uiManager.updateConnectionStatus(status);
    });
}

/**
 * Sets up language navigation button listeners.
 */
function setupLanguageListeners() {
    const backBtn = document.getElementById('back');
    const forwardBtn = document.getElementById('forward');

    backBtn?.addEventListener('click', previousLanguage);
    forwardBtn?.addEventListener('click', nextLanguage);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', loadPage);