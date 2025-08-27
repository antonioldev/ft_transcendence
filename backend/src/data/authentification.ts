// Where the hashing algo will secure the password before saving to db
import argon2 from "argon2";

const PEPPER = process.env.PEPPER ?? "";

export async function hashPassword(pw: string) {
  return argon2.hash(pw + PEPPER, { 
	type: argon2.argon2id, 
	memoryCost: 64*1024, 
	timeCost: 3, 
	parallelism: 1,
	});
}

export async function verifyPassword(stored: string, pw: string) {
	return argon2.verify(stored, pw + PEPPER);
}
