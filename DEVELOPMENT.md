# Development Environment

## How to start the development environment

### Option 1: Quick command (recommended)
```bash
make dev
```
This command will:
- Build and start only the backend in Docker
- Start the frontend in development mode with hot reload
- Frontend will be served at: https://localhost:8443

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

- ✅ Hot reload for TypeScript
- ✅ Hot reload for CSS/TailwindCSS
- ✅ Hot reload for HTML
- ✅ Real-time TypeScript compilation
- ✅ TailwindCSS watch mode
- ✅ Vite dev server with HTTPS

## Important notes

- The development frontend runs at `https://localhost:8443`
- The backend continues running in Docker on the configured port
- Changes in TypeScript, CSS and HTML files are reflected instantly
- To return to production, use `make build` and `make start`
