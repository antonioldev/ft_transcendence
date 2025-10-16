import "@babylonjs/loaders";
import { updateLanguageDisplay, previousLanguage, nextLanguage } from '../translations/translations.js';
import { uiManager } from '../ui/UIManager.js';
import { webSocketClient } from './WebSocketClient.js';
import { AuthManager } from './AuthManager.js';
import { MenuFlowManager } from './MenuFlowManager.js';
import { AppStateManager } from './AppStateManager.js';
import { ConnectionStatus, WebSocketEvent } from '../shared/constants.js';
import { EL, requireElementById } from '../ui/elements.js';
import { DashboardManager } from './DashboardManager.js';
import { sendRootRequest } from "./HTTPRequests.js";
// import { MemoryLeakDetector } from '../utils/memory.js'

// Initialize the detector
// const memoryDetector = new MemoryLeakDetector();

async function loadPage() {
    // Initialize classes
    AppStateManager.initialize();
    AuthManager.initialize();
    MenuFlowManager.initialize();
    // DashboardManager.initialize();

	// Setup language system
	updateLanguageDisplay();
	setupLanguageListeners();

	// memoryDetector.startMonitoring(); // Logs memory usage (only google) 

	// send "/" HTTP request and receive WebSocket URL to create ws
	const WS_URL = await sendRootRequest();
	// webSocketClient.connect(WS_URL);

	// // Setup WebSocket monitoring
	// webSocketClient.registerCallback(WebSocketEvent.STATUS_CHANGE, (status: ConnectionStatus) => {
	// 	uiManager.updateConnectionStatus(status);
	// });

	// if (webSocketClient.isConnected()) {
    //     uiManager.updateConnectionStatus(ConnectionStatus.CONNECTED);
    // } else {
    //     uiManager.updateConnectionStatus(ConnectionStatus.CONNECTING);
    // }
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