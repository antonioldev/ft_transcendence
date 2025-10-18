import Fastify from 'fastify';
import { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import fastifyWebsocket from '@fastify/websocket';
import * as dotenv from 'dotenv';
import { setupWebsocket }  from './routes/Websocket.js';
import config from './config/default.js';
import { initialisazeDatabase } from './data/db-init.js';
import { registerDatabaseFunctions } from './data/database.js';
import { APIRoutes } from './routes/apiRoutes.js';
import { authGoogle } from './routes/authRoutes.js';
import { seedDefaultUsers } from './data/db-init.js';

/* --- SETUP DATABASE --- */

dotenv.config();
const db = await initialisazeDatabase('./database/transcendence.sqlite');
registerDatabaseFunctions(db);
await seedDefaultUsers(8);


/* --- CREATE FASTIFY APP --- */

export const app: FastifyInstance = Fastify({
    logger: config.debug === 'yes' ? true : false,
    trustProxy: true,
});


/* --- SETUP PLUGINS --- */

// JWT
await app.register(fastifyJwt, { secret: process.env.JWT_SECRET! });

// Websocket options
await app.register(fastifyWebsocket, {
	options: {
		maxPayload: 1048576,        // Max bytes of single message
		perMessageDeflate: false,   // Disable per-message compression for better performance
		clientTracking: true,       // Enable tracking of connected clients
		maxConnections: 100,        // max num of concurrent WebSocket connections // TODO shall we reduce this?
	}
});

// CORS for frontend
await app.register(fastifyCors, {
    origin: "https://localhost",
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
});


/* --- SETUP ROUTES --- */

await app.register(APIRoutes);
// await app.register(authLocal);
await app.register(authGoogle);
await app.register(setupWebsocket);


/**
 * Starts the Fastify server and listens on the configured host and port.
 * Logs a message when the server is ready or exits on error.
 */
const start = async (): Promise<void> => {
    try {
        await app.listen({ 
            port: config.server.port,
            host: config.server.host
        });
        console.log(`Pong server ready`);
    } 
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();