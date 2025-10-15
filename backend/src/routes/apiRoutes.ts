import { Player } from '../network/Client.js';
import { FastifyInstance } from 'fastify';
import * as db from "../data/validation.js";
import { gameManager } from '../network/GameManager.js';
import { AuthCode, GameMode, AiDifficulty } from '../shared/constants.js';
import { GAME_CONFIG } from '../shared/gameConfig.js';
import { removeClient, findOrCreateClient, getClient, addClient } from './utils.js';


/* --- HTTP Endpoints --- */

export async function APIRoutes(app: FastifyInstance) {

	// ROOT
	app.get('/', async (request, reply) => {
		const { sid } = request.query as { sid?: string};
		console.log(`SID = ${sid}`);
		if (!sid) {
			return reply.code(400).send({ message: "Error: missing SID"} );
		}
		let client = findOrCreateClient(sid);
		// check for double user
		client.is_connected = true;
		
		reply.send( { 
			message: "Welcome to Battle Pong!",
			wsURL: `wss://${request.hostname}/ws?sid=${encodeURIComponent(sid)}`,
		});
		console.log(`New Client connected: sid = ${sid}`);
	});

	// LOGIN
	app.post('/login', async (request, reply) => {
		const { sid } = request.query as { sid: string};
		let client = findOrCreateClient(sid);

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
				client.setInfo(clientInfo.username, clientInfo.email);
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
	app.post('/logout', async (request, reply) => {
		const { sid } = request.query as { sid: string};
		let client = getClient(sid);
		if (!client) {
			return reply.code(401).send( {success: false, message: "Logout failed: user not logged in"});
		}

		removeClient(sid);
		await db.logoutUser(client.username);
		console.log(`User ${client.username} successfully logged out`);
		return reply.send({ success: true, message: `User '${client.username}' successfully logged out` })
	})

	// REGISTER
	app.post('/register', async (request, reply) => {
		const { username, email, password } = request.body as { username: string, email: string, password: string };

		if (!username || !email || !password) {
			return reply.code(401).send({ result: AuthCode.BAD_CREDENTIALS, message: 'Missing username, email, or password' })
		}

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
	app.post('/join', (request, reply) => {
		const { sid } = request.query as { sid: string };
		const { mode, players, capacity, aiDifficulty  } = request.body as 
			{ mode: GameMode, players: Player[], capacity?: number, aiDifficulty?: AiDifficulty };
		
		const client = findOrCreateClient(sid);
		const gameSession = gameManager.findOrCreateGame(mode, capacity ?? undefined);
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
	app.get('/stats', (request, reply) => {
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
	app.get('/history', (request, reply) => {
		const { username } = request.query as { username: string };
		const history = db.getUserStats(username); // from DB
		if (!history) {
			console.log(`Failed to send game history: user '${username}' not found`);
			return reply.code(401).send({ success: false, message: "User not found" });
		}
		console.log(`User stats sent to ${username}`);
		return reply.send({ success: true, history: history });
	})
}
