// Functions to sanitize input and handle user authentication/session logic
import * as dbFunction from '../data/database.js';
import { verifyPassword, hashPassword } from './authentification.js';
import { UserProfileData, UserStats, GameHistoryEntry } from '../shared/types.js';

/**
 * Check login credentials.
 * Returns:
 *   0 = success
 *   1 = user not found
 *   2 = wrong password
 *   3 = session creation failed
 */
export async function verifyLogin(username: string, password: string): Promise<number> {
	const isEmail = username.includes('@');

	let userExists = false;
	let user_email = '';

	if (isEmail) {
		// Check by email
		const existsResult = dbFunction.userExist(undefined, undefined, username);
		userExists = existsResult === 1;
		user_email = username;
	} else {
		// Check by username
		const existsResult = dbFunction.userExist(undefined, username, undefined);
		userExists = existsResult === 2;
		if (userExists) {
			user_email = dbFunction.getUserEmail(username);
		}
	}

	if (!userExists) return 1;

	// Verify password against stored hash
	const storedPwd = dbFunction.getUserPwd(user_email);
	console.log('verifyLogin: comparing given password with stored hash', password, storedPwd);

	const isMatch = await verifyPassword(storedPwd, password);
	if (!isMatch) return 2;

	const userId = dbFunction.retrieveUserID(username);
	const sid = dbFunction.createSession(userId);
	if (!sid) {
		console.log(`verifyLogin: failed to create session, sid=${sid}`);
		return 3;
	}

	return 0;
}

/**
 * End user session by username.
 * Returns 1 if logout succeeded, 0 otherwise.
 */
export async function logoutUser(username: string): Promise<number> {
	const check = dbFunction.userExist(undefined, username);
	if (check === 0) {
		console.log("logoutUser: user not found");
		return 0;
	}

	const userId = dbFunction.retrieveUserID(username);
	if (userId === -1) {
		console.log('logoutUser: failed to get userId');
		return 0;
	}

	try {
		dbFunction.deleteSessionLogout(userId);
		console.log('logoutUser: success');
		return 1;
	} catch (err) {
		console.error('logoutUser: error deleting session', err);
		return 0;
	}
}

/**
 * Get user info from a session id.
 */
export function getUserBySession(sid: string): { id: number; username: string; email?: string } | null {
	try {
		const row = dbFunction.getUserBySession(sid);
		console.log(
			'[getUserBySession]',
			row ? `${row.id}, ${row.username}, ${row.email}` : 'no user'
		);
		return row ?? null;
	} catch (err) {
		console.error('getUserBySession error:', err);
		return null;
	}
}

/**
 * Get session id from a username.
 */
export function getSessionByUsername(username: string): string | null | undefined {
	try {
		const userId = dbFunction.retrieveUserID(username);
		const sid = dbFunction.retrieveSessionID(userId);
		console.log(`getSessionByUsername: got sid=${sid}`);
		if (sid !== undefined || sid !== null) return sid;
	} catch (err) {
		console.error('getSessionByUsername error', err);
		return null;
	}
}

/**
 * Register a new user with hashed password.
 * Returns:
 *   0 = success
 *   1 = email already used
 *   2 = username already used
 *   3 = error while registering
 */
export async function registerNewUser(username: string, email: string, password: string): Promise<number> {
	const exists = dbFunction.userExist(undefined, username, email);
	if (exists === 1) return 1;
	if (exists === 2) return 2;

	try {
		const hashed = await hashPassword(password);
		dbFunction.registerUser(username.trim(), email.trim(), hashed);
		return 0;
	} catch (err) {
		console.error('registerNewUser error:', err);
		return 3;
	}
}

/**
 * Get full profile info by username.
 */
export function requestUserInformation(username: string): UserProfileData | undefined | null {
	if (!dbFunction.userExist(undefined, username, undefined)) return undefined;
	const userInfo = dbFunction.getUserProfile(username);
	return userInfo ?? undefined;
}

/**
 * Get user statistics (wins, losses, games, ratios).
 */
export function getUserStats(username: string): UserStats | undefined {
	try {
		username = (JSON.parse(username) as any).username ?? username;
	} catch { }

	const userId = dbFunction.retrieveUserID(username);
	const victories = dbFunction.getUserNbVictory(userId);
	const defeats = dbFunction.getUserNbDefeat(userId);
	const games = victories + defeats;
	const winRatio = games > 0 ? victories / games : 0;
	const tournamentsPlayed = dbFunction.getUserNbTournament(userId);
	const tournamentWins = dbFunction.getUserNbTournamentWin(userId);
	const tournamentWinRatio = tournamentsPlayed > 0 ? tournamentWins / tournamentsPlayed : 0;

	return {
		victories,
		defeats,
		games,
		winRatio,
		tournamentsPlayed,
		tournamentWins,
		tournamentWinRatio,
	};
}

/**
 * Get all past games for a given user.
 */
export function getGameHistoryForUser(username: string): GameHistoryEntry[] | undefined {
	try {
		username = (JSON.parse(username) as any).username ?? username;
	} catch { }

	const userId = dbFunction.retrieveUserID(username);
	if (userId === -1) return [];

	const rows = dbFunction.getUserGameHistoryRows(userId) as any[];
	if (rows.length === 0) return [];

	return rows.map((r) => ({
		playedAt: r.startedAt ?? 'error',
		opponent: r.opponent ?? 'error',
		score: r.yourScore != null && r.opponentScore != null ? `${r.yourScore} - ${r.opponentScore}` : 'error',
		result: r.didWin == null ? 'error' : r.didWin ? 'Win' : 'Loss',
		isTournament: r.isTournament ? 'No' : 'Yes',
		duration: r.durationSeconds ?? 999,
	}));
}

/**
 * Find a Google user or create one if missing.
 */
export function findOrCreateGoogleUser(profile: { sub: string; name: string; email: string }): UserProfileData | null {
	let user = dbFunction.findUserByGoogleId(profile.sub);
	if (user) return user;

	const existsByEmail = dbFunction.userExist(undefined, undefined, profile.email);
	if (existsByEmail)
		dbFunction.linkGoogleIdToUser(profile.email, profile.sub);
	else
		dbFunction.createGoogleUser(profile);

	const userId = dbFunction.retrieveUserID(profile.name);
	dbFunction.createSession(userId);

	return dbFunction.findUserByGoogleId(profile.sub);
}

/**
 * Create a new game for a player.
 */
export function registerNewGame(gameId: string, playerUsername: string, tournament: number): boolean {
	if (!playerUsername) {
		console.error('registerNewGame: playerUsername is undefined');
		return false;
	}

	const playerId = dbFunction.retrieveUserID(playerUsername);
	if (playerId === -1) {
		console.error("registerNewGame: player not found in db");
		return false;
	}

	const dbGameId = dbFunction.createNewGame(gameId, playerId, tournament);
	return dbGameId !== -1;
}

/**
 * Add a second player to a game.
 */
export function addPlayer2(gameId: string, player2: string): boolean {
	if (!gameId) return false;

	if (!dbFunction.gameExist(gameId)) {
		console.error("addPlayer2: game not found");
		return false;
	}

	const player2Id = dbFunction.retrieveUserID(player2);
	if (player2Id === -1) return false;

	try {
		dbFunction.updatePlayer2(gameId, player2Id);
		return true;
	} catch (err) {
		console.error('addPlayer2 error:', err);
		return false;
	}
}

/**
 * Update start time of a game.
 */
export function updateStartTime(gameId: string) {
	dbFunction.updateStartGameTime(gameId);
}

/**
 * Save final game result and update player stats.
 */
export function saveGameResult(
	gameId: string,
	player1Name: string,
	player2Name: string,
	player1Score: number,
	player2Score: number,
	endTime: number
): boolean {
	const player1Id = dbFunction.retrieveUserID(player1Name);
	const player2Id = dbFunction.retrieveUserID(player2Name);

	if (player1Id === -1 || player2Id === -1) {
		console.error('saveGameResult: player1 or player2 not found');
		return false;
	}
	if (!dbFunction.gameExist(gameId)) {
		console.error('saveGameResult: game not found');
		return false;
	}

	const isTournament = dbFunction.isGameTournament(gameId);
	const winnerId = player1Score > player2Score ? player1Id : player2Id;
	const looserId = winnerId === player1Id ? player2Id : player1Id;

	const updated = dbFunction.updateGameInfo(
		gameId,
		player1Score,
		player2Score,
		winnerId,
		looserId,
		endTime
	);

	if (!updated) {
		console.log('saveGameResult: failed to update game');
		return false;
	}

	console.log('saveGameResult: saved', { gameId });
	updatePlayers(winnerId, looserId, isTournament);
	dbFunction.displayGameInfo(gameId);
	dbFunction.displayPlayerInfo(player1Id);
	dbFunction.displayPlayerInfo(player2Id);

	return true;
}

/**
 * Update stats for winner and loser.
 */
export function updatePlayers(winnerId: number, looserId: number, tournament: number) {
	dbFunction.updateUserGame(winnerId, 1);
	dbFunction.updateUserVictory(winnerId, 1);
	dbFunction.updateUserGame(looserId, 1);
	dbFunction.updateUserDefeat(looserId, 1);

	if (tournament) {
		dbFunction.updateUserTournament(looserId, 1);
	}
}

/**
 * Update tournament winner stats.
 */
export function updateTournamentWinner(playerName: string): boolean {
	const playerId = dbFunction.retrieveUserID(playerName);
	if (playerId === -1) {
		console.error('updateTournamentWinner: player not found');
		return false;
	}

	if (dbFunction.updateUserTournamentWin(playerId, 1)) 
		return true;
	else {
		console.error('updateTournamentWinner: failed to update tournament wins');
		return false;
	}
}
