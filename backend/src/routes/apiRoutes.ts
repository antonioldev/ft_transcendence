import { Player } from '../network/Client.js';
import { FastifyInstance } from 'fastify';
import * as db from "../data/validation.js";
import { gameManager } from '../network/GameManager.js';
import { AuthCode, GameMode, AiDifficulty } from '../shared/constants.js';
import { GAME_CONFIG } from '../shared/gameConfig.js';
import { removeClientConnection, findOrCreateClient, getClientConnection, createClientConnection } from './utils.js';


/* --- HTTP Endpoints --- */

export async function APIRoutes(app: FastifyInstance) {

	// ROOT
	app.get('/api/root', async (request, reply) => {
		
		const { sid } = request.query as { sid?: string};
		if (!sid) {
			console.log(`ROOT request failed: missing SID`);
			return reply.code(400).send({ status: AuthCode.BAD_CREDENTIALS, message: "Error: missing SID"} );
		}
		console.log(`ROOT request received from: ${sid}`);
		let client = getClientConnection(sid);
		if (!client) {
			client = createClientConnection(sid);
		} 
		else if (!client.is_connected) {
			console.log("Client refresh")
			reply.send({ 
				status: AuthCode.ALREADY_LOGIN, 
				message: "Welcome back to Battle Pong!",
				user: {
					username: client.username,
					email: client.email,
					password: client.password,
				}
			});
		}
		client.is_connected = true;
		// check for double user ???
		
		reply.send( { status: AuthCode.OK, message: "Welcome to Battle Pong!" });
	});

	// LOGIN
	app.post('/api/login', async (request, reply) => {
		const { sid } = request.query as { sid: string};
		if (!sid) {
			console.log(`/login request failed: missing SID`);
			return reply.code(400).send({ message: "Error: missing SID"} );
		}
		console.log(`/login request received from: ${sid}`);
		let client = getClientConnection(sid);
		if (!client) {
			console.log("login failed: user not logged in");
			return reply.code(401).send( {success: false, message: "login failed: user not logged in"});
		}

		// get login details from Google Auth token or by default request body
		let clientInfo: { username: string, email: string, password: string };
		const { token } = request.body as { token?: string };
		if (token) {
			try {
				const decoded = app.jwt.verify(token) as { user: { username: string; email: string; password: string } };
				clientInfo = decoded.user;
			}
			catch (err) {
				return reply.code(401).send({result: AuthCode.BAD_CREDENTIALS, message: "Error: Invalid JWT token"});
			}
		}
		else {
			clientInfo = request.body as { username: string, email: string, password: string };
		}
		
		// Verify login with db
		const result = await db.verifyLogin(clientInfo.username, clientInfo.password);
		let error: string = "";
		switch (result) {
			case AuthCode.OK:
				client.setInfo(clientInfo.username, clientInfo.email, clientInfo.password);
				client.loggedIn = true;
				console.log(`User ${client.username} successfully logged in`);
				return reply.send({ 
					result: result,
					message: `User '${client.username}' successfully logged in` });
			
			case AuthCode.NOT_FOUND:
				error = `User '${client.username}' doesn't exist`;
				break ;
			case AuthCode.BAD_CREDENTIALS:
				error = `Username or password incorrect`;
				break ;				
			case AuthCode.ALREADY_LOGIN:
				error = `User already loggin in`;
				break ;
		}
		console.log(`Cannot login user: ${error}`);
		return reply.code(401).send({ result: result, message: error })
	});

	// LOGOUT
	app.post('/api/logout', async (request, reply) => {
		const { sid } = request.query as { sid: string};
		if (!sid) {
			console.log(`/logout request failed: missing SID`);
			return reply.code(400).send({ message: "Error: missing SID"} );
		}
		console.log(`/logout request received from: ${sid}`);
		let client = getClientConnection(sid);
		if (!client) {
			console.log("Logout failed: user not logged in");
			return reply.code(401).send( {success: false, message: "Logout failed: user not logged in"});
		}

		await db.logoutUser(client.username);
		console.log(`User ${client.username} successfully logged out`);
		return reply.send({ success: true, message: `User '${client.username}' successfully logged out` })
	})

	// REGISTER
	app.post('/api/register', async (request, reply) => {
		const { sid } = request.query as { sid: string};
		if (!sid) {
			console.log(`/register request failed: missing SID`);
			return reply.code(400).send({ message: "Error: missing SID"} );
		}
		const { username, email, password } = request.body as { username: string, email: string, password: string };
		if (!username || !email || !password) {
			console.log(`/register request failed: missing user info`);
			return reply.code(401).send({ result: AuthCode.BAD_CREDENTIALS, message: 'Missing username, email, or password' })
		}
		console.log(`/register request received from: ${sid}`);

		const result = await db.registerNewUser(username, email, password);
		let message: string;
		let statusCode: number;
		switch (result) {
			case AuthCode.OK:
				statusCode = 201;
				message = `User ${username} successfully registered`;
				break;
			case AuthCode.USER_EXISTS:
				statusCode = 401;
				message = `Registration failed: user with that email already exists`;
				break;
			case AuthCode.USERNAME_TAKEN:
				statusCode = 401;
				message = `Registration failed: username '${username}' taken`;
				break;
			default:
				statusCode = 404;
				message = 'Registration failed: db failed';
				break;
		}
		return reply.code(statusCode).send({ result: result, message: message})
	})

	// JOIN GAME 
	app.post('/api/join', (request, reply) => {
		const { sid } = request.query as { sid: string };
		if (!sid) {
			console.log(`/join request failed: missing SID`);
			return reply.code(400).send({ success: false, message: "Error: missing SID"} );
		}

		const { gameMode, players, capacity, aiDifficulty  } = request.body as 
			{ gameMode: GameMode, players: Player[], capacity?: number, aiDifficulty?: AiDifficulty };

		if (!gameMode || !players ) {
			console.log(`/join request failed: missing game info`);
			return reply.code(401).send({ success: false, message: 'Missing username, email, or password' })
		}

		let client = getClientConnection(sid);
		if (!client) {
			console.log("join failed: user not logged in");
			return reply.code(401).send( {success: false, message: "join failed: user not logged in"});
		}
		const gameSession = gameManager.findOrCreateGame(gameMode, capacity ?? undefined);
		gameManager.addClient(client, gameSession);

		if (aiDifficulty !== undefined && gameSession.ai_difficulty === undefined) {
			gameSession.set_ai_difficulty(aiDifficulty);
		}

		// add players to gameSession
		for (const player of players ?? []) {
			gameSession.add_player(new Player(player.id, player.name, client));
		}

		// start game if full or local, otherwise wait for players to join
		if ((gameSession.full) || gameSession.mode === GameMode.TOURNAMENT_LOCAL) {
			gameManager.runGame(gameSession);
		}
		else {
			setTimeout(() => { gameManager.runGame(gameSession) }, (GAME_CONFIG.maxJoinWaitTime * 1000));
		}

		return reply.send({ success: true, message: `Client joined game ${gameSession.id}` })
	})

	// USER STATS
	app.get('/api/stats', (request, reply) => {
		const { username } = request.query as { username: string };
		const stats = db.getUserStats(username); // from DB
		if (!stats) {
			console.log(`Failed to send stats: user '${username}' not found`);
			return reply.code(401).send({ success: false, message: "User not found" });
		}
		console.log(`User stats sent to ${username}`);
		return reply.send({ success: true, stats: stats });
	})

	// GAME HISTORY
	app.get('/api/history', (request, reply) => {
		const { username } = request.query as { username: string };
		const history = db.getGameHistoryForUser(username); // from DB
		if (!history) {
			console.log(`Failed to send game history: user '${username}' not found`);
			return reply.code(401).send({ success: false, message: "User not found" });
		}
		console.log(`User history sent to ${username}`);
		return reply.send({ success: true, history: history });
	})
}
