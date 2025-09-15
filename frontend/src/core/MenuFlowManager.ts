import { Logger } from '../utils/LogManager.js';
import { GameMode, ViewMode, AppState, AiDifficulty } from '../shared/constants.js';
import { uiManager } from '../ui/UIManager.js';
import { authManager } from './AuthManager.js';
import { getCurrentTranslation } from '../translations/translations.js';
import { dashboardManager } from './DashboardManager.js';
import { webSocketClient } from './WebSocketClient.js';
import { appStateManager } from './AppStateManager.js';
import { EL, requireElementById} from '../ui/elements.js';
import { GameConfigFactory } from '../engine/GameConfig.js';

/**
 * Manages the selection and initialization of game modes and view modes for the application.
 * 
 * Implements the singleton pattern to ensure a single instance throughout the app.
 * Handles UI state, event listeners, and game starting logic.
 */
export class MenuFlowManager {
	private static instance: MenuFlowManager;
	private selectedViewMode: ViewMode = ViewMode.MODE_2D;
	private selectedGameMode: GameMode | null = null;
	private currentViewModeIndex = 0;
	private currentAiDifficultyIndex: AiDifficulty = AiDifficulty.EASY;
	private currentTournamentIndex: number = 4;
	private currentOnlineTournamentIndex: number = 4;
	
	// Unified player collection system
	private isCollectingPlayerNames = false;
	private playerIndex: number = 0;
	private playerNames: string[] = [];
	private maxPlayersNeeded: number = 0;

	static getInstance(): MenuFlowManager {
		if (!MenuFlowManager.instance)
			MenuFlowManager.instance = new MenuFlowManager();
		return MenuFlowManager.instance;
	}

	static initialize(): void {
		const menuFlowManager = MenuFlowManager.getInstance();
		menuFlowManager.setupEventListeners();
	}

	// ========================================
	// EVENT LISTENERS SETUP
	// ========================================

	private setupEventListeners(): void {
		// View mode navigation controls
		const viewModeBack = requireElementById(EL.BUTTONS.VIEW_MODE_BACK);
		const viewModeForward = requireElementById(EL.BUTTONS.VIEW_MODE_FORWARD);
		const backBtn = requireElementById(EL.BUTTONS.DASHBOARD_BACK);
		const soloDifficultyBack = requireElementById(EL.BUTTONS.SOLO_DIFFICULTY_BACK);
		const soloDifficultyForward = requireElementById(EL.BUTTONS.SOLO_DIFFICULTY_FORWARD);
		const tournamentNumberBack = requireElementById(EL.BUTTONS.TOURNAMENT_NUMBER_BACK);
		const tournamentNumberForward = requireElementById(EL.BUTTONS.TOURNAMENT_NUMBER_FORWARD);
		const tournamentOnlineNumberBack = requireElementById(EL.BUTTONS.TOURNAMENT_ONLINE_NUMBER_BACK);
		const tournamentOnlineNumberForward = requireElementById(EL.BUTTONS.TOURNAMENT_ONLINE_NUMBER_FORWARD);

		viewModeBack.addEventListener('click', () => this.previousViewMode());
		viewModeForward.addEventListener('click', () => this.nextViewMode());
		backBtn.addEventListener('click', () => { appStateManager.navigateTo(AppState.MAIN_MENU);});
		soloDifficultyBack.addEventListener('click', () => this.previousAIDifficulty());
		soloDifficultyForward.addEventListener('click', () => this.nextAIDifficulty());
		tournamentNumberBack.addEventListener('click', () => this.previousTournamentSize());
		tournamentNumberForward.addEventListener('click', () => this.nextTournamentSize());
		tournamentOnlineNumberBack.addEventListener('click', () => this.previousOnlineTournamentSize());
		tournamentOnlineNumberForward.addEventListener('click', () => this.nextOnlineTournamentSize());

		uiManager.updateAIDifficultyDisplay(this.currentAiDifficultyIndex);

		// Game mode selection buttons
		this.setupGameModeButtons();
		this.setupPlayerSetupListeners();
		this.showDashboard();
	}

	private setupGameModeButtons(): void {
		this.setupGameModeHandler(GameMode.SINGLE_PLAYER, {
			requiresAuth: false,
			requiresSetup: true,
			availableOfflineOnly: false
		});

		this.setupGameModeHandler(GameMode.TWO_PLAYER_LOCAL, {
			requiresAuth: false,
			requiresSetup: true,
			availableOfflineOnly: true,
			errorMessage: 'Local mode not available for logged-in users'
		});
		
		this.setupGameModeHandler(GameMode.TWO_PLAYER_REMOTE, {
			requiresAuth: true,
			requiresSetup: false,
			availableOfflineOnly: false
		});
		
		this.setupGameModeHandler(GameMode.TOURNAMENT_LOCAL, {
			requiresAuth: false,
			requiresSetup: true,
			availableOfflineOnly: true,
			errorMessage: 'Local tournament not available for logged-in users'
		});
		
		this.setupGameModeHandler(GameMode.TOURNAMENT_REMOTE, {
			requiresAuth: true,
			requiresSetup: false,
			availableOfflineOnly: false
		});

		const backButton = requireElementById(EL.BUTTONS.MODE_BACK);
		backButton.addEventListener('click', () => this.handleModeBackButton());
	}
	
	private handleModeBackButton(): void {
		this.selectedGameMode = null;
		appStateManager.navigateTo(AppState.MAIN_MENU);
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
		const button = requireElementById(gameMode);

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

			this.selectedGameMode = gameMode;

			if (config.requiresSetup && !authManager.isUserAuthenticated()) {
				// Start player collection for offline modes
				this.beginPlayerCollection(gameMode);
				appStateManager.navigateTo(AppState.PLAYER_SETUP);
				uiManager.showSetupForm(EL.PLAYER_COLLECTION.FORM);
			} else {
				// For authenticated users or modes that don't require setup
				let capacity: number | undefined = undefined;
				
				if (gameMode === GameMode.TOURNAMENT_REMOTE)
					capacity = this.currentOnlineTournamentIndex;
				
				await appStateManager.startGameWithMode(
					this.selectedViewMode, 
					this.selectedGameMode, 
					this.currentAiDifficultyIndex,
					capacity
				);
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

	private updatePlayerCollectionUI(): void {
		const currentPlayer = this.playerIndex + 1;
		const isLastPlayer = currentPlayer >= this.maxPlayersNeeded;
		const t = getCurrentTranslation();
		const label = document.getElementById(EL.PLAYER_COLLECTION.LABEL) as HTMLLabelElement;
		const input = document.getElementById(EL.PLAYER_COLLECTION.INPUT) as HTMLInputElement;
		const nextButton = document.getElementById(EL.BUTTONS.START_GAME) as HTMLButtonElement;
		const addCpuButton = document.getElementById(EL.PLAYER_COLLECTION.ADD_CPU) as HTMLButtonElement;

		if (label) label.textContent = `${t.playerName} ${currentPlayer}`;
		if (nextButton) nextButton.textContent = isLastPlayer ? t.startGame : t.next;

		// Show/hide Add CPU for tournaments only
		if (this.selectedGameMode === GameMode.TOURNAMENT_LOCAL) {
			const canAddCpu = this.playerNames.length >= this.getMinPlayersForCpu();
			if (addCpuButton) {
				addCpuButton.style.display = 'block';
				addCpuButton.disabled = !canAddCpu;
			}
		} else {
			if (addCpuButton) addCpuButton.style.display = 'none';
		}

		// Focus input
		if (input) {
			input.value = '';
			input.focus();
			input.onkeydown = (e: KeyboardEvent) => {
				if (e.key === 'Enter') {
					e.preventDefault();
					this.handlePlayerNext();
				}
			};
		}
	}

	private getMinPlayersForCpu(): number {
		if (this.selectedGameMode !== GameMode.TOURNAMENT_LOCAL) return 0;
		
		switch (this.currentTournamentIndex) {
			case 4: return 3;
			case 8: return 5;
			case 16: return 9;
			default: return Math.floor(this.currentTournamentIndex / 2) + 1;
		}
	}

	private handlePlayerNext(): void {
		const input = document.getElementById(EL.PLAYER_COLLECTION.INPUT) as HTMLInputElement;
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

	private handleAddCpu(): void {
		if (this.selectedGameMode !== GameMode.TOURNAMENT_LOCAL) return;
		
		const minPlayers = this.getMinPlayersForCpu();
		if (this.playerNames.length < minPlayers) {
			alert(`Need at least ${minPlayers} players to add CPU.`);
			return;
		}
		
		// Fill remaining slots with CPU players
		while (this.playerNames.length < this.maxPlayersNeeded) {
			this.playerNames.push(`CPU ${this.playerNames.length + 1}`);
		}
		
		this.finishPlayerCollection();
	}

	private async finishPlayerCollection(): Promise<void> {
		GameConfigFactory.setPlayers(this.playerNames);

		this.isCollectingPlayerNames = false;

		let capacity: number | undefined = undefined;
		if (this.selectedGameMode === GameMode.TOURNAMENT_LOCAL) {
			capacity = this.currentTournamentIndex;
		}

		await appStateManager.startGameWithMode(
			this.selectedViewMode,
			this.selectedGameMode!,
			this.currentAiDifficultyIndex,
			capacity
		);
	}

	private handlePlayerBack(): void {
		this.isCollectingPlayerNames = false;
		this.playerIndex = 0;
		this.playerNames = [];
		this.selectedGameMode = null;
		appStateManager.navigateTo(AppState.GAME_MODE);
	}

	// ========================================
	// PLAYER SETUP MANAGEMENT
	// ========================================

	private setupPlayerSetupListeners(): void {
		const setupBack = requireElementById(EL.BUTTONS.SETUP_BACK);
		const startGame = requireElementById(EL.BUTTONS.START_GAME);
		const addCpu = document.getElementById(EL.PLAYER_COLLECTION.ADD_CPU);

		setupBack.addEventListener('click', () => {
			if (this.isCollectingPlayerNames) {
				this.handlePlayerBack();
			} else {
				this.selectedGameMode = null;
				appStateManager.navigateTo(AppState.GAME_MODE);
			}
		});

		startGame.addEventListener('click', async () => {
			if (this.selectedGameMode === null) return;

			if (this.isCollectingPlayerNames) {
				this.handlePlayerNext();
				return;
			}

			if (!GameConfigFactory.validatePlayerSetup(this.selectedGameMode)) {
				const t = getCurrentTranslation();
				alert(t.pleaseFilllAllFields);
				return;
			}

			let capacity: number | undefined = undefined;
			if (this.selectedGameMode === GameMode.TOURNAMENT_REMOTE) {
				capacity = this.currentOnlineTournamentIndex;
			}

			await appStateManager.startGameWithMode(
				this.selectedViewMode, 
				this.selectedGameMode, 
				this.currentAiDifficultyIndex,
				capacity
			);
		});

		if (addCpu) {
			addCpu.addEventListener('click', () => {
				if (this.isCollectingPlayerNames && this.selectedGameMode === GameMode.TOURNAMENT_LOCAL) {
					this.handleAddCpu();
				}
			});
		}
	}

	private showDashboard(): void {
		Logger.debug('Dashboard button element', 'MenuFlowManager', EL.BUTTONS.DASHBOARD);
		const dashboardBtn = requireElementById(EL.BUTTONS.DASHBOARD);
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

	private previousAIDifficulty(): void {
		this.currentAiDifficultyIndex = (this.currentAiDifficultyIndex - 1 + 4) % 4;
		uiManager.updateAIDifficultyDisplay(this.currentAiDifficultyIndex);
	}

	private nextAIDifficulty(): void {
		this.currentAiDifficultyIndex = (this.currentAiDifficultyIndex + 1) % 4;
		uiManager.updateAIDifficultyDisplay(this.currentAiDifficultyIndex);
	}

	// ========================================
	// TOURNAMENT SIZE MANAGEMENT
	// ========================================

	private previousTournamentSize(): void {
		this.currentTournamentIndex = this.currentTournamentIndex === 4 ? 16 : this.currentTournamentIndex === 8 ? 4 : 8;
		uiManager.updateTournamentSizeDisplay(this.currentTournamentIndex);
	}

	private nextTournamentSize(): void {
		this.currentTournamentIndex = this.currentTournamentIndex === 4 ? 8 : this.currentTournamentIndex === 8 ? 16 : 4;
		uiManager.updateTournamentSizeDisplay(this.currentTournamentIndex);
	}

	private previousOnlineTournamentSize(): void {
		this.currentOnlineTournamentIndex = this.currentOnlineTournamentIndex === 4 ? 16 : this.currentOnlineTournamentIndex === 8 ? 4 : 8;
		uiManager.updateOnlineTournamentSizeDisplay(this.currentOnlineTournamentIndex);
	}

	private nextOnlineTournamentSize(): void {
		this.currentOnlineTournamentIndex = this.currentOnlineTournamentIndex === 4 ? 8 : this.currentOnlineTournamentIndex === 8 ? 16 : 4;
		uiManager.updateOnlineTournamentSizeDisplay(this.currentOnlineTournamentIndex);
	}

	// ========================================
	// VIEW MODE MANAGEMENT
	// ========================================

	private getViewModes() {
		const t = getCurrentTranslation();
		return [
			{ mode: ViewMode.MODE_2D, name: t.classicMode },
			{ mode: ViewMode.MODE_3D, name: t.immersiveMode }
		];
	}

	private previousViewMode(): void {
		const viewModes = this.getViewModes();
		this.currentViewModeIndex = (this.currentViewModeIndex - 1 + 2) % viewModes.length;
		this.selectedViewMode = viewModes[this.currentViewModeIndex].mode;
		uiManager.updateViewModeDisplay(viewModes[this.currentViewModeIndex].name);
	}

	private nextViewMode(): void {
		const viewModes = this.getViewModes();
		this.currentViewModeIndex = (this.currentViewModeIndex + 1) % viewModes.length;
		this.selectedViewMode = viewModes[this.currentViewModeIndex].mode;
		uiManager.updateViewModeDisplay(viewModes[this.currentViewModeIndex].name);
	}
}

export const menuFlowManager = MenuFlowManager.getInstance();