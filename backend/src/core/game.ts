import { Ball } from './Ball.js';
import { Paddle, CPUBot } from './Paddle.js';
import { Clock } from './utils.js';
import { GAME_CONFIG, CPUDifficultyMap, LEFT_PADDLE, RIGHT_PADDLE } from '../shared/gameConfig.js';
import { GameMode, MessageType, Powerup} from '../shared/constants.js';
import { PlayerInput, GameStateData, ServerMessage } from '../shared/types.js';
import { Client, Player} from '../models/Client.js'
import { saveGameResult } from '../data/validation.js';

// The Game class runs the core game logic for all game modes.
export class Game {
	// Clock instance to manage game loop timing
	clock: Clock;
	queue: PlayerInput[] = [];
	running: boolean = true;
	paused: boolean = false;
	players: Player[]
	winner!: Player;
	paddles: (Paddle | CPUBot)[] = [new Paddle(LEFT_PADDLE), new Paddle(RIGHT_PADDLE)];
	ball!: Ball;
	// Callback function to broadcast the game state
	private _broadcast: (message: ServerMessage, clients?: Client[]) => void;

	constructor(players: Player[], broadcast_callback: (message: ServerMessage, clients?: Client[]) => void) {
		// Initialize game properties
		this.clock = new Clock();
		this._broadcast = broadcast_callback;
		this.players = players;
		this._init();
	}

	// Initialize the ball and players
	private _init() {
		this.ball = new Ball(this.paddles, this._update_score.bind(this));

		for (const side of [LEFT_PADDLE, RIGHT_PADDLE]) {
			const player: Player = this.players[side];
			if (player.name === "CPU" && player.difficulty !== undefined) {
				const noiseFactor =  CPUDifficultyMap[player.difficulty];
				this.paddles[side] = new CPUBot(side, this.ball, noiseFactor);
			}
			this._broadcast({
				type: MessageType.POWERUP_ASSIGNMENT,
				side: side,
				powerups: this.paddles[side].powerups,
			})
		}
	}

	// private isBot(paddle: Paddle): paddle is Paddle & { update: (dt: number) => void } {
	// 	return typeof (paddle as any).update === 'function';
	// }
	private isBot(paddle: Paddle | CPUBot): paddle is CPUBot {
		return typeof (paddle as any).update === 'function';
	}

	private _handle_input(dt: number): void {
		if (!this.running) return ;

		this._process_queue(dt);

		// call .update() only on bot paddles
		for (const paddle of this.paddles) {
			if (this.isBot(paddle)) {
				paddle.update(dt);
			}
		}
	}

	// Update the score for the specified side
	private _update_score(side: number, score: number): void {
		if (!this.running) return ;

		this.paddles[side].score += score;
		if (this.paddles[side].score >= GAME_CONFIG.scoreToWin) {
			this.winner = this.players[side];
			this.stop();
		}
	}

	// Update the game state, including player and ball positions
	private _update_state(dt: number): void {
		// cache preceeding rect positions for collision calculations
		this.paddles[LEFT_PADDLE].cacheRect();
		this.paddles[RIGHT_PADDLE].cacheRect();
		this._handle_input(dt);
		this.ball.update(dt);
	}

	// Process the input queue and apply player movements
	private _process_queue(dt: number): void {
		while (this.queue.length > 0) {
			const input = this.queue.shift();
			if (input) {
				this.paddles[input.side].move(dt, input.dx);
			}
		}
	}

	// Add a new input to the queue
	enqueue(input: PlayerInput): void {
		if (!this.paused) {
			this.queue.push(input);
		}
	}

	// Retrieve the current game state as a data object
	get_state(): GameStateData {
		return {
			paddleLeft: {
				x:     this.paddles[LEFT_PADDLE].rect.centerx,
				score: this.paddles[LEFT_PADDLE].score,
			},
			paddleRight: {
				x:     this.paddles[RIGHT_PADDLE].rect.centerx,
				score: this.paddles[RIGHT_PADDLE].score,
			},
			ball: {
				x: this.ball.rect.centerx,
				z: this.ball.rect.centerz,
				current_rally: this.ball.current_rally,
			},
		}
	}

	assign_sides() {
		if (!this.players[LEFT_PADDLE] || !this.players[RIGHT_PADDLE]) {
			console.error("Error assigning sides: player(s) undefined")
			return ;
		}
		this._broadcast({
			type: MessageType.SIDE_ASSIGNMENT,
			left: this.players[LEFT_PADDLE].name,
			right: this.players[RIGHT_PADDLE].name,
		});
	}
	async send_countdown(): Promise<void> {
		for (let countdown = GAME_CONFIG.startDelay; countdown >= 0; countdown--) {
			console.log(`Sending countdown: ${countdown}`);

			this._broadcast({
				type: MessageType.COUNTDOWN,
				countdown: countdown,
			});

			if (countdown > 0) {
				await this.clock.sleep(1000);
			}
		}
		// reset clock dt to 60fps after countdown
		this.clock.tick(60);
	}

	// Main game loop 
	async run(): Promise<Player> {
		// if both are CPU then choose a random winner
		if (this.paddles[LEFT_PADDLE] instanceof CPUBot && this.paddles[RIGHT_PADDLE] instanceof CPUBot) {
			const index = (Math.random() > 0.5) ? 0 : 1;
			this.winner = this.players[index];
			this.stop();
			return (this.winner);
		}
		this.assign_sides();
		await this.send_countdown();
		// run game loop, updating and broadcasting state to clients until win
		while (this.running) {
			const dt = await this.clock.tick(60);
			if (this.paused) continue ;

			this._update_state(dt);
			this._broadcast({
				type: MessageType.GAME_STATE,
				state: this.get_state()
			});
		}
		return (this.winner);
	}

	// Pause the game
	pause(): void {
		if(!this.paused) {
			this.paused = true;
			this.queue = []
			this._broadcast( {type: MessageType.PAUSED} );
		}
	}

	// Resume the game
	resume(): void { 
		this.paused = false; 
		this._broadcast({type: MessageType.RESUMED});
	}

	// Returns if the game is currently paused
	isPaused(): boolean { return this.paused; }

	// Stop the execution of the game & broadcast the winner
	stop(gameId?: string) {
		if (!this.running) return ;

		this.running = false;
		console.log(`Game id in async stop of game.ts: ${gameId}`);
		if (gameId && this.players[LEFT_PADDLE].client?.id != this.players[RIGHT_PADDLE].client?.id) {
			const player1_score = this.paddles[LEFT_PADDLE].score;
			const player2_score = this.paddles[RIGHT_PADDLE].score;
			const player1_username = this.players[LEFT_PADDLE].name;
			const player2_username = this.players[RIGHT_PADDLE].name;
			const endTime = Date.now();
			console.log(`TO VERIFY ==> player1_name: ${player1_username}, player2_name: ${player2_username} // client1_name: ${this.players[LEFT_PADDLE].client?.username}, client2_name: ${this.players[RIGHT_PADDLE].client?.username}`)
			// saveGameResult(gameId, player1_username, player2_username, player1_score, player2_score, endTime) // add check for error
		}
		
		this._broadcast({
			type: MessageType.GAME_ENDED,
			...(this.winner && { winner: this.winner.name }) // optionally send winner if exists
		});

		console.log("game ended: broadcasting game end");
	}
	
	// If someone quits a remote game, the opposing player wins
	setOtherPlayerWinner(quitter_id: string) {
		if (!this.players[LEFT_PADDLE].client || !this.players[RIGHT_PADDLE].client) return ;
		
		this.winner = (this.players[LEFT_PADDLE].client?.id === quitter_id) ? this.players[RIGHT_PADDLE] : this.players[LEFT_PADDLE];
	}

	activate_powerup(type: Powerup, side: number, slot: number) {
		if (this.paddles[side].powerups[slot] != type) {
			console.log(`Cannot actvivate powerup "${type}" as player lacks this ability`);
			return ;
		}
		const other_side = side === LEFT_PADDLE ? RIGHT_PADDLE : LEFT_PADDLE;
		switch (type) {
			case Powerup.SLOW_OPPONENT:
				this.paddles[other_side].speed = GAME_CONFIG.decreasedPaddleSpeed;
				break ;
			case Powerup.SHRINK_OPPONENT:
				this.paddles[other_side].rect.width = GAME_CONFIG.decreasedPaddleWidth;
				break ;			
			case Powerup.INCREASE_PADDLE_SPEED:
				this.paddles[side].speed = GAME_CONFIG.increasedPaddleSpeed;
				break ;
    		case Powerup.GROW_PADDLE:
				this.paddles[side].rect.width = GAME_CONFIG.increasedPaddleWidth;
				break ;
		}
		this._broadcast({
			type: MessageType.POWERUP_ACTIVATED,
			powerup: type,
			side: side,
			slot: slot
		})

		this.paddles[side].powerups[slot] = null;
		setTimeout(() => this.deactivate_powerup(type, side, slot), GAME_CONFIG.powerupDuration)
	}

	deactivate_powerup(type: Powerup, side: number, slot: number) {
		const other_side = side === LEFT_PADDLE ? RIGHT_PADDLE : LEFT_PADDLE;
		switch (type) {
			case Powerup.SLOW_OPPONENT:
				this.paddles[other_side].speed = GAME_CONFIG.paddleSpeed;
				break ;
			case Powerup.SHRINK_OPPONENT:
				this.paddles[other_side].rect.width = GAME_CONFIG.paddleWidth;
				break ;			
			case Powerup.INCREASE_PADDLE_SPEED:
				this.paddles[side].speed = GAME_CONFIG.paddleSpeed;
				break ;
    		case Powerup.GROW_PADDLE:
				this.paddles[side].rect.width = GAME_CONFIG.paddleWidth;
				break ;
		}

		this._broadcast({
			type: MessageType.POWERUP_DEACTIVATED,
			powerup: type,
			side: side,
			slot: slot
		})
	}
}
