import Fastify from 'fastify';
import healthCheck from './routes/helthCheck.js';
// import gameRoutes from './routes/gameRoutes.js';
import websocketRoutes from './routes/webSocket.js';
import config from './config/default.js';
// import { error } from 'console';

const fastify = Fastify({
    logger: config.debug === 'yes' ? true : false
});

await fastify.register(import('@fastify/websocket'));

if (config.debug === 'yes') {
    console.log('🐛 DEBUG MODE ENABLED');
    console.log('📋 Config:', {
        server: config.server,
        debug: config.debug
    });
}

healthCheck(fastify);
fastify.register(websocketRoutes);
// app.register(gameRoutes);

const start = async (): Promise<void> => {
    try {
        await fastify.listen({ 
            port: config.server.port,
            host: config.server.host 
        });
        console.log(`Pong server ready on ${config.server.host}:${config.server.port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();