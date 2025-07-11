import { updateLanguageDisplay, previousLanguage, nextLanguage } from '../translations/translations.js';
import { uiManager } from '../ui/UIManager.js';
import { AuthManager } from './AuthManager.js';
import { GameModeManager } from './GameModeManager.js';
import { setupKeyboardListeners } from './KeyboardManager.js';

function loadPage() {
    // Initialize core systems
    uiManager.initializeStyles();
    AuthManager.initialize();
    GameModeManager.initialize();
    setupKeyboardListeners();
    
    // Initialize language display and setup language navigation
    updateLanguageDisplay();
    setupLanguageListeners();
    
    // Show the main menu
    uiManager.showScreen('main-menu');
}

function setupLanguageListeners() {
    const backBtn = document.getElementById('back');
    const forwardBtn = document.getElementById('forward');

    backBtn?.addEventListener('click', previousLanguage);
    forwardBtn?.addEventListener('click', nextLanguage);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', loadPage);