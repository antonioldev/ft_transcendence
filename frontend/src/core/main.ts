import { updateLanguageDisplay, previousLanguage, nextLanguage } from '../translations/translations.js';
import { uiManager } from '../ui/UIManager.js';
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
    
    // NEW: Initialize history manager for browser back/forward support
    HistoryManager.initialize();
    
    // Initialize language display and setup language navigation
    updateLanguageDisplay();
    setupLanguageListeners();
}

function setupLanguageListeners() {
    const backBtn = document.getElementById('back');
    const forwardBtn = document.getElementById('forward');

    backBtn?.addEventListener('click', previousLanguage);
    forwardBtn?.addEventListener('click', nextLanguage);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', loadPage);