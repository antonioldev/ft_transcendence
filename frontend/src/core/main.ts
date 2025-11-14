import "@babylonjs/loaders";
import { AuthCode, MessageType } from '../shared/constants.js';
import { getCurrentTranslation, updateLanguageDisplay } from '../translations/translations.js';
import { uiManager } from '../ui/UIManager.js';
import { ConnectionStatus } from "../utils/constants.js";
import { appManager } from './AppManager.js';
import { authManager } from './AuthManager.js';
import { getSID, sendGET } from "./HTTPRequests.js";
import { webSocketClient } from './WebSocketClient.js';
import { MemoryLeakDetector } from "../utils/memory.js";

const memoryDetector = new MemoryLeakDetector();

async function loadPage() {
    appManager.initialize();
    authManager.initialize();

	updateLanguageDisplay();
	memoryDetector.startMonitoring();

	// send "/" HTTP request and create ws
	const data = await sendGET("root");
	console.log(data.message);
	if (data.status === AuthCode.ALREADY_LOGIN) {
		const userData: { username: string, email: string, password: string } = data.user;
		authManager.handleLoginResponse(AuthCode.OK, "Login after client refresh", userData.username, getCurrentTranslation());
	}
	webSocketClient.connect(`wss://${window.location.hostname}:8443/ws?sid=${getSID()}`);

	// Setup WebSocket monitoring
	webSocketClient.registerCallback(MessageType.STATUS_CHANGE, (status: ConnectionStatus) => {
		uiManager.updateConnectionStatus(status);
	});
}

// Initialize the application
window.addEventListener('load', loadPage);