import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import * as dotenv from 'dotenv';
import { webSocketManager }  from './network/WebSocketManager.js';
import config from './config/default.js';
import { initialisazeDatabase } from './data/db-init.js';
import { registerDatabaseFunctions } from './data/database.js';
import { authRoutes } from './auth/auth_google.js';

dotenv.config();

const fastify = Fastify({
    logger: config.debug === 'yes' ? true : false
});

// init the database
const db = initialisazeDatabase('./database/transcendence.sqlite');
registerDatabaseFunctions(db);

// Register JWT plugin
await fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET!
});

// Enable CORS for the frontend application
await fastify.register(fastifyCors, {
    origin: "http://localhost:8080",
    methods: ['GET', 'POST'],
    credentials: true,
});

// Set Cross-Origin-Opener-Policy header for HTML responses
fastify.addHook('onSend', async (request, reply, payload) => {
    if (reply.getHeader('Content-Type')?.toString().includes('text/html')) {
        reply.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    }
});

// Register the authentication routes
await fastify.register(authRoutes);

// Register the WebSocket plugin with specific options
await fastify.register(import('@fastify/websocket'), {
	options: {
		// Maximum size of a single message payload in bytes
		maxPayload: 1048576,
		// Disable per-message compression for better performance
		perMessageDeflate: false,
		// Enable tracking of connected clients
		clientTracking: true,
		// Limit the maximum number of concurrent WebSocket connections //TODO shall we reduce this?
		maxConnections: 100,
	}
});

// add the connection to the database

// Setup WebSocket routes using the webSocketManager
await webSocketManager.setupRoutes(fastify);

/**
 * Starts the Fastify server and listens on the configured host and port.
 * Logs a message when the server is ready or exits on error.
 */
const start = async (): Promise<void> => {
    try {
        await fastify.listen({ 
            port: config.server.port,
            host: config.server.host
        });

        
        console.log(`Pong server ready`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();