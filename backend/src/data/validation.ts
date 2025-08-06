// Program to sanitize info before sending to SQL and ensure SQL injection avoidance
import * as dbFunction from '../data/database.js';
import { UserProfileData, UserStats, GameHistoryEntry } from '../shared/types.js';

export function verifyLogin(username: string, password: string): number {
    // Check if input is an email (contains @) or username
    const isEmail = username.includes('@');
    
    let userExists = false;
    let user_email = '';
    
    if (isEmail) {
        // Login with email
        const existsResult = dbFunction.userExist(undefined, undefined, username);
        userExists = existsResult === 1; // email returns 1
        user_email = username;
    } else {
        // Login with username
        const existsResult = dbFunction.userExist(undefined, username, undefined);
        userExists = existsResult === 2; // username returns 2
        if (userExists) {
            user_email = dbFunction.getUserEmail(username);
        }
    }
    
    if (!userExists) {
        return 1; // User doesn't exist
    }
    
    const register_pwd = dbFunction.getUserPwd(user_email);
    // function to compare password with hashing one saved in db
    console.log("Validation.ts, verifyLogin: password to check and password saved", password, register_pwd);
    if (password === register_pwd)
        return 0;
    else
        return 2;
}

export function registerNewUser(username: string, email: string, password:string): number {
    // const hs_pwd = function to hash password to add here 
    let checkvalue = dbFunction.userExist(undefined, username, email);
    if (checkvalue === 1) {
        return 1; // user exist (checked by email)
    } else if (checkvalue === 2) {
        return 2; // username already taken
    }
    console.log("Validation.ts, registerNewUser: info sent", username, email, password);

    try {
        dbFunction.registerUser(username, email, password);
        return 0; // registration success
    } catch (err) {
        console.error("registerUser: fail to register ", err);
        return 3; // registration error
    }
}

export function requestUserInformation(username: string): UserProfileData | undefined | null {
    if (!dbFunction.userExist(undefined,username,undefined))
        return undefined;
    const userInfo = dbFunction.getUserProfile(username);
    if (userInfo === undefined)
        return undefined;
    return userInfo;    
}

export function getUserStats(username: string): UserStats | undefined { // TODO create a real function to return the stats of a user
  if (!username) return undefined;

  return {
    victories: 12,
    defeats: 8,
    games: 20,
    winRatio: 0.6
  };
}

export function getGameHistoryForUser(username: string): GameHistoryEntry[] | undefined { //TODO create a real function to return the game history of a user
  if (!username) return undefined;

  return [
    {
      playedAt: '2025-07-15 10:32',
      opponent: 'rival_one',
      score: '10 - 7',
      result: 'Win',
      duration: 300
    },
    {
      playedAt: '2025-07-14 18:45',
      opponent: 'challengerX',
      score: '6 - 10',
      result: 'Loss',
      duration: 280
    },
    {
      playedAt: '2025-07-13 13:10',
      opponent: 'alpha',
      score: '12 - 11',
      result: 'Win',
      duration: 350
    }
  ];
}

export function findOrCreateGoogleUser(profile: { sub: string, name: string, email: string }): UserProfileData | null {
    let user = dbFunction.findUserByGoogleId(profile.sub);
    if (user) {
        return user;
    }

    const userExistsByEmail = dbFunction.userExist(undefined, undefined, profile.email);
    if (userExistsByEmail) {
        dbFunction.linkGoogleIdToUser(profile.email, profile.sub);
    } else {
        dbFunction.createGoogleUser(profile);
    }
    
    return dbFunction.findUserByGoogleId(profile.sub);
}

export function registerNewGame(gameId: string, playerUsername: string, tournament: number) : boolean {
	console.log(`DB create game instance: creating a new game: {player1 ${playerUsername}}`);
	if (playerUsername === undefined) {
		console.error("Validation.ts -- registerNewGame: playerUsername is undefined");
		return false;
	}
	const player_id = dbFunction.retrieveUserID(playerUsername);
	console.log(`BD create game instance: player1 id {player1: ${player_id}}`);
	if (player_id === -1) {
		console.error("Validation.ts -- registerNewGame: Player doesn't exist in db");
		return false;
	}
	const dbGameId = dbFunction.createNewGame(gameId, player_id, tournament);
	if (dbGameId != -1) {
		return true;
	}
	return false;
}

export function addPlayer2(gameId: string, player2: string): boolean {
	console.log(`validation -- addPlayer2: we are adding 2nd player to exisitng game {gameid: ${gameId}, player2: ${player2}}`);
	if (gameId === undefined)
		return false;
	if (dbFunction.gameExist(gameId) === false) {
		console.error("validation -- addPlayer2: game doesn't exist in database");
		return false
	}
	const player2_id = dbFunction.retrieveUserID(player2);
	if (player2_id === -1)
		return false;
	try {
		dbFunction.updatePlayer2(gameId, player2_id);
		return true;
	} catch (err) {
		console.error("validation -- addPlayer2: Failed to add player 2 to the game db", err);
		return false; // registration error
	}
}

export function updateStartTime(gameId: string) {
	dbFunction.updateStartGameTime(gameId);
}

export function saveGameResult(gameId: string, player1_name: string, player2_name: string, player1_score: number, player2_score: number, endTime: number): boolean {

	const player1_id = dbFunction.retrieveUserID(player1_name);
	const player2_id = dbFunction.retrieveUserID(player2_name);
    if (player1_id === -1 || player2_id === -1) {
		console.error('❌ validation -- saveGameResult: player1 or player2 do not exist in DB');
		return false;
    }
	if (!dbFunction.gameExist(gameId)) {
		console.error('❌ validation -- saveGameResult: game do not exist in db');
		return false;
	}
    let isGameTournament = dbFunction.isGameTournament(gameId);
	const winner_id = player1_score > player2_score ? player1_id : player2_id;
	const looser_id = winner_id === player1_id ? player2_id : player1_id;

	const gameUpdate = dbFunction.updateGameInfo(gameId, player1_score, player2_score, winner_id, looser_id, endTime);
	if (gameUpdate) {
		console.log('✅ Game result saved:', { gameId });
		updatePlayers(winner_id, looser_id, isGameTournament);
		dbFunction.displayGameInfo(gameId);
        dbFunction.displayPlayerInfo(player1_id);
        dbFunction.displayPlayerInfo(player2_id);
		return true;
	} else {
		console.log('❌ Error saving game result:');
		return false;
	}
}

export function updatePlayers(winner_id: number, looser_id: number, tournament: number) {
	dbFunction.updateUserGame(winner_id, 1);
    dbFunction.updateUserVictory(winner_id, 1);
    dbFunction.updateUserGame(looser_id, 1);
    dbFunction.updateUserDefeat(looser_id, 1);
    if (tournament)
        dbFunction.updateUserTournament(looser_id, 1);
}

export function updateTournamentWinner(player1_name: string): boolean {
	const player1_id = dbFunction.retrieveUserID(player1_name);
    if (player1_id === -1) {
		console.error('❌ validation -- updatePlayerTournamentWinner: player1 do not exist in DB');
		return false;
    }
    if (dbFunction.updateUserTournamentWin(player1_id, 1))
        return true;
    else {
        console.error('❌ validation -- updatePlayerTournamentWinner: fail to update the nb of tournament win');
        return false;
    }
}