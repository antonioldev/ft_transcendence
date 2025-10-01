import { Rect } from './utils.js';
import { Paddle } from './Paddle.js'
import { CollisionDirection } from '../shared/constants.js'
import { GAME_CONFIG, getBallStartPosition, LEFT, RIGHT } from '../shared/gameConfig.js';

// Represents the ball in the game, handling its movement, collisions, and scoring logic.
export class Ball {
    paddles: (Paddle)[]; // Array of players (paddles) in the game.
    rally: { current: number };
    updateScore: (side: number, ball: Ball) => void; // Callback to update the score.
    rect: Rect; // Current position and size of the ball.
    oldRect: Rect; // Previous position and size of the ball.
    direction: [number, number]; // Direction vector of the ball's movement.
    speed: number = GAME_CONFIG.ballInitialSpeed; // Initial speed of the ball.
    
    //Powerups
    isFrozen: Boolean = false;
    speed_cache: number = GAME_CONFIG.ballInitialSpeed; // used to remember speed before powershot activated
    powershot_active: boolean = false;       // whether ball is currently at superspeed
    double_points_active: boolean = false;    // whether double points powerup activated

    // Initializes the ball with players and a score update callback.
    constructor(paddles: any[], rally: any, updateScoreCallback: (side: number, ball: Ball) => void) {
        this.paddles = paddles;
        this.rally = rally;
        this.updateScore = updateScoreCallback;

        const ballPos = getBallStartPosition();
        this.rect = new Rect(ballPos.x, ballPos.z, GAME_CONFIG.ballRadius * 2, GAME_CONFIG.ballRadius * 2);
        this.oldRect = this.rect.instance();
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
                    this.update_ball_trajectory(side);
                    this.rally.current += this.double_points_active ? 2 : 1;
                }
                else if (this.rect.top <= this.paddles[side].rect.bottom && this.oldRect.top >= this.paddles[side].oldRect.bottom) {
                    this.rect.top = this.paddles[side].rect.bottom;
                    this.update_ball_trajectory(side);
                    this.rally.current += this.double_points_active ? 2 : 1;
                }
            }
        }
    }

    update_ball_trajectory(side: number) {
        this.calculate_spin(this.paddles[side]);
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
        }
        if (this.rect.right >= GAME_CONFIG.wallBounds.maxX) {
            this.rect.right = GAME_CONFIG.wallBounds.maxX;
            this.direction[0] *= -1; // Reverse X direction
        }
        
        // Goal detection (top/bottom goals)
        if (this.rect.centerz <= GAME_CONFIG.goalBounds.rightGoal) {
            this.updateScore(RIGHT, this);
            this.reset();
        }
        if (this.rect.centerz >= GAME_CONFIG.goalBounds.leftGoal) {
            this.updateScore(LEFT, this);
            this.reset();
        }
    }

    // Resets the ball to its initial position and direction.
    reset(): void {
        const ballPos = getBallStartPosition();
        this.rect.x = ballPos.x;
        this.rect.z = ballPos.z;
        this.direction = this.randomDirection();
        this.speed = GAME_CONFIG.ballInitialSpeed;
        this.rally.current = 1;
    }

    // Updates the ball's state, including movement, collisions, and scoring.
    update(dt: number): void {
        if (this.isFrozen) return ;
        this.oldRect.copy(this.rect);
        this.move(dt);
        this.wallCollision();
    }

    duplicate(): Ball {
        let new_ball = new Ball(this.paddles, this.rally, this.updateScore);
        new_ball.rect.copy(this.rect);
        new_ball.oldRect.copy(this.oldRect);
        new_ball.direction = this.direction;
        new_ball.speed = this.speed;
        new_ball.isFrozen = this.isFrozen;
        new_ball.speed_cache = this.speed_cache
        new_ball.powershot_active = this.powershot_active;
        new_ball.double_points_active = this.double_points_active;
        return (new_ball);
    }
}