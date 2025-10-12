import "@babylonjs/loaders";

import { ConnectionStatus, MessageType } from '../shared/constants.js';
import { nextLanguage, previousLanguage, updateLanguageDisplay } from '../translations/translations.js';
import { EL, requireElementById } from '../ui/elements.js';
import { uiManager } from '../ui/UIManager.js';
import { AppStateManager } from './AppStateManager.js';
import { AuthManager } from './AuthManager.js';
import { DashboardManager } from './DashboardManager.js';
import { MenuFlowManager } from './MenuFlowManager.js';
import { webSocketClient } from './WebSocketClient.js';
// import { MemoryLeakDetector } from '../utils/memory.js'

// Initialize the detector
// const memoryDetector = new MemoryLeakDetector();

function loadPage(): void {
	// Initialize classes
	AppStateManager.initialize();
	AuthManager.initialize();
	MenuFlowManager.initialize();
	DashboardManager.initialize();

	// Setup language system
	updateLanguageDisplay();
	setupLanguageListeners();

	// memoryDetector.startMonitoring(); // Logs memory usage (only google) 

	// Setup WebSocket monitoring
	webSocketClient.registerCallback(MessageType.STATUS_CHANGE, (status: ConnectionStatus) => {
		uiManager.updateConnectionStatus(status);
	});

	if (webSocketClient.isConnected()) {
		uiManager.updateConnectionStatus(ConnectionStatus.CONNECTED);
	} else {
		uiManager.updateConnectionStatus(ConnectionStatus.CONNECTING);
	}
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