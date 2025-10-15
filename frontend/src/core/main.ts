import "@babylonjs/loaders";

import { ConnectionStatus } from '../shared/constants.js';
// import { setupLanguageSelector, updateLanguageDisplay } from '../translations/translations.js';
// import { updateLanguageDisplay } from '../translations/translations.js';
import { uiManager } from '../ui/UIManager.js';
import { AppStateManager } from './AppStateManager.js';
import { AuthManager } from './AuthManager.js';
import { MenuFlowManager } from './MenuFlowManager.js';
import { webSocketClient } from './WebSocketClient.js';
import { MessageType } from "../shared/constants.js";

import { DashboardManager } from './DashboardManager.js';

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
	// updateLanguageDisplay();
	// setupLanguageSelector();

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

// Initialize the application
window.addEventListener('load', loadPage);