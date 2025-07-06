import Fastify from 'fastify';
import websocketRoutes from './network/webSocket.js';
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
		// verifyClient: (info) => {
		// 	return true;
		// }
	}
});

fastify.register(websocketRoutes);

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