export type PlayerInput = {
	id: string;
	type: string;
	side: number;
	dx: number;
}

export type GameState = {
	paddleLeft: {x: number, score: number};
	paddleRight: {x: number, score: number};
	ball: {x: number, z: number}
}

export type ClientMessage = {
	type: 'join_game' | 'player_input';
	gameMode?: 'singlePlayer' | 'two_player_remote';
	side?: number;
	direction?: 'left' | 'right' | 'stop';
}

export type ServerMessage = {
	type: 'game_state' | 'side_assignment' | 'game_started' | 'error';
	state?: GameState;
	side?: number;
	message?: string;
}