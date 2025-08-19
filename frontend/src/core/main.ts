import { updateLanguageDisplay, previousLanguage, nextLanguage } from '../translations/translations.js';
import { uiManager } from '../ui/UIManager.js';
import { webSocketClient } from './WebSocketClient.js';
import { AuthManager } from './AuthManager.js';
import { MenuFlowManager } from './MenuFlowManager.js';
import { AppStateManager } from './AppStateManager.js';
import { ConnectionStatus, WebSocketEvent } from '../shared/constants.js';
import { EL, requireElementById } from '../ui/elements.js';
import { DashboardManager } from './DashboardManager.js';
// import { MemoryLeakDetector } from '../utils/memory.js'

// Initialize the detector
// const memoryDetector = new MemoryLeakDetector();

// TODO: distinguish SESSION_ENDED FROM GAME_ENDED for tournaments
// TODO: in message before countdown, store the match_id and send match_id for:
    // - player movement messages
    // - player quits / disconnects

function loadPage(): void {
    // Initialize classes
    uiManager.initializeStyles();
    AppStateManager.initialize();
    AuthManager.initialize();
    MenuFlowManager.initialize();
    DashboardManager.initialize();

    // Setup language system
    updateLanguageDisplay();
    setupLanguageListeners();

    // memoryDetector.startMonitoring(); // Logs memory usage (only google) 

    // Setup WebSocket monitoring
    webSocketClient.registerCallback(WebSocketEvent.STATUS_CHANGE, (status: ConnectionStatus) => {
        uiManager.updateConnectionStatus(status);
    });
}

/**
 * Sets up language navigation button listeners.
 */
function setupLanguageListeners() {
    const backBtn = requireElementById(EL.BUTTONS.BACK);
    const forwardBtn = requireElementById(EL.BUTTONS.FORWARD);

    backBtn.addEventListener('click', previousLanguage);
    forwardBtn.addEventListener('click', nextLanguage);
}

// Initialize the application
window.addEventListener('load', loadPage);