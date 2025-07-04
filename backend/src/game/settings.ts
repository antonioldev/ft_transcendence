// Screen dimensions
export const WINDOW_WIDTH = 1280;
export const WINDOW_HEIGHT = 720;

// Sprites
export const BALL_SIZE = 40;
export const PADDLE_HEIGHT = 100;
export const PADDLE_WIDTH = BALL_SIZE;

export const LEFT_PADDLE = 0;
export const RIGHT_PADDLE = 1;
export const BALL = 2;

export const POS: Record<number, [number, number]> = {
    [BALL]: [WINDOW_WIDTH / 2, WINDOW_HEIGHT / 2],
    [LEFT_PADDLE]: [PADDLE_WIDTH / 2, WINDOW_HEIGHT / 2],
    [RIGHT_PADDLE]: [WINDOW_WIDTH - PADDLE_WIDTH / 2, WINDOW_HEIGHT / 2],
};

// Gameplay
export const START_DELAY = 1.0;

export const SPEED: Record<'player' | 'aibot' | 'ball', number> = {
    player: 500,
    aibot: 500,
    ball: 300,
};

