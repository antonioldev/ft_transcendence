export class Client {
	id: string;
	username: string;
	password: string;
	websocket: any;

    constructor(id: string, username: string, password: string, websocket: any) {
        this.id = id;
        this.username = username;
        this.password = password;
		this.websocket = websocket;
	}
}

