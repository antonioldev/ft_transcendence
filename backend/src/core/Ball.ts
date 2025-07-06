import { Rect } from './utils.js';
import { Player } from './Paddle.js'
import { CollisionDirection } from '../shared/constants.js'
import { GAME_CONFIG, getBallStartPosition, LEFT_PADDLE, RIGHT_PADDLE } from '../shared/gameConfig.js';

export class Ball {
    rect: Rect;
    oldRect: Rect;
    direction: [number, number];
    speed = GAME_CONFIG.ballInitialSpeed;
    speedModifier = 0;
    players: (Player)[];
    startTime: number;
    updateScore: (scoringPlayer: number) => void;

    constructor(players: any[], updateScoreCallback: (side: number) => void) {
        const ballPos = getBallStartPosition();
        this.rect = new Rect(ballPos.x, ballPos.z, GAME_CONFIG.ballRadius * 2, GAME_CONFIG.ballRadius * 2);
        this.oldRect = this.rect.instance();
        this.players = players;
        this.updateScore = updateScoreCallback;
        this.startTime = performance.now();
        this.direction = this.randomDirection();
    }

    private randomDirection(): [number, number] {
        const x = Math.random() < 0.5 ? 1 : -1;
        const y = (Math.random() * 0.1 + 0.7) * (Math.random() < 0.5 ? -1 : 1);
        return [x, y];
    }

    move(dt: number): void {
        const deltaSeconds = dt / 1000;
        this.rect.x += this.direction[0] * this.speed * deltaSeconds * this.speedModifier;
        this.collision(CollisionDirection.HORIZONTAL);
        this.rect.y += this.direction[1] * this.speed * deltaSeconds * this.speedModifier;
        this.collision(CollisionDirection.VERTICAL);
    }

    private collision(direction: CollisionDirection): void {
        for (const paddle of this.players) {
            if (!this.rect.colliderect(paddle.rect)) continue;

            if (direction === CollisionDirection.HORIZONTAL) {
                if (this.rect.right >= paddle.rect.left && this.oldRect.right <= paddle.oldRect.left) {
                    this.rect.right = paddle.rect.left;
                    this.direction[0] *= -1;
            }
                else if (this.rect.left <= paddle.rect.right && this.oldRect.left >= paddle.oldRect.right) {
                    this.rect.left = paddle.rect.right;
                    this.direction[0] *= -1;
                }
            } 
            else {
                if (this.rect.bottom >= paddle.rect.top && this.oldRect.bottom <= paddle.oldRect.top) {
                    this.rect.bottom = paddle.rect.top;
                    this.direction[1] *= -1;
                } 	
                else if (this.rect.top <= paddle.rect.bottom && this.oldRect.top >= paddle.oldRect.bottom) {
                    this.rect.top = paddle.rect.bottom;
                    this.direction[1] *= -1;
                }
            }
        }
    }

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
            const scorer = LEFT_PADDLE;  // Left player scores
            this.updateScore(scorer);
            this.reset();
        }
        if (this.rect.bottom >= GAME_CONFIG.goalBounds.leftGoal) {
            const scorer = RIGHT_PADDLE;  // Right player scores
            this.updateScore(scorer);
            this.reset();
        }
    }

    reset(): void {
        const ballPos = getBallStartPosition();
        this.rect.x = ballPos.x;
        this.rect.y = ballPos.z;
        this.direction = this.randomDirection();
        this.startTime = performance.now();
    }

    private delayTimer(): void {
        const elapsed = (performance.now() - this.startTime);
        this.speedModifier = elapsed >= GAME_CONFIG.startDelay ? 1 : 0;
    }

    update(dt: number): void {
        this.oldRect.copy(this.rect);
        this.delayTimer();
        this.move(dt);
        this.wallCollision();
    }
}