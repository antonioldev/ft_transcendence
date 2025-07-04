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