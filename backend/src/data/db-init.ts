import Database from 'better-sqlite3';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { registerNewUser } from './validation.js';

export async function initialisazeDatabase(dbPath: string): Promise<Database.Database> {
	const dir = dirname(dbPath);
	if (!existsSync(dir)) {
		console.log("Error, not able to find db file");
		throw new Error('Database folder does not exist');
	}
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = dirname(__filename);

	const db = new Database(dbPath);
	console.log("trying to initialise db");

	try {
		db.pragma('foreign_keys = ON');
		const user_version = db.pragma('user_version', { simple: true }) as number;
		console.log("user_version: ", user_version);
		if (user_version === 0) {
			console.log('Initilising new database...');
			const initPath = join(__dirname, 'init.sql');
			console.log('initPath: ',initPath);
			const initScript = readFileSync(initPath, 'utf-8');

			db.transaction(() => {
				db.exec(initScript);
				db.pragma('user_version = 1');
			})();

			console.log('Database initialised successfully');
			
		}
		return db;
	} catch (error) {
		db.close();
		console.error("Error in creating database: ", error);
		throw error;
	}
}