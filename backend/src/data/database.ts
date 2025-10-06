// ------------------------
// Helpers / constants
// ------------------------
import Database from 'better-sqlite3';
import crypto from 'crypto';
import { UserProfileData, SessionUser } from '../shared/types.js';

let db: Database.Database;

export function registerDatabaseFunctions(database: Database.Database) {
  console.log('registering db');
  db = database;
}

export function generateClientId(): string {
	return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
 
export function generateGameId(): string {
	return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const HOUR = 60 * 60;
const nowSec = () => Math.floor(Date.now() / 1000);
const GAME_ID_RE = /^game_\d{13}_[a-z0-9]{9}$/;
const SID_RE     = /^[a-f0-9]{64}$/;

enum UserField {
  EMAIL,
  PASSWORD,
}

// ------------------------
// Validation helpers
// ------------------------
const toInt = (v: unknown, name = 'value') => {
  const n = Number(v);
  if (!Number.isInteger(n)) throw new Error(`Invalid ${name}: must be an integer`);
  return n;
};

const nonNegInt = (v: unknown, name = 'value') => {
  const n = toInt(v, name);
  if (n < 0) throw new Error(`Invalid ${name}: must be >= 0`);
  return n;
};

const trimString = (v: string, name = 'value') => {
  if (typeof v !== 'string') throw new Error(`Invalid ${name}: must be a string`);
  const s = v.trim();
  if (!s) throw new Error(`Invalid ${name}: cannot be empty`);
  return s;
};

// ------------------------
// ID formats (+ safe wrappers)
// ------------------------

export const safeGameId = (s: string) => {
  s = trimString(s, 'game_id');
  if (!GAME_ID_RE.test(s)) throw new Error('Invalid game_id');
  return s;
};

export const safeSid = (s: string) => {
  s = trimString(s, 'sid');
  if (!SID_RE.test(s)) throw new Error('Invalid sid');
  return s;
};

/**
 * USERS table functions
**/

export function registerUser(username: string, email: string, password: string): boolean {
	try {
		username = username.trim();
		email = email.trim();
		password = password.trim();

		const userInfo = db.prepare('INSERT INTO users (username, email, pwd) VALUES (?,?,?)');
		userInfo.run(username, email, password);
		return true;
	} catch (err) {
		console.error('Error in registerUser:', err);
		return false;
	}
}

export function deleteUser(email: string): boolean {
	try {
		email = email.trim();

		const userInfo = db.prepare('DELETE FROM users WHERE email = ?');
		userInfo.run(email);
		return true;
	} catch (err) {
		console.error('Error in delete user: ', err);
		return false;
	}
}

export function updateUserInfo(field: UserField, newInfo: string, email: string): boolean {
	try {
		email = email.trim();
		newInfo = newInfo.trim();
		const userID = retrieveUserID(email);

		let userNewInfo;
		switch (field) {
			case UserField.EMAIL:
				userNewInfo = db.prepare('UPDATE users SET email = ? WHERE id = ?');
				userNewInfo.run(newInfo, userID);
				return true;
			case UserField.PASSWORD:
				userNewInfo = db.prepare('UPDATE users SET pwd = ? WHERE id = ?');
				userNewInfo.run(newInfo, userID);
				return true;
			default:
				console.error("Field can't be modified");
				return false;
		}
	} catch (err) {
		console.error('Error in updating userInfo: ', err);
		return false;
	}
}

export function updateUserVictory(id: number, victory: number): boolean {
	try {
		id = nonNegInt(id, 'user id');
		victory = nonNegInt(victory, 'victory count');

		const currentVictory = getUserNbVictory(id);
		if (currentVictory === -1) {
			console.error('User not found');
			return false;
		}
		let newVictoryNb = currentVictory + victory;
		const user = db.prepare('UPDATE users SET victories = ? WHERE id = ?');
		console.log(`database.ts -- updateUserVictory: Nb of victory after update ${currentVictory} + ${victory} = ${newVictoryNb}`);
		user.run(newVictoryNb, id);
		return true;
	} catch (err) {
		console.error('Error in updating userVictories: ', err);
		return false;
	}
}

export function updateUserDefeat(id: number, Defeat: number): boolean {
	try {
		id = nonNegInt(id, 'user id');
		Defeat = nonNegInt(Defeat, 'defeat count');

		const currentDefeat = getUserNbDefeat(id);
		if (currentDefeat === -1) {
			console.error('User not found');
			return false;
		}
		let newDefeatNb = currentDefeat + Defeat;
		console.log(`database.ts -- updateUserDefeat: Nb of defeat after update ${currentDefeat} + ${Defeat} = ${newDefeatNb}`);
		const user = db.prepare('UPDATE users SET defeats = ? WHERE id = ?');
		user.run(newDefeatNb, id);
		return true;
	} catch (err) {
		console.error('Error in updating userDefeats: ', err);
		return false;
	}
}

export function updateUserTournament(id: number, tournament: number): boolean {
	try {
		id = nonNegInt(id, 'user id');
		tournament = nonNegInt(tournament, 'tournament count');

		const currentTournament = getUserNbTournament(id);
		if (currentTournament === -1) {
			console.error('User not found');
			return false;
		}
		let newTournamentNb = currentTournament + tournament;
		console.log(`database.ts -- updateUserTournament: Nb of tournament after update ${currentTournament} + ${tournament} = ${newTournamentNb}`);
		const user = db.prepare('UPDATE users SET tournament = ? WHERE id = ?');
		user.run(newTournamentNb, id);
		return true;
	} catch (err) {
		console.error('Error in updating userDefeats: ', err);
		return false;
	}
}

export function updateUserTournamentWin(id: number, tournament_win: number): boolean {
	try {
		id = nonNegInt(id, 'user id');
		tournament_win = nonNegInt(tournament_win, 'tournament win count');

		const currentTournamentWin = getUserNbTournamentWin(id);
		if (currentTournamentWin === -1) {
			console.error('User not found');
			return false;
		}
		let newNbTournamentWin = currentTournamentWin + tournament_win;
		const user = db.prepare('UPDATE users SET tournament_win = ? WHERE id = ?');
		user.run(newNbTournamentWin, id);
		return true;
	} catch (err) {
		console.error('Error in updating userDefeats: ', err);
		return false;
	}
}

export function updateUserGame(id: number, Game: number): boolean {
	try {
		id = nonNegInt(id, 'user id');
		Game = nonNegInt(Game, 'game count');

		const currentGame = getUserNbGames(id);
		if (currentGame === -1) {
			console.error('User not found');
			return false;
		}
		let newGameNb = currentGame + Game;
		console.log(`database.ts -- updateUserGame: Nb of game after update ${currentGame} + ${Game} = ${newGameNb}`);
		const user = db.prepare('UPDATE users SET games = ? WHERE id = ?');
		user.run(newGameNb, id);
		return true;
	} catch (err) {
		console.error('Error in updating userGames: ', err);
		return false;
	}
}


// GET USER INFO 
export function userExist(id?: number, username?: string, email?: string): number {
	try {
		if (id !== undefined) {
			id = nonNegInt(id, 'user id');
			const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
			if (user) return 1;
		}
		if (email && email.trim() !== '' && email !== undefined) {
			email = email.trim();
			const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
			if (user) return 1;
		}
		if (username && username.trim() !== '' && username !== undefined) {
			username = username.trim();
			const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
			if (user) return 2;
		}
		return 0;
	} catch (err) {
		console.error("Error in userExist:", err);
		return 0;
	}
}

export function getUserUsername(email: string): string {
	try {
		email = email.trim();

		const user = db.prepare('SELECT username FROM users WHERE email = ?');
		const userName = user.get(email) as { username: string } | undefined;
		if (userName) {
			return userName.username;
		}
		return "";
	} catch (err) {
		console.error('Error in get User username:', err);
		return "";
	}
}

export function getUserEmail(username: string): string {
	try {
		username = username.trim();

		const user = db.prepare('SELECT email FROM users WHERE username = ?');
		const userEmail = user.get(username) as { email: string } | undefined;
		if (userEmail) {
			return userEmail.email;
		}
		return "";
	} catch (err) {
		console.error('Error in get User Email:', err);
		return "";
	}
}

export function getUserPwd(email: string): string {
	try {
		email = email.trim();

		const user = db.prepare('SELECT pwd FROM users WHERE email = ?');
		const userPwd = user.get(email) as { pwd: string } | undefined;
		if (userPwd) {
			return userPwd.pwd;
		}
		return "";
	} catch (err) {
		console.error('Error in get User Email:', err);
		return "";
	}
}

export function retrieveUserID(username: string): number {
	try {
		username = username.trim();

		const user = db.prepare('SELECT id FROM users WHERE username = ?');
		const userID = user.get(username) as { id: number } | undefined;
		if (!userID) {
			console.error('User not found');
			return -1;
		}
		return userID.id;
	} catch (err) {
		console.error('Error in get User ID:', err);
		return -1;
	}
}

// GET INFO regarding game history
export function getUserNbVictory(id: number): number {
	try {
		id = nonNegInt(id, 'user id');

		const user = db.prepare('SELECT victories FROM users WHERE id = ?');
		const userVictory = user.get(id) as { victories: number };
		if (!userVictory) {
			console.error('User not found');
			return -1;
		}
		return userVictory.victories;
	} catch (err) {
		console.error('Error in get User victory nb:', err);
		return -1;
	}
}

export function getUserNbTournament(id: number) {
	try {
		id = nonNegInt(id, 'user id');

		const user = db.prepare('SELECT tournament FROM users WHERE id = ?');
		const userTournament = user.get(id) as { tournament: number };
		if (!userTournament) {
			console.error('User not found');
			return -1;
		}
		return userTournament.tournament;
	} catch (err) {
		console.error('Error in get User defeat nb:', err);
		return -1;
	}
}

export function getUserNbTournamentWin(id: number) {
	try {
		id = nonNegInt(id, 'user id');

		const user = db.prepare('SELECT tournament_win FROM users WHERE id = ?');
		const userTournamentWin = user.get(id) as { tournament_win: number };
		if (!userTournamentWin) {
			console.error('User not found');
			return -1;
		}
		return userTournamentWin.tournament_win;
	} catch (err) {
		console.error('Error in get User defeat nb:', err);
		return -1;
	}
}

export function getUserNbDefeat(id: number) {
	try {
		id = nonNegInt(id, 'user id');

		const user = db.prepare('SELECT defeats FROM users WHERE id = ?');
		const userDefeats = user.get(id) as { defeats: number };
		if (!userDefeats) {
			console.error('User not found');
			return -1;
		}
		return userDefeats.defeats;
	} catch (err) {
		console.error('Error in get User defeat nb:', err);
		return -1;
	}
}

export function getUserNbGames(id: number) {
	try {
		id = nonNegInt(id, 'user id');

		const user = db.prepare('SELECT games FROM users WHERE id = ?');
		const userGames = user.get(id) as { games: number };
		console.log('[DBG][getUserNbGames] id=%s row=%s', id, JSON.stringify(userGames));
		console.log('[DBG][getUserNbGames] games field =', (userGames as any)?.games, 'type =', typeof (userGames as any)?.games);

		if (!userGames) {
			console.error('User not found');
			console.log('[DBG] Recent users:', db.prepare('SELECT id, username, games FROM users ORDER BY id DESC LIMIT 5').all());
  			console.log('[DBG] Sample games for id:', id, db.prepare('SELECT game_id, player1_id, player2_id, winner_id, played_at FROM games WHERE player1_id=? OR player2_id=? ORDER BY played_at DESC LIMIT 5').all(id, id));
			return -1;
		}
		return userGames.games;
	} catch (err) {
		console.error('Error in get User games nb:', err);
		return -1;
	}
}

export function getUserProfile(username: string): UserProfileData | null {
	username = username.trim();

	const userInfo = db.prepare(`
	SELECT id, username, email, victories, defeats, games
	FROM users WHERE username = ?
  `).get(username) as UserProfileData | undefined;

	if (!userInfo) return null;

	return {
		userId: userInfo.userId,
		username: userInfo.username,
		email: userInfo.email,
		victories: userInfo.victories,
		defeats: userInfo.defeats,
		games: userInfo.games
	};
}

/**
 * GAMES table functions  
**/

export function createNewGame(gameId: string, player1_id: number, tournament: number): number {
	try {
		gameId = safeGameId(gameId);
		player1_id = nonNegInt(player1_id, 'player1_id');
		tournament = nonNegInt(tournament, 'tournament');

		const game = db.prepare('INSERT INTO games (game_id, player1_id, tournament) VALUES (?,?, ?)');
		const newGame = game.run(gameId, player1_id, tournament);
		return newGame.lastInsertRowid as number;
	} catch (error) {
		console.error("Error in createGame:", error);
		return -1;
	}
}

export function gameExist(id: string): boolean {
	try {
		id = safeGameId(id);
		console.log(`Gameid is: ${id}`);

		const game = db.prepare('SELECT * FROM games WHERE game_id = ?').get(id);
		if (game) return true;
		return false;
	} catch (err) {
		console.error("Error in gameExist:", err);
		return false;
	}
}

// Function useful only to save a game at the end
export function registerGame(
	player1_id: number,
	player2_id: number,
	winner_id: number,
	looser_id: number,
	player1_score: number,
	player2_score: number,
	duration_seconds: number
): boolean {
	try {
		player1_id = nonNegInt(player1_id, 'player1_id');
		player2_id = nonNegInt(player2_id, 'player2_id');
		winner_id = nonNegInt(winner_id, 'winner_id');
		looser_id = nonNegInt(looser_id, 'looser_id');
		player1_score = nonNegInt(player1_score, 'player1_score');
		player2_score = nonNegInt(player2_score, 'player2_score');
		duration_seconds = nonNegInt(duration_seconds, 'duration_seconds');

		const game = db.prepare(`
			INSERT INTO games (
				player1_id,
				player2_id,
				winner_id,
				looser_id,
				player1_score,
				player2_score,
				duration_seconds
			) VALUES (?, ?, ?, ?, ?, ?, ?)`);
		game.run(
			player1_id,
			player2_id,
			winner_id,
			looser_id,
			player1_score,
			player2_score,
			duration_seconds
		);

		return true;
	} catch (error) {
		console.error("Error in createGame:", error);
		return false;
	}
}

// DELETE rows
export function deleteGame(id: number): boolean {
	try {
		id = nonNegInt(id, 'game id');

		const gameInfo = db.prepare('DELETE FROM games WHERE game_id = ?');
		gameInfo.run(id);
		return true;
	} catch (err) {
		console.error('Error in delete game: ', err);
		return false;
	}
}

// UPDATE game info
export function updateGameInfo(id: string, player1_score: number, player2_score: number, winner: number, looser: number, endTime: number): boolean {
	try {
		id = safeGameId(id);
		player1_score = nonNegInt(player1_score, 'player1_score');
		player2_score = nonNegInt(player2_score, 'player2_score');
		winner = nonNegInt(winner, 'winner_id');
		looser = nonNegInt(looser, 'looser_id');
		endTime = nonNegInt(endTime, 'end time');

		let startTime = getGameStartTime(id);
		if (!startTime) {
			console.error('Game not found or start time invalid.');
			return false;
		}
		const gameDuration = Math.floor((endTime - startTime.getTime()) / 1000);
		const gameInfo = db.prepare('UPDATE games SET player1_score = ?, player2_score = ?, winner_id = ?, looser_id = ?, duration_seconds = ? WHERE game_id = ?');
		gameInfo.run(player1_score, player2_score, winner, looser, gameDuration, id);
		return true;
	} catch (err) {
		console.error('Error in update game: ', err);
		return false;
	}
}

export function updatePlayer2(id: string, player_2: number): boolean {
	try {
		id = safeGameId(id);
		player_2 = nonNegInt(player_2, 'player2_id');

		const gamePlayer2 = db.prepare('UPDATE games SET player2_id = ? WHERE game_id = ?');
		gamePlayer2.run(player_2, id);
		return true;
	} catch (err) {
		console.error('Error in update game: ', err);
		return false;
	}
}

export function updateTournament(id: string): boolean {
	try {
		id = safeGameId(id);

		const gameTournament = db.prepare('UPDATE games SET tournament = 1 WHERE game_id = ?');
		gameTournament.run(id);
		return true;
	} catch (err) {
		console.error('Error in update game: ', err);
		return false;
	}
}

export function updateStartGameTime(id: string): boolean {
	try {
		id = safeGameId(id);

		const startTime = new Date();
		const gameStartTime = db.prepare('UPDATE games SET played_at = ? WHERE game_id = ?');
		gameStartTime.run(startTime.toISOString(), id);
		return true;
	} catch (err) {
		console.error('Error in update game: ', err);
		return false;
	}
}

// GET games information
export function getGameStartTime(id: string): Date | null {
	try {
		id = safeGameId(id);

		const gameStartTime = db.prepare('SELECT played_at FROM games WHERE game_id = ?');
		const startTime = gameStartTime.get(id) as { played_at: string };
		return new Date(startTime.played_at);
	} catch (err) {
		console.error('Error in select start of the game: ', err);
		return null;
	}
}

export function getGamePlayer1(id: string): number {
	try {
		id = safeGameId(id);

		const game = db.prepare('SELECT player1_id FROM games WHERE game_id = ?');
		const ret = game.get(id) as { player1_id: number };
		return ret.player1_id;
	} catch (err) {
		console.error('Error in player 1 of the game: ', err);
		return -1;
	}
}

export function getGamePlayer2(id: string): number {
	try {
		id = safeGameId(id);

		const game = db.prepare('SELECT player2_id FROM games WHERE game_id = ?');
		const ret = game.get(id) as { player2_id: number };
		return ret.player2_id;
	} catch (err) {
		console.error('Error in player 2 of the game: ', err);
		return -1;
	}
}

export function getGamePlayer1Score(id: string): number {
	try {
		id = safeGameId(id);

		const game = db.prepare('SELECT player1_score FROM games WHERE game_id = ?');
		const ret = game.get(id) as { player1_score: number };
		return ret.player1_score;
	} catch (err) {
		console.error('Error in player 1 score of the game: ', err);
		return -1;
	}
}

export function getGamePlayer2Score(id: string): number {
	try {
		id = safeGameId(id);

		const game = db.prepare('SELECT player2_score FROM games WHERE game_id = ?');
		const ret = game.get(id) as { player2_score: number };
		return ret.player2_score;
	} catch (err) {
		console.error('Error in player 2 of the game: ', err);
		return -1;
	}
}

export function getGameWinner(id: string): number {
	try {
		id = safeGameId(id);

		const game = db.prepare('SELECT winner_id FROM games WHERE game_id = ?');
		const ret = game.get(id) as { winner_id: number };
		return ret.winner_id;
	} catch (err) {
		console.error('Error in select winner of the game: ', err);
		return -1;
	}
}

export function getGameLooser(id: string): number {
	try {
		id = safeGameId(id);

		const game = db.prepare('SELECT looser_id FROM games WHERE game_id = ?');
		const ret = game.get(id) as { looser_id: number };
		return ret.looser_id;
	} catch (err) {
		console.error('Error in select looser of the game: ', err);
		return -1;
	}
}

export function getGameDuration(id: string): number {
	try {
		id = safeGameId(id);

		const game = db.prepare('SELECT duration_seconds FROM games WHERE game_id = ?');
		const ret = game.get(id) as { duration_seconds: number };
		return ret.duration_seconds;
	} catch (err) {
		console.error('Error in select duration of the game: ', err);
		return -1;
	}
}

export function isGameTournament(id: string): number {
	try {
		id = safeGameId(id);

		const game = db.prepare('SELECT tournament FROM games WHERE game_id = ?');
		const ret = game.get(id) as { tournament: number };
		return ret.tournament;
	} catch (err) {
		console.error('Error in check if game is a tournament: ', err);
		return -1;
	}
}

// Google OAuth functions
export function findUserByGoogleId(googleId: string): UserProfileData | null {
	googleId = googleId.trim();

	const statement = db.prepare('SELECT id, username, email, victories, defeats, games FROM users WHERE google_id = ?');
	const user = statement.get(googleId) as any;
	return user || null;
}

export function createGoogleUser(profile: { sub: string, name: string, email: string }): number {
	try {
		const name = profile.name.trim();
		const email = profile.email.trim();
		const sub = profile.sub.trim();

		const statement = db.prepare(
			'INSERT INTO users (username, email, google_id) VALUES (?, ?, ?)'
		);
		const result = statement.run(name, email, sub);
		return result.lastInsertRowid as number;
	} catch (err) {
		console.error('Error in createGoogleUser:', err);
		const existingUser = findUserByGoogleId(profile.sub);
		return existingUser ? existingUser.userId : -1;
	}
}

export function linkGoogleIdToUser(email: string, googleId: string): boolean {
	try {
		email = email.trim();
		googleId = googleId.trim();

		const statement = db.prepare(
			'UPDATE users SET google_id = ? WHERE email = ?'
		);
	 const result = statement.run(googleId, email);
		return result.changes > 0;
	} catch (err) {
		console.error('Error in linkGoogleIdToUser:', err);
		return false;
	}
}

// Display info 
export function displayGameInfo(gameId: string) {
	try {
		gameId = safeGameId(gameId);

		const gameInfo = db.prepare('SELECT * FROM games WHERE game_id = ?');
	} catch (err) {
		console.error('Error in printing game info', err);
	}
}

export function displayPlayerInfo(playerId: number) {
	try {
		playerId = nonNegInt(playerId, 'player id');

		const gameInfo = db.prepare('SELECT * FROM users WHERE id = ?');
	} catch (err) {
		console.error('Error in printing game info', err);
	}
}

// Get entire game history for a user
export function getUserGameHistoryRows(userId: number) {
	try {
		userId = nonNegInt(userId, 'user id');

		const stmt = db.prepare(`
		SELECT
			g.game_id                       AS gameId,
			g.played_at                     AS startedAt,
			COALESCE(g.duration_seconds, 0) AS durationSeconds,
			g.tournament                    AS isTournament,
			CASE WHEN g.player1_id = ? THEN u2.username ELSE u1.username END AS opponent,
			CASE WHEN g.player1_id = ? THEN g.player1_score ELSE g.player2_score END AS yourScore,
			CASE WHEN g.player1_id = ? THEN g.player2_score ELSE g.player1_score END AS opponentScore,
			CASE
			WHEN g.winner_id IS NULL THEN NULL
			WHEN g.winner_id = ?     THEN 1
			ELSE 0
			END                            AS didWin
		FROM games g
		JOIN users u1 ON u1.id = g.player1_id
		JOIN users u2 ON u2.id = g.player2_id
		WHERE g.player1_id = ? OR g.player2_id = ?
		ORDER BY g.played_at DESC, g.game_id DESC
		`);
		return stmt.all(userId, userId, userId, userId, userId, userId);
	} catch (err) {
		console.error('Error in getUserGameHistoryRows:', err);
		return [];
	}
}

// Session cookie creation to ensure no double login and refresh doesn't logout user

export function createSession(userId: number): string | undefined {
	try {
		userId = nonNegInt(userId, 'user id');
		if (userId === -1) {
			console.error("error in createSession, userId is invalid");
			return undefined;
		}
		const now = nowSec();
		deleteSessionExpired(userId);

		// Block if there is any active session for this user
		const active = db.prepare(
		'SELECT id FROM sessions WHERE user_id=? AND expires_at > ? LIMIT 1'
		).get(userId, now) as { id: string } | undefined;
		if (active !== undefined) return undefined;
		
		const sid = crypto.randomBytes(32).toString('hex');
		const expiresAt = now + HOUR;
		db.prepare(
		`INSERT INTO sessions (id, user_id, created_at, expires_at, user_agent, ip)
		VALUES (?,?,?,?,?,?)`
		).run(sid, userId, now, expiresAt, null, null);

		return sid;
	} catch (err) {
		console.error('Error in createSession:', err);
		return undefined;
	}
}

export function deleteSessionExpired(userId: number): boolean {
	try {
		userId = nonNegInt(userId, 'user id');
		const now = nowSec();
		db.prepare('DELETE FROM sessions WHERE user_id=? AND expires_at <= ?').run(userId, now);
		return true;
	} catch (err) {
		return false;
	 }
}

export function deleteSessionLogout(userId: number) {
	try {
		userId = nonNegInt(userId, 'user id');
		db.prepare('DELETE FROM sessions WHERE user_id=?').run(userId);
	} catch (err) {
		console.error('Error on deleting session');
	}

}

export function getSessionInfo(userId: number): SessionUser | null {
	try {
		userId = nonNegInt(userId, 'user id');
		const row = db.prepare('SELECT id, user_id, created_at, expires_at FROM sessions WHERE user_id=?'
		).get(userId) as { sid: string, user_id: number; created_at: number; expires_at: number } | undefined;

		if (!row) return null;
			return { sid: row.sid, userId: row.user_id, createdAt: row.created_at, expiresAt: row.expires_at };
	} catch (err) {
		console.error('Error in getSessionInfo:', err);
		return null;
	}
}

export function getUserBySession(sid: string): { id: number; username: string, email?: string} | null {
	try {
		sid = safeSid(sid);
		const userId = db.prepare('SELECT user_id FROM sessions WHERE id = ?').get(sid) as { user_id: number } | undefined;
		if (!userId) return null;
		const row = db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(userId.user_id) as { id:number; username:string; email?:string } | undefined;
		if (!row) return null;
		console.log(`in database.ts we found the session by user: ${row.username}, ${row.email}, ${row.id} where userId: ${userId.user_id}`);
		return row;
	} catch (e) {
		console.error('getUserBySession error:', e);
		return null;
	}
}

export function retrieveSessionID(userId: number): string | null {
	try {
		userId = nonNegInt(userId, 'user id');
		const sid = db.prepare('SELECT id FROM sessions WHERE user_id = ?');
		const SID = sid.get(userId) as { id: string } | undefined;
		if (SID === undefined) {
			console.error('SID not found');
			return null;
		}
		return SID.id;
	} catch (err) {
		console.error('Error in get User ID:', err);
		return null;
	}
}