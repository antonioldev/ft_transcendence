import { Ball } from './Ball.js';
import { Paddle, CPUBot } from './Paddle.js';
import { Clock } from './utils.js';
import { GAME_CONFIG, CPUDifficultyMap, LEFT, RIGHT } from '../shared/gameConfig.js';
import { MessageType, GameState} from '../shared/constants.js';
import { PlayerInput, GameStateData, ServerMessage } from '../shared/types.js';
import { Client, Player, CPU} from '../network/Client.js'
import { saveGameResult } from '../data/validation.js';
import { PowerupManager, Slot } from './Powerup.js';

// The Game class runs the core game logic for all game modes.
export class Game {
	id: string;
	clock: Clock;
	input_queue: PlayerInput[] = [];
	state: GameState = GameState.INIT;
	players: readonly (Player | CPU)[]
	winner!: Player | CPU;
	loser!: Player | CPU;
	paddles: (Paddle | CPUBot)[] = [new Paddle(LEFT), new Paddle(RIGHT)];
	balls: Ball[];
	powerup_manager: PowerupManager;
	private _broadcast: (message: ServerMessage, clients?: Set<Client>) => void;
    rally = { current: 1 };

	constructor(id: string, players: (Player | CPU)[], broadcast_callback: (message: ServerMessage, clients?: Set<Client>) => void) {
		this.id = id;
		this.clock = new Clock();
		this._broadcast = broadcast_callback;
		this.players = players;
		this.balls = [ new Ball(this.paddles, this.rally, this._update_score.bind(this)) ];
		this.powerup_manager = new PowerupManager(this.paddles, this.balls)
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
	private _update_score(side: number): void {
		if (!this.is_running()) return ;

		this.paddles[side].score += this.rally.current;
		if (this.paddles[side].score >= GAME_CONFIG.scoreToWin) {
			this.assign_winner(this.players[side]);
			this.stop();
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

	// Retrieve the current game state as a data object
	get_state(): GameStateData {
		let ball_states = [];
		for (const ball of this.balls) {
			ball_states.push({
				x: ball.rect.centerx,
				z: ball.rect.centerz,
			})
		}
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
			ball_states: ball_states,
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
	async run(): Promise<Player | CPU> {
		console.log(`Game ${this.id} started with players: ${this.players[LEFT].name}, ${this.players[RIGHT].name}`)
		// if both are CPU then choose a random winner
		if (this.paddles[LEFT] instanceof CPUBot && this.paddles[RIGHT] instanceof CPUBot) {
			const random_index = (Math.random() > 0.5) ? 0 : 1;
			return (this.players[random_index]);
		}
		await this.send_countdown();
		this.state = GameState.RUNNING;

		// run game loop, updating and broadcasting state to clients until win
		while (!this.is_ended()) {
			const dt = await this.clock.tick(60);
			if (this.is_paused()) continue ;

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
		if (this.state === GameState.ENDED) return ;
		this.state = GameState.ENDED;
	}

	save_to_db() {
		const player1 = this.players[LEFT];
		const player2 = this.players[RIGHT];
		const player1_score = this.paddles[LEFT].score;
		const player2_score = this.paddles[RIGHT].score;
		saveGameResult(this.id, player1.name, player2.name, player1_score, player2_score, Date.now()) // add check for error
		console.log(`Game ${this.id} saved to db`);
	}
	
	// If someone quits a remote game, the opposing player wins
	setOtherPlayerWinner(quitter: Client) {
		if (this.players[LEFT] instanceof CPU) {
			this.winner = this.players[LEFT];
		}
		else {
			this.winner = (this.players[LEFT].client === quitter) ? this.players[RIGHT] : this.players[LEFT];
		}
	}

	activate(side: number, slot_index: number) {
		const slot: Slot = this.powerup_manager.slots[side][slot_index];
		this.powerup_manager.activate(slot);
        console.log(`Powerup ${slot.type} activated by ${this.players[side].name}`);
	}

	assign_winner(winner: Player | CPU) {
		this.winner = winner;
		this.loser = this.players[LEFT] === winner ? this.players[RIGHT] : this.players[LEFT];
	}
}
