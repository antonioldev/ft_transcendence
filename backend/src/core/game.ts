import { Ball } from './Ball.js';
import { Paddle, EasyBot, MediumBot, HardBot, ExactBot } from './Paddle.js';
import { Clock } from './utils.js';
import { GAME_CONFIG, LEFT_PADDLE, RIGHT_PADDLE } from '../shared/gameConfig.js';
import { GameMode, MessageType} from '../shared/constants.js';
import { PlayerInput, GameStateData, ServerMessage } from '../shared/types.js';
import { Client, Player} from '../models/Client.js'
import { saveGameResult } from '../data/validation.js';

type Bot = new (side: number, ball: Ball) => Paddle;
const BOT_MAP = {
	0: EasyBot,
	1: MediumBot,
	2: HardBot,
	3: ExactBot,
} satisfies Record<number, Bot>;


// The Game class runs the core game logic for all game modes.
export class Game {
	// Clock instance to manage game loop timing
	clock: Clock;
	queue: PlayerInput[] = [];
	running: boolean = true;
	paused: boolean = false;
	players: Player[]
	winner!: Player;
	paddles: (Paddle | EasyBot | MediumBot | HardBot | ExactBot)[] = [new Paddle(LEFT_PADDLE), new Paddle(RIGHT_PADDLE)];
	ball!: Ball;
	match_id?: string; // for tournament matches only
	// Callback function to broadcast the game state
	private _broadcast: (message: ServerMessage, clients?: Client[]) => void;

	constructor(players: Player[], broadcast_callback: (message: ServerMessage, clients?: Client[]) => void, match_id?: string) {
		// Initialize game properties
		this.match_id = match_id;
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
			if (player.name === "CPU") {
				const Bot = BOT_MAP[player.difficulty as keyof typeof BOT_MAP];
				this.paddles[side] = new Bot(side, this.ball);
			}
		}
	}


	private isBot(paddle: Paddle): paddle is Paddle & { update: (dt: number) => void } {
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
			this.running = false;
			this.winner = this.players[side];
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

	async send_sides_and_countdown(): Promise<void> { // New function, send to clients message to start + countdown
		// broadcast the side assignment to all clients
		this._broadcast({
			type: MessageType.ALL_READY,
			left: this.players[LEFT_PADDLE]?.name,
			right: this.players[RIGHT_PADDLE]?.name,
			...(this.match_id && { match_id: this.match_id }) // optionally includes match_id for tournament
		});
		
		// broadcast the countdown timer on every second
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
		await this.send_sides_and_countdown();
		// if both are CPU then choose a random winner
		if (this.paddles[LEFT_PADDLE] instanceof ExactBot && this.paddles[RIGHT_PADDLE] instanceof ExactBot) {
			const index = (Math.random() > 0.5) ? 0 : 1;
			this.winner = this.players[index];
			this.running = false;
		}

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
		this.stop();
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
	stop(gameId?: string): void { 
		this.running = false;

		// TODO: save score to db
		if (gameId && this.players[LEFT_PADDLE].client?.id != this.players[RIGHT_PADDLE].client?.id) {
			const player1_score = this.paddles[LEFT_PADDLE].score;
			const player2_score = this.paddles[RIGHT_PADDLE].score;
			const player1_username = this.players[LEFT_PADDLE].name;
			const player2_username = this.players[RIGHT_PADDLE].name;
			const endTime = Date.now();
			console.log(`TO VERIFY ==> player1_name: ${player1_username}, player2_name: ${player2_username} // client1_name: ${this.players[LEFT_PADDLE].client?.username}, client2_name: ${this.players[RIGHT_PADDLE].client?.username}`)
			saveGameResult(gameId, player1_username, player2_username, player1_score, player2_score, endTime) // add check for error
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
}
