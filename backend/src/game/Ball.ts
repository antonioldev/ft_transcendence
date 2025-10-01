import { Rect } from './utils.js';
import { Paddle } from './Paddle.js'
import { CollisionDirection } from '../shared/constants.js'
import { GAME_CONFIG, getBallStartPosition, LEFT, RIGHT } from '../shared/gameConfig.js';
import { rotate } from './utils.js';

// Represents the ball in the game, handling its movement, collisions, and scoring logic.
export class Ball {
    rect: Rect; // Current position and size of the ball.
    oldRect: Rect; // Previous position and size of the ball.
    direction: [number, number]; // Direction vector of the ball's movement.
    speed: number = GAME_CONFIG.ballServeSpeed; // Initial speed of the ball.
    paddles: (Paddle)[]; // Array of players (paddles) in the game.
    isPaused: Boolean = false;
    updateScore: (side: number, score: number) => void; // Callback to update the score.
    current_rally = 1;
    speed_cache: number = GAME_CONFIG.ballInitialSpeed;
    
    powershot_active: boolean = false;       // whether ball is currently at superspeed
    double_points_active: boolean = false;    // whether double points powerup activated
    curve_angle: number = GAME_CONFIG.curve_angle;

    // Initializes the ball with players and a score update callback.
    constructor(paddles: any[], updateScoreCallback: (side: number, score: number) => void) {
        const ballPos = getBallStartPosition();
        this.rect = new Rect(ballPos.x, ballPos.z, GAME_CONFIG.ballRadius * 2, GAME_CONFIG.ballRadius * 2);
        this.oldRect = this.rect.instance();
        this.paddles = paddles;
        this.updateScore = updateScoreCallback;
        this.direction = this.randomDirection();
    }

    // Generates a random initial direction for the ball.
    private randomDirection(): [number, number] {
        // create a random angle
        const angle = (Math.random() * 2 - 1) * GAME_CONFIG.ballMaxAngle;

        // create vector with random horizontal direction
        const x = Math.sin(angle);
        const z = Math.random() < 0.5 ? Math.cos(angle) : -(Math.cos(angle));
        return [x, z];
    }

    // Moves the ball based on its direction, speed, and elapsed time.
    move(dt: number): void {
        const deltaSeconds = dt / 1000;
        this.rect.x += this.direction[0] * this.speed * deltaSeconds;
        this.collision(CollisionDirection.HORIZONTAL);
        this.rect.z += this.direction[1] * this.speed * deltaSeconds;
        this.collision(CollisionDirection.FRONT);
        this.direction = rotate(this.direction, -this.curve_angle);
``    }

    calculate_direction(paddle: Paddle) {
        // calculate how far along the paddle the ball hits
        const paddle_intercept = paddle.rect.centerx - this.rect.centerx;
        const normalized_intercept = paddle_intercept / (GAME_CONFIG.paddleWidth / 2)
        
        // calculate the angle of defelction relative to the paddle intersection
        const angle_sign = (paddle_intercept >  0) ? 1 : -1;
        const angle_magnitude = Math.max(Math.abs(normalized_intercept * GAME_CONFIG.ballMaxAngle), GAME_CONFIG.ballMinAngle);
        const deflection_angle = angle_magnitude * angle_sign;

        // apply the angle to the ball's direction vector
        const z = (paddle.side === LEFT) ? Math.cos(deflection_angle) : -(Math.cos(deflection_angle));
        const x = -(Math.sin(deflection_angle));
        this.direction = [x, z];
    }

    // Handles collisions with paddles and adjusts the ball's direction accordingly.
    private collision(direction: CollisionDirection): void {
        for (const side of [LEFT, RIGHT]) {
            if (!this.rect.colliderect(this.paddles[side].rect)) continue;

            // Collision with sides of paddle
            if (direction === CollisionDirection.HORIZONTAL) { 
                if (this.rect.right >= this.paddles[side].rect.left && this.oldRect.right <= this.paddles[side].oldRect.left) {
                    this.rect.right = this.paddles[side].rect.left;
                    this.direction[0] *= -1;
                }
                else if (this.rect.left <= this.paddles[side].rect.right && this.oldRect.left >= this.paddles[side].oldRect.right) {
                    this.rect.left = this.paddles[side].rect.right;
                    this.direction[0] *= -1;
                }
            }
            else { // Collision with front of paddle
                if (this.rect.bottom >= this.paddles[side].rect.top && this.oldRect.bottom <= this.paddles[side].oldRect.top) {
                    this.rect.bottom = this.paddles[side].rect.top;
                    this.current_rally += this.double_points_active ? 2 : 1;
                    this.update_ball_trajectory(side);
                    this.curve_angle = GAME_CONFIG.curve_angle;

                }
                else if (this.rect.top <= this.paddles[side].rect.bottom && this.oldRect.top >= this.paddles[side].oldRect.bottom) {
                    this.rect.top = this.paddles[side].rect.bottom;
                    this.current_rally += this.double_points_active ? 2 : 1;
                    this.update_ball_trajectory(side);
                    this.curve_angle = GAME_CONFIG.curve_angle;
                }
            }
        }
    }

    update_ball_trajectory(side: number) {
        if (this.speed === GAME_CONFIG.ballServeSpeed) this.speed = GAME_CONFIG.ballInitialSpeed;

        this.calculate_direction(this.paddles[side]);
        this.speed *= (this.speed < GAME_CONFIG.maxBallSpeed) ? GAME_CONFIG.ballSpeedIncrease : 1;
        this.handle_powershot(side);
    }

    handle_powershot(collision_side: number) {
        if (this.paddles[collision_side].powershot_activated) {
            this.speed_cache = this.speed;
            this.speed = GAME_CONFIG.ballPowerShotSpeed;
            this.paddles[collision_side].powershot_activated = false;
            this.powershot_active = true;
        }
        else if (this.powershot_active) {
            this.speed = this.speed_cache;
            this.powershot_active = false;
        }
    }

    // Handles collisions with walls and detects goals to update the score.
    wallCollision(): void {
        // Wall collisions (left/right walls)
        if (this.rect.left <= GAME_CONFIG.wallBounds.minX) {
            this.rect.left = GAME_CONFIG.wallBounds.minX;
            this.direction[0] *= -1; // Reverse X direction
            this.curve_angle = GAME_CONFIG.curve_angle;
        }
        else if (this.rect.right >= GAME_CONFIG.wallBounds.maxX) {
            this.rect.right = GAME_CONFIG.wallBounds.maxX;
            this.direction[0] *= -1; // Reverse X direction
            this.curve_angle = GAME_CONFIG.curve_angle;
        }
        
        // Goal detection (top/bottom goals)
        if (this.rect.centerz <= GAME_CONFIG.goalBounds.rightGoal) {
            this.updateScore(RIGHT, this.current_rally);
            this.reset();
        }
        else if (this.rect.centerz >= GAME_CONFIG.goalBounds.leftGoal) {
            this.updateScore(LEFT, this.current_rally);
            this.reset();
        }
    }

    // Resets the ball to its initial position and direction.
    reset(): void {
        const ballPos = getBallStartPosition();
        this.rect.x = ballPos.x;
        this.rect.z = ballPos.z;
        this.direction = this.randomDirection();
        this.speed = GAME_CONFIG.ballServeSpeed;
        this.current_rally = 1;
    }

    // Updates the ball's state, including movement, collisions, and scoring.
    update(dt: number): void {
        if (this.isPaused) return ;
        this.oldRect.copy(this.rect);
        this.move(dt);
        this.wallCollision();
    }
}