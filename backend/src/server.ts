import Fastify from 'fastify';
import { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import { webSocketManager } from './network/WebSocketManager.js';
import config from './config/default.js';
import { authRoutes } from './routes/auth.js';
import * as dotenv from 'dotenv';

dotenv.config();

const fastify: FastifyInstance<any, any, any, any, any, any, any, any> = Fastify({
    logger: config.debug === 'yes' ? true : false
});

fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET!
});

fastify.register(fastifyCors, {
    origin: 'http://localhost:8080',
    methods: ['GET', 'POST'],
});

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