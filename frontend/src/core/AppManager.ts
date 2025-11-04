import { Game } from '../engine/Game.js';
import { GameInitializer } from '../engine/GameInitializer.js';
import { AiDifficulty, GameMode, GameState } from '../shared/constants.js';
import { getCurrentTranslation, updateLanguageDisplay } from '../translations/translations.js';
import { EL, requireElementById } from '../ui/elements.js';
import { uiManager } from '../ui/UIManager.js';
import { AppState, BUTTON_NAV, GAME_MODE_CONFIG, MIN_PLAYERS_FOR_CPU, Quality, TOURNAMENT_SIZES, ViewMode } from '../utils/constants.js';
import { Logger } from '../utils/LogManager.js';
import type { GameSetting } from '../utils/types.js';
import { authManager } from './AuthManager.js';
import { dashboardManager } from './DashboardManager.js';

export let currentSettings: GameSetting = {
	language: 0,
	viewMode: ViewMode.MODE_2D,
	scene3D: 'random',
	gameMode: null,
	AiDifficulty: AiDifficulty.EASY,
	musicEnabled: true,
	soundEffectsEnabled: true,
	offlineTournamentSize: 4,
	onlineTournamentSize: 4,
	quality: Quality.MEDIUM
};

export function updateCurrentSettings(newSettings: Partial<typeof currentSettings>): void {
    if (newSettings) {
        currentSettings = { ...currentSettings, ...newSettings };
        uiManager.updateSettings();
    }
}

/**
 * Central controller for application state and navigation.
 * Manages transitions between game phases, coordinates UI updates,
 * and delegates actions to authentication, history, and networking managers.
 * Does not implement game logic; focuses on lifecycle and state management.
 */
export class AppManager {
	currentAppState: AppState = AppState.MAIN_MENU;
	private currentGame: Game | null = null;
	private isCollectingPlayerNames = false;
	private playerIndex: number = 0;
	private playerNames: string[] = [];
	private maxPlayersNeeded: number = 0;

	initialize(): void {
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', () => {
				this.setupEventListeners();
				this.initializeUI();
			});
		} else {
			this.setupEventListeners();
			this.initializeUI();
		}
	}

	private initializeUI(): void {
		uiManager.updateViewModeButtonStyles(currentSettings.viewMode);
		uiManager.updateAIDifficultyDisplay(currentSettings.AiDifficulty);
		uiManager.updateTournamentSizeDisplay(currentSettings.offlineTournamentSize);
		uiManager.updateOnlineTournamentSizeDisplay(currentSettings.onlineTournamentSize);

		this.navigateTo(AppState.MAIN_MENU);
	}

	// ========================================
	// EVENT LISTENERS SETUP
	// ========================================
	private setupEventListeners(): void {
		this.setupViewModeListeners();
		this.setupGameModeListeners();
		this.setupPlayerSetupListeners();
		this.setupDashboardListener();
		this.setupSettingListener();
		this.setupInstructionsListener();
		
		document.addEventListener('submit', (event) => {
			event.preventDefault();
		});

		window.addEventListener('popstate', (event) => {
			if (this.currentGame?.getState() === GameState.RUNNING) {
				this.currentGame?.requestExitToMenu();
				return;
			} else if (this.currentGame?.getState() === GameState.PAUSED) {
				this.currentGame?.requestExitToMenu();
				return;
			}

			const state = event.state?.screen || AppState.MAIN_MENU;
			this.navigateTo(state, false);
		});
	}

	private setupViewModeListeners(): void {
		const classicBtn = requireElementById<HTMLButtonElement>(EL.BUTTONS.VIEW_MODE_CLASSIC);
		const immersiveBtn = requireElementById<HTMLButtonElement>(EL.BUTTONS.VIEW_MODE_IMMERSIVE);

		classicBtn.addEventListener('click', () => this.selectViewMode(ViewMode.MODE_2D));
		immersiveBtn.addEventListener('click', () => this.selectViewMode(ViewMode.MODE_3D));
	}

	private setupGameModeListeners(): void {
		// Game mode buttons
		for (const [gameMode, config] of Object.entries(GAME_MODE_CONFIG)) {
			const button = requireElementById<HTMLButtonElement>(gameMode as GameMode);
			button.addEventListener('click', () => this.handleGameModeClick(gameMode as GameMode, config));
		}

		// Navigation
		const modeBackBtn = requireElementById<HTMLButtonElement>(EL.BUTTONS.MODE_BACK);
		modeBackBtn.addEventListener('click', () => this.handleModeBackClick());

		// Difficulty controls
		const difficultyBackBtn = requireElementById<HTMLButtonElement>(EL.BUTTONS.SOLO_DIFFICULTY_BACK);
		const difficultyForwardBtn = requireElementById<HTMLButtonElement>(EL.BUTTONS.SOLO_DIFFICULTY_FORWARD);
		
		difficultyBackBtn.addEventListener('click', () => this.updateAIDifficulty(BUTTON_NAV.PREV));
		difficultyForwardBtn.addEventListener('click', () => this.updateAIDifficulty(BUTTON_NAV.NEXT));
		
		// Tournament size controls
		const tournamentBackBtn = requireElementById<HTMLButtonElement>(EL.BUTTONS.TOURNAMENT_NUMBER_BACK);
		const tournamentForwardBtn = requireElementById<HTMLButtonElement>(EL.BUTTONS.TOURNAMENT_NUMBER_FORWARD);
		
		tournamentBackBtn.addEventListener('click', () => this.updateTournamentSize(false, BUTTON_NAV.PREV));
		tournamentForwardBtn.addEventListener('click', () => this.updateTournamentSize(false, BUTTON_NAV.NEXT));
		
		// Online tournament size controls
		const tournamentOnlineBackBtn = requireElementById<HTMLButtonElement>(EL.BUTTONS.TOURNAMENT_ONLINE_NUMBER_BACK);
		const tournamentOnlineForwardBtn = requireElementById<HTMLButtonElement>(EL.BUTTONS.TOURNAMENT_ONLINE_NUMBER_FORWARD);
		
		tournamentOnlineBackBtn.addEventListener('click', () => this.updateTournamentSize(true, BUTTON_NAV.PREV));
		tournamentOnlineForwardBtn.addEventListener('click', () => this.updateTournamentSize(true, BUTTON_NAV.NEXT));
	}

	private setupPlayerSetupListeners(): void {
		const setupBackBtn = requireElementById<HTMLButtonElement>(EL.BUTTONS.SETUP_BACK);
		const startGameBtn = requireElementById<HTMLButtonElement>(EL.BUTTONS.START_GAME);
		const addCpuBtn = requireElementById<HTMLButtonElement>(EL.PLAYER_COLLECTION.ADD_CPU);

		setupBackBtn.addEventListener('click', () => this.handleSetupBackClick());
		startGameBtn.addEventListener('click', () => this.startGame());
		addCpuBtn.addEventListener('click', () => this.handleAddCpuClick());
	}

	private setupDashboardListener(): void {
		const dashboardBtn = requireElementById<HTMLButtonElement>(EL.BUTTONS.DASHBOARD);
		const dashboardBackBtn = requireElementById<HTMLButtonElement>(EL.BUTTONS.DASHBOARD_BACK);
		
		dashboardBtn.addEventListener('click', () => this.handleDashboardClick());
		dashboardBackBtn.addEventListener('click', () => this.navigateTo(AppState.MAIN_MENU));
	}

	private setupSettingListener(): void {
		const settingsBtn = requireElementById<HTMLButtonElement>(EL.BUTTONS.SETTINGS);
		settingsBtn?.addEventListener('click', () => {
			this.navigateTo(AppState.SETTINGS);
		});

		const backBtn = requireElementById<HTMLButtonElement>(EL.BUTTONS.SETTING_BACK);
		backBtn.addEventListener('click', () => {
			this.navigateTo(AppState.MAIN_MENU);
		});

		const sceneSelect = document.getElementById('map-selector') as HTMLSelectElement;
		if (sceneSelect) {
			sceneSelect.value = currentSettings.scene3D;

			sceneSelect.addEventListener('change', async (event) => {
				const target = event.target as HTMLSelectElement;
				if (target)
					currentSettings.scene3D = target.value;
				await authManager.saveUserSettings({ scene3D: target.value });
			});
		}

		const musicToggle = document.getElementById('music-toggle') as HTMLInputElement;
		if (musicToggle) {
			musicToggle.checked = currentSettings.musicEnabled;

			musicToggle.addEventListener('change', async (event) => {
				const target = event.target as HTMLInputElement;
				currentSettings.musicEnabled = target.checked;
				await authManager.saveUserSettings({ musicEnabled: target.checked });
			});
		}

		const effectsToggle = document.getElementById('sound-effect-toggle') as HTMLInputElement;
		if (effectsToggle) {
			effectsToggle.checked = currentSettings.soundEffectsEnabled;

			effectsToggle.addEventListener('change', async (event) => {
				const target = event.target as HTMLInputElement;
				currentSettings.soundEffectsEnabled = target.checked;
				await authManager.saveUserSettings({ soundEffectsEnabled: target.checked });
			});
		}

		updateLanguageDisplay();
		const languageSelect = document.getElementById('language_select') as HTMLSelectElement;
		if (languageSelect) {
			languageSelect.value = ['UK', 'IT', 'FR', 'BR', 'RU'][currentSettings.language];
			languageSelect.addEventListener('change', async (event) => {
				const target = event.target as HTMLSelectElement;
				const languageMapping = ['UK', 'IT', 'FR', 'BR', 'RU'];
				const newLangIndex = languageMapping.indexOf(target.value);
				if (newLangIndex !== -1) {
					currentSettings.language = newLangIndex;
					updateLanguageDisplay();
					await authManager.saveUserSettings({ language: newLangIndex });
				}
			});
		}

		updateCurrentSettings(currentSettings);
	}

	private setupInstructionsListener(): void {
		const instructionsBtn = requireElementById<HTMLButtonElement>(EL.BUTTONS.INSTRUCTIONS);
		const instructionsBackBtn = requireElementById<HTMLButtonElement>(EL.BUTTONS.INSTRUCTIONS_BACK);

		instructionsBtn.addEventListener('click', () => {
			appManager.navigateTo(AppState.INSTRUCTIONS);
		});

		instructionsBackBtn.addEventListener('click', () => {
			appManager.navigateTo(AppState.MAIN_MENU);
		});
	}

	private selectViewMode(mode: ViewMode): void {
		currentSettings.viewMode = mode;
		uiManager.updateViewModeButtonStyles(mode);
	}

	private async handleGameModeClick(gameMode: GameMode, config: any): Promise<void> {
		if (config.availableOfflineOnly && authManager.isUserAuthenticated()) {
			alert('This mode is not available for logged-in users.');
			return;
		}

		if (config.requiresAuth && !authManager.isUserAuthenticated()) {
			const t = getCurrentTranslation();
			alert(t.loginRequired);
			return;
		}

		currentSettings.gameMode = gameMode;
		await this.startGame();
	}

	private handleModeBackClick(): void {
		this.isCollectingPlayerNames = false;
		currentSettings.gameMode = null;
		this.navigateTo(AppState.MAIN_MENU);
	}

	private handleSetupBackClick(): void {
		this.isCollectingPlayerNames = false;
		currentSettings.gameMode = null;
		this.navigateTo(AppState.GAME_MODE);
	}

	private handleAddCpuClick(): void {
		if (!this.isCollectingPlayerNames || currentSettings.gameMode !== GameMode.TOURNAMENT_LOCAL)
			return;

		const minPlayers = MIN_PLAYERS_FOR_CPU[currentSettings.offlineTournamentSize];
		if (this.playerNames.length < minPlayers) {
			alert(`Need at least ${minPlayers} players to add CPU.`);
			return;
		}

		this.finishPlayerCollection();
	}

	private async handleDashboardClick(): Promise<void> {
		await dashboardManager.loadUserDashboard();
		this.navigateTo(AppState.STATS_DASHBOARD);
	}

	private updateAIDifficulty(direction: BUTTON_NAV): void {
		const len = Object.keys(AiDifficulty).length / 2;
		if (direction === BUTTON_NAV.NEXT)
			currentSettings.AiDifficulty = (currentSettings.AiDifficulty + 1) % len;
		else
			currentSettings.AiDifficulty = (currentSettings.AiDifficulty - 1 + len) % len;

		uiManager.updateAIDifficultyDisplay(currentSettings.AiDifficulty);
	}

	private updateTournamentSize(isOnline: boolean, direction: BUTTON_NAV): void {
		const currentIndex = isOnline ? currentSettings.onlineTournamentSize : currentSettings.offlineTournamentSize;
		const currentSizeIndex = TOURNAMENT_SIZES.indexOf(currentIndex as 4 | 8 | 16);
		
		let newSizeIndex: number;
		if (direction === BUTTON_NAV.NEXT)
			newSizeIndex = (currentSizeIndex + 1) % TOURNAMENT_SIZES.length;
		else if (direction == BUTTON_NAV.PREV)
			newSizeIndex = (currentSizeIndex - 1 + TOURNAMENT_SIZES.length) % TOURNAMENT_SIZES.length;
		else
			newSizeIndex = currentSizeIndex;
		
		const newSize = TOURNAMENT_SIZES[newSizeIndex];
		
		if (isOnline) {
			currentSettings.onlineTournamentSize = newSize;
			uiManager.updateOnlineTournamentSizeDisplay(currentSettings.onlineTournamentSize);
		} else {
			currentSettings.offlineTournamentSize = newSize;
			uiManager.updateTournamentSizeDisplay(currentSettings.offlineTournamentSize);
		}
	}

	navigateTo(state: AppState, addToHistory: boolean = true): void {
		if (addToHistory)
			history.pushState({ screen: state }, '', window.location.href);
		this.currentAppState = state;

		switch (state) {
			case AppState.MAIN_MENU:
				uiManager.showScreen(EL.SCREENS.MAIN_MENU);
				authManager.checkAuthState();
				this.currentGame = null;
				break;
			case AppState.LOGIN:
				uiManager.showScreen(EL.SCREENS.MAIN_MENU, { modal: EL.SCREENS.LOGIN_MODAL });
				break;
			case AppState.REGISTER:
				uiManager.showScreen(EL.SCREENS.MAIN_MENU, { modal: EL.SCREENS.REGISTER_MODAL });
				break;
			case AppState.INSTRUCTIONS:
				uiManager.showScreen(EL.SCREENS.MAIN_MENU, { modal: EL.SCREENS.INSTRUCTIONS_MODAL });
				break;
			case AppState.GAME_MODE:
				uiManager.showScreen(EL.SCREENS.GAME_MODE_OVERLAY);
				break;
			case AppState.PLAYER_SETUP:
				uiManager.showScreen(EL.SCREENS.PLAYER_SETUP_OVERLAY);
				break;
			case AppState.GAME_3D:
				uiManager.showScreen(EL.SCREENS.GAME_3D, { hideUserInfo: true });
				break;
			case AppState.STATS_DASHBOARD:
				uiManager.showScreen(EL.SCREENS.STATS_DASHBOARD);
				break;
			case AppState.SETTINGS:
				uiManager.showScreen(EL.SCREENS.SETTINGS_MENU);
				if (authManager.isUserAuthenticated()) {
					authManager.getUserSettings();
				}
				break;
			default:
				Logger.error(`Unknown state: ${state}, redirecting to main menu`, 'AppManager');
				this.navigateTo(AppState.MAIN_MENU);
				break;
		}
	}

	private async startGame(): Promise<void> {
		if (!currentSettings.gameMode) return;

		const config = GAME_MODE_CONFIG[currentSettings.gameMode];
		const isAuthenticated = authManager.isUserAuthenticated();

		if (config.requiresSetup && !isAuthenticated) {
			if (!this.isCollectingPlayerNames) {
				this.beginPlayerCollection(currentSettings.gameMode);
				this.navigateTo(AppState.PLAYER_SETUP);
			} else {
				this.handlePlayerInputSubmission();
			}
		} else {
			await this.launchGame();
		}
	}

	private handlePlayerInputSubmission(): void {
		const input = requireElementById<HTMLInputElement>(EL.PLAYER_COLLECTION.INPUT);
		const name = (input?.value ?? '').trim();
		const t = getCurrentTranslation();
		
		if (!name) {
			input?.focus();
			return;
		}

		if (this.playerNames.includes(name)) {
			alert(t.usernameNotValid);
			if (input) {
				input.value = '';
				input.focus();
			}
			return;
		}

		this.playerNames.push(name);
		this.playerIndex++;

		if (this.playerIndex >= this.maxPlayersNeeded) {
			this.finishPlayerCollection();
			return;
		}

		this.updatePlayerCollectionUI();
	}

	private getMaxPlayers(gameMode: GameMode, tournamentSize?: number): number {
	switch (gameMode) {
		case GameMode.TWO_PLAYER_LOCAL: return 2;
		case GameMode.TOURNAMENT_LOCAL: return tournamentSize ?? 4;
		default: return 1;
	}
}

	private beginPlayerCollection(gameMode: GameMode): void {
		this.isCollectingPlayerNames = true;
		this.playerIndex = 0;
		this.playerNames = [];
		
		const tournamentSize = gameMode === GameMode.TOURNAMENT_LOCAL
			? currentSettings.offlineTournamentSize : currentSettings.onlineTournamentSize;
		this.maxPlayersNeeded = this.getMaxPlayers(gameMode, tournamentSize);
		
		this.updatePlayerCollectionUI();
	}

	private updatePlayerCollectionUI(): void {
		const currentPlayer = this.playerIndex + 1;
		const isLastPlayer = currentPlayer >= this.maxPlayersNeeded;
		const t = getCurrentTranslation();

		const label = requireElementById<HTMLLabelElement>(EL.PLAYER_COLLECTION.LABEL);
		const input = requireElementById<HTMLInputElement>(EL.PLAYER_COLLECTION.INPUT);
		const nextButton = requireElementById<HTMLButtonElement>(EL.BUTTONS.START_GAME);
		const addCpuButton = requireElementById<HTMLButtonElement>(EL.PLAYER_COLLECTION.ADD_CPU);

		label.textContent = `${t.playerName} ${currentPlayer}`;
		nextButton.textContent = isLastPlayer ? t.startGame : t.next;

		if (currentSettings.gameMode === GameMode.TOURNAMENT_LOCAL) {
			const canAddCpu = this.playerNames.length >= MIN_PLAYERS_FOR_CPU[currentSettings.offlineTournamentSize];
			addCpuButton.style.display = 'block';
			addCpuButton.style.opacity = canAddCpu ? '1' : '0.5';
			addCpuButton.disabled = !canAddCpu;
		} else {
			addCpuButton.style.display = 'none';
		}

		input.value = '';
		input.focus();

		input.onkeydown = (e: KeyboardEvent) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				this.handlePlayerInputSubmission();
			}
		};
	}

	private async finishPlayerCollection(): Promise<void> {
		GameInitializer.setPlayers(this.playerNames);
		this.isCollectingPlayerNames = false;
		await this.launchGame();
	}

	private async launchGame(): Promise<void> {
		if (!currentSettings.gameMode) return;

		try {
			this.clearCanvas();
			this.navigateTo(AppState.GAME_3D, false);

			let capacity: number | undefined = undefined;
			if (currentSettings.gameMode === GameMode.TOURNAMENT_REMOTE)
				capacity = currentSettings.onlineTournamentSize;
			else if (currentSettings.gameMode === GameMode.TOURNAMENT_LOCAL)
				capacity = currentSettings.offlineTournamentSize;

			const config = GameInitializer.createWithAuthCheck(currentSettings);

			this.currentGame = new Game(config);
			await this.currentGame.create(currentSettings.AiDifficulty, capacity);
		} catch (error) {
			this.currentGame = null;
			Logger.error('Error starting game', 'AppManager', error);
			this.navigateTo(AppState.MAIN_MENU);
		}
	}

	getCurrentGame(): Game | null {
		return this.currentGame;
	}

	private clearCanvas(): void {
		const el = document.getElementById(EL.GAME.CANVAS_3D);
		if (!(el instanceof HTMLCanvasElement)) return;
		const canvas = el;

		const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
		if (gl) {
			gl.clearColor(0, 0, 0, 1);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		}
	}
}

export const appManager = new AppManager;