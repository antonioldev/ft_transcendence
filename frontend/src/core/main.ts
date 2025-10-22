import "@babylonjs/loaders";
import { updateLanguageDisplay, previousLanguage, nextLanguage, getCurrentTranslation } from '../translations/translations.js';
import { uiManager } from '../ui/UIManager.js';
import { webSocketClient } from './WebSocketClient.js';
import { authManager } from './AuthManager.js';
import { appManager } from './AppManager.js';
import { AuthCode, ConnectionStatus, MessageType } from '../shared/constants.js';
import { EL, requireElementById } from '../ui/elements.js';
import { getSID, sendGET } from "./HTTPRequests.js";

async function loadPage() {
    // Initialize classes
    appManager.initialize();
    authManager.initialize();

	// Setup language system
	updateLanguageDisplay();
	// setupLanguageListeners();

	// send "/" HTTP request and create ws
	const data = await sendGET("root");
	console.log(data.message);
	if (data.status === AuthCode.ALREADY_LOGIN) {
		const userData: { username: string, email: string, password: string } = data.user;
		// const responseData = await sendPOST("login", { username: userData.username, password: userData.password });
		authManager.handleLoginResponse(AuthCode.OK, "Login after client refresh", userData.username, getCurrentTranslation());
	}
	webSocketClient.connect(`wss://${window.location.hostname}:8443/ws?sid=${getSID()}`);

	// Setup WebSocket monitoring
	webSocketClient.registerCallback(MessageType.STATUS_CHANGE, (status: ConnectionStatus) => {
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