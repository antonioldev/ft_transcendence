import { Engine, Scene, Color4, DeviceSourceManager, DeviceType,SceneLoader} from "@babylonjs/core";
import { GameConfig } from './GameConfig.js';
import { buildScene2D, buildScene3D } from './scene/sceneBuilder.js';
import { webSocketClient } from '../core/WebSocketClient.js';
import { GameStateData, GameObjects } from '../shared/types.js';
import { GAME_CONFIG } from '../shared/gameConfig.js';
import { GameState, ViewMode, WebSocketEvent, AppState } from '../shared/constants.js';
import { Logger } from '../utils/LogManager.js';
import { uiManager } from '../ui/UIManager.js';
import { GUIManager } from './GuiManager.js';
import { AnimationManager } from "./AnimationManager.js";
import { RenderManager } from './RenderManager.js';
import { GameMode, Direction } from '../shared/constants.js';
import { PlayerControls} from '../shared/types.js';
import { getPlayerBoundaries } from '../shared/gameConfig.js';
import { appStateManager } from '../core/AppStateManager.js';
import { GameConfigFactory } from './GameConfig.js';
import { AudioManager } from './AudioManager.js';
import { PowerupType, PowerUpAction } from "../shared/constants.js";
import { PowerupManager } from "./PowerUpManager.js";
// import { LoadingGui } from "./gui/LoadingGui.js";
import { PlayerSide, PlayerState } from "./utils.js"



/**
 * The Game class serves as the core of the game engine, managing the initialization,
 * state, and lifecycle of the game. It handles rendering, input, audio, and communication
 * with the server, as well as coordinating various game components such as scenes,
 * animations, and GUI elements.
 */
export class Game {
	private static currentInstance: Game | null = null;
	private isInitialized: boolean = false;
	private currentState: GameState | null = null;
	private engine: Engine | null = null;
	private scene: Scene | null = null;
	private canvas: HTMLCanvasElement | null = null;
	private gameObjects: GameObjects | null = null;
	private animationManager: AnimationManager | null = null;
	// private loadingGui: LoadingGui | null = null;
	private guiManager: GUIManager | null = null;
	private renderManager: RenderManager | null = null;
	private audioManager: AudioManager | null =null;
	private powerup: PowerupManager | null = null;
	private deviceSourceManager: DeviceSourceManager | null = null;
	private gameLoopObserver: any = null;

	private players: Map<PlayerSide, PlayerState> = new Map();

// ====================			STATIC METHODS			 ====================
	static getCurrentInstance(): Game | null {
		return Game.currentInstance;
	}
	static async create(viewMode: ViewMode, gameMode: GameMode, aiDifficulty: number): Promise<void> {
		try {
			const config = GameConfigFactory.createWithAuthCheck(viewMode, gameMode);
			const game = new Game(config);
			await game.connect(aiDifficulty);
			await game.initialize();
		} catch (error) {
			Logger.error('Error creating game', 'Game', error);
			throw error;
		}
	}

// ====================			CONSTRUCTOR			   ====================
	constructor(private config: GameConfig) {
		if (Game.currentInstance)
			Game.currentInstance.dispose();
		Game.currentInstance = this;
		try {
			const element = document.getElementById(config.canvasId);
			if (element instanceof HTMLCanvasElement) {
				this.canvas = element;
				const gl = this.canvas.getContext('webgl') || this.canvas.getContext('webgl2');
				if (gl) {
					gl.getExtension('WEBGL_color_buffer_float');
					gl.getExtension('EXT_color_buffer_half_float');
				}
				this.canvas.focus();
				this.resetPlayersData();
			}
		} catch (error) {
			Logger.errorAndThrow('Error creating game managers', 'Game', error);
		}
	}

// ====================			INITIALIZATION			====================
	async initialize(): Promise<void> {
		if (this.isInitialized) return;
		
		this.setupGlobalKeyboardEvents();
		SceneLoader.ShowLoadingScreen = false;

		uiManager.setLoadingScreenVisible(true);
		try {
			Logger.info('Initializing game...', 'Game');

			this.engine = await this.initializeBabylonEngine();
			this.scene = await this.createScene();
			// this.renderManager = new RenderManager(this.engine, this.scene);
			// this.renderManager?.startRendering();

			// this.loadingGui = new LoadingGui(this.scene);
			// this.loadingGui.show();

			this.deviceSourceManager = new DeviceSourceManager(this.scene.getEngine());

			this.animationManager = new AnimationManager(this.scene);

			this.audioManager = new AudioManager(this.scene);
			await this.audioManager.initialize();

			this.gameObjects = this.config.viewMode === ViewMode.MODE_2D
				? await buildScene2D(this.scene, this.config.gameMode, this.config.viewMode, (progress: number) => uiManager.updateLoadingProgress(progress))
				: await buildScene3D(this.scene, this.config.gameMode, this.config.viewMode, (progress: number) => uiManager.updateLoadingProgress(progress));

			// this.gameObjects = this.config.viewMode === ViewMode.MODE_2D
			// 	? await buildScene2D(this.scene, this.config.gameMode, this.config.viewMode, (progress: number) => this.loadingGui?.setProgress(progress))
			// 	: await buildScene3D(this.scene, this.config.gameMode, this.config.viewMode, (progress: number) => this.loadingGui?.setProgress(progress));


			this.guiManager = new GUIManager(this.scene, this.config, this.animationManager, this.audioManager);

			this.powerup = new PowerupManager(this.players, this.animationManager, this.guiManager, this.gameObjects);

			this.renderManager = new RenderManager(this.engine, this.scene, this.guiManager, this.animationManager, this.gameObjects);
			this.renderManager?.startRendering();

			this.connectComponents();
			this.isInitialized = true;
			webSocketClient.sendPlayerReady();
			uiManager.setLoadingScreenVisible(false);
			// this.loadingGui.hide();
// 			this.updateTournamentLobby(["player0"]);
// let counter = 1;
// const names: string[] = [];

// const intervalId = setInterval(() => {
// names.push(`Player${counter}`);
// this.updateTournamentLobby({ lobby: [...names] });
// counter++;

// // Stop after, say, 8 players
// if (counter > 16) {
// 	clearInterval(intervalId);
// }
// }, 3000);
			// if (this.config.gameMode === GameMode.TWO_PLAYER_REMOTE || this.config.gameMode === GameMode.TOURNAMENT_REMOTE)
			// 	uiManager.updateLoadingText();
		} catch (error) {
			await this.dispose();
			Logger.errorAndThrow('Error initializing game', 'Game', error);
		}
	}

	// Initialize Babylon.js engine
	private async initializeBabylonEngine(): Promise<Engine> {
		const engine = new Engine(this.canvas, true, { 
			preserveDrawingBuffer: true, 
			stencil: true, 
			disableWebGL2Support: false,
			antialias: false,
			audioEngine: true,
			powerPreference: "high-performance"
		});
		return engine;
	}

	// Create scene based on view mode
	private async  createScene(): Promise<Scene> {
		const scene = new Scene(this.engine!);
		scene.createDefaultEnvironment({ createGround: false, createSkybox: false });
		scene.clearColor = new Color4(0, 0, 0, 1);
		return scene;
	}

	private setupGlobalKeyboardEvents(): void {
		document.addEventListener('keydown', (event) => {

			if (event.key === 'Escape' && this.currentState === GameState.PLAYING) {
				if (this.isInGame()) this.pause();
				else if (this.isPaused()) this.resume();
			}
			const k = event.key.toLowerCase();
			if (this.isPaused()) {
				if (k === 'y') this.requestExitToMenu();
				else if (k === 'n' || event.key === 'Escape') this.resume();
			}

			if (this.currentState !== GameState.PLAYING) return;
			// if (event.repeat) return;
			if (!this.powerup) return;
			switch (k) {
				// LEFT player (side 0): slots 0,1,2
				case 'c': this.powerup.requestActivatePowerup(0, 0); break;
				case 'v': this.powerup.requestActivatePowerup(0, 1); break;
				case 'b': this.powerup.requestActivatePowerup(0, 2); break;

				// RIGHT player (side 1): slots 0,1,2
				case 'i': this.powerup.requestActivatePowerup(1, 0); break;
				case 'o': this.powerup.requestActivatePowerup(1, 1); break;
				case 'p': this.powerup.requestActivatePowerup(1, 2); break;
			}
		});
	}

	// Connect all components together
	private connectComponents(): void {
		webSocketClient.registerCallback(WebSocketEvent.GAME_STATE, (state: GameStateData) => { this.updateGameObjects(state); });
		webSocketClient.registerCallback(WebSocketEvent.CONNECTION, () => { });
		webSocketClient.registerCallback(WebSocketEvent.ERROR, (error: string) => { Logger.error('Network error', 'Game', error); });
		webSocketClient.registerCallback(WebSocketEvent.GAME_PAUSED, () => { this.onServerPausedGame(); });
		webSocketClient.registerCallback(WebSocketEvent.GAME_RESUMED, () => { this.onServerResumedGame(); });
		webSocketClient.registerCallback(WebSocketEvent.GAME_ENDED, (message: any) => { this.onServerEndedGame(message.winner); });
		webSocketClient.registerCallback(WebSocketEvent.SESSION_ENDED, (message: any) => { this.onServerEndedSession(message.winner); });

		webSocketClient.registerCallback(WebSocketEvent.SIDE_ASSIGNMENT, (message: any) => { this.handlePlayerAssignment(message.left, message.right); });

		webSocketClient.registerCallback(WebSocketEvent.MATCH_ASSIGNMENT, (message: any) => { this.handleTournamentGames(message); });
		webSocketClient.registerCallback(WebSocketEvent.MATCH_WINNER, (message: any) => { this.handleTournamentSingleGame(message); });
		webSocketClient.registerCallback(WebSocketEvent.TOURNAMENT_LOBBY, (message: any) => {this.updateTournamentLobby(message); });

		webSocketClient.registerCallback(WebSocketEvent.COUNTDOWN, (message: any) => { this.handleCountdown(message.countdown); });
		
		webSocketClient.registerCallback(WebSocketEvent.POWERUP_ASSIGNMENT, (message: any) => { this.powerup?.assign(message); });
		webSocketClient.registerCallback(WebSocketEvent.POWERUP_ACTIVATED, (message: any) => { this.powerup?.activate(message); });
		webSocketClient.registerCallback(WebSocketEvent.POWERUP_DEACTIVATED, (message: any) => { this.powerup?.deactivate(message); });
		
	}

	async connect(aiDifficulty: number): Promise<void> {
		webSocketClient.joinGame(this.config.gameMode, this.config.players, aiDifficulty);
	}

// ====================			GAME CONTROL			 ====================
	private start(): void {
		if (!this.isInitialized) return;

		try {
			this.currentState = GameState.PLAYING;
			// Start game loop
			this.startGameLoop();
		} catch (error) {
			Logger.errorAndThrow('Error starting game', 'Game', error);
		}
	}

	private async handleCountdown(countdown: number): Promise<void> {
		if (countdown === undefined || countdown === null)
			Logger.errorAndThrow('Server sent SIGNAL without countdown parameter', 'Game');

		// this.loadingGui?.hide();
		uiManager.setLoadingScreenVisible(false);
		this.guiManager?.lobby.hide()

		if (this.currentState === GameState.MATCH_ENDED)
			this.resetForNextMatch();
		if (countdown === GAME_CONFIG.startDelay) {
			const controlledSides = this.getControlledSides();
			this.renderManager?.startCameraAnimation(
				this.gameObjects?.cameras, 
				this.config.viewMode,
				controlledSides,
				this.config.isLocalMultiplayer
			);
		}
		else if (countdown > 0 && GAME_CONFIG.startDelay - 1) {
			this.guiManager?.countdown.set(true, countdown);
			this.audioManager?.playCountdown();
		}
		else {
			this.audioManager?.stopCountdown();
			this.audioManager?.startGameMusic();
			this.renderManager?.stopCameraAnimation();
			this.guiManager?.countdown.set(false);
			await this.guiManager?.animateBackground(false);
			this.start();
		}
	}

	// Handle server confirming game is paused
	private onServerPausedGame(): void {
		if (!this.isInitialized || this.currentState === GameState.PAUSED) return;

		this.currentState = GameState.PAUSED;
		this.guiManager?.setPauseVisible(true);
		this.audioManager?.pauseGameMusic();
		this.stopGameLoop();

	}

	// Handle server confirming game is resumed
	private onServerResumedGame(): void {
		if (!this.isInitialized || this.currentState === GameState.PLAYING) return;

		this.currentState = GameState.PLAYING;
		this.guiManager?.setPauseVisible(false);
		this.audioManager?.resumeGameMusic();
		this.renderManager?.startRendering();
		this.startGameLoop();
	}

	// Handle server ending the game
	private async onServerEndedGame(winner: string): Promise<void> {
		if (!this.isInitialized || !this.config.isTournament) return;

		this.guiManager?.setPauseVisible(false);
		await this.guiManager?.animateBackground(true);
		await this.guiManager?.showPartialWinner(winner);
		await this.guiManager?.endGame.waitForSpaceToContinue(2000);
		await this.guiManager?.hidePartialWinner();
		webSocketClient.notifyGameAnimationDone();
		this.audioManager?.stopGameMusic();
		// this.controlledSides = [];
		this.stopGameLoop();
		this.currentState = GameState.MATCH_ENDED;
	}

	private async onServerEndedSession(winner: string): Promise<void> {
		if (!this.isInitialized) return;

		if (!this.renderManager?.isRunning)
			this.renderManager?.startRendering();

		this.guiManager?.setPauseVisible(false);
		if (winner !== undefined)
			await this.guiManager?.showWinner(winner);

		this.audioManager?.stopGameMusic();
		this.renderManager?.stopRendering();
		// this.controlledSides = []
		this.stopGameLoop();
		this.dispose();
		this.resetToMenu();

	}

// ====================			GAME LOOP				====================
	private startGameLoop(): void {
		if (this.gameLoopObserver) return;
		this.gameLoopObserver = setInterval(() => {
			if (!this.isInitialized || this.currentState !== GameState.PLAYING) return;
			try {
				// this.loadingGui?.hide();
				uiManager.setLoadingScreenVisible(false);
				this.guiManager?.lobby.hide();
				this.updateInput();
				if (this.config.viewMode === ViewMode.MODE_3D)
					this.renderManager?.update3DCameras();
			} catch (error) {
				Logger.errorAndThrow('Error in game loop', 'Game', error);
			}
		}, 16);
	}

	private stopGameLoop(): void {
		if (this.gameLoopObserver) {
			clearInterval(this.gameLoopObserver);
			this.gameLoopObserver = null;
		}
	}

	private resetForNextMatch(): void {
		if (!this.isInitialized) return;

		this.resetPlayersData();

		if (this.gameObjects) {
			if (this.gameObjects.players.left) {
				this.gameObjects.players.left.position.x = 0;
				this.gameObjects.players.left.scaling.x = 1;
			}
			if (this.gameObjects.players.right) {
				this.gameObjects.players.right.position.x = 0;
				this.gameObjects.players.right.scaling.x = 1;
			}
			if (this.gameObjects.ball) {
				this.gameObjects.ball.position.x = 0;
				this.gameObjects.ball.position.z = 0;
			}
		}

		this.guiManager?.hud.updateScores(
			this.players.get(PlayerSide.LEFT)!.score,
			this.players.get(PlayerSide.RIGHT)!.score
		);
	}

	private resetPlayersData(): void {
		this.players = new Map([
			[PlayerSide.LEFT, {
				isControlled: false,
				size: GAME_CONFIG.paddleWidth,
				score: 0,
				powerUps: [null, null, null],
				activePowerup: null,
				inverted: false
			}],
			[PlayerSide.RIGHT, {
				isControlled: false,
				size: GAME_CONFIG.paddleWidth,
				score: 0,
				powerUps: [null, null, null],
				activePowerup: null,
				inverted: false
			}]
		]);
	}

// ====================			GAME STATE UPDATES	   ====================
	private updateGameObjects(state: GameStateData): void {
		if (!this.isInitialized || !this.gameObjects) return;

		try {
			// Update paddle positions
			this.gameObjects.players.left.position.x = state.paddleLeft.x;
			this.gameObjects.players.right.position.x = state.paddleRight.x;

			// Update ball position
			this.gameObjects.ball.position.x = state.ball.x;
			this.gameObjects.ball.position.z = state.ball.z;
			this.gameObjects.ball.rotation.x += 0.1;
			this.gameObjects.ball.rotation.y += 0.05;

			if (this.guiManager?.hud.updateRally(state.ball.current_rally))
				this.audioManager?.playPaddleHit();
			this.audioManager?.updateMusicSpeed(state.ball.current_rally);

			if (this.players.get(PlayerSide.LEFT)!.score < state.paddleLeft.score) {
                this.players.get(PlayerSide.LEFT)!.score = state.paddleLeft.score;
                this.audioManager?.playScore();
            }
            if (this.players.get(PlayerSide.RIGHT)!.score < state.paddleRight.score) {
                this.players.get(PlayerSide.RIGHT)!.score = state.paddleRight.score;
                this.audioManager?.playScore();
			}
			this.guiManager?.hud.updateScores(
                this.players.get(PlayerSide.LEFT)!.score,
                this.players.get(PlayerSide.RIGHT)!.score
            );

		} catch (error) {
			Logger.errorAndThrow('Error updating game objects', 'Game', error);
		}
	}

// ====================			INPUT HANDLING		   ====================

	private handlePlayerAssignment(leftPlayerName: string, rightPlayerName: string): void {
		this.guiManager?.hud.updatePlayerNames(leftPlayerName, rightPlayerName);

		const leftPlayer = this.players?.get(PlayerSide.LEFT);
		const rightPlayer = this.players?.get(PlayerSide.RIGHT);
		
		if (leftPlayer)
			leftPlayer.isControlled = this.config.players.some(player => player.name === leftPlayerName);

		if (rightPlayer)
			rightPlayer.isControlled = this.config.players.some(player => player.name === rightPlayerName);

		// Get controlled sides for camera setup
		const controlledSides = this.getControlledSides();
		
		this.renderManager?.updateActiveCameras(this.config.viewMode, controlledSides, this.config.isLocalMultiplayer);
		this.guiManager?.updateControlVisibility(
			leftPlayer?.isControlled || false, 
			rightPlayer?.isControlled || false
		);
	}

	private getControlledSides(): number[] {
		const controlledSides: number[] = [];
		if (this.players?.get(PlayerSide.LEFT)?.isControlled) 
			controlledSides.push(PlayerSide.LEFT);
		if (this.players?.get(PlayerSide.RIGHT)?.isControlled)
			controlledSides.push(PlayerSide.RIGHT);
		return controlledSides;
	}


	private handleTournamentGames(message: any): void {
		this.guiManager?.matchTree.insert(
			message.round_index,
			message.match_index,
			message.left ?? null,
			message.right ?? null,
			message.match_total ?? undefined
		);
	}

	private handleTournamentSingleGame(message: any): void {
		this.guiManager?.matchTree.update(
			message.winner,
			message.round_index,
			message.match_index
		)
	}

	private updateInput(): void {
		if (!this.isInitialized || !this.deviceSourceManager || !this.gameObjects) return;
		try {
			const keyboardSource = this.deviceSourceManager.getDeviceSource(DeviceType.Keyboard);
			if (keyboardSource) {
				this.handlePlayerInput(keyboardSource, this.gameObjects.players.left, this.config.controls.playerLeft, 0); // Handle left player (side 0)
				this.handlePlayerInput(keyboardSource, this.gameObjects.players.right, this.config.controls.playerRight, 1); // Handle right player (side 1)
			}
		} catch (error) {
			Logger.errorAndThrow('Error updating input', 'Game', error);
		}
	}

	private handlePlayerInput(keyboardSource: any, player: any, controls: PlayerControls, side: PlayerSide): void {
		const playerState = this.players?.get(side);
		if (!playerState?.isControlled) return;
		const bounds = getPlayerBoundaries(this.players.get(side)!.size);

		let input: Direction = Direction.STOP;
		if (keyboardSource.getInput(controls.left) === 1)
			input = Direction.LEFT;
		else if (keyboardSource.getInput(controls.right) === 1)
			input = Direction.RIGHT;
		if (input === Direction.STOP) return;
		
		const inverted = this.players.get(side)!.inverted;
		const effective =
			inverted
				? (input === Direction.LEFT ? Direction.RIGHT : Direction.LEFT)
				: input;
		
		if (effective === Direction.LEFT && player.position.x <= bounds.left) return;
		if (effective === Direction.RIGHT && player.position.x >= bounds.right) return;
		
		webSocketClient.sendPlayerInput(side, input);
	}

// ====================			GAME STATE			   ====================
	isInGame(): boolean {
		return this.currentState === GameState.PLAYING || this.currentState === GameState.MATCH_ENDED;
	}

	isPaused(): boolean {
		return this.currentState === GameState.PAUSED;
	}

	pause(): void {
		if (!this.isInitialized || this.currentState !== GameState.PLAYING) return;
		webSocketClient.sendPauseRequest();
	}

	resume(): void {
		if (!this.isInitialized) return;
		webSocketClient.sendResumeRequest();
	}

	async requestExitToMenu(): Promise<void> {
		if (this.currentState === GameState.EXITING) return;

		try {
			this.currentState = GameState.EXITING;
			webSocketClient.sendQuitGame();
		} catch (error) {
			Logger.error('Error during request exit', 'Game', error);
			this.stopGameLoop();
			this.dispose();
			this.resetToMenu();
		}
	}

	private resetToMenu(): void {
		appStateManager.navigateTo(AppState.MAIN_MENU);
	}

// ====================			CLEANUP				  ====================
	private async dispose(): Promise<void> {
	if (!this.isInitialized) return;
		try {
			this.isInitialized = false;
			this.stopGameLoop();

			this.renderManager?.dispose();
			this.renderManager = null;

			this.deviceSourceManager?.dispose();
			this.deviceSourceManager = null;

			this.players.clear();

			this.guiManager?.dispose();
			this.guiManager = null;

			// this.loadingGui?.dispose();
			// this.loadingGui = null;

			uiManager.setLoadingScreenVisible(false);

			this.gameObjects = null;
			this.audioManager?.dispose();
			this.audioManager = null;

			this.scene?.onBeforeRenderObservable?.clear();
			this.scene?.onAfterRenderObservable?.clear();
			this.scene?.dispose();
			this.scene = null;

			this.engine?.dispose();
			this.engine = null;

			if (this.canvas) {
				const context = this.canvas.getContext('2d');
				context?.clearRect(0, 0, this.canvas.width, this.canvas.height);
			}
			this.canvas = null;

			if (Game.currentInstance === this) Game.currentInstance = null;

			Logger.debug('Game disposed successfully', 'Game');
		} catch (error) {
			Logger.errorAndThrow('Error disposing game', 'Game', error);
		}
	}

	private updateTournamentLobby(message: any): void {
		
		const names: string[] = message.lobby ?? ["test1"];
		this.guiManager?.lobby.show(names);
		uiManager.setLoadingScreenVisible(false);
	}
}
