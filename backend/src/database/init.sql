-- Create empty containers for the future data 
-- User table will contain user information 
-- Gmae table will contain game information for history lookup

-- Empty table for user info
CREATE TABLE IF NOT EXISTS users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	username TEXT UNIQUE NOT NULL,
	email TEXT UNIQUE NOT NULL,
	pwd TEXT NOT NULL,
	victories INTEGER DEFAULT 0,
	defeats INTEGER DEFAULT 0,
	games INTEGER DEFAULT 0
);

-- Empty table for game info
CREATE TABLE IF NOT EXISTS games (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	player1_id INTEGER NOT NULL,
	player2_id INTEGER NOT NULL,
	winner_id INTEGER,
	looser_id INTEGER,
	player1_score INTEGER DEFAULT 0,
	player2_score INTEGER DEFAULT 0,
	played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	duration_seconds INTEGER,
    FOREIGN KEY (player1_id) REFERENCES users(id),
    FOREIGN KEY (player2_id) REFERENCES users(id),
    FOREIGN KEY (winner_id) REFERENCES users(id),
	FOREIGN KEY (looser_id) REFERENCES users(id)
)