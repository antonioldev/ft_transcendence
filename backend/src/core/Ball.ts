import { Rect } from './utils.js';
import { Paddle } from './Paddle.js'
import { CollisionDirection } from '../shared/constants.js'
import { GAME_CONFIG, getBallStartPosition, LEFT_PADDLE, RIGHT_PADDLE } from '../shared/gameConfig.js';

// Represents the ball in the game, handling its movement, collisions, and scoring logic.
export class Ball {
    rect: Rect; // Current position and size of the ball.
    oldRect: Rect; // Previous position and size of the ball.
    direction: [number, number]; // Direction vector of the ball's movement.
    speed = GAME_CONFIG.ballInitialSpeed; // Initial speed of the ball.
    speedModifier = 0; // Speed modifier based on game state (e.g., delay).
    paddles: (Paddle)[]; // Array of players (paddles) in the game.
    startTime: number; // Timestamp when the ball was initialized or reset.
    updateScore: (side: number, score: number) => void; // Callback to update the score.
    current_rally = 0; 

    // Initializes the ball with players and a score update callback.
    constructor(paddles: any[], updateScoreCallback: (side: number, score: number) => void) {
        const ballPos = getBallStartPosition();
        this.rect = new Rect(ballPos.x, ballPos.z, GAME_CONFIG.ballRadius * 2, GAME_CONFIG.ballRadius * 2);
        this.oldRect = this.rect.instance();
        this.paddles = paddles;
        this.updateScore = updateScoreCallback;
        this.startTime = performance.now();
        this.direction = this.randomDirection();
    }

    // Generates a random initial direction for the ball.
    private randomDirection(): [number, number] {
        const x = (Math.random() * 2 - 1) * GAME_CONFIG.ballMaxAngle;
        const z = Math.random() < 0.5 ? 1 : -1;
        const magnitude = Math.sqrt(x * x + z * z);
        return [x / magnitude, z / magnitude];
    }

    // Moves the ball based on its direction, speed, and elapsed time.
    move(dt: number): void {
        const deltaSeconds = dt / 1000;
        this.rect.x += this.direction[0] * this.speed * deltaSeconds * this.speedModifier;
        this.collision(CollisionDirection.HORIZONTAL);
        this.rect.z += this.direction[1] * this.speed * deltaSeconds * this.speedModifier;
        this.collision(CollisionDirection.FRONT);
    }

    calculate_spin(paddle: Paddle) {
        // calculate how far along the paddle the ball hits
        const paddle_intercept = paddle.rect.centerx - this.rect.centerx;
        const normalized_intercept = paddle_intercept / (GAME_CONFIG.paddleWidth / 2)
        
        // calculate the angle of defelction relative to the paddle intersection
        const angle_sign = (paddle_intercept >  0) ? 1 : -1;
        const angle_magnitude = Math.max(Math.abs(normalized_intercept * GAME_CONFIG.ballMaxAngle), GAME_CONFIG.ballMinAngle);
        const deflection_angle = angle_magnitude * angle_sign;

        // apply the angle to the ball's direction vector
        const z = (paddle.side === LEFT_PADDLE) ? Math.cos(deflection_angle) : -(Math.cos(deflection_angle));
        const x = -(Math.sin(deflection_angle));
        this.direction = [x, z];
    }

    // Handles collisions with paddles and adjusts the ball's direction accordingly.
    private collision(direction: CollisionDirection): void {
        for (const paddle of this.paddles) {
            if (!this.rect.colliderect(paddle.rect)) continue;
            
            this.speed *= GAME_CONFIG.ballSpeedIncrease;
            this.current_rally += 1;

            if (direction === CollisionDirection.HORIZONTAL) { // Collision with sides of paddle
                if (this.rect.right >= paddle.rect.left && this.oldRect.right <= paddle.oldRect.left) {
                    this.rect.right = paddle.rect.left;
                    this.direction[0] *= -1;
                }
                else if (this.rect.left <= paddle.rect.right && this.oldRect.left >= paddle.oldRect.right) {
                    this.rect.left = paddle.rect.right;
                    this.direction[0] *= -1;
                }
            }
            else { // Collision with front of paddle
                if (this.rect.bottom >= paddle.rect.top && this.oldRect.bottom <= paddle.oldRect.top) {
                    this.rect.bottom = paddle.rect.top;
                    this.calculate_spin(paddle);

                }
                else if (this.rect.top <= paddle.rect.bottom && this.oldRect.top >= paddle.oldRect.bottom) {
                    this.rect.top = paddle.rect.bottom;
                    this.calculate_spin(paddle);
                }
            }
        }
    }

    // Handles collisions with walls and detects goals to update the score.
    wallCollision(): void {
        // Wall collisions (left/right walls)
        if (this.rect.left <= GAME_CONFIG.wallBounds.minX) {
            this.rect.left = GAME_CONFIG.wallBounds.minX;
            this.direction[0] *= -1; // Reverse X direction
        }
        if (this.rect.right >= GAME_CONFIG.wallBounds.maxX) {
            this.rect.right = GAME_CONFIG.wallBounds.maxX;
            this.direction[0] *= -1; // Reverse X direction
        }
        
        // Goal detection (top/bottom goals)
        if (this.rect.top <= GAME_CONFIG.goalBounds.rightGoal) {
            this.updateScore(RIGHT_PADDLE, this.current_rally);
            this.reset();
        }
        if (this.rect.bottom >= GAME_CONFIG.goalBounds.leftGoal) {
            this.updateScore(LEFT_PADDLE, this.current_rally);
            this.reset();
        }
    }

    // Resets the ball to its initial position and direction.
    reset(): void {
        const ballPos = getBallStartPosition();
        this.rect.x = ballPos.x;
        this.rect.z = ballPos.z;
        this.direction = this.randomDirection();
        this.startTime = performance.now();
        this.speed = GAME_CONFIG.ballInitialSpeed;
        this.current_rally = 0;
    }

    // Delays the ball's movement until the start delay has elapsed.
    private delayTimer(): void {
        const elapsed = (performance.now() - this.startTime);
        this.speedModifier = elapsed >= GAME_CONFIG.ballDelay ? 1 : 0;
    }

    // Updates the ball's state, including movement, collisions, and scoring.
    update(dt: number): void {
        this.oldRect.copy(this.rect);
        this.delayTimer();
        this.move(dt);
        this.wallCollision();
    }
}