import * as dbFunction from '../data/database.js';
import { initialisazeDatabase } from '../data/db-init.js';

const db = initialisazeDatabase('/app/database/transcendence.sqlite');
dbFunction.registerDatabaseFunctions(db);
let success = false;

console.log('▶ Registering user...');
success = dbFunction.registerUser('test', 'test@example.com', 'pass123');
console.log('✅ Register success:', success);

console.log('▶ Registering user...');
success = dbFunction.registerUser('test2', 'test2@example.com', 'pass123');
console.log('✅ Register success:', success);

console.log('▶ Registering user...');
success = dbFunction.registerUser('test3', 'test3@example.com', 'pass123');
console.log('✅ Register success:', success);

console.log('▶ Registering user...');
success = dbFunction.registerUser('test4', 'test4@example.com', 'pass123');
console.log('✅ Register success:', success);

let emails = ["test@example.com", "test2@example.com", "test3@example.com", "test4@example.com"];
console.log('▶ Deleting users...');
let i = 0;
while (i < emails.length)
    success = dbFunction.deleteUser(emails[i++]);
console.log('✅ deleting success:', success);

