import { Engine, Scene, Color4, SceneLoader} from "@babylonjs/core";
import { GameConfig } from './GameConfig.js';
import { buildScene2D, buildScene3D } from './scene/sceneBuilder.js';
import { webSocketClient } from '../core/WebSocketClient.js';
import { GameStateData, GameObjects } from '../shared/types.js';
import { GAME_CONFIG } from '../shared/gameConfig.js';
import { ViewMode, WebSocketEvent, AppState, GameState } from '../shared/constants.js';
import { Logger } from '../utils/LogManager.js';
import { uiManager } from '../ui/UIManager.js';
import { GameMode } from '../shared/constants.js';
import { appStateManager } from '../core/AppStateManager.js';
import { GameConfigFactory } from './GameConfig.js';
import { PlayerSide, PlayerState } from "./utils.js"
import { disposeMaterialResources } from "./scene/materialFactory.js";
import { GameServices } from "./GameServices.js";

/**
 * The Game class serves as the core of the game engine, managing the initialization,
 * state, and lifecycle of the game. It handles rendering, input, audio, and communication
 * with the server, as well as coordinating various game components such as scenes,
 * animations, and GUI elements.
 */
export class Game {
	private isInitialized: boolean = false;
	private serverState: GameState = GameState.INIT;
	private engine: Engine | null = null;
	private scene: Scene | null = null;
	private services: GameServices | null = null;
	private canvas: HTMLCanvasElement | null = null;
	private gameObjects: GameObjects | null = null;
	private gameLoopObserver: any = null;
	private players: Map<PlayerSide, PlayerState> = new Map([
			[PlayerSide.LEFT, { name: "", isControlled: false, keyboardProfile: undefined,
				size: GAME_CONFIG.paddleWidth, score: 0, powerUpsAssigned: false, powerUps: [], inverted: false,}],
			[PlayerSide.RIGHT, { name: "", isControlled: false, keyboardProfile: undefined,
				size: GAME_CONFIG.paddleWidth, score: 0, powerUpsAssigned: false, powerUps: [], inverted: false,}]
		]);
	private exitHandler = () => {
		this.requestExitToMenu();
	};

// ====================			CONSTRUCTOR			   ====================
	constructor(private config: GameConfig) {
		try {
			// this.state = new GameStateManager();
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
		} catch (error) {
			Logger.errorAndThrow('Error creating game managers', 'Game', error);
		}
	}

	async create(viewMode: ViewMode, gameMode: GameMode, aiDifficulty: number, capacity?: number): Promise<Game> {
		try {
			const config = GameConfigFactory.createWithAuthCheck(viewMode, gameMode);
			const game = new Game(config);
			webSocketClient.joinGame(this.config.gameMode, this.config.players, aiDifficulty, capacity);
			await game.initialize();
			return game;
		} catch (error) {
			await this.dispose();
			Logger.error('Error creating game', 'Game', error);
			throw error;
		}
	}

// ====================			INITIALIZATION			====================
	async initialize(): Promise<void> {
		if (this.isInitialized) return;

		SceneLoader.ShowLoadingScreen = false;
		uiManager.setLoadingScreenVisible(true);
		Logger.info('Initializing game...', 'Game');

		this.engine = await this.initializeBabylonEngine();
		this.scene = await this.createScene();

		this.gameObjects = this.config.viewMode === ViewMode.MODE_2D
			? await buildScene2D(this.scene, this.config.gameMode, this.config.viewMode, (progress: number) => uiManager.updateLoadingProgress(progress))
			: await buildScene3D(this.scene, this.config.gameMode, this.config.viewMode, (progress: number) => uiManager.updateLoadingProgress(progress));

		this.services = new GameServices(this.engine, this.scene, this.config, this.gameObjects, this.players);
		await this.services.initialize();
		this.services.render.startRendering();

		this.registerCallbacks();
		this.isInitialized = true;
		if (this.config.isRemoteMultiplayer)
			webSocketClient.requestLobby();
		webSocketClient.sendPlayerReady();
		uiManager.setLoadingScreenVisible(false);
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
		scene.clearColor = new Color4(20/255, 61/255, 96/255, 1);
		return scene;
	}

	private resetPlayersState(): void {
		this.players.set(PlayerSide.LEFT, {
			name: "",
			score: 0,
			size: GAME_CONFIG.paddleWidth,
			inverted: false,
			isControlled: false,
			powerUps: [],
			powerUpsAssigned: false
		});
		
		this.players.set(PlayerSide.RIGHT, {
			name: "",
			score: 0,
			size: GAME_CONFIG.paddleWidth,
			inverted: false,
			isControlled: false,
			powerUps: [],
			powerUpsAssigned: false
		});
	}

	getState(): GameState {
		return this.serverState;
	}

// ====================			GAME CONTROL			 ====================
	private async handleCountdown(countdown: number): Promise<void> {
		try {
			if (countdown === undefined || countdown === null)
				Logger.errorAndThrow('Server sent SIGNAL without countdown parameter', 'Game');

			uiManager.setLoadingScreenVisible(false);
			this.services?.gui?.lobby.hide();
			const playerLeft = this.players.get(PlayerSide.LEFT)?.name;
			const playerRight = this.players.get(PlayerSide.RIGHT)?.name;

			if (countdown === GAME_CONFIG.startDelay) {
				const controlledSides = this.getControlledSides();
				await Promise.all([
					this.services?.gui.countdown.introduceNames(playerLeft!, playerRight!),
					this.services?.render?.startCameraAnimation(
						this.gameObjects?.cameras, 
						this.config.viewMode,
						controlledSides,
						this.config.isLocalMultiplayer
					)
				]);
			}
			else if (countdown === 4) {
				this.services?.gui.countdown.hideNames();
			}
			else if (countdown === 3 || countdown === 2 || countdown === 1) {
				this.services?.gui?.countdown.set(true, countdown);
				this.services?.audio?.playCountdown();
			}
			else if (countdown === 0) {
				this.services?.audio?.stopCountdown();
				this.services?.audio?.startGameMusic();
				this.services?.render?.stopCameraAnimation();
				this.services?.gui?.countdown.finishCountdown();
				await this.services?.gui?.animateBackground(false);
				this.startGameLoop();
			}
		} catch (error) {
			Logger.error('Error handling countdown', 'Game', error);
		}
	}

	// Handle server confirming game is paused
	private onServerPausedGame(): void {
		this.services?.gui?.setPauseVisible(true);
		this.services?.audio?.pauseGameMusic();
	}

	// Handle server confirming game is resumed
	private onServerResumedGame(): void {
		this.services?.gui?.setPauseVisible(false);
		this.services?.audio?.resumeGameMusic();
	}

	// Handle server ending the game
	private async onServerEndedGame(winner: string, loser: string): Promise<void> {
		if (!this.isInitialized || !this.config.isTournament) return;
		
		this.services?.gui?.setPauseVisible(false);
		const controlledSides = this.getControlledSides();

		const controlledPlayer = controlledSides.length === 1 ? this.players.get(controlledSides[0]) : null;
		const showLoser = controlledPlayer?.name === loser;
		
		if (showLoser){
			await this.services?.gui?.showTournamentMatchLoser();
			const wantsToSpectate = await this.services?.input.waitForSpectatorChoice();
			if (wantsToSpectate) {
				this.services?.input.setSpectator('yes');
				this.services?.gui.hud.setSpectatorMode();
				webSocketClient.sendSpectatorReady();
			} else
				this.requestExitToMenu();
		}
		else {
			const waitForSpace = controlledSides.length !== 0 || this.config.gameMode === GameMode.TOURNAMENT_REMOTE;
			await this.services?.gui?.showTournamentMatchWinner(winner, waitForSpace);
			this.resetForNextMatch();
			webSocketClient.sendPlayerReady();
			this.services?.audio?.stopGameMusic();
		}
		// this.resetForNextMatch();
		// webSocketClient.sendPlayerReady();
		// this.services?.audio?.stopGameMusic();
	}

	private async onServerEndedSession(winner: string): Promise<void> {
		if (!this.isInitialized) return;

		if (!this.services?.render?.isRunning)
			this.services?.render?.startRendering();

		this.services?.gui?.setPauseVisible(false);
		if (this.scene) {
			const cams = this.scene.activeCameras?.length ? this.scene.activeCameras : this.scene.activeCamera;
			this.services?.particles?.spawnFireworksInFrontOfCameras(this.scene, cams);
		}
		if (winner !== undefined)
			await this.services?.gui?.showWinner(winner);

		this.services?.audio?.stopGameMusic();
		this.dispose();

	}

// ====================			GAME LOOP				====================
	private startGameLoop(): void {
		if (this.gameLoopObserver) return;
		this.gameLoopObserver = setInterval(() => {
			if (!this.isInitialized) return;
				try {
					uiManager.setLoadingScreenVisible(false);
					this.services?.gui?.lobby.hide();
					this.services?.input?.update();
					if (this.config.viewMode === ViewMode.MODE_3D)
						this.services?.render?.update3DCameras();
				} catch (error) {
					Logger.errorAndThrow('Error in game loop', 'Game', error);
				}
		}, 16);
	}

	private resetForNextMatch(): void {
		if (!this.isInitialized) return;

		this.services?.gui?.powerUp.reset();
		this.resetPlayersState();

		if (this.gameObjects) {
			if (this.gameObjects.players.left) {
				this.gameObjects.players.left.position.x = 0;
				this.gameObjects.players.left.scaling.x = 1;
			}
			if (this.gameObjects.players.right) {
				this.gameObjects.players.right.position.x = 0;
				this.gameObjects.players.right.scaling.x = 1;
			}
			// if (this.gameObjects.ball) {
			// 	this.gameObjects.ball.position.x = 0;
			// 	this.gameObjects.ball.position.z = 0;
			// }
			for (let i = 0; i < this.gameObjects.balls.length; i++) {
				const ball = this.gameObjects.balls[i];
				// ball.position.x = 0;
				// ball.position.z = 0;
				// ball.visibility = i === 0 ? 1 : 0;
				ball.visibility = 0;
			}
		}

		this.services?.gui?.hud.updateScores(
			this.players.get(PlayerSide.LEFT)!.score,
			this.players.get(PlayerSide.RIGHT)!.score
		);
	}

// ====================			GAME STATE UPDATES	   ====================
	private updateGameObjects(state: GameStateData): void {
		if (!this.isInitialized || !this.gameObjects) return;

		try {
			this.handleChangeServerState(state)
			// Update paddle positions
			this.gameObjects.players.left.position.x = state.paddleLeft.x;
			this.gameObjects.players.right.position.x = state.paddleRight.x;

			// Update ball position
			// this.gameObjects.ball.position.x = state.ball.x;
			// this.gameObjects.ball.position.z = state.ball.z;
			// this.gameObjects.ball.rotation.x += 0.1;
			// this.gameObjects.ball.rotation.y += 0.05;
			const ballStates = state.ball_states || [];
			for (let i = 0; i < this.gameObjects.balls.length; i++) {
				const ball = this.gameObjects.balls[i];
				const ballState = ballStates[i];
				
				if (ballState) {
					ball.position.x = ballState.x;
					ball.position.z = ballState.z;
					ball.rotation.x += 0.1;
					ball.rotation.y += 0.05;
					ball.visibility = 1;
				} else {
					ball.visibility = 0;
				}
			}

			const currentRally = state.rally || 0;
			if (this.services?.gui?.hud.updateRally(currentRally))
				this.services?.audio?.playPaddleHit();
			this.services?.audio?.updateMusicSpeed(currentRally);
			// if (this.services?.gui?.hud.updateRally(state.ball[0].current_rally))
			// 	this.services?.audio?.playPaddleHit();
			// this.services?.audio?.updateMusicSpeed(state.ball[0].current_rally);

			const leftPlayer = this.players.get(PlayerSide.LEFT)!;
			const rightPlayer = this.players.get(PlayerSide.RIGHT)!;

			this.services?.powerup?.handleUpdates(PlayerSide.LEFT, state.paddleLeft.powerups);
			this.services?.powerup?.handleUpdates(PlayerSide.RIGHT, state.paddleRight.powerups);


			let scoresChanged = false;
			if (leftPlayer.score < state.paddleLeft.score) {
				leftPlayer.score = state.paddleLeft.score;
				this.services?.audio?.playScore();
				scoresChanged = true;
			}
			if (rightPlayer.score < state.paddleRight.score) {
				rightPlayer.score = state.paddleRight.score;
				this.services?.audio?.playScore();
				scoresChanged = true;
			}

			if (scoresChanged)
				this.services?.gui?.hud.updateScores(leftPlayer.score, rightPlayer.score);

		} catch (error) {
			Logger.errorAndThrow('Error updating game objects', 'Game', error);
		}
	}

	private handleChangeServerState(state: GameStateData): void {
		if (this.serverState === state.state) return;

		this.serverState = state.state;
		switch (this.serverState){
			case GameState.PAUSED:
				this.onServerPausedGame();
				break;
			case GameState.RUNNING:
				this.onServerResumedGame();
				break;
			case GameState.ENDED:
				const winner = state.winner;
				const loser = state.loser;
				if (winner && loser)
					this.onServerEndedGame(winner, loser);
				break;
		}
	}

// ====================			INPUT HANDLING		   ====================
	private handlePlayerAssignment(leftPlayerName: string, rightPlayerName: string): void {
		this.services?.gui?.hud.updatePlayerNames(leftPlayerName, rightPlayerName);

		const leftPlayer = this.players?.get(PlayerSide.LEFT);
		const rightPlayer = this.players?.get(PlayerSide.RIGHT);
		
		if (leftPlayer){
			leftPlayer.name = leftPlayerName;
			leftPlayer.isControlled = this.config.players.some(player => player.name === leftPlayerName);
		}
		if (rightPlayer){
			rightPlayer.name = rightPlayerName;
			rightPlayer.isControlled = this.config.players.some(player => player.name === rightPlayerName);
		}

		this.services?.input?.assignLocalControls();

		const controlledSides = this.getControlledSides();
		this.services?.render?.updateActiveCameras(this.config.viewMode, controlledSides, this.config.isLocalMultiplayer);
		this.services?.gui?.updateControlVisibility(
			leftPlayer?.isControlled || false, 
			rightPlayer?.isControlled || false
		);
	}

	private getControlledSides(): PlayerSide[] {
		const controlledSides: PlayerSide[] = [];
		if (this.players?.get(PlayerSide.LEFT)?.isControlled) 
			controlledSides.push(PlayerSide.LEFT);
		if (this.players?.get(PlayerSide.RIGHT)?.isControlled)
			controlledSides.push(PlayerSide.RIGHT);
		return controlledSides;
	}

// ====================			GAME LIFECYCLE			   ====================
	async requestExitToMenu(): Promise<void> {
		webSocketClient.sendQuitGame();
		this.dispose();
	}

// ====================			WEBSOCKET				  ====================
	private registerCallbacks(): void {
		webSocketClient.registerCallback(WebSocketEvent.GAME_STATE, (state: GameStateData) => { this.updateGameObjects(state); });
		webSocketClient.registerCallback(WebSocketEvent.ERROR, (error: string) => { Logger.error('Network error', 'Game', error); });
		webSocketClient.registerCallback(WebSocketEvent.SESSION_ENDED, (message: any) => { this.onServerEndedSession(message.winner); });
		webSocketClient.registerCallback(WebSocketEvent.SIDE_ASSIGNMENT, (message: any) => { this.handlePlayerAssignment(message.left, message.right); });
		webSocketClient.registerCallback(WebSocketEvent.MATCH_ASSIGNMENT, (message: any) => { this.services?.gui?.updateTournamentRound(message); });
		webSocketClient.registerCallback(WebSocketEvent.MATCH_RESULT, (message: any) => { this.services?.gui?.updateTournamentGame(message);});
		webSocketClient.registerCallback(WebSocketEvent.TOURNAMENT_LOBBY, (message: any) => {this.services?.gui?.updateTournamentLobby(message); uiManager.setLoadingScreenVisible(false); });
		webSocketClient.registerCallback(WebSocketEvent.COUNTDOWN, (message: any) => { this.handleCountdown(message.countdown); });
		document.addEventListener('game:exitToMenu', this.exitHandler);
	}

	private unregisterCallbacks(): void {
		try {
			webSocketClient.unregisterCallback(WebSocketEvent.GAME_STATE);
			webSocketClient.unregisterCallback(WebSocketEvent.ERROR);
			webSocketClient.unregisterCallback(WebSocketEvent.SESSION_ENDED);
			webSocketClient.unregisterCallback(WebSocketEvent.SIDE_ASSIGNMENT);
			webSocketClient.unregisterCallback(WebSocketEvent.MATCH_ASSIGNMENT);
			webSocketClient.unregisterCallback(WebSocketEvent.MATCH_RESULT);
			webSocketClient.unregisterCallback(WebSocketEvent.TOURNAMENT_LOBBY);
			webSocketClient.unregisterCallback(WebSocketEvent.COUNTDOWN);
		} catch (error) {
			Logger.error('Error clearing WebSocket callbacks', 'Game', error);
		}
	}
// ====================			CLEANUP				  ====================
	private async dispose(): Promise<void> {
		if (!this.isInitialized) return;
		try {
			document.removeEventListener('game:exitToMenu', this.exitHandler);
			this.isInitialized = false;
			clearInterval(this.gameLoopObserver);
			this.gameLoopObserver = null;
			this.services?.dispose();
			this.services = null;
			disposeMaterialResources();
			this.gameObjects = null;
			this.players.clear();
			this.unregisterCallbacks();
			if (this.scene) {
				this.scene.onBeforeRenderObservable?.clear();
				this.scene.onAfterRenderObservable?.clear();
				this.scene.dispose();
				this.scene = null;
			}
			if (this.engine) {
				this.engine.stopRenderLoop();
				this.engine.dispose();
				this.engine = null;
			}
			if (this.canvas) {
				const context = this.canvas.getContext('2d');
				context?.clearRect(0, 0, this.canvas.width, this.canvas.height);
			}
			this.canvas = null;
			uiManager.setLoadingScreenVisible(false);
			appStateManager.navigateTo(AppState.MAIN_MENU);
			Logger.debug('Game disposed successfully', 'Game');
		} catch (error) {
			Logger.error('Error disposing game', 'Game', error);
		}
	}
}
