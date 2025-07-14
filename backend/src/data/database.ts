// DB command to create, update and remove information from db and tables
import Database from 'better-sqlite3';

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
export function userExist(id: number): boolean {
	try {
		const user = db.prepare('SELECT * FROM users WHERE id = ?');
		const userExist = user.get(id);
		return userExist !== undefined;
	} catch (err) {
		console.error("Error user doesn't exist:", err);
		return false;
	}		
}


export function getUserbyUsername(email: string) {
	try {
		const user = db.prepare('SELECT username FROM users WHERE email = ?');
		const userName = user.get(email) as { username: string};
		return userName;
	} catch (err) {
		console.error('Error ingetUserEmail:', err);
		return null;
	}	
}

export function getUserbyEmail(email: string) {
	try {
		const user = db.prepare('SELECT * FROM users WHERE email = ?');
		return user.get(email);
	} catch (err) {
		console.error('Error ingetUserEmail:', err);
		return null;
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
		console.error('Error ingetUserbyID:', err);
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
		console.error('Error ingetUserbyID:', err);
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
		console.error('Error ingetUserbyID:', err);
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
		console.error('Error ingetUserbyID:', err);
		return -1;
	}
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
		const gameInfo = db.prepare('UPDATE games SET player1_score = ?, player2_score = ?, winner = ?, looser = ?, duration_seconds = ? WHERE id = ?');
		gameInfo.run(player1_score, player2_score, winner, looser, gameDuration, id);
		return true;
	} catch (err) {
		console.error('Error in delete game: ', err);
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
		console.error('Error in delete game: ', err);
		return null;
	}
}


export function getGamePlayer1(id: number): number {
	try {
		const game = db.prepare('SELECT player1_id FROM games WHERE id = ?');
		const ret = game.get(id) as {player1_id: number};
		return ret.player1_id;
	} catch (err) {
		console.error('Error in delete game: ', err);
		return -1;
	}
}

export function getGamePlayer2(id: number): number {
	try {
		const game = db.prepare('SELECT player2_id FROM games WHERE id = ?');
		const ret = game.get(id) as {player2_id: number};
		return ret.player2_id;
	} catch (err) {
		console.error('Error in delete game: ', err);
		return -1;
	}
}

export function getGamePlayer1Score(id: number): number {
	try {
		const game = db.prepare('SELECT player1_score FROM games WHERE id = ?');
		const ret = game.get(id) as {player1_score: number};
		return ret.player1_score;
	} catch (err) {
		console.error('Error in delete game: ', err);
		return -1;
	}
}

export function getGamePlayer2Score(id: number): number {
	try {
		const game = db.prepare('SELECT player2_score FROM games WHERE id = ?');
		const ret = game.get(id) as {player2_score: number};
		return ret.player2_score;
	} catch (err) {
		console.error('Error in delete game: ', err);
		return -1;
	}
}

export function getGameWinner(id: number): number {
	try {
		const game = db.prepare('SELECT winner FROM games WHERE id = ?');
		const ret = game.get(id) as {winner: number};
		return ret.winner;
	} catch (err) {
		console.error('Error in delete game: ', err);
		return -1;
	}
}

export function getGameLooser(id: number): number {
	try {
		const game = db.prepare('SELECT looser FROM games WHERE id = ?');
		const ret = game.get(id) as {looser: number};
		return ret.looser;
	} catch (err) {
		console.error('Error in delete game: ', err);
		return -1;
	}
}

export function getGameDuration(id: number): number {
	try {
		const game = db.prepare('SELECT duration_seconds FROM games WHERE id = ?');
		const ret = game.get(id) as {duration_seconds: number};
		return ret.duration_seconds;
	} catch (err) {
		console.error('Error in delete game: ', err);
		return -1;
	}
}

//UPDATE TABLES after a game
