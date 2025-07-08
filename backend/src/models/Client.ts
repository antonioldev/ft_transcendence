/**
 * Represents a client connected to the system.
 * Each client has a unique ID, username, password, and a websocket connection.
 */
export class Client {
	id: string;
	username: string;
	password: string;
	websocket: any;

    /**
     * Initializes a new instance of the Client class.
     * @param id - The unique identifier for the client.
     * @param username - The username of the client.
     * @param password - The password of the client.
     * @param websocket - The websocket connection associated with the client.
     */
    constructor(id: string, username: string, password: string, websocket: any) {
        this.id = id;
        this.username = username;
        this.password = password;
		this.websocket = websocket;
	}
}

