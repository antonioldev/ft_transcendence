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

export function getUserStats(username: string): UserStats | undefined {
  if (!username) return undefined;

  return {
    victories: 12,
    defeats: 8,
    games: 20,
    winRatio: 0.6
  };
}

export function getGameHistoryForUser(username: string): GameHistoryEntry[] | undefined {
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