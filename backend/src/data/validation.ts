// Program to sanitize info before sending to SQL and ensure SQL injection avoidance
import * as dbFunction from '../data/database.js';

export function verifyLogin(username: string, password: string): number {
    if (!dbFunction.userExist(undefined,username,undefined))
        return 1;
    const user_email = dbFunction.getUserEmail(username);
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
    if (dbFunction.userExist(0, "", email)) {
        return 1;
    }
    console.log("Validation.ts, registerNewUser: info sent", username, email, password);

    try {
        dbFunction.registerUser(username, email, password);
        return 0;
    } catch (err) {
        console.error("registerUser: fail to register ", err);
        return 2;
    }
}