// DB command to create, update and remove information from db and tables
import Database from 'better-sqlite3';
import { UserProfileData } from '../shared/types.js';

enum UserField{
	EMAIL,
	PASSWORD,
}

let db: Database.Database;

export function registerDatabaseFunctions(database: Database.Database) {
	db = database;
}

/**
 * USERS table functions  
**/

// CREATE rows 

export function registerUser(username: string, email: string, password: string): boolean {
	try {
		const userInfo = db.prepare('INSERT INTO users (username, email, pwd) VALUES (?,?,?)');
		userInfo.run(username, email, password);
		return true;
	} catch (err) {
		console.error('Error inregisterUser:', err);
		return false;
	}
}

// DELETE rows
export function deleteUser(email: string): boolean {
	try {
		const userInfo = db.prepare('DELETE FROM users WHERE email = ?');
		userInfo.run(email);
		return true;
	} catch (err) {
		console.error('Error in delete user: ', err);
		return false;
	}
}

// UPDATE user info
export function updateUserInfo(field: UserField, newInfo: string, email: string): boolean {
	try {
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
		const currentVictory = getUserNbVictory(id);
		if (currentVictory === -1) {
			console.error('User not found');
			return false;
		}
		let newVictoryNb = currentVictory + victory;
		const user = db.prepare('UPDATE users SET victories = ? WHERE id = ?');
		user.run(newVictoryNb, id);
		return true;
	} catch (err) {
		console.error('Error in updating userVictories: ', err);
		return false;
	}
}

export function updateUserDefeat(id: number, Defeat: number): boolean {
	try {
		const currentDefeat = getUserNbDefeat(id);
		if (currentDefeat === -1) {
			console.error('User not found');
			return false;
		}
		let newDefeatNb = currentDefeat + Defeat;
		const user = db.prepare('UPDATE users SET defeats = ? WHERE id = ?');
		user.run(newDefeatNb, id);
		return true;
	} catch (err) {
		console.error('Error in updating userDefeats: ', err);
		return false;
	}
}

export function updateUserGame(id: number, Game: number): boolean {
	try {
		const currentGame = getUserNbGames(id);
		if (currentGame === -1) {
			console.error('User not found');
			return false;
		}
		let newGameNb = currentGame + Game;
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
            const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
            if (user) return 1;
        }
        if (email && email.trim() !== '') {
            const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
            if (user) return 1;
        }
        if (username && username.trim() !== '') {
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
		const user = db.prepare('SELECT username FROM users WHERE email = ?');
		const userName = user.get(email) as {username: string}| undefined;
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
		const user = db.prepare('SELECT email FROM users WHERE username = ?');
		const userEmail = user.get(username)  as {email: string}| undefined;
		if (userEmail) {
			return userEmail.email;
		}
		return "";;
	} catch (err) {
		console.error('Error in get User Email:', err);
		return "";
	}
}

export function getUserPwd(email: string): string {
	try {
		const user = db.prepare('SELECT pwd FROM users WHERE email = ?');
		const userPwd =  user.get(email)  as {pwd: string}| undefined;
		if (userPwd) {
			return userPwd.pwd;
		}
		return "";;
	} catch (err) {
		console.error('Error in get User Email:', err);
		return "";
	}
}

export function retrieveUserID(email: string): number {
	try {
		const user = db.prepare('SELECT id FROM users WHERE email = ?');
		const userID = user.get(email) as { id: number } | undefined;
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
		const user = db.prepare('SELECT victories FROM users WHERE id = ?');
		const userVictory = user.get(id) as {victories: number};
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

export function getUserNbDefeat(id: number) {
	try {
		const user = db.prepare('SELECT defeats FROM users WHERE id = ?');
		const userDefeats = user.get(id) as {defeats: number};
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
		const user = db.prepare('SELECT games FROM users WHERE id = ?');
		const userGames = user.get(id) as {games: number};
		if (!userGames) {
			console.error('User not found');
			return -1;
		}
		return userGames.games;
	} catch (err) {
		console.error('Error in get User games nb:', err);
		return -1;
	}
}

export function getUserProfile(username: string): UserProfileData | null {
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





// database.ts (near the bottom, after other GAME helpers)
export function getAggregatedStats(username: string) {
  const row = db.prepare(`
     SELECT victories, defeats, games
     FROM   users
     WHERE  username = ?
  `).get(username) as { victories: number, defeats: number, games: number } | undefined;
  return row ?? null;
}

export function getRecentGames(username: string, limit = 20) {
  // get the user's id once
  const idStmt = db.prepare('SELECT id FROM users WHERE username = ?');
  const idRow  = idStmt.get(username) as { id: number } | undefined;
  if (!idRow) return [];

  const stmt = db.prepare(`
    SELECT g.played_at            AS playedAt,
           opp.username           AS opponent,
           g.player1_score || ' - ' || g.player2_score AS score,
           CASE WHEN g.winner_id = ? THEN 'Win' ELSE 'Loss' END AS result,
           g.duration_seconds     AS duration
    FROM   games g
    JOIN   users me   ON me.id = ?
    JOIN   users opp  ON opp.id = CASE
                                   WHEN g.player1_id = me.id THEN g.player2_id
                                   ELSE g.player1_id END
    WHERE  g.player1_id = me.id OR g.player2_id = me.id
    ORDER  BY g.played_at DESC
    LIMIT  ?
  `);
  return stmt.all(idRow.id, idRow.id, limit) as any[];
}














/**
 * GAMES table functions  
**/

//CREATE a new game to save, must be done before the game begin
export function createNewGame(player1_id: number, player2_id: number): number {
	try {
		const game = db.prepare('INSERT INTO games (player1_id, player2_id) VALUES (?,?)');
		const newGame = game.run(player1_id, player2_id);
		return newGame.lastInsertRowid as number;
	} catch (error) {
		console.error("Error in createGame:", error);
		return -1;
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
		const gameInfo = db.prepare('DELETE FROM games WHERE id = ?');
		gameInfo.run(id);
		return true;
	} catch (err) {
		console.error('Error in delete game: ', err);
		return false;
	}
}

//UPDATE game info
export function updateGameInfo(id: number, player1_score: number, player2_score: number, winner: number, looser: number, endTime: number): boolean {
	try {
		let startTime = getGameStartTime(id);
		if (!startTime) {
			console.error('Game not found or start time invalid.');
			return false;			
		}
		const gameDuration = Math.floor((endTime - startTime.getTime()) / 1000);
		const gameInfo = db.prepare('UPDATE games SET player1_score = ?, player2_score = ?, winner_id = ?, looser_id = ?, duration_seconds = ? WHERE id = ?');
		gameInfo.run(player1_score, player2_score, winner, looser, gameDuration, id);
		updateUserVictory(winner, 1);
		updateUserDefeat(looser, 1);
		updateUserGame(winner, 1);
		updateUserGame(looser, 1);
		return true;
	} catch (err) {
		console.error('Error in update game: ', err);
		return false;
	}
}

//GET games information
export function getGameStartTime(id: number): Date | null {
	try {
		const gameStartTime = db.prepare('SELECT played_at FROM games WHERE id = ?');
		const startTime = gameStartTime.get(id) as { played_at: string };
		return new Date(startTime.played_at);
	} catch (err) {
		console.error('Error in select start of the game: ', err);
		return null;
	}
}


export function getGamePlayer1(id: number): number {
	try {
		const game = db.prepare('SELECT player1_id FROM games WHERE id = ?');
		const ret = game.get(id) as {player1_id: number};
		return ret.player1_id;
	} catch (err) {
		console.error('Error in player 1 of the game: ', err);
		return -1;
	}
}

export function getGamePlayer2(id: number): number {
	try {
		const game = db.prepare('SELECT player2_id FROM games WHERE id = ?');
		const ret = game.get(id) as {player2_id: number};
		return ret.player2_id;
	} catch (err) {
		console.error('Error in player 2 of the game: ', err);
		return -1;
	}
}

export function getGamePlayer1Score(id: number): number {
	try {
		const game = db.prepare('SELECT player1_score FROM games WHERE id = ?');
		const ret = game.get(id) as {player1_score: number};
		return ret.player1_score;
	} catch (err) {
		console.error('Error in player 1 score of the game: ', err);
		return -1;
	}
}

export function getGamePlayer2Score(id: number): number {
	try {
		const game = db.prepare('SELECT player2_score FROM games WHERE id = ?');
		const ret = game.get(id) as {player2_score: number};
		return ret.player2_score;
	} catch (err) {
		console.error('Error in player 2 of the game: ', err);
		return -1;
	}
}

export function getGameWinner(id: number): number {
	try {
		const game = db.prepare('SELECT winner_id FROM games WHERE id = ?');
		const ret = game.get(id) as {winner_id: number};
		return ret.winner_id;
	} catch (err) {
		console.error('Error in select winner of the game: ', err);
		return -1;
	}
}

export function getGameLooser(id: number): number {
	try {
		const game = db.prepare('SELECT looser_id FROM games WHERE id = ?');
		const ret = game.get(id) as {looser_id: number};
		return ret.looser_id;
	} catch (err) {
		console.error('Error in select looser of the game: ', err);
		return -1;
	}
}

export function getGameDuration(id: number): number {
	try {
		const game = db.prepare('SELECT duration_seconds FROM games WHERE id = ?');
		const ret = game.get(id) as {duration_seconds: number};
		return ret.duration_seconds;
	} catch (err) {
		console.error('Error in select duration of the game: ', err);
		return -1;
	}
}

export function findUserByGoogleId(googleId: string): UserProfileData | null {
    const statement = db.prepare('SELECT id, username, email, victories, defeats, games FROM users WHERE google_id = ?');
    const user = statement.get(googleId) as any;
    return user || null;
}

// Create a new user from Google profile data
export function createGoogleUser(profile: { sub: string, name: string, email: string}): number {
    try {
        const statement = db.prepare(
            'INSERT INTO users (username, email, google_id) VALUES (?, ?, ?)'
        );
        const result = statement.run(profile.name, profile.email, profile.sub);
        return result.lastInsertRowid as number;
    } catch (err) {
        console.error('Error in createGoogleUser:', err);
        const existingUser = findUserByGoogleId(profile.sub);
        return existingUser ? existingUser.userId : -1;
    }
}

export function linkGoogleIdToUser(email: string, googleId: string): boolean {
    try {
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