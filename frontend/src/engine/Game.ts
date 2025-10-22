import { Color4, Engine, Scene, SceneLoader } from "@babylonjs/core";
import { appStateManager } from '../core/AppManager.js';
import { webSocketClient } from '../core/WebSocketClient.js';
import { AppState, GameMode, GameState, MessageType } from '../shared/constants.js';
import { GAME_CONFIG } from '../shared/gameConfig.js';
import { GameObjects, GameStateData, ThemeObject } from '../shared/types.js';
import { uiManager } from '../ui/UIManager.js';
import { Logger } from '../utils/LogManager.js';
import { GameConfig } from './GameConfig.js';
import { GameServices } from "./GameServices.js";
import { buildScene } from './scene/builders/sceneBuilder.js';
import { disposeMaterialResources } from "./scene/builders/materialsBuilder.js";
import { PlayerSide, PlayerState } from "./utils.js";
import { startFireworks } from "./scene/builders/effectsBuilder.js";
import { PowerupType } from "../shared/constants.js";


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
	private gameLoopObserver: any = null;
	private isSpectator: boolean = false;
	private isGameEnded: boolean = false;
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
			webSocketClient.joinGame(this.config.gameMode, this.config.players, aiDifficulty, capacity);
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

		this.services = new GameServices(this.engine, this.scene, this.config, this.gameObjects, this.players);
		await this.services.initialize();
		this.services.render.startRendering();
		this.registerCallbacks();
		this.isInitialized = true;
		if (this.config.isRemoteMultiplayer)
			webSocketClient.requestLobby();
		webSocketClient.sendPlayerReady();
		uiManager.setLoadingScreenVisible(false);
		await this.services?.gui.curtain.show();
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
		if (countdown === undefined || countdown === null) {
			Logger.error('Server sent SIGNAL without countdown parameter', 'Game');
			return;
		}

		if (countdown === GAME_CONFIG.startDelay) {
			uiManager.setLoadingScreenVisible(false);
			this.services?.gui.lobby.hide();
			this.services?.gui.cardGame.hide();
			this.services?.gui.curtain.hide();
			this.services?.gui.hud.show(true);
		}
		if (countdown === GAME_CONFIG.startDelay - 1) {
			const playerLeft = this.players.get(PlayerSide.LEFT)?.name;
			const playerRight = this.players.get(PlayerSide.RIGHT)?.name;
			this.services?.audio?.restoreMusicVolume();
			const controlledSides = this.getControlledSides();
			await Promise.all([
				this.services?.gui.countdown.showPlayersName(playerLeft!, playerRight!),
				this.services?.animation?.startCameraAnimations(
					this.gameObjects?.cameras, 
					this.config.viewMode,
					controlledSides,
					this.config.isLocalMultiplayer
				)
			]);
		}
		else if (countdown === 4) {
			this.services?.gui.countdown.hidePlayersName();
		}
		else if (countdown === 3 || countdown === 2 || countdown === 1) {
			this.services?.gui?.countdown.show(countdown);
			this.services?.audio?.playCountdown();
		}
		else if (countdown === 0) {
			this.services?.audio?.startGameMusic();
			this.services?.animation?.stopCameraAnimations();
			this.services?.gui?.countdown.finish();
			this.startGameLoop();
			// this.testPowerupEffects();
		}
	}

	private testPowerupEffects(): void {
	const powerupTypes = [
		PowerupType.SHRINK_OPPONENT,
		PowerupType.GROW_PADDLE,
		PowerupType.INVERT_OPPONENT,
		PowerupType.SHIELD,
		PowerupType.SLOW_OPPONENT,
		PowerupType.INCREASE_PADDLE_SPEED,
		PowerupType.FREEZE,
		PowerupType.POWERSHOT,
		PowerupType.CURVE_BALL,
		PowerupType.CURVE_BALL
	];

	let currentIndex = 0;
	let previousPowerup: PowerupType | null = null;

	const testInterval = setInterval(() => {
		if (!this.isInitialized || !this.services?.powerup) {
			clearInterval(testInterval);
			return;
		}

		// Deactivate previous powerup
		if (previousPowerup !== null) {
			this.services.powerup.deactivate(PlayerSide.LEFT, 0, previousPowerup);
			console.error(`   ✅ Deactivated: ${PowerupType[previousPowerup]}`);
		}

		// Activate new powerup
		const powerupType = powerupTypes[currentIndex];
		console.error(`🧪 Activating: ${PowerupType[powerupType]}`);
		this.services.powerup.activate(PlayerSide.LEFT, 0, powerupType);

		previousPowerup = powerupType;
		currentIndex = (currentIndex + 1) % powerupTypes.length;
	}, 3000);
}

	// Handle server ending the game
	private async onServerEndedGame(winner: string, loser: string): Promise<void> {
		if (!this.isInitialized || !this.config.isTournament) return;
		this.services?.audio?.lowerMusicVolume();
		this.services?.gui?.setPauseVisible(false, false);
		const controlledSides = this.getControlledSides();

		const controlledPlayer = controlledSides.length === 1 ? this.players.get(controlledSides[0]) : null;
		const showLoser = controlledPlayer?.name === loser;
		
		if (showLoser){
			await this.services?.gui?.showTournamentMatchLoser();
			await this.services?.input.waitForSpectatorChoice();
			this.resetForNextMatch();
			await this.services?.gui.curtain.show(showLoser);
			this.services?.gui.hud.setSpectatorMode();
			webSocketClient.sendSpectatorReady();
			this.isSpectator = true;
			return;
		}

		const waitForSpace = controlledSides.length !== 0 && this.config.gameMode !== GameMode.TOURNAMENT_REMOTE;
		await this.services?.gui?.showTournamentMatchWinner(winner, waitForSpace);
		this.resetForNextMatch();
		await this.services?.gui.curtain.show();
		this.services?.gui.cardGame.show();
		webSocketClient.sendPlayerReady();
	}

	private async onServerEndedSession(winner: string): Promise<void> {
		if (!this.isInitialized) return;

		this.services?.render?.startRendering();

		this.services?.gui?.setPauseVisible(false, false);
		// const cams = this.scene?.activeCameras?.length ? this.scene.activeCameras : this.scene?.activeCamera;
		// this.services?.particles?.spawnFireworksInFrontOfCameras(this.scene, cams);
		startFireworks(this.themeObjects?.effects || [], 250);
		await this.services?.gui?.showWinner(winner);
		await this.services?.gui.curtain.play();
		this.services?.audio?.stopGameMusic();
		this.dispose();

	}

// ====================			GAME LOOP				====================
	private startGameLoop(): void {
		if (this.gameLoopObserver) return;
		this.gameLoopObserver = setInterval(() => {
			if (!this.isInitialized) return;
				try {
					this.services?.input?.update();
					this.services?.render?.update3DCameras(this.config.viewMode);
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

	private resetForNextMatch(): void {
		if (!this.isInitialized) return;

		this.stopGameLoop();
		this.services?.gui?.hud.resetPowerUps();
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

			this.gameObjects.players.left.position.x = state.paddleLeft.x;
			this.gameObjects.players.right.position.x = state.paddleRight.x;

			// Update ball position
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
			Logger.error('Error updating game objects', 'Game', error);
		}
	}

	private handleChangeServerState(state: GameStateData): void {
		if (this.serverState === state.state) return;

		// if (this.isSpectator)
		// 	this.services?.gui.curtain.hide();
		this.serverState = state.state;

		switch (this.serverState){
			case GameState.PAUSED:
				this.services?.gui?.setPauseVisible(true, this.isSpectator);
				this.services?.audio?.pauseGameMusic();
				break;
			case GameState.RUNNING:
				this.services?.gui?.setPauseVisible(false, this.isSpectator);
				this.services?.audio?.resumeGameMusic();
				this.isGameEnded = false;
				break;
			case GameState.ENDED:
				if (this.isGameEnded) return;
				this.isGameEnded = true;
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
		if (!this.isInitialized) return;
		await this.services?.gui.curtain.play();
		if (webSocketClient.isConnected())
			webSocketClient.sendQuitGame();
		await this.dispose();
	}

// ====================			WEBSOCKET				  ====================
	private registerCallbacks(): void {
		webSocketClient.registerCallback(MessageType.GAME_STATE, (state: GameStateData) => { this.updateGameObjects(state); });
		webSocketClient.registerCallback(MessageType.ERROR, (error: string) => { Logger.error('Network error', 'Game', error); });
		webSocketClient.registerCallback(MessageType.SESSION_ENDED, (message: any) => { this.onServerEndedSession(message.winner); });
		webSocketClient.registerCallback(MessageType.SIDE_ASSIGNMENT, (message: any) => { this.handlePlayerAssignment(message.left, message.right); });
		webSocketClient.registerCallback(MessageType.MATCH_ASSIGNMENT, (message: any) => { this.services?.gui?.updateTournamentRound(message); });
		webSocketClient.registerCallback(MessageType.MATCH_RESULT, (message: any) => { this.services?.gui?.updateTournamentGame(message);});
		webSocketClient.registerCallback(MessageType.TOURNAMENT_LOBBY, (message: any) => {this.services?.gui?.updateTournamentLobby(message); uiManager.setLoadingScreenVisible(false); });
		webSocketClient.registerCallback(MessageType.COUNTDOWN, (message: any) => { this.handleCountdown(message.countdown); });
		document.addEventListener('game:exitToMenu', this.exitHandler);
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

// ====================			CLEANUP				  ====================
	private async dispose(): Promise<void> {
		try {
			if (!this.isInitialized) {
				Logger.debug('Dispose called but not initialized', 'Game');
				return;
			}
			this.isInitialized = false;
			document.removeEventListener('game:exitToMenu', this.exitHandler);
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
