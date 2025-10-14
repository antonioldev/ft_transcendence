import { RegisterUser } from "../shared/types";
import { authManager } from "./AuthManager";
import { webSocketClient } from "./WebSocketClient";
const base_url: string = "https://localhost:8443"; // TEMP


export function getSID() {
	let SID = sessionStorage.getItem('sid');
	if (!SID) {
		SID = crypto.randomUUID();
		sessionStorage.setItem('sid', SID);
	}
	return (SID);
}
export async function sendRootRequest(): Promise<string> {
	const url = base_url + `?sid=${getSID()}`;
	const response = await fetch(url, {
		method: "GET",
		headers: { "Content-Type": "application/json"},
	})
	const data = await response.json();
	console.log(data.message);
	return (data.wsURL);
}

export async function registerNewUser(registrationInfo: RegisterUser) {
	// if (!this.isConnected()) {
	//     this.triggerCallback(WebSocketEvent.ERROR, 'Not connected to server');
	//     return;
	// }
	// const message: ClientMessage = {
	//     type: MessageType.REGISTER_USER,
	//     registerUser: registrationInfo
	// };
	// this.ws!.send(JSON.stringify(message));

	const response = await fetch(base_url, {
		method: "POST",
		headers: { "Content-Type": "application/json"},
		body: JSON.stringify(registrationInfo),
	})

	const data = await response.json();
	authManager.handleRegistrationResponse(data.result, data.message);
}
