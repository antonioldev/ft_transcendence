import Database from 'better-sqlite3';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { registerNewUser } from './validation';

export async function initialisazeDatabase(dbPath: string): Promise<Database.Database> {
	const dir = dirname(dbPath);
	if (!existsSync(dir)) {
		throw new Error('Database folder does not exist');
	}
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = dirname(__filename);

	const db = new Database(dbPath);

	try {
		db.pragma('foreign_keys = ON');
		const user_version = db.pragma('user_version', { simple: true }) as number;
		console.log("user_version: ", user_version);
		if (user_version === 0) {
			console.log('Initilising new database...');
			const initPath = join(__dirname, 'init.sql');
			const initScript = readFileSync(initPath, 'utf-8');

			db.transaction(() => {
				db.exec(initScript);
				db.pragma('user_version = 1');
			})();

			console.log('Database initialised successfully');
			
		}
		await seedDefaultUsers(8);
		return db;
	} 
	catch (error) {
		db.close();
		console.error("Error in creating database: ", error);
		throw error;
	}
}

async function seedDefaultUsers(user_count: number) {
	// pick simple starter passwords; your registerUser should pepper+argon2-hash before insert
	for (let i = 0; i < user_count; i++) {
		await registerNewUser(`p${i}`, `player${i}@example.com`, 'p' );
	}
	console.log(`Seeded ${user_count} default users via registration flow`);
  }