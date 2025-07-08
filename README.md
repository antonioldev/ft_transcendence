# ft_transcendence
This project is about creating a website for the mighty Pong contest!

## Notion Pages
https://www.notion.so/transcendence-20ed2fbe756e8096b213eaec9850f049
https://www.notion.so/ft_transcendence-20d8ccef5a8a80d88122e5a2d67d06f0

## How to create a WebSocket in Fastify
https://www.npmjs.com/package/@fastify/websocket


## Features

- **Dual Mode Gaming**: Classic 2D mode and immersive 3D split-screen mode
- **Multiple Game Modes**: 
  - Single Player (vs AI) 	----> TO IMPLENET
  - Local 2 Players
  - Online 2 Players 		----> TO IMPLENET
  - Tournaments				----> TO IMPLENET
- **Real-time Multiplayer**: WebSocket-based networking for responsive gameplay
- **Multi-language Support**: English, Italian, French, Portuguese
- **Responsive Design**: Optimized for different screen sizes ----> TO IMPLENET

## How to Play

### Controls

**2D Classic Mode:**
- Player 1: `W` (up) / `S` (down)
- Player 2: `↑` (up) / `↓` (down)

**3D Immersive Mode:**
- Player 1: `A` (left) / `D` (right)
- Player 2: `←` (left) / `→` (right)

### Game Controls
- `ESC`: Pause/Resume game
- `Y`: Confirm exit (when paused)
- `N`: Cancel exit (when paused)

### Language Selection
- Use `←` / `→` arrows in the main menu to cycle through languages

## Architecture

### Project Structure

```
ft_transcendence/
├── backend/                 # Node.js + Fastify backend
│   ├── src/
│   │   ├── core/           # Game logic (Ball, Paddle, Game classes)
│   │   ├── models/         # Data models (Client, GameManager)
│   │   ├── network/        # WebSocket handling
│   │   ├── shared/         # Shared types and constants
│   │   └── config/         # Configuration files
│   ├── Dockerfile
│   └── package.json
├── frontend/               # TypeScript + Babylon.js frontend
│   ├── src/
│   │   ├── core/          # Main application logic
│   │   ├── engine/        # Babylon.js engine and scene building
│   │   ├── game/          # Game managers (Input, Network, GUI)
│   │   ├── shared/        # Shared types and constants
│   │   ├── translations/  # Multi-language support
│   │   └── ui/            # UI management
│   ├── Dockerfile
│   └── package.json
├── shared/                # Shared files between frontend/backend that will be copied in backend and frontend during building to avoid duplication 
├── docker-compose.yml
├── Makefile
└── README.md
```

### Technology Stack

**Backend:**
- **Fastify**: Fast and efficient web framework
- **@fastify/websocket**: WebSocket support for real-time communication
- **TypeScript**: Type-safe development

**Frontend:**
- **Babylon.js**: 3D graphics engine for immersive mode
- **TypeScript**: Type-safe client-side development
- **Native WebSocket**: Real-time communication with backend

## Development

### Prerequisites

- Docker and Docker Compose
- Make (optional, for convenience commands)

### Setup and Run

1. **Clone the repository**
   git clone <repository-url>
   cd ft_transcendence

2. **Build and start the application**

   make run		 ----> I'm using docker-compose. need to check if it's ok

3. **Access the game**
   - Open your browser and navigate to: `http://localhost:8080`
   - The backend WebSocket server runs on: `ws://localhost:3000`

### Available Make Commands

# Build and run
make run                    # Build and start all services
make build                  # Build both frontend and backend
make build-frontend         # Build frontend only
make build-backend          # Build backend only

# Container management
make start                  # Start containers
make stop                   # Stop containers
make restart                # Restart containers
make ps                     # Show container status

# Logs
make logs                   # Show all logs
make logs-frontend          # Show frontend logs
make logs-backend           # Show backend logs

# Cleanup
make clean                  # Stop containers and remove orphans
make fclean                 # Remove containers, images, and volumes
make wipe-all              # Remove all Docker artifacts
make wipe-images           # Remove all Docker images

# Updates
make update-deps           # Update npm dependencies
make update                # Update deps and rebuild

### Environment Variables

Create a `.env` file in the root directory:	   -----> for this simple setup, it should work even without as we have default numbers

# Backend Configuration
BACKEND_HOST=0.0.0.0
BACKEND_PORT=3000
DEBUG=no

# Frontend Configuration  
FRONTEND_PORT=8080

### Game Logic Overview

#### Backend Core Components

**Ball Class** (`backend/src/core/Ball.ts`)
- Handles ball physics, movement, and collision detection
- Manages scoring and reset logic

**Paddle Classes** (`backend/src/core/Paddle.ts`)
- `Player`: Human-controlled paddle
- `AIBot`: AI-controlled paddle with prediction algorithm

**Game Classes** (`backend/src/core/game.ts`)
- `SinglePlayer`: Game mode with AI opponent
- `TwoPlayer`: Game mode for human vs human

**WebSocket Management** (`backend/src/network/WebSocketManager.ts`)
- Handles client connections and message routing
- Manages game sessions and player input

#### Frontend Core Components

**BabylonEngine** (`frontend/src/engine/BabylonEngine.ts`)
- Manages Babylon.js engine lifecycle
- Handles scene creation for 2D/3D modes

**Scene Builder** (`frontend/src/engine/sceneBuilder.ts`)
- Creates game objects (paddles, ball, field)
- Sets up cameras and lighting for both modes

**NetworkGameManager** (`frontend/src/game/NetworkGameManager.ts`)
- Manages WebSocket communication
- Updates game objects based on server state

**Input Manager** (`frontend/src/game/InputManager.ts`)
- Handles keyboard input
- Sends player actions to server

## Network Protocol

The game uses WebSocket communication with JSON message format:

### Client Messages
```typescript
interface ClientMessage {
    type: MessageType;
    gameMode?: GameMode;
    side?: number;
    direction?: Direction;
}
```

### Server Messages
```typescript
interface ServerMessage {
    type: MessageType;
    state?: GameStateData;
    side?: number;
    message?: string;
}
```

### Message Types
- `JOIN_GAME`: Client requests to join a game
- `PLAYER_INPUT`: Client sends player movement
- `GAME_STATE`: Server broadcasts game state updates
- `GAME_STARTED`: Server confirms game start
- `ERROR`: Server reports errors

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   make stop
   # Or change ports in .env file
   ```

2. **WebSocket connection fails**
   - Ensure backend is running on port 3000
   - Check browser console for connection errors
   - Verify no firewall blocking WebSocket connections

3. **Frontend not loading**
   - Check if nginx is serving files correctly
   - Verify frontend build completed successfully
   - Check browser console for JavaScript errors

4. **Docker build failures**
   ```bash
   make fclean    # Clean everything
   make run       # Rebuild from scratch
   ```

### Debug Mode

Enable debug logging:   ------> Removed most of logs, I kept only the failing
```bash
echo "DEBUG=yes" >> .env
make restart
make logs-backend
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Commit: `git commit -m "Add feature description"`
6. Push: `git push origin feature-name`
7. Create a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public functions
- Update shared types in `/shared` when needed

## License

This project is part of the 42 School curriculum.

## Roadmap (For what i remembered from the meeting :)

- [ ] AI player
- [ ] Tournament mode implementation
- [ ] Online multiplayer with matchmaking
- [ ] Database
- [ ] Google Auth
- [ ] Player statistics and leaderboards
- [ ] Custom game configurations
- [ ] Sound effects and music
