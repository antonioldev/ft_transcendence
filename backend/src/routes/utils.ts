import { Client } from "../network/Client.js";
import { ServerMessage } from "../shared/types.js";

export const sidClientMap: Map<string, Client> = new Map();

export function findOrCreateClient(sid: string): Client {
	let client: Client | undefined = sidClientMap.get(sid);
	if (!client) {
		console.log(`New client created, SID: ${sid}`);
		client = new Client(sid);
		sidClientMap.set(sid, client);
	}
	return client;
}

export function getClient(sid: string): Client | undefined {
	return (sidClientMap.get(sid));
}

export function removeClient(sid: string) {
	sidClientMap.delete(sid);
}

export function addClient(sid: string, client: Client) {
	sidClientMap.set(sid, client);
}

export function send(socket: any, message: ServerMessage) {
    socket.send(JSON.stringify(message), (err?: Error) => {
        if (err) console.error(`❌ Failed to send message: `, err.stack);
    });
}
