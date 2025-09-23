exi# Development Environment

## How to start the development environment

### Option 1: Quick command (recommended)
```bash
make dev
```
This command will:
- Build and start only the backend in Docker
- Start the frontend in development mode with hot reload
- Frontend will be served at: http://localhost:5173 (HTTP for development)

### Option 2: Manual
```bash
# 1. Start only the backend
make start-backend

# 2. In another terminal, start the frontend
make dev-frontend
```

## Switching between Development and Production

### For DEVELOPMENT (hot reload):
In the `frontend/src/index.html` file:
```html
<!-- DEVELOPMENT: CSS with hot reload -->
<link rel="stylesheet" href="/styles/output.css"> <!-- DEVELOPMENT -->
<!-- <link href="/output.css" rel="stylesheet"> --> <!-- PRODUCTION -->

<!-- DEVELOPMENT: Use .ts for hot reload -->
<script type="module" src="./core/main.ts"></script>
<!-- <script type="module" src="./core/main.js"></script> --> <!-- PRODUCTION -->
```

### For PRODUCTION (Docker):
In the `frontend/src/index.html` file:
```html
<!-- <link rel="stylesheet" href="/styles/output.css"> --> <!-- DEVELOPMENT -->
<!-- PRODUCTION: Compiled CSS -->
<link href="/output.css" rel="stylesheet"> <!-- PRODUCTION -->

<!-- <script type="module" src="./core/main.ts"></script> --> <!-- DEVELOPMENT -->
<!-- PRODUCTION: Use compiled .js -->
<script type="module" src="./core/main.js"></script> <!-- PRODUCTION -->
```

## Available commands

- `make dev` - Complete development environment
- `make start-backend` - Backend only
- `make dev-frontend` - Frontend only in dev mode
- `make build` - Complete build for production
- `make start` - Start in production mode

## Development environment features

- Hot reload for HTML, TypeScript and CSS/TailwindCSS
- Real-time TypeScript compilation
- TailwindCSS watch mode
- Vite dev server with HTTP (port 5173)
- Docker-based backend development
- Automatic WebSocket connection switching (dev vs prod)

## Port Configuration

### Development Mode (HTTP)
- **Frontend**: `http://localhost:5173` (Vite dev server)
- **Backend**: `http://localhost:3000` (Docker container)
- **WebSocket**: `ws://localhost:3000/ws` (direct to backend)

### Production Mode (HTTPS)
- **Frontend**: `https://localhost:8443` (Docker with SSL)
- **Backend**: `https://localhost:3000` (Docker container)
- **WebSocket**: `wss://localhost:8443/ws` (through nginx proxy)

## WebSocket Configuration

The WebSocket client automatically detects the environment:
- In **development** (port 5173): connects directly to `ws://localhost:3000/ws`
- In **production**: connects through nginx proxy using the current host

## Important notes

- The development frontend runs at `http://localhost:5173` (HTTP for faster development)
- WebSocket connections are automatically routed to the correct backend port
- When switching back to production, it is necessary to update the port configuration:
  - In `frontend/vite.config.js`, change ports from 5173 to 8443
- The backend continues running in Docker on the configured port
- Changes in TypeScript, CSS and HTML files are reflected instantly
- To return to production, use `make build` and `make start`

## Switching Between Modes

### From Development to Production:
1. Update `frontend/vite.config.js`:
   ```javascript
   server: {
     host: '0.0.0.0',
     port: 8443,  // Changed from 5173
     hmr: {
       host: 'localhost',
       port: 8443  // Changed from 5173
     }
   }
   ```
2. Comment/uncomment lines in `frontend/src/index.html` as shown above
3. Run `make build` and `make start`

### From Production to Development:
1. Update `frontend/vite.config.js`:
   ```javascript
   server: {
     host: '0.0.0.0',
     port: 5173,  // Changed from 8443
     hmr: {
       host: 'localhost',
       port: 5173  // Changed from 5173
     }
   }
   ```
2. Comment/uncomment lines in `frontend/src/index.html` as shown above
3. Run `make dev`
