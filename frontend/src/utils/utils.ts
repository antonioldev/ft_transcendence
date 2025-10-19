import { GameMode, MIN_PLAYERS_FOR_CPU } from '../shared/constants.js';

// Returns the maximum number of players for a game mode
export function getMaxPlayers(gameMode: GameMode, tournamentSize?: number): number {
	switch (gameMode) {
		case GameMode.TWO_PLAYER_LOCAL: return 2;
		case GameMode.TOURNAMENT_LOCAL: return tournamentSize ?? 4;
		default: return 1;
	}
}

// Returns minimum human players needed before CPU can fill remaining tournament slots
export function getMinPlayersForCpu(tournamentSize: number): number {
	return MIN_PLAYERS_FOR_CPU[tournamentSize];
}

// Returns minimum players required to start a game mode (for validation)
export function getMinPlayersRequired(gameMode: GameMode): number {
	switch (gameMode) {
		case GameMode.SINGLE_PLAYER:
			return 1;
		case GameMode.TWO_PLAYER_LOCAL:
		case GameMode.TOURNAMENT_LOCAL:
			return 2;
		default:
			return 1;
	}
}
