import { updateLanguageDisplay, previousLanguage, nextLanguage } from '../translations/translations.js';
import { uiManager } from '../ui/UIManager.js';
import { webSocketClient } from './WebSocketClient.js';
import { AuthManager } from './AuthManager.js';
import { MenuFlowManager } from './MenuFlowManager.js';
import { KeyboardManager } from './KeyboardManager.js';
import { HistoryManager } from './HistoryManager.js';
import { ConnectionStatus, WebSocketEvent } from '../shared/constants.js';
import { EL, requireElementById } from '../ui/elements.js';
import { DashboardManager } from './DashboardManager.js';
import { MemoryLeakDetector } from './.memory.js'



// Initialize the detector
const memoryDetector = new MemoryLeakDetector();
export { memoryDetector };

function loadPage(): void {
    // Initialize classes
    uiManager.initializeStyles();
    AuthManager.initialize();
    MenuFlowManager.initialize();
    KeyboardManager.initialize();
    HistoryManager.initialize();
    DashboardManager.initialize();

    // Setup language system
    updateLanguageDisplay();
    setupLanguageListeners();

    // memoryDetector.startMonitoring();

    // setInterval(() => {
    //     if ((performance as any).memory) {
    //         const memory = (performance as any).memory;
    //         console.log('Memory:', {
    //             used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
    //             total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + 'MB'
    //         });
    //     }
    // }, 5000);

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
document.addEventListener('DOMContentLoaded', loadPage);