import Fastify from 'fastify';
import { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import cookie from '@fastify/cookie';
import * as dotenv from 'dotenv';
import { setupWebsocket }  from './routes/Websocket.js';
import config from './config/default.js';
import { initialisazeDatabase } from './data/db-init.js';
import { registerDatabaseFunctions } from './data/database.js';
import { APIRoutes } from './routes/apiRoutes.js';
import { authGoogle, authLocal } from './routes/authRoutes.js';
import { seedDefaultUsers } from './data/db-init.js';
import fs from 'fs';

/* --- SETUP DATABASE --- */

dotenv.config();
const db = await initialisazeDatabase('./database/transcendence.sqlite');
registerDatabaseFunctions(db);
await seedDefaultUsers(8);


/* --- CREATE FASTIFY APP --- */

export const app: FastifyInstance = Fastify({
    logger: config.debug === 'yes' ? true : false,
    trustProxy: true,
    https: {
        key: fs.readFileSync('/etc/nginx/ssl/private/key.key'),
        cert: fs.readFileSync('/etc/nginx/ssl/certs/cert.crt'),
    }
});


/* --- SETUP PLUGINS --- */

// JWT
await app.register(fastifyJwt, { secret: process.env.JWT_SECRET! });

// Cookies
await app.register(cookie, {
    secret: process.env.COOKIE_SECRET,
    hook: 'onRequest',
    parseOptions: {
        secure: true,
        sameSite: 'none',
        httpOnly: true
    }
});

// Websocket options
await app.register(import('@fastify/websocket'), {
	options: {
		maxPayload: 1048576,        // Max bytes of single message
		perMessageDeflate: false,   // Disable per-message compression for better performance
		clientTracking: true,       // Enable tracking of connected clients
		maxConnections: 100,        // max num of concurrent WebSocket connections // TODO shall we reduce this?
	}
});

// CORS for frontend
await app.register(fastifyCors, {
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
    // origin: "https://192.168.1.83",
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Set-Cookie'],
});


/* --- SETUP ROUTES --- */

await app.register(APIRoutes);
await app.register(authLocal);
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