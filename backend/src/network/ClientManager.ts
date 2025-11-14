import { gameManager } from "./GameManager.js";
import { logoutUser } from "../data/validation.js";

/**
 * Represents a physical device/browser connection to the server
 * One client can control multiple players (e.g., local multiplayer)
 */
export class Client {
    // id: string = generateClientId();
    sid: string;
    username: string = "default";       // Username for future authentication (not used yet)
    email: string = "default@default";          // email for future authentication (not used yet)
    password?: string;
    websocket?: any;        // websocket is assigned when they join their first game
    loggedIn: boolean = false;      // Whether this client is authenticated
    is_connected: Boolean = true;

    constructor(sid: string) {
        this.sid = sid;
    }

    setInfo(username: string, email: string, password: string) {
        this.username = username;       // Keep for future use
        this.email = email;       // Keep for future use
        this.password = password
    }
}

class ClientManager {
	sidClientMap: Map<string, Client> = new Map();

	createClientConnection(sid: string): Client {
		console.log(`New client created, SID: ${sid}`);
		const client = new Client(sid);
		this.sidClientMap.set(sid, client);
		return client;
	}

	 findOrCreateClient(sid: string): Client {
		let client: Client | undefined = this.sidClientMap.get(sid);
		if (!client) {
			client = this.createClientConnection(sid);
		}
		return client;
	}

	getClientConnection(sid: string): Client | undefined {
		return (this.sidClientMap.get(sid));
	}

	handleDisconnection(client: Client) {
		client.is_connected = false;
		gameManager.removeClientFromGame(client);
		setTimeout(() => { this.removeClient(client) }, 2000);
	}
	
	async removeClient(client:  Client) {
		if (!client.is_connected) {
			this.sidClientMap.delete(client.sid);
			await logoutUser(client.username); 
			console.log(`Removed client connection, SID: ${client.sid}`);
		}
	}
}

export const clientManager = new ClientManager();
