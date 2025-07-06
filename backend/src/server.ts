import Fastify from 'fastify';
import { webSocketManager }  from './network/WebSocketManager.js';
import config from './config/default.js';

const fastify = Fastify({
    logger: config.debug === 'yes' ? true : false
});

await fastify.register(import('@fastify/websocket'), {
	options: {
		maxPayload: 1048576,
		perMessageDeflate: false,
		clientTracking: true,
		maxConnections: 100,
	}
});

// fastify.register(websocketRoutes);
await webSocketManager.setupRoutes(fastify);

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