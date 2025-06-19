export enum GameState{
    MENU = 'menu',
    PLAYING_2D = 'playing_2d',
    PLAYING_3D = 'playing_3d',
    PAUSED_2D = 'paused_2d',
    PAUSED_3D = 'paused_3d'
}

class GameStateManager{
    private currentState: GameState = GameState.MENU;
    private previousState: GameState = GameState.MENU;

    getCurrentState(): GameState {
        return this.currentState;
    }

    getPreviousState(): GameState {
        return this.previousState;
    }

    setState(newState: GameState): void {
        console.log(`Game state: ${this.currentState} -> ${newState}`);
        this.previousState = this.currentState;
        this.currentState = newState;
    }

    isInGame(): boolean {
        if (this.currentState === GameState.PLAYING_2D 
            || this.currentState === GameState.PLAYING_3D)
            return true;
        return false;
    }

    isPaused(): boolean {
        if (this.currentState === GameState.PAUSED_2D 
            || this.currentState === GameState.PAUSED_3D)
            return true;
        return false;
    }

    isInMenu(): boolean {
        if (this.currentState === GameState.MENU)
            return true;
        return false;
    }
}

export const gameStateManager = new GameStateManager();