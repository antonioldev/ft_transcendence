import { Client } from "../network/Client.js";
import { ServerMessage } from "../shared/types.js";

export const sidClientMap: Map<string, Client> = new Map();

export function findOrCreateClient(sid: string): Client {
	let client: Client | undefined = sidClientMap.get(sid);
	if (!client) {
		client = createClientConnection(sid);
	}
	return client;
}

export function createClientConnection(sid: string): Client {
	console.log(`New client created, SID: ${sid}`);
	const client = new Client(sid);
	sidClientMap.set(sid, client);
	return client;
}

export function getClientConnection(sid: string): Client | undefined {
	return (sidClientMap.get(sid));
}

export function removeClientConnection(sid: string) {
	console.log(`Removed client connection, SID: ${sid}`);
	sidClientMap.delete(sid);
}

export function send(socket: any, message: ServerMessage) {
    socket.send(JSON.stringify(message), (err?: Error) => {
        if (err) console.error(`❌ Failed to send message: `, err.stack);
    });
}
