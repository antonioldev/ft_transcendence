import * as dbFunctions from '../data/database.js';
import { initialisazeDatabase } from './db-init.js';

const db = initialisazeDatabase('/app/database/transcendence.sqlite');
dbFunctions.registerDatabaseFunctions(db);

function logDivider() {
  console.log('----------------------------');
}

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testGameFlow() {
  let success = false;

  // Register players
  console.log('▶ Registering player1...');
  success = dbFunctions.registerUser('Alice', 'alice@example.com', 'alice123');
  console.log('✅ Register success:', success);

  console.log('▶ Registering player2...');
  success = dbFunctions.registerUser('Bob', 'bob@example.com', 'bob123');
  console.log('✅ Register success:', success);
  logDivider();

  const player1_id = dbFunctions.retrieveUserID('alice@example.com');
  const player2_id = dbFunctions.retrieveUserID('bob@example.com');

  console.log(`Player1 ID: ${player1_id}, Player2 ID: ${player2_id}`);
  logDivider();

  // Create game
  console.log('▶ Creating new game...');
  const gameId = dbFunctions.createNewGame(player1_id, player2_id);
  console.log('🎮 Game created with ID:', gameId);

  const startTime = dbFunctions.getGameStartTime(gameId);
  console.log('🕒 Game start time:', startTime);
  logDivider();

  // Simulate delay
  console.log('⌛ Simulating game...');
  await wait(2000); // 2 seconds

  // Update game info
  console.log('▶ Updating game result...');
  success = dbFunctions.updateGameInfo(gameId, 10, 7, player1_id, player2_id, Date.now());
  console.log('✅ Game update success:', success);
  await wait(500);

  // Fetch game data
  console.log('⏱ Duration (seconds):', dbFunctions.getGameDuration(gameId));
  console.log('🏆 Winner ID:', dbFunctions.getGameWinner(gameId));
  console.log('Looser ID:', dbFunctions.getGameLooser(gameId));
  logDivider();

  console.log('New info player1: ', dbFunctions.getUserEmail('alice@example.com'));
  console.log('New info player2: ', dbFunctions.getUserEmail('bob@example.com'));
  logDivider();

  cleanTest(1, 'alice@example.com', 'bob@example.com');
}

async function cleanTest(gameId: number, email1: string, email2: string) {
    console.log('🧹 Cleaning up...');
    console.log('Deleting game:', dbFunctions.deleteGame(gameId));
    await wait(1000);
    console.log('Deleting user Alice:', dbFunctions.deleteUser(email1));
    console.log('Deleting user Bob:', dbFunctions.deleteUser(email2));
}

testGameFlow();
