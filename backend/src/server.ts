import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import cookie from '@fastify/cookie';
import * as dotenv from 'dotenv';
import { webSocketManager }  from './network/WebSocketManager.js';
import config from './config/default.js';
import { initialisazeDatabase } from './data/db-init.js';
import { registerDatabaseFunctions } from './data/database.js';
import { registerNewUser } from './data/validation.js';
import { authRoutes } from './auth/auth_google.js';
import sessionBindRoutes from "./auth/auth_local.js"


dotenv.config();

const fastify = Fastify({
    logger: config.debug === 'yes' ? true : false,
    trustProxy: true,
});

fastify.register(cookie, {
  secret: process.env.COOKIE_SECRET,
  hook: 'onRequest',
  parseOptions: {
    secure: true,
    sameSite: 'none',
    httpOnly: true
  }
});

fastify.register(sessionBindRoutes);

// init the database
const db = await initialisazeDatabase('./database/transcendence.sqlite');
registerDatabaseFunctions(db);
await seedDefaultUsers(8);

async function seedDefaultUsers(user_count: number) {
  // pick simple starter passwords; your registerUser should pepper+argon2-hash before insert
  for (let i = 0; i < user_count; i++) {
      await registerNewUser(`p${i}`, `player${i}@example.com`, 'p' );
  }
  console.log(`Seeded ${user_count} default users via registration flow`);
}

// Register JWT plugin
await fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET!
});

// Enable CORS for the frontend application
await fastify.register(fastifyCors, {
    origin: (origin: string | undefined, cb: (err: Error | null, allow: boolean) => void) => {
        if (!origin) return cb(null, true); // allow non-browser requests (curl)
        const allowed = [
            // 42 London hostname pattern
            /^https:\/\/c\d+r\d+s\d+\.42london\.com(:8443)?$/,

            // Local network IP ranges A, B, and C with optional port 8443
            /^https?:\/\/10\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(:8443)?$/,
            /^https?:\/\/172\.(?:1[6-9]|2[0-9]|3[01])\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(:8443)?$/,
            /^https?:\/\/192\.168\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(:8443)?$/,
        
            /^https?:\/\/localhost(:\d+)?$/
        ];
        if (allowed.some(regexp => regexp.test(origin))) cb(null, true);
        else cb(new Error('Not allowed'), false);   
    },
    // origin: process.env.LAN_IP,
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Set-Cookie'],
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