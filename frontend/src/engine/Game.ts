import { Color4, Engine, Scene, SceneLoader } from "@babylonjs/core";
import { appManager } from '../core/AppManager.js';
import { sendPOST } from "../core/HTTPRequests.js";
import { webSocketClient } from '../core/WebSocketClient.js';
import { Direction, GameMode, GameState, MessageType } from '../shared/constants.js';
import { GAME_CONFIG } from '../shared/gameConfig.js';
import { GameStateData, PlayerInfo, ServerMessage } from '../shared/types.js';
import { uiManager } from '../ui/UIManager.js';
import { AppState, PlayerSide } from '../utils/constants.js';
import { Logger } from '../utils/LogManager.js';
import { GameObjects, PlayerState, ThemeObject } from '../utils/types.js';
import { GameConfig } from './GameInitializer.js';
import { GameServices } from "./GameServices.js";
import { startFireworks } from "./scene/builders/effectsBuilder.js";
import { disposeMaterialResources } from "./scene/builders/materialsBuilder.js";
import { buildScene } from './scene/builders/sceneBuilder.js';
import { Motion } from "./services/AnimationManager.js";

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
	private themeObjects: ThemeObject | null = null;
	private players: Map<PlayerSide, PlayerState> = new Map([
		[PlayerSide.LEFT, this.resetPlayerState()],
		[PlayerSide.RIGHT, this.resetPlayerState()]
	]);
	private gameLoopObserver: any | null = null;
	private isSpectator: boolean = false;
	private isPaused: boolean = false;
	private isLastMatch: boolean = false;
	private isCountdownStarted: boolean = false;
	private currentRally: number = 1;
	

// ====================			CONSTRUCTOR			   ====================
	constructor(private config: GameConfig) {
		try {
			this.themeObjects = { props: [], actors: [], effects: [] };
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

	async create(aiDifficulty: number, capacity?: number): Promise<Game> {
		try {
			const players: PlayerInfo[] = this.config.players;
			const gameMode = this.config.gameMode;
			await sendPOST("join", { gameMode, players, aiDifficulty, capacity });
			await this.initialize();
			return this;
		} catch (error) {
			await this.dispose();
			Logger.error('Error creating game', 'Game', error);
			throw error;
		}
	}

// ====================			INITIALIZATION			====================
	async initialize(): Promise<void> {
		if (this.isInitialized) return;

		uiManager.updateLoadingProgress(0);
		SceneLoader.ShowLoadingScreen = false;
		uiManager.setLoadingScreenVisible(true);
		Logger.info('Initializing game...', 'Game');

		this.engine = await this.initializeBabylonEngine();
		this.scene = await this.createScene();

		const { gameObjects, themeObjects } = await buildScene(this.scene, this.config, 
			(progress: number) => uiManager.updateLoadingProgress(progress));

		this.gameObjects = gameObjects;
		this.themeObjects = themeObjects;

		this.services = new GameServices(this.engine, this.scene, this.config, this.gameObjects, this.players, {
			onPauseToggle: () => this.togglePause(),
			onExitToMenu: () => this.requestExitToMenu(),
			onSwitchGame: (dir) => this.switchGame(dir),
			onToggleMatchTree: () => this.services?.gui.matchTree.toggle(),
		});
		this.registerCallbacks();
		this.isInitialized = true;
		uiManager.setLoadingScreenVisible(false);
		await this.services?.start();
		if (this.config.isRemoteMultiplayer)
			webSocketClient.requestLobby();
		webSocketClient.sendPlayerReady();
		
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

		window.addEventListener('resize', () => {
			engine.resize();
		});
		engine.resize();
		return engine;
	}

	// Create scene based on view mode
	private async  createScene(): Promise<Scene> {
		const scene = new Scene(this.engine!);
		scene.createDefaultEnvironment({ createGround: false, createSkybox: false });
		scene.clearColor = new Color4(20/255, 61/255, 96/255, 1);
		return scene;
	}

	getState(): GameState {
		return this.serverState;
	}

// ====================			GAME CONTROL			 ====================
	private async handleCountdown(message: ServerMessage): Promise<void> {
		const countdown = message.countdown;
		if (countdown === undefined || countdown === null) return;

		if (!this.isCountdownStarted) {
			this.isCountdownStarted = true;
			this.services?.startCountdownSequence();
		}
		
		if (countdown === GAME_CONFIG.startDelay - 1) {
			const controlledSides = this.getControlledSides();
			await this.services?.showPlayerIntroduction(controlledSides);
		}
		else if (countdown === 4) {
			this.services?.hidePlayerIntroduction();
		}
		else if (countdown === 3 || countdown === 2 || countdown === 1) {
			this.services?.showCountdownNumber(countdown);
		}
		else if (countdown === 0) {
			this.services?.finishCountdown();
			this.startGameLoop();
			this.isCountdownStarted = false;
		}
	}

	private async onServerEndedGame(winner: string, loser: string): Promise<void> {
		if (!this.isInitialized || !this.config.isTournament || this.isSpectator) return;
		
		const controlledSides = this.getControlledSides();
		const controlledPlayer = controlledSides.length === 1 ? this.players.get(controlledSides[0]) : null;
		const showLoser = controlledPlayer?.name === loser;

		this.resetForNextMatch();

		if (this.config.gameMode === GameMode.TOURNAMENT_REMOTE && showLoser) {
			this.isSpectator = true;
			const wantsToSpectate = await this.services?.showMatchEndForLoser(this.isLastMatch);
			if (!wantsToSpectate)
				this.requestExitToMenu();
			return;
		}

		const waitForSpace = controlledSides.length !== 0 && this.config.gameMode !== GameMode.TOURNAMENT_REMOTE;
		const showCardGame = this.config.isRemoteMultiplayer;
		await this.services?.showMatchEndForWinner(winner, waitForSpace, showCardGame, this.isLastMatch);
		
		webSocketClient.sendPlayerReady();
	}
	
	private async onServerEndedSession(message: ServerMessage): Promise<void> {
		if (!this.isInitialized) return;

		const winner = message.winner;

		startFireworks(this.themeObjects?.effects || [], 250);
		if (winner)
			await this.services?.handleSessionEnd(winner, this.isSpectator);
		this.dispose();
	}

// ====================			GAME LOOP				====================
	private startGameLoop(): void {
		if (this.gameLoopObserver) return;
		this.gameLoopObserver = setInterval(() => {
			if (!this.isInitialized) return;
				try {
					this.services?.updateGameLoop(this.config.viewMode);
				} catch (error) {
					Logger.error('Error in game loop', 'Game', error);
				}
		}, 4);
	}

	private stopGameLoop(): void {
		if (this.gameLoopObserver) {
			clearInterval(this.gameLoopObserver);
			this.gameLoopObserver = null;
		}
	}

	private resetPlayerState(): PlayerState {
		return {
			name: "",
			isControlled: false,
			keyboardProfile: undefined,
			size: GAME_CONFIG.paddleWidth,
			score: 0,
			powerUpsAssigned: false,
			powerUps: [],
			inverted: false
		};
	}

	private resetPlayersState(): void {
		this.players.set(PlayerSide.LEFT, this.resetPlayerState());
		this.players.set(PlayerSide.RIGHT, this.resetPlayerState());
	}

	private resetForNextMatch(): void {
		if (!this.isInitialized) return;

		this.stopGameLoop();
		this.services?.resetGuiForNextMatch();
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
			for (let i = 0; i < this.gameObjects.balls.length; i++) {
				const ball = this.gameObjects.balls[i];
				ball.visibility = 0;
			}
		}
		this.currentRally = 1;
	}

// ====================			GAME STATE UPDATES	   ====================
	private updateGameObjects(state: GameStateData): void {
		if (!this.isInitialized || !this.gameObjects) return;

		try {
			this.handleChangeServerState(state)

			this.gameObjects.players.left.position.x = state.paddleLeft.x;
			this.gameObjects.players.right.position.x = state.paddleRight.x;

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

			if (this.currentRally !== state.rally) {
				this.currentRally = state.rally;
				this.services?.updateRally(this.currentRally);
				
			}

			const leftPlayer = this.players.get(PlayerSide.LEFT)!;
			const rightPlayer = this.players.get(PlayerSide.RIGHT)!;

			this.services?.updatePowerups(state.paddleLeft.powerups, state.paddleRight.powerups)

			if (leftPlayer.score < state.paddleLeft.score || rightPlayer.score < state.paddleRight.score) {
				rightPlayer.score = state.paddleRight.score;
				leftPlayer.score = state.paddleLeft.score;
				this.services?.updateScore(leftPlayer.score, rightPlayer.score);
			}

		} catch (error) {
			Logger.error('Error updating game objects', 'Game', error);
		}
	}

	private handleChangeServerState(state: GameStateData): void {
		if (this.serverState === state.state) return;
		this.serverState = state.state;

		switch (this.serverState){
			case GameState.PAUSED:
				// this.services?.gui?.setPauseVisible(true, this.isSpectator); //TODO we need it?
				break;
			case GameState.RUNNING:
				// this.services?.gui?.setPauseVisible(false, this.isSpectator);
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
	private handlePlayerAssignment(message: ServerMessage): void {
		const leftPlayerName = message.left;
		const rightPlayerName = message.right;

		if (!leftPlayerName || !rightPlayerName) return;

		const leftPlayer = this.players.get(PlayerSide.LEFT);
		const rightPlayer = this.players.get(PlayerSide.RIGHT);
		
		if (leftPlayer) {
			leftPlayer.name = leftPlayerName;
			leftPlayer.isControlled = this.config.players.some(player => player.name === leftPlayerName);
		}
		if (rightPlayer) {
			rightPlayer.name = rightPlayerName;
			rightPlayer.isControlled = this.config.players.some(player => player.name === rightPlayerName);
		}

		const controlledSides = this.getControlledSides();
		this.services?.updatePlayerAssignment(leftPlayerName, rightPlayerName, controlledSides);
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
		if (!this.isInitialized) return;
		await this.services?.playCurtains();
		if (webSocketClient.isConnected())
			webSocketClient.sendQuitGame();
		await this.dispose();
	}

	private togglePause(): void {
		this.isPaused = !this.isPaused;
		this.services?.handlePause(this.isPaused, this.isSpectator);

		if (this.isPaused)
			webSocketClient.sendPauseRequest();
		else
			webSocketClient.sendResumeRequest();
	}

// ====================			WEBSOCKET				  ====================
	private registerCallbacks(): void {
		webSocketClient.registerCallback(MessageType.GAME_STATE, (state: GameStateData) => { this.updateGameObjects(state); });
		webSocketClient.registerCallback(MessageType.ERROR, (error: string) => { Logger.error('Network error', 'Game', error); });
		webSocketClient.registerCallback(MessageType.SESSION_ENDED, (message: ServerMessage) => { this.onServerEndedSession(message); });
		webSocketClient.registerCallback(MessageType.SIDE_ASSIGNMENT, (message: ServerMessage) => { this.handlePlayerAssignment(message); });
		webSocketClient.registerCallback(MessageType.MATCH_ASSIGNMENT, (message: ServerMessage) => { this.isLastMatch = this.services?.updateTournamentRound(message) ?? false; });
		webSocketClient.registerCallback(MessageType.MATCH_RESULT, (message: ServerMessage) => { this.services?.updateTournamentGame(message);});
		webSocketClient.registerCallback(MessageType.TOURNAMENT_LOBBY, (message: ServerMessage) => { this.services?.updateTournamentLobby(message);});
		webSocketClient.registerCallback(MessageType.COUNTDOWN, (message: ServerMessage) => { this.handleCountdown(message); });
	}

	private unregisterCallbacks(): void {
		webSocketClient.unregisterCallback(MessageType.GAME_STATE);
		webSocketClient.unregisterCallback(MessageType.ERROR);
		webSocketClient.unregisterCallback(MessageType.SESSION_ENDED);
		webSocketClient.unregisterCallback(MessageType.SIDE_ASSIGNMENT);
		webSocketClient.unregisterCallback(MessageType.MATCH_ASSIGNMENT);
		webSocketClient.unregisterCallback(MessageType.MATCH_RESULT);
		webSocketClient.unregisterCallback(MessageType.TOURNAMENT_LOBBY);
		webSocketClient.unregisterCallback(MessageType.COUNTDOWN);
	}

	private switchGame(direction: Direction): void {
		this.services?.playCurtains(Motion.F.xFast);
		webSocketClient.sendSwitchGame(direction);
	}

// ====================			CLEANUP				  ====================
	private async dispose(): Promise<void> {
		try {
			if (!this.isInitialized) {
				Logger.debug('Dispose called but not initialized', 'Game');
				return;
			}
			this.isInitialized = false;
			this.stopGameLoop();
			this.services?.dispose();
			this.services = null;
			if (this.themeObjects) {
				for (const e of this.themeObjects.effects) e.dispose();
				for (const a of this.themeObjects.actors) a.dispose();
				for (const m of this.themeObjects.props) m.dispose?.();
			}
			this.themeObjects = null;
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
			this.canvas = null;
			uiManager.setLoadingScreenVisible(false);
			appManager.navigateTo(AppState.MAIN_MENU);
			Logger.debug('Game disposed successfully', 'Game');
		} catch (error) {
			Logger.error('Error disposing game', 'Game', error);
		}
	}
}
