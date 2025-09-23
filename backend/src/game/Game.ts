import { Ball } from './Ball.js';
import { Paddle, CPUBot } from './Paddle.js';
import { Clock } from './utils.js';
import { GAME_CONFIG, CPUDifficultyMap, LEFT_PADDLE, RIGHT_PADDLE } from '../shared/gameConfig.js';
import { MessageType} from '../shared/constants.js';
import { PlayerInput, GameStateData, ServerMessage } from '../shared/types.js';
import { Client, Player, CPU} from '../network/Client.js'
import { saveGameResult } from '../data/validation.js';
import { PowerupManager, Slot } from './Powerup.js';

// The Game class runs the core game logic for all game modes.
export class Game {
	id: string;
	clock: Clock;
	queue: PlayerInput[] = [];
	running: boolean = true;
	paused: boolean = false;
	players: (Player | CPU)[]
	winner!: Player | CPU;
	paddles: (Paddle | CPUBot)[] = [new Paddle(LEFT_PADDLE), new Paddle(RIGHT_PADDLE)];
	ball: Ball;
	private _broadcast: (message: ServerMessage, clients?: Set<Client>) => void;
	powerup_manager: PowerupManager;

	constructor(id: string, players: (Player | CPU)[], broadcast_callback: (message: ServerMessage, clients?: Set<Client>) => void) {
		this.id = id;
		this.clock = new Clock();
		this._broadcast = broadcast_callback;
		this.players = players;
		this.ball = new Ball(this.paddles, this._update_score.bind(this));
		this.powerup_manager = new PowerupManager(this.paddles, this.ball, this._broadcast)
		this._init();
	}

	private _init() {
		for (const side of [LEFT_PADDLE, RIGHT_PADDLE]) {
			const player: Player | CPU = this.players[side];
			if (player instanceof CPU) {
				const noiseFactor =  CPUDifficultyMap[player.difficulty];
				this.paddles[side] = new CPUBot(side, this.ball, noiseFactor, GAME_CONFIG.paddleSpeed, 0, (s, slot) => this.activate(s, slot) );
			}
		}
	}

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

	// used to send the names a powerups to a spectator joining a game
	send_current_state(client: Client) {
		// need to add client as arg
		this.powerup_manager.send_state(new Set([client])); 
		this.send_side_assignment(new Set([client]));
	}

	send_side_assignment(clients?: Set<Client>) {
		if (!this.players[LEFT_PADDLE] || !this.players[RIGHT_PADDLE]) {
			console.error("Error assigning sides: player(s) undefined")
			return ;
		}
		this._broadcast({
			type: MessageType.SIDE_ASSIGNMENT,
			left: this.players[LEFT_PADDLE].name,
			right: this.players[RIGHT_PADDLE].name,
		}, clients);
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
	async run(): Promise<Player | CPU> {
		// if both are CPU then choose a random winner
		if (this.paddles[LEFT_PADDLE] instanceof CPUBot && this.paddles[RIGHT_PADDLE] instanceof CPUBot) {
			const index = (Math.random() > 0.5) ? 0 : 1;
			this.winner = this.players[index];
			this.stop();
			return (this.winner);
		}
		this.send_side_assignment();
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
	isPaused(): boolean { 
		return this.paused; 
	}

	// Stop the execution of the game & broadcast the winner
	stop() {
		if (!this.running) return ;
		this.running = false;
	}

	save_to_db() {
		const player1 = this.players[LEFT_PADDLE];
		const player2 = this.players[RIGHT_PADDLE];
		const player1_score = this.paddles[LEFT_PADDLE].score;
		const player2_score = this.paddles[RIGHT_PADDLE].score;
		saveGameResult(this.id, player1.name, player2.name, player1_score, player2_score, Date.now()) // add check for error
		console.log(`Game ${this.id} saved to db`);
	}
	
	// If someone quits a remote game, the opposing player wins
	setOtherPlayerWinner(quitter: Client) {
		if (this.players[LEFT_PADDLE] instanceof CPU) {
			this.winner = this.players[LEFT_PADDLE];
		}
		else {
			this.winner = (this.players[LEFT_PADDLE].client === quitter) ? this.players[RIGHT_PADDLE] : this.players[LEFT_PADDLE];
		}
	}

	activate(side: number, slot_index: number) {
		const slot: Slot = this.powerup_manager.slots[side][slot_index];
		this.powerup_manager.activate(slot);
        console.log(`Powerup ${slot.type} activated by ${this.players[side].name}`);
	}
}
