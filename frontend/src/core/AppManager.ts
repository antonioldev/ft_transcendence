import { Game } from '../engine/Game.js';
import { GameConfigFactory } from '../engine/GameConfig.js';
import { AiDifficulty, AppState, GAME_MODE_CONFIG, GameMode, GameState, TOURNAMENT_SIZES, ViewMode, BUTTON_NAV } from '../shared/constants.js';
import { getCurrentTranslation } from '../translations/translations.js';
import { EL, requireElementById } from '../ui/elements.js';
import { uiManager } from '../ui/UIManager.js';
import { Logger } from '../utils/LogManager.js';
import { getMaxPlayers, getMinPlayersForCpu } from '../utils/utils.js';
import { authManager } from './AuthManager.js';
import { dashboardManager } from './DashboardManager.js';
import { updateLanguageDisplay } from '../translations/translations.js';

export interface Setting {
	lang: number;
	viewMode: ViewMode;
	scene3D: string;
	gameMode: GameMode | null;
	AiDifficulty: AiDifficulty;
	musicEnabled: boolean;
	soundEffectsEnabled: boolean;

}

export let currentSettings: Setting = {
	lang: 0,
	viewMode: ViewMode.MODE_2D,
    scene3D: 'random',
	gameMode: null,
	AiDifficulty: AiDifficulty.EASY,
    musicEnabled: true,
    soundEffectsEnabled: true
};

export function updateCurrentSettings(newSettings: Partial<typeof currentSettings>): void {
    if (newSettings) {
        currentSettings = { ...currentSettings, ...newSettings };
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
	private selectedViewMode: ViewMode = ViewMode.MODE_2D;
	private selectedGameMode: GameMode | null = null;
	private currentAiDifficultyIndex: AiDifficulty = AiDifficulty.EASY;
	private currentOfflineTournamentSize: number = 4;
	private currentOnlineTournamentSize: number = 4;
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
		uiManager.updateViewModeButtonStyles(this.selectedViewMode);
		uiManager.updateAIDifficultyDisplay(this.currentAiDifficultyIndex);
		uiManager.updateTournamentSizeDisplay(this.currentOfflineTournamentSize);
		uiManager.updateOnlineTournamentSizeDisplay(this.currentOnlineTournamentSize);

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
		this.setupSettingListner();
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

	private setupSettingListner(): void {
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

			sceneSelect.addEventListener('change', (event) => {
				const target = event.target as HTMLSelectElement;
				if (target)
					currentSettings.scene3D = target.value;
			});
		}

		const musicToggle = document.getElementById('music-toggle') as HTMLInputElement;
		if (musicToggle) {
			musicToggle.checked = currentSettings.musicEnabled;

			musicToggle.addEventListener('change', (event) => {
				const target = event.target as HTMLInputElement;
				currentSettings.musicEnabled = target.checked;
			});
		}

		const effectsToggle = document.getElementById('sound-effect-toggle') as HTMLInputElement;
		if (effectsToggle) {
			effectsToggle.checked = currentSettings.soundEffectsEnabled;

			effectsToggle.addEventListener('change', (event) => {
				const target = event.target as HTMLInputElement;
				currentSettings.soundEffectsEnabled = target.checked;
			});
		}

		updateLanguageDisplay();
		const languageSelect = document.getElementById('language_select') as HTMLSelectElement;
		if (languageSelect) {
			languageSelect.addEventListener('change', (event) => {
				const target = event.target as HTMLSelectElement;
				const languageMapping = ['UK', 'IT', 'FR', 'BR', 'RU'];
				const newLangIndex = languageMapping.indexOf(target.value);
				if (newLangIndex !== -1) {
					currentSettings.lang = newLangIndex;
					updateLanguageDisplay();
				}
			});
		}
	}

	private selectViewMode(mode: ViewMode): void {
		this.selectedViewMode = mode;
		currentSettings.viewMode = mode;
		uiManager.updateViewModeButtonStyles(this.selectedViewMode);
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

		this.selectedGameMode = gameMode;
		await this.startGame();
	}

	private handleModeBackClick(): void {
		this.isCollectingPlayerNames = false;
		this.selectedGameMode = null;
		this.navigateTo(AppState.MAIN_MENU);
	}

	private handleSetupBackClick(): void {
		this.isCollectingPlayerNames = false;
		this.selectedGameMode = null;
		this.navigateTo(AppState.GAME_MODE);
	}

	private handleAddCpuClick(): void {
		if (!this.isCollectingPlayerNames || this.selectedGameMode !== GameMode.TOURNAMENT_LOCAL) {
			return;
		}

		const minPlayers = getMinPlayersForCpu(this.currentOfflineTournamentSize);
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
			this.currentAiDifficultyIndex = (this.currentAiDifficultyIndex + 1) % len;
		else
			this.currentAiDifficultyIndex = (this.currentAiDifficultyIndex - 1 + len) % len;

		uiManager.updateAIDifficultyDisplay(this.currentAiDifficultyIndex);
	}

	private updateTournamentSize(isOnline: boolean, direction: BUTTON_NAV): void {
		const currentIndex = isOnline ? this.currentOnlineTournamentSize : this.currentOfflineTournamentSize;
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
			this.currentOnlineTournamentSize = newSize;
			uiManager.updateOnlineTournamentSizeDisplay(this.currentOnlineTournamentSize);
		} else {
			this.currentOfflineTournamentSize = newSize;
			uiManager.updateTournamentSizeDisplay(this.currentOfflineTournamentSize);
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
				break;
			default:
				Logger.error(`Unknown state: ${state}, redirecting to main menu`, 'AppManager');
				this.navigateTo(AppState.MAIN_MENU);
				break;
		}
	}

	private async startGame(): Promise<void> {
		if (!this.selectedGameMode) return;

		const config = GAME_MODE_CONFIG[this.selectedGameMode];
		const isAuthenticated = authManager.isUserAuthenticated();

		if (config.requiresSetup && !isAuthenticated) {
			if (!this.isCollectingPlayerNames) {
				this.beginPlayerCollection(this.selectedGameMode);
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
		
		if (!name) {
			input?.focus();
			return;
		}

		if (this.playerNames.includes(name)) {
			alert('Name already used. Choose different name.');
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

	private beginPlayerCollection(gameMode: GameMode): void {
		this.isCollectingPlayerNames = true;
		this.playerIndex = 0;
		this.playerNames = [];
		
		const tournamentSize = gameMode === GameMode.TOURNAMENT_LOCAL
			? this.currentOfflineTournamentSize : this.currentOnlineTournamentSize;
		this.maxPlayersNeeded = getMaxPlayers(gameMode, tournamentSize);
		
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

		if (this.selectedGameMode === GameMode.TOURNAMENT_LOCAL) {
			const canAddCpu = this.playerNames.length >= getMinPlayersForCpu(this.currentOfflineTournamentSize);
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
		GameConfigFactory.setPlayers(this.playerNames);
		this.isCollectingPlayerNames = false;
		await this.launchGame();
	}

	private async launchGame(): Promise<void> {
		if (!this.selectedGameMode) return;

		try {
			this.navigateTo(AppState.GAME_3D, false);

			let capacity: number | undefined = undefined;
			if (this.selectedGameMode === GameMode.TOURNAMENT_REMOTE)
				capacity = this.currentOnlineTournamentSize;
			else if (this.selectedGameMode === GameMode.TOURNAMENT_LOCAL)
				capacity = this.currentOfflineTournamentSize;

			const config = GameConfigFactory.createWithAuthCheck(currentSettings);

			this.currentGame = new Game(config);
			await this.currentGame.create(this.currentAiDifficultyIndex, capacity);
		} catch (error) {
			this.currentGame = null;
			Logger.error('Error starting game', 'AppManager', error);
			this.navigateTo(AppState.MAIN_MENU);
		}
	}
}

export const appManager = new AppManager;