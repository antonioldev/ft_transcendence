import { Engine, Scene, Color4, DeviceSourceManager, DeviceType,SceneLoader} from "@babylonjs/core";
import { GameConfig } from './GameConfig.js';
import { buildScene2D, buildScene3D } from './scene/sceneBuilder.js';
import { webSocketClient } from '../core/WebSocketClient.js';
import { GameStateData, GameObjects } from '../shared/types.js';
import { GAME_CONFIG } from '../shared/gameConfig.js';
import { GameState, ViewMode, WebSocketEvent, AppState } from '../shared/constants.js';
import { Logger } from '../utils/LogManager.js';
import { uiManager } from '../ui/UIManager.js';
import { GUIManager } from './gui/GuiManager.js';
import { AnimationManager } from "./AnimationManager.js";
import { RenderManager } from './RenderManager.js';
import { GameMode, Direction } from '../shared/constants.js';
import { PlayerControls} from '../shared/types.js';
import { getPlayerBoundaries } from '../shared/gameConfig.js';
import { appStateManager } from '../core/AppStateManager.js';
import { GameConfigFactory } from './GameConfig.js';
import { AudioManager } from './AudioManager.js';
import { Powerup, PowerUpAction, SizePaddle } from "../shared/constants.js";
// import { LoadingGui } from "./gui/LoadingGui.js";

enum PlayerSide {
	LEFT = 0,
	RIGHT = 1
}

interface PlayerState {
	paddleSize: SizePaddle;
	score: number;
	powerUps: (Powerup | null)[];
	activePowerup: Powerup | null;
}

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
	private deviceSourceManager: DeviceSourceManager | null = null;
	private gameLoopObserver: any = null;
	private controlledSides: number[] = [];


	private leftPaddleSize: SizePaddle = SizePaddle.NORMAL;
	private rightPaddleSize: SizePaddle = SizePaddle.NORMAL;
	private playerLeftScore: number = 0;
	private playerRightScore: number = 0;
	private playerSize: Map<PlayerSide, SizePaddle> = new Map;
	private playerScore: Map<PlayerSide, Number> = new Map;
	private playerPowerUps: Map<PlayerSide, (Powerup | null)[]> = new Map();
	private active_powerups: Map<PlayerSide, Powerup | null> = new Map();

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
			}
			this.playerPowerUps.set(0, [null, null, null]);
			this.playerPowerUps.set(1, [null, null, null]);
			this.active_powerups.set(0, null);
			this.active_powerups.set(1, null);
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

			if (this.isPaused()) {
				if (event.key === 'Y' || event.key === 'y') this.requestExitToMenu();
				else if (event.key === 'N' || event.key === 'n' || event.key === 'Escape') this.resume();
			}

			if (this.currentState !== GameState.PLAYING) return;
			// if (event.repeat) return;
			const k = event.key.toLowerCase();
			switch (k) {
				// LEFT player (side 0): slots 0,1,2
				case 'c': this.requestActivatePowerUp(0, 0); break;
				case 'v': this.requestActivatePowerUp(0, 1); break;
				case 'b': this.requestActivatePowerUp(0, 2); break;

				// RIGHT player (side 1): slots 0,1,2
				case 'i': this.requestActivatePowerUp(1, 0); break;
				case 'o': this.requestActivatePowerUp(1, 1); break;
				case 'p': this.requestActivatePowerUp(1, 2); break;
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
		webSocketClient.registerCallback(WebSocketEvent.COUNTDOWN, (message: any) => { this.handleCountdown(message.countdown); });
		webSocketClient.registerCallback(WebSocketEvent.POWERUP_ASSIGNMENT, (message: any) => { this.getPowerup(message); });
		webSocketClient.registerCallback(WebSocketEvent.POWERUP_ACTIVATED, (message: any) => { this.togglePowerUp(message, true); });
		webSocketClient.registerCallback(WebSocketEvent.POWERUP_DEACTIVATED, (message: any) => { this.togglePowerUp(message, false); });
		webSocketClient.registerCallback(WebSocketEvent.TOURNAMENT_LOBBY, (message: any) => {this.updateTournamentLobby(message); });
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
		this.guiManager?.hideLobby()

		if (this.currentState === GameState.MATCH_ENDED)
			this.resetForNextMatch();
		if (countdown === GAME_CONFIG.startDelay) {
			this.renderManager?.startCameraAnimation(
				this.gameObjects?.cameras, 
				this.config.viewMode,
				this.controlledSides,
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
		await this.guiManager?.waitForSpaceToContinue(2000);
		await this.guiManager?.hidePartialWinner();
		webSocketClient.notifyGameAnimationDone();
		this.audioManager?.stopGameMusic();
		this.controlledSides = [];
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
		this.controlledSides = []
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
				this.guiManager?.hideLobby()
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

		this.playerLeftScore = 0;
		this.playerRightScore = 0;
		this.leftPaddleSize = SizePaddle.NORMAL;
		this.rightPaddleSize = SizePaddle.NORMAL;
		this.active_powerups.set(0, null);
		this.active_powerups.set(1, null);

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

		this.guiManager?.hud.updateScores(0, 0);
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

			if(this.guiManager?.hud.updateRally(state.ball.current_rally))
				this.audioManager?.playPaddleHit();
			this.audioManager?.updateMusicSpeed(state.ball.current_rally);

			if (this.playerLeftScore < state.paddleLeft.score) {
				this.playerLeftScore = state.paddleLeft.score
				this.audioManager?.playScore();
			}
			if (this.playerRightScore < state.paddleRight.score) {
				this.playerRightScore = state.paddleRight.score
				this.audioManager?.playScore();
			}
			this.guiManager?.hud.updateScores(state.paddleLeft.score, state.paddleRight.score);

		} catch (error) {
			Logger.errorAndThrow('Error updating game objects', 'Game', error);
		}
	}

// ====================			INPUT HANDLING		   ====================
	private assignPlayerSide(name: string, side: number): void {
		const isOurPlayer = this.config.players.some(player => player.name === name);
		if (isOurPlayer && !this.controlledSides.includes(side))
			this.controlledSides.push(side);
	}

	private handlePlayerAssignment(leftPlayerName: string, rightPlayerName: string): void {
		this.guiManager?.hud.updatePlayerNames(leftPlayerName, rightPlayerName);
		this.assignPlayerSide(leftPlayerName, 0);
		this.assignPlayerSide(rightPlayerName, 1);

		this.renderManager?.updateActiveCameras(this.config.viewMode, this.controlledSides, this.config.isLocalMultiplayer);
		this.guiManager?.updateControlVisibility(this.controlledSides.includes(0), this.controlledSides.includes(1));
	}


	private handleTournamentGames(message: any): void {
		console.error(message.match_index);
		this.guiManager?.matchTree.insert(
			message.round_index,
			message.match_index,
			message.left ?? null,
			message.right ?? null,
			message.match_total ?? undefined
		);
	}

	private handleTournamentSingleGame(message: any): void {
		console.error(message.winner + " " + message.round_index + " " + message.match_index);
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

	private handlePlayerInput(keyboardSource: any, player: any, controls: PlayerControls, side: number): void {
		if (!(this.controlledSides.includes(side))) return;

		// Get boundaries based on current paddle size
		const boundaries = side === 0 
			? getPlayerBoundaries(this.leftPaddleSize)
			: getPlayerBoundaries(this.rightPaddleSize);

		let direction = Direction.STOP;
		if ((keyboardSource.getInput(controls.left) === 1) && (player.position.x > boundaries.left)) 
			direction = Direction.LEFT;
		else if ((keyboardSource.getInput(controls.right) === 1) && (player.position.x < boundaries.right))
			direction = Direction.RIGHT;

		if (direction !== Direction.STOP)
			webSocketClient.sendPlayerInput(side, direction);
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

			this.controlledSides = [];

			this.guiManager?.dispose();
			this.guiManager = null;

			// this.loadingGui?.dispose();
			// this.loadingGui = null;

			uiManager.setLoadingScreenVisible(false);

			this.gameObjects = null;
			this.audioManager?.dispose();
			this.audioManager = null;

			if (this.scene) {
				this.scene.onBeforeRenderObservable?.clear();
				this.scene.onAfterRenderObservable?.clear();
				this.scene.dispose();
				this.scene = null;
			}

			this.engine?.dispose();
			this.engine = null;

			if (this.canvas) {
				const context = this.canvas.getContext('2d');
				if (context)
					context.clearRect(0, 0, this.canvas.width, this.canvas.height);
			}
			this.canvas = null;

			if (Game.currentInstance === this) Game.currentInstance = null;

			Logger.debug('Game disposed successfully', 'Game');
		} catch (error) {
			Logger.errorAndThrow('Error disposing game', 'Game', error);
		}
	}

// ====================			POWERUP				  ====================
	private getPowerup(message: any): void {
		if (!message || !Array.isArray(message.powerups))
			console.warn("[PowerUps] invalid message", message);
		
		const ids: number[] = message.powerups;
		const side = message.side;

		if (side !== 0 && side !== 1) {
			console.warn("[PowerUps] unknown side", side);
			return;
		}

		this.playerPowerUps.set(side, ids.map(id => id as Powerup));

		ids.forEach((powerup, index) => {
			this.guiManager?.powerUp.update(side, index, powerup as Powerup, PowerUpAction.CREATED);
		});
	}

	private requestActivatePowerUp(side: number, index: number): void {
		const powerUps = this.playerPowerUps.get(side);
		if (!powerUps) return;
		
		const powerup = powerUps[index];
		if (powerup === null || powerup === undefined) return;

		const currentlyActive = this.active_powerups.get(side);
		if (currentlyActive === powerup) return;

		console.error("send");

		webSocketClient.sendPowerupActivationRequest(powerup, side, index);
	}

	private togglePowerUp(message: any, toActive: boolean): void {
		if (!message) return;

		console.warn(`[PowerUp Toggle] ${toActive ? 'Activating' : 'Deactivating'} power-up:`, message);

		const side = message.side;
		const slot = message.slot;
		const powerup = message.powerup;

		const med = GAME_CONFIG.paddleWidth;
		const lrg = GAME_CONFIG.increasedPaddleWidth;
		const sml = GAME_CONFIG.decreasedPaddleWidth;
		
		if (toActive) {
			this.active_powerups.set(side, powerup);
			switch (message.powerup) {
				case Powerup.SHRINK_OPPONENT:
					if (side === 0) {
						this.animationManager?.scaleWidth(this.gameObjects?.players.right, med, sml);
						this.rightPaddleSize = SizePaddle.SMALL;
					} else {
						this.animationManager?.scaleWidth(this.gameObjects?.players.left, med, sml);
						this.leftPaddleSize = SizePaddle.SMALL;
					}
					break;
				case Powerup.GROW_PADDLE:
					if (side === 0) {
						this.animationManager?.scaleWidth(this.gameObjects?.players.left, med, lrg);
						this.leftPaddleSize = SizePaddle.LARGE;
					} else {
						this.animationManager?.scaleWidth(this.gameObjects?.players.right, med, lrg);
						this.rightPaddleSize = SizePaddle.LARGE;
					}
					break;
			}
			this.guiManager?.powerUp.update(side, slot, null, PowerUpAction.ACTIVATED);
		} else {
			this.active_powerups.set(side, null);
			switch (message.powerup) {
				case Powerup.SHRINK_OPPONENT:
					if (side === 0) {
						this.animationManager?.scaleWidth(this.gameObjects?.players.right, sml, med);
						this.rightPaddleSize = SizePaddle.NORMAL;
					} else {
						this.animationManager?.scaleWidth(this.gameObjects?.players.left, sml, med);
						this.leftPaddleSize = SizePaddle.NORMAL;
					}
					break;
				case Powerup.GROW_PADDLE:
					if (side === 0) {
						this.animationManager?.scaleWidth(this.gameObjects?.players.left, lrg, med);
						this.leftPaddleSize = SizePaddle.NORMAL;
					} else {
						this.animationManager?.scaleWidth(this.gameObjects?.players.right, lrg, med);
						this.rightPaddleSize = SizePaddle.NORMAL;
					}
					break;
			}
			this.guiManager?.powerUp.update(side, slot, null, PowerUpAction.DEACTIVATED);
		}
	}

	private updateTournamentLobby(message: any): void {
		
		const names: string[] = message.lobby ?? ["test1"];
		this.guiManager?.showLobby(names);
		uiManager.setLoadingScreenVisible(false);
	}
}
