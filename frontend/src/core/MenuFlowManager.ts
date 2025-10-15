import { GameConfigFactory } from '../engine/GameConfig.js';
import { AiDifficulty, AppState, GameMode, ViewMode } from '../shared/constants.js';
import { getCurrentTranslation } from '../translations/translations.js';
import { EL, requireElementById } from '../ui/elements.js';
import { uiManager } from '../ui/UIManager.js';
import { Logger } from '../utils/LogManager.js';
import { appStateManager } from './AppStateManager.js';
import { authManager } from './AuthManager.js';
import { dashboardManager } from './DashboardManager.js';
import { webSocketClient } from './WebSocketClient.js';
import { currentSettings } from './AppStateManager.js';
import { updateLanguageDisplay } from '../translations/translations.js';

/**
 * Manages the selection and initialization of game modes and view modes for the application.
 * 
 * Implements the singleton pattern to ensure a single instance throughout the app.
 * Handles UI state, event listeners, and game starting logic.
 */
export class MenuFlowManager {
	private static instance: MenuFlowManager;
	// private selectedViewMode: ViewMode = ViewMode.MODE_2D;
	// private selectedGameMode: GameMode | null = null;
	// private currentAiDifficultyIndex: AiDifficulty = AiDifficulty.EASY;
	private currentTournamentIndex: number = 4;
	private currentOnlineTournamentIndex: number = 4;
	private isCollectingPlayerNames = false;
	private playerIndex: number = 0;
	private playerNames: string[] = [];
	private maxPlayersNeeded: number = 0;

	private readonly gameModeConfigs = {
		[GameMode.SINGLE_PLAYER]: {
			requiresAuth: false,
			requiresSetup: true,
			availableOfflineOnly: false
		},
		[GameMode.TWO_PLAYER_LOCAL]: {
			requiresAuth: false,
			requiresSetup: true,
			availableOfflineOnly: true,
			errorMessage: 'Local mode not available for logged-in users'
		},
		[GameMode.TWO_PLAYER_REMOTE]: {
			requiresAuth: true,
			requiresSetup: false,
			availableOfflineOnly: false
		},
		[GameMode.TOURNAMENT_LOCAL]: {
			requiresAuth: false,
			requiresSetup: true,
			availableOfflineOnly: true,
			errorMessage: 'Local tournament not available for logged-in users'
		},
		[GameMode.TOURNAMENT_REMOTE]: {
			requiresAuth: true,
			requiresSetup: false,
			availableOfflineOnly: false
		}
	} as const;

	private readonly tournamentSizes = [4, 8, 16] as const;

	static getInstance(): MenuFlowManager {
		if (!MenuFlowManager.instance)
			MenuFlowManager.instance = new MenuFlowManager();
		return MenuFlowManager.instance;
	}

	static initialize(): void {
		// Ensure DOM is fully loaded before initializing
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', () => {
				const menuFlowManager = MenuFlowManager.getInstance();
				menuFlowManager.setupEventListeners();
				menuFlowManager.updateViewModeButtonStyles();
			});
		} else {
			// DOM is already loaded
			const menuFlowManager = MenuFlowManager.getInstance();
			menuFlowManager.setupEventListeners();
			menuFlowManager.updateViewModeButtonStyles();
		}
	}

	// ========================================
	// EVENT LISTENERS SETUP
	// ========================================

    private setupEventListeners(): void {
        try {
            // Setup navigation listeners (includes view mode, difficulty, and tournament navigation)
            this.setupNavigationListeners();
            
            // Game mode selection buttons
            this.setupGameModeButtons();
            this.setupPlayerSetupListeners();
            this.showDashboard();
            this.setupSettingsButton();
            
            // Initialize UI displays
            uiManager.updateAIDifficultyDisplay(currentSettings.AiDifficulty);
            uiManager.updateTournamentSizeDisplay(this.currentTournamentIndex);
			this.updateTournamentSize(false, 'reset');
			this.updateTournamentSize(true, 'reset');
			uiManager.updateOnlineTournamentSizeDisplay(this.currentOnlineTournamentIndex);
			
		} catch (error) {
			console.error(`Failed to setup event listeners: ${error}`, 'MenuFlowManager');
		}
	}

	private setupNavigationListeners(): void {
		try {
			const elements = {
				viewModeClassic: requireElementById<HTMLButtonElement>(EL.BUTTONS.VIEW_MODE_CLASSIC),
				viewModeImmersive: requireElementById<HTMLButtonElement>(EL.BUTTONS.VIEW_MODE_IMMERSIVE),
				backBtn: requireElementById<HTMLButtonElement>(EL.BUTTONS.DASHBOARD_BACK),
				settingsBackBtn: requireElementById<HTMLButtonElement>(EL.BUTTONS.SETTINGS_BACK),
				soloDifficultyBack: requireElementById<HTMLButtonElement>(EL.BUTTONS.SOLO_DIFFICULTY_BACK),
				soloDifficultyForward: requireElementById<HTMLButtonElement>(EL.BUTTONS.SOLO_DIFFICULTY_FORWARD),
				tournamentNumberBack: requireElementById<HTMLButtonElement>(EL.BUTTONS.TOURNAMENT_NUMBER_BACK),
				tournamentNumberForward: requireElementById<HTMLButtonElement>(EL.BUTTONS.TOURNAMENT_NUMBER_FORWARD),
				tournamentOnlineNumberBack: requireElementById<HTMLButtonElement>(EL.BUTTONS.TOURNAMENT_ONLINE_NUMBER_BACK),
				tournamentOnlineNumberForward: requireElementById<HTMLButtonElement>(EL.BUTTONS.TOURNAMENT_ONLINE_NUMBER_FORWARD)
			};
	
			// View mode navigation
			elements.viewModeClassic.addEventListener('click', () => {
				this.setViewMode(ViewMode.MODE_2D);
			});
			elements.viewModeImmersive.addEventListener('click', () => {
				this.setViewMode(ViewMode.MODE_3D);
			});
			
			// Dashboard back button
			elements.backBtn.addEventListener('click', () => { 
				appStateManager.navigateTo(AppState.MAIN_MENU);
			});
			
			// Settings back button
			elements.settingsBackBtn.addEventListener('click', () => { 
				appStateManager.navigateTo(AppState.MAIN_MENU);
			});
			
			// AI difficulty navigation
			elements.soloDifficultyBack.addEventListener('click', () => {
				this.updateAIDifficulty('previous');
			});
			elements.soloDifficultyForward.addEventListener('click', () => {
				this.updateAIDifficulty('next');
			});
			
			// Tournament size navigation
			elements.tournamentNumberBack.addEventListener('click', () => {
				this.updateTournamentSize(false, 'previous');
			});
			elements.tournamentNumberForward.addEventListener('click', () => {
				this.updateTournamentSize(false, 'next');
			});
			elements.tournamentOnlineNumberBack.addEventListener('click', () => {
				this.updateTournamentSize(true, 'previous');
			});
			elements.tournamentOnlineNumberForward.addEventListener('click', () => {
				this.updateTournamentSize(true, 'next');
			});
			
		} catch (error) {
			console.error(`Failed to setup navigation listeners: ${error}`, 'MenuFlowManager');
		}
	}

	private setupGameModeButtons(): void {
		Object.entries(this.gameModeConfigs).forEach(([gameMode, config]) => {
			this.setupGameModeHandler(gameMode as GameMode, config);
		});

		const backButton = requireElementById<HTMLButtonElement>(EL.BUTTONS.MODE_BACK);
		backButton.addEventListener('click', () => this.handleBack(AppState.MAIN_MENU));
	}
	
	private handleBack(target: AppState): void {
		this.isCollectingPlayerNames = false;
		// this.playerIndex = 0;
		// this.playerNames = [];
		currentSettings.gameMode = null;

		appStateManager.navigateTo(target);
	}

	// ========================================
	// SETTINGS BUTTON
	// ========================================
	
	private setupSettingsButton(): void {
		const settingsBtn = requireElementById<HTMLButtonElement>(EL.BUTTONS.SETTINGS);
		settingsBtn?.addEventListener('click', () => {
			appStateManager.navigateTo(AppState.SETTINGS);
		});

		this.setupLanguageSelector();
		this.setupSceneSelector();
		this.setupGameMusicEnable();
		this.setupGameEffectsEnabled();
	}

	private setupSceneSelector(): void {
		const sceneSelect = document.getElementById('map-selector') as HTMLSelectElement;
		if (sceneSelect) {
			sceneSelect.value = currentSettings.scene3D;

			sceneSelect.addEventListener('change', (event) => {
				const target = event.target as HTMLSelectElement;
				if (target)
					currentSettings.scene3D = target.value;
			});
		}
	}

	private setupGameMusicEnable(): void { 
		const musicToggle = document.getElementById('music-toggle') as HTMLInputElement;
		if (musicToggle) {
			musicToggle.checked = currentSettings.musicEnabled;

			musicToggle.addEventListener('change', (event) => {
				const target = event.target as HTMLInputElement;
				currentSettings.musicEnabled = target.checked;
			});
		}
	}

	private setupGameEffectsEnabled(): void {
		const effectsToggle = document.getElementById('sound-effect-toggle') as HTMLInputElement;
		if (effectsToggle) {
			effectsToggle.checked = currentSettings.musicEnabled;

			effectsToggle.addEventListener('change', (event) => {
				const target = event.target as HTMLInputElement;
				currentSettings.musicEnabled = target.checked;
			});
		}
	}

	private setupLanguageSelector(): void {
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

	// ========================================
	// GAME MODE HANDLERS
	// ========================================

	private setupGameModeHandler(gameMode: GameMode, config: {
		requiresAuth: boolean; 
		requiresSetup: boolean; 
		availableOfflineOnly: boolean; 
		errorMessage?: string;
	}) {
		const button = requireElementById<HTMLButtonElement>(gameMode);

		button.addEventListener('click', async () => {
			if (config.availableOfflineOnly && authManager.isUserAuthenticated()) {
				alert(config.errorMessage || 'This mode is not available for logged-in users.');
				return;
			}

			if (config.requiresAuth && !authManager.isUserAuthenticated()) {
				const t = getCurrentTranslation();
				alert(t.loginRequired);
				return;
			}

			currentSettings.gameMode = gameMode;

			if (config.requiresSetup && !authManager.isUserAuthenticated()) {
				this.beginPlayerCollection(gameMode);
				appStateManager.navigateTo(AppState.PLAYER_SETUP);
			} else {
				await this.startGameWithCurrentConfig();
			}
		});
	}

	private beginPlayerCollection(gameMode: GameMode): void {
		this.isCollectingPlayerNames = true;
		this.playerIndex = 0;
		this.playerNames = [];
		
		this.maxPlayersNeeded = this.getMaxPlayers(gameMode);
		
		this.updatePlayerCollectionUI();
	}

	private getMaxPlayers(gameMode: GameMode): number {
		switch (gameMode) {
			case GameMode.SINGLE_PLAYER: return 1;
			case GameMode.TWO_PLAYER_LOCAL: return 2;
			case GameMode.TOURNAMENT_LOCAL: return this.currentTournamentIndex;
			default: return 1;
		}
	}

	// ========================================
	// PLAYER COLLECTION MANAGEMENT
	// ========================================

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
			const canAddCpu = this.playerNames.length >= this.getMinPlayersForCpu();
			addCpuButton.style.display = 'block';
			addCpuButton.style.opacity = canAddCpu ? '1' : '0.5';
			addCpuButton.disabled = !canAddCpu;
		} else {
			addCpuButton.style.display = 'none';
		}

		input.value = '';
		input.focus();

		// Setup input handling for Enter key
		input.onkeydown = (e: KeyboardEvent) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				this.handlePlayerInputSubmission();
			}
		};
	}

	private handlePlayerInputSubmission(): void {
		const input = requireElementById<HTMLInputElement>(EL.PLAYER_COLLECTION.INPUT);
		const name = (input?.value ?? '').trim();
		
		if (!name) {
			input?.focus();
			return;
		}

		// Check duplicate
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

	private getMinPlayersForCpu(): number {
		if (currentSettings.gameMode !== GameMode.TOURNAMENT_LOCAL) return 0;
		
		switch (this.currentTournamentIndex) {
			case 4: return 3;
			case 8: return 5;
			case 16: return 9;
			default: return Math.floor(this.currentTournamentIndex / 2) + 1;
		}
	}

	private async finishPlayerCollection(): Promise<void> {
		GameConfigFactory.setPlayers(this.playerNames);
		this.isCollectingPlayerNames = false;
		await this.startGameWithCurrentConfig();
	}

	// ========================================
	// PLAYER SETUP MANAGEMENT
	// ========================================

	private setupPlayerSetupListeners(): void {
		const setupBack = requireElementById<HTMLButtonElement>(EL.BUTTONS.SETUP_BACK);
		const startGame = requireElementById<HTMLButtonElement>(EL.BUTTONS.START_GAME);
		const addCpu = requireElementById<HTMLInputElement>(EL.PLAYER_COLLECTION.ADD_CPU);

		setupBack.addEventListener('click', () => this.handleBack(AppState.GAME_MODE));
		startGame.addEventListener('click', () => this.handleStartGame());

		if (addCpu) {
			addCpu.addEventListener('click', () => {
				if (this.isCollectingPlayerNames && currentSettings.gameMode === GameMode.TOURNAMENT_LOCAL) {
		
					const minPlayers = this.getMinPlayersForCpu();
					if (this.playerNames.length < minPlayers) {
						alert(`Need at least ${minPlayers} players to add CPU.`);
						return;
					}
					this.finishPlayerCollection();
				}
			});
		}
	}

	private async handleStartGame(): Promise<void> {
		if (currentSettings.gameMode === null) return;

		if (this.isCollectingPlayerNames) {
			this.handlePlayerInputSubmission();
			return;
		}

		if (!GameConfigFactory.validatePlayerSetup(currentSettings.gameMode)) {
			const t = getCurrentTranslation();
			alert(t.pleaseFilllAllFields);
			return;
		}

		await this.startGameWithCurrentConfig();
	}

	// ========================================
	// GAME START CONFIGURATION
	// ========================================

	private getTournamentCapacity(): number | undefined {
		if (currentSettings.gameMode === GameMode.TOURNAMENT_REMOTE)
			return this.currentOnlineTournamentIndex;
		if (currentSettings.gameMode === GameMode.TOURNAMENT_LOCAL)
			return this.currentTournamentIndex;
		return undefined;
	}

	private async startGameWithCurrentConfig(): Promise<void> {
		await appStateManager.startGameWithMode(
			currentSettings,
			// this.selectedViewMode,
			// this.selectedGameMode!,
			// this.currentAiDifficultyIndex,
			this.getTournamentCapacity()
		);
	}

	// ========================================
	// DASHBOARD MANAGEMENT
	// ========================================

	private showDashboard(): void {
		Logger.debug('Dashboard button element', 'MenuFlowManager', EL.BUTTONS.DASHBOARD);
		const dashboardBtn = requireElementById<HTMLButtonElement>(EL.BUTTONS.DASHBOARD);
		Logger.debug('Attaching dashboard click handler', 'MenuFlowManager');
		dashboardBtn?.addEventListener('click', () => {
			Logger.debug('Dashboard clicked', 'MenuFlowManager');
			if (!authManager.isUserAuthenticated()) {
				Logger.warn('authManager is not authenticated, returning', 'MenuFlowManager');
				return;
			}
			const user = authManager.getCurrentUser();
			if (!user) {
				Logger.warn('user is null, returning', 'MenuFlowManager');
				return;
			}
			dashboardManager.clear();
			// Request new stats from backend
			Logger.debug('clearing the dashboard', 'MenuFlowManager');
			webSocketClient.requestUserStats(user.username);
			Logger.debug('request user data was called', 'MenuFlowManager');
			webSocketClient.requestUserGameHistory(user.username);
			Logger.debug('request user game history was called', 'MenuFlowManager');
			// Show dashboard panel
			Logger.info('Navigating to dashboard...', 'MenuFlowManager');
			appStateManager.navigateTo(AppState.STATS_DASHBOARD);
		});
	}

	// ========================================
	// AI DIFFICULTY MANAGEMENT
	// ========================================

	private updateAIDifficulty(direction: 'next' | 'previous'): void {
		const len = Object.keys(AiDifficulty).length / 2;
		if (direction === 'next')
			currentSettings.AiDifficulty = (currentSettings.AiDifficulty + 1) % len;
		else
			currentSettings.AiDifficulty = (currentSettings.AiDifficulty - 1 + len) % len;

		uiManager.updateAIDifficultyDisplay(currentSettings.AiDifficulty);
	}

	// ========================================
	// TOURNAMENT SIZE MANAGEMENT
	// ========================================

	private updateTournamentSize(isOnline: boolean, direction: 'next' | 'previous' | 'reset'): void {
		const currentIndex = isOnline ? this.currentOnlineTournamentIndex : this.currentTournamentIndex;
		const currentSizeIndex = this.tournamentSizes.indexOf(currentIndex as 4 | 8 | 16);
		
		let newSizeIndex: number;
		if (direction === 'next')
			newSizeIndex = (currentSizeIndex + 1) % this.tournamentSizes.length;
		else if (direction == 'previous')
			newSizeIndex = (currentSizeIndex - 1 + this.tournamentSizes.length) % this.tournamentSizes.length;
		else
			newSizeIndex = currentSizeIndex;
		
		const newSize = this.tournamentSizes[newSizeIndex];
		
		if (isOnline) {
			this.currentOnlineTournamentIndex = newSize;
			uiManager.updateOnlineTournamentSizeDisplay(this.currentOnlineTournamentIndex);
		} else {
			this.currentTournamentIndex = newSize;
			uiManager.updateTournamentSizeDisplay(this.currentTournamentIndex);
		}
	}

	// ========================================
	// VIEW MODE MANAGEMENT
	// ========================================
		private setViewMode(viewMode: ViewMode): void {
			currentSettings.viewMode = viewMode;
			this.updateViewModeButtonStyles();
		}

	private updateViewModeButtonStyles(): void {
		const classicBtn = requireElementById<HTMLButtonElement>(EL.BUTTONS.VIEW_MODE_CLASSIC);
		const immersiveBtn = requireElementById<HTMLButtonElement>(EL.BUTTONS.VIEW_MODE_IMMERSIVE);

		// Reset both buttons to inactive state
		classicBtn.className = "bg-transparent text-light-green font-poppins-semibold text-lg px-4 py-3 transition-colors duration-200 border border-light-green rounded-sm min-w-[120px]";
		immersiveBtn.className = "bg-transparent text-light-green font-poppins-semibold text-lg px-4 py-3 transition-colors duration-200 border border-light-green rounded-sm min-w-[120px]";
		
		// Set active button style
		if (currentSettings.viewMode === ViewMode.MODE_2D) {
			classicBtn.className = "bg-orange text-blue-background font-poppins-semibold text-lg px-4 py-3 transition-colors duration-200 border border-orange rounded-sm min-w-[120px]";
		} else {
			immersiveBtn.className = "bg-orange text-blue-background font-poppins-semibold text-lg px-4 py-3 transition-colors duration-200 border border-orange rounded-sm min-w-[120px]";
		}
	}
}
