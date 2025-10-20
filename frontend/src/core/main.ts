import "@babylonjs/loaders";
import { updateLanguageDisplay, previousLanguage, nextLanguage } from '../translations/translations.js';
import { uiManager } from '../ui/UIManager.js';
import { webSocketClient } from './WebSocketClient.js';
import { authManager } from './AuthManager.js';
// import { menuFlowManager } from './MenuFlowManager.js';
import { appManager } from './AppManager.js';
import { ConnectionStatus, WebSocketEvent } from '../shared/constants.js';
import { EL, requireElementById } from '../ui/elements.js';
import { getSID, sendGET } from "./HTTPRequests.js";
// import { MemoryLeakDetector } from '../utils/memory.js'

// Initialize the detector
// const memoryDetector = new MemoryLeakDetector();

async function loadPage() {
    // Initialize classes
    appManager.initialize();
    authManager.initialize();
    // menuFlowManager.initialize();
    // dashboardManager.initialize();

	// Setup language system
	updateLanguageDisplay();
	setupLanguageListeners();

	// memoryDetector.startMonitoring(); // Logs memory usage (only google) 

	// send "/" HTTP request and create ws
	await sendGET("root");
	webSocketClient.connect(`wss://${window.location.hostname}:8443/ws?sid=${getSID()}`);

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