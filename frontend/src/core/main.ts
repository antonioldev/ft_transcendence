import { updateLanguageDisplay, previousLanguage, nextLanguage } from '../translations/translations.js';
import { uiManager } from '../ui/UIManager.js';
import { webSocketClient } from '../game/WebSocketClient.js';
import { AuthManager } from './AuthManager.js';
import { GameModeManager } from './GameModeManager.js';
import { setupKeyboardListeners } from './KeyboardManager.js';
import { HistoryManager } from './HistoryManager.js';

function loadPage() {
    // Initialize core systems
    uiManager.initializeStyles();
    AuthManager.initialize();
    GameModeManager.initialize();
    setupKeyboardListeners();
    HistoryManager.initialize();
    updateLanguageDisplay();
    setupLanguageListeners();
    
    // Simple WebSocket status monitoring
    webSocketClient.onStatusChange((status) => {
        uiManager.updateConnectionStatus(status);
    });
}

function setupLanguageListeners() {
    const backBtn = document.getElementById('back');
    const forwardBtn = document.getElementById('forward');

    backBtn?.addEventListener('click', previousLanguage);
    forwardBtn?.addEventListener('click', nextLanguage);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', loadPage);