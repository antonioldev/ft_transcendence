import { registerDatabaseFunctions, registerUser, getUserbyEmail } from '../data/database.js';
import { initialisazeDatabase } from './db-init.js';

const db = initialisazeDatabase('./src/database/transcendence.sqlite');
registerDatabaseFunctions(db);

console.log('▶ Registering user...');
const success = registerUser('test', 'test@example.com', 'pass123');
console.log('✅ Register success:', success);

console.log('▶ Fetching user by email...');
const user = getUserbyEmail('test@example.com');
console.log('👤 User fetched:', user);
