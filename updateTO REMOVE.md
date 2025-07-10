

# in SHARED/TYPES.ts
# Added players in client message, it will used when starting the game to send who the players are

## Sending JOIN_GAME with players: [
##  {id: "Alice", name: "Alice"}, 
##  {id: "Bob", name: "Bob"}]
export interface ClientMessage {
    type: MessageType; // Type of message
    gameMode?: GameMode; // Game mode (optional)
    players?: PlayerInfo[];
    side?: number; // Player side (optional)
    direction?: Direction; // Movement direction (optional)
}

export interface PlayerInfo {
    id: string;        // Now: same as name, Future: real user ID from database
    name: string;      // Display name (can have duplicates)
}

# in FRONTEND/GAME/WEBSOCKETCLIENT.TS
# sending the message to the server including clients

joinGame(gameMode: GameMode, players: PlayerInfo[]): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const message: ClientMessage = {
                type: MessageType.JOIN_GAME,
                gameMode: gameMode,
                players: players
            };
            this.ws.send(JSON.stringify(message));
        }
    }

# in FRONTEND/SRC/GAME/NETWORKGAMEMANAGER.ts -> become GameSession.ts
# joining game send also list of players
# This class manages the actual game session - networking, game state, input handling, and game loop. "GameSession" better describes its role as the central game coordinator.
startSinglePlayer(): void {
        const players = this.getPlayerInfoFromUI(GameMode.SINGLE_PLAYER);
        if (this.webSocketClient.isConnected()) {
            this.webSocketClient.joinGame(GameMode.SINGLE_PLAYER, players);
            this.playerSide = 0;
            this.start();
        } else {
            this.webSocketClient.onConnection(() => {
                this.webSocketClient.joinGame(GameMode.SINGLE_PLAYER, players);
                this.start();
            });
        }
    }

# GameEngine.ts -> become GameController.ts
# it creates and manages the Babylon.js scene, cameras, lights, and rendering setup. "SceneManager" is more accurate than "Engine."

# GameEngine.ts -> become GameController.ts
# This is the main entry point that controls the overall game lifecycle. "Controller" better describes its coordinating role.