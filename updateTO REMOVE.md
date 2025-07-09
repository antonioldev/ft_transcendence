

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

# in FRONTEND/SRC/GAME/NETWORKGAMEMANAGER.ts
# joining game send also list of players
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