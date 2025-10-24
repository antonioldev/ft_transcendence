import { Ball } from './Ball.js';
import { Paddle, CPUBot } from './Paddle.js';
import { Clock } from './utils.js';
import { GAME_CONFIG, CPUDifficultyMap, LEFT, RIGHT } from '../shared/gameConfig.js';
import { MessageType, GameState} from '../shared/constants.js';
import { PlayerInput, GameStateData, ServerMessage, BallState } from '../shared/types.js';
import { Client, Player, CPU} from '../network/Client.js'
import { saveGameResult, registerNewGame, addPlayer2  } from '../data/validation.js';
import { PowerupManager, Slot } from './Powerup.js';
import { remove_elem } from './utils.js';

// The Game class runs the core game logic for all game modes.
export class Game {
	id: string;
	state: GameState = GameState.INIT;
	clock: Clock = new Clock();
	input_queue: PlayerInput[] = [];
	
	players: readonly (Player | CPU)[]
	winner!: Player | CPU;
	loser!: Player | CPU;
	paddles: (Paddle | CPUBot)[] = [new Paddle(LEFT), new Paddle(RIGHT)];
    
	rally = { current: 1 };
	balls: Ball[] = [ new Ball(this.paddles, this.rally, this._update_score.bind(this)) ];
	powerup_manager: PowerupManager = new PowerupManager(this.paddles, this.balls);
	private _broadcast: (message: ServerMessage, clients?: Set<Client>) => void;

	constructor(id: string, players: (Player | CPU)[], broadcast_callback: (message: ServerMessage, clients?: Set<Client>) => void) {
		this.id = id;
		this.players = players;
		this._broadcast = broadcast_callback;

		this._init_CPUs();
		this.send_side_assignment();
	}

	private _init_CPUs() {
		for (const side of [LEFT, RIGHT]) {
			const player: Player | CPU = this.players[side];
			if (player instanceof CPU) {
				const noiseFactor =  CPUDifficultyMap[player.difficulty];
				this.paddles[side] = new CPUBot(side, this.balls, noiseFactor, GAME_CONFIG.paddleSpeed, 0, (s, slot) => this.activate(s, slot) );
			}
		}
	}

	private _handle_input(dt: number): void {
		if (!this.is_running) return ;

		this._process_input_queue(dt);

		for (const paddle of this.paddles) {
			if (paddle instanceof CPUBot) {
				paddle.update(dt);
			}
		}
	}

	// Update the score for the specified side
	private _update_score(side: number, ball: Ball): void {
		if (!this.is_running()) return ;

		this.paddles[side].score += this.rally.current;
		if (this.paddles[side].score >= GAME_CONFIG.scoreToWin) {
			this.assign_winner(this.players[side]);
			this.stop();
		}
		if (this.balls.length > 1) {
			remove_elem(this.balls, ball);
		}
	}

	// Update the game state, including player and ball positions
	private _update_state(dt: number): void {
		// cache preceeding rect positions for collision calculations
		this.paddles[LEFT].cacheRect();
		this.paddles[RIGHT].cacheRect();
		this._handle_input(dt);
		for (const ball of this.balls) {
			ball.update(dt);
		}
	}

	// Process the input queue and apply player movements
	private _process_input_queue(dt: number): void {
		while (this.input_queue.length > 0) {
			const input = this.input_queue.shift();
			if (input) {
				this.paddles[input.side].move(dt, input.dx);
			}
		}
	}

	// Add a new input to the queue
	enqueue(input: PlayerInput): void {
		if (this.is_running()) {
			this.input_queue.push(input);
		}
	}

	get_ball_states(): BallState[] {
		let ball_states = [];
		for (const ball of this.balls) {
			ball_states.push({
				x: ball.rect.centerx,
				z: ball.rect.centerz,
			})
		}
		return ball_states;
	}

	// Retrieve the current game state as a data object
	get_state(): GameStateData {
		return {
			state: this.state,
			...(this.winner?.name && { winner: this.winner.name }),
			...(this.loser?.name && { loser: this.loser.name }),
			rally: this.rally.current,
			paddleLeft: {
				x:     this.paddles[LEFT].rect.centerx,
				score: this.paddles[LEFT].score,
				powerups: this.powerup_manager.get_state(LEFT),
			},
			paddleRight: {
				x:     this.paddles[RIGHT].rect.centerx,
				score: this.paddles[RIGHT].score,
				powerups: this.powerup_manager.get_state(RIGHT),
			},
			ball_states: this.get_ball_states(),
		}
	}

	send_side_assignment(clients?: Set<Client>) {
		if (!this.players[LEFT] || !this.players[RIGHT]) {
			console.error("Error assigning sides: player(s) undefined")
			return ;
		}
		this._broadcast({
			type: MessageType.SIDE_ASSIGNMENT,
			left: this.players[LEFT].name,
			right: this.players[RIGHT].name,
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
	async run(): Promise<Player | CPU > {
		console.log(`Game ${this.id} started with players: ${this.players[LEFT].name}, ${this.players[RIGHT].name}`)

		this.state = GameState.RUNNING;
		this._broadcast({
			type: MessageType.GAME_STATE,
			state: this.get_state()
		});
		
		await this.send_countdown();
		// run game loop, updating and broadcasting state to clients until win
		while (!this.is_ended()) {
			const dt = await this.clock.tick(60);
			if (!this.is_paused()) {
				this._update_state(dt);
			}
			this._broadcast({
				type: MessageType.GAME_STATE,
				state: this.get_state()
			});
		}
		return (this.winner);
	}

	// Pause the game
	pause(): void {
		this.state = GameState.PAUSED;
		this.input_queue = []
	}

	// Resume the game
	resume(): void { 
		this.state = GameState.RUNNING;
	}

	// Returns if the game is currently paused
	is_paused(): boolean { 
		return (this.state === GameState.PAUSED); 
	}

	// Returns if the game is currently running
	is_running(): boolean { 
		return (this.state === GameState.RUNNING); 
	}
	// Returns if the game is currently running
	is_ended(): boolean { 
		return (this.state === GameState.ENDED); 
	}

	// Stop the execution of the game
	stop() {
		if (this.is_ended()) return ;
		this.state = GameState.ENDED;
	}

	save_to_db() {
		if (this.players.length === 0) return ;
		if (this.players[LEFT] instanceof CPU || this.players[RIGHT] instanceof CPU) return ;

		registerNewGame(this.id, this.players[LEFT]?.name, 1);
		addPlayer2(this.id, this.players[RIGHT]?.name);
		console.log(`Game ${this.id} added to db: P1:${this.players[LEFT]?.name}, P2: ${this.players[RIGHT]?.name}`);

		saveGameResult(
			this.id, 
			this.players[LEFT]?.name, 
			this.players[RIGHT]?.name, 
			this.paddles[LEFT]?.score, 
			this.paddles[RIGHT]?.score, 
			Date.now()
		);
		console.log(`Game ${this.id} saved to db`);
	}
	
	// If someone quits a remote game, the opposing player wins
	setOtherPlayerWinner(quitter: Client) {
		if (this.players[LEFT] instanceof CPU) {
			this.assign_winner(this.players[LEFT]);
		}
		else {
			this.assign_winner((this.players[LEFT].client === quitter) ? this.players[RIGHT] : this.players[LEFT]);
		}
	}

	async activate(side: number, slot_index: number) {
		const slot: Slot = this.powerup_manager.slots[side][slot_index];
		await this.powerup_manager.activate(slot);
        console.log(`Powerup ${slot.type} activated by ${this.players[side].name}`);
	}

	assign_winner(winner: Player | CPU) {
		this.winner = winner;
		this.loser = this.players[LEFT] === winner ? this.players[RIGHT] : this.players[LEFT];
	}
}
