export type PlayerInput = {
	id: string;
	type: string;
	side: number;
	dy: number;
}

export type GameState = {
	paddle_left: {y: number, score: number};
	paddle_right: {y: number, score: number};
	ball: {x: number, y: number}
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