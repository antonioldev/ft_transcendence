import { Player } from '../game/Player.js';
import { FastifyInstance } from 'fastify';
import * as db from "../data/validation.js";
import { gameManager } from '../network/GameManager.js';
import { AuthCode, GameMode, AiDifficulty } from '../shared/constants.js';
import { GAME_CONFIG } from '../shared/gameConfig.js';
import { clientManager } from '../network/ClientManager.js';
import { updateUserSettings, getUserSettings } from '../data/database.js';

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
		let client = clientManager.getClientConnection(sid);
		if (!client) {
			client = clientManager.createClientConnection(sid);
		} 
		else if (!client.is_connected && client.loggedIn) { // testing this one
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
		else {
			reply.send({ status: AuthCode.OK, message: "Welcome to Battle Pong!" });
		}
		client.is_connected = true;
	});

	// LOGIN
	app.post('/api/login', async (request, reply) => {
		const { sid } = request.query as { sid: string};
		if (!sid) {
			console.log(`/login request failed: missing SID`);
			return reply.code(400).send({ message: "Error: missing SID"} );
		}
		console.log(`/login request received from: ${sid}`);
		let client = clientManager.getClientConnection(sid);
		if (!client) { // testing what happen with client connecting again
			console.log("login failed: client not recognised");
			return reply.code(401).send( { success: false, message: "login failed: client not recognised" });
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
		let client = clientManager.getClientConnection(sid);
		if (!client) {
			console.log("Logout failed: user not logged in");
			return reply.code(401).send( {success: false, message: "Logout failed: user not logged in"});
		}
		
		client.loggedIn = false;
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

		if (gameMode === undefined || gameMode === null || !players ) {
			console.log(`/join request failed: missing game info`);
			return reply.code(401).send({ success: false, message: 'Missing username, email, or password' })
		}

		let client = clientManager.getClientConnection(sid);
		if (!client) {
			console.log("join failed: user not logged in");
			return reply.code(401).send( {success: false, message: "join failed: user not logged in"});
		}
		const gameSession = gameManager.findOrCreateGame(gameMode, capacity ?? undefined);
		gameManager.addClientToGame(client, gameSession);

		if (aiDifficulty !== undefined && gameSession.ai_difficulty === undefined) {
			gameSession.set_ai_difficulty(aiDifficulty);
		}

		// add players to gameSession
		for (const player of players ?? []) {
			gameSession.add_player(new Player(player.id, player.name, client));
		}

		// start game if full or local, otherwise wait for more players to join
		if (gameSession.full || gameSession.mode === GameMode.TOURNAMENT_LOCAL) {
			gameManager.runGame(gameSession);
		}
		else if (gameSession.mode === GameMode.TOURNAMENT_REMOTE) {
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
		// print duration from history only
		if (history) {
			history.forEach((entry) => {
				console.log(`[APIROUTES.TS] /api/history: Game played at: ${entry.playedAt}, isTournament: ${entry.isTournament}, opponent: ${entry.opponent}, score: ${entry.score}, result: ${entry.result}`);
			});
		}
		if (!history) {
			console.log(`Failed to send game history: user '${username}' not found`);
			return reply.code(401).send({ success: false, message: "User not found" });
		}
		console.log(`User history sent to ${username}`);
		return reply.send({ success: true, history: history });
	})

	// UPDATE USER SETTINGS
	app.post('/api/settings', async  (request, reply) =>{
		const { sid } = request.query as { sid: string };
		if (!sid) {
			console.log(`/settings request failed: missing SID`);
			return reply.code(400).send({ success: false, message: "Error: missing SID"} );
		}

		const client = clientManager.getClientConnection(sid);
		if (!client || !client.loggedIn) {
			console.log("Update settings failed: user not logged in");
			return reply.code(401).send( {success: false, message: "User not authenticated"});
		}

		const currentSettings = getUserSettings(client.username);
		const requestBody = request.body as {
			musicEnabled?: boolean,
			soundEffectsEnabled?: boolean,
			language?: number,
			scene3D?: string
		};

		const {
			musicEnabled = currentSettings?.musicEnabled,
			soundEffectsEnabled = currentSettings?.soundEffectsEnabled,
			language = currentSettings?.language,
			scene3D = currentSettings?.scene3D
		} = requestBody;

		const success = updateUserSettings(
			client.username,
			musicEnabled,
			soundEffectsEnabled,
			language,
			scene3D
		);

		if (!success) {
			console.log(`Failed to update settings for user '${client.username}'`);
			return reply.code(500).send({ success: false, message: "Failed to update settings" });
		}

		console.log(`Settings updated successfully for user '${client.username}'`);
		return reply.code(200).send({ success: true, message: "Settings updated successfully" });
	})

	// GET USER SETTINGS
	app.get('/api/settings', (request, reply) => {
		const { sid } = request.query as { sid: string };
		if (!sid) {
			console.log(`/settings request failed: missing SID`);
			return reply.code(400).send({ success: false, message: "Error: missing SID"} );
		}

		const client = clientManager.getClientConnection(sid);
		if (!client || !client.loggedIn) {
			console.log("Get settings failed: user not logged in");
			return reply.code(401).send( {success: false, message: "User not authenticated"});
		}

		const userSettings = getUserSettings(client.username);
		if (!userSettings) {
			console.log(`Failed to get settings for user '${client.username}'`);
			return reply.code(500).send({ success: false, message: "Failed to get settings" });
		}

		return reply.send({ success: true, settings: userSettings });
	});
}
