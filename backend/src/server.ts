import fastify, { FastifyInstance } from 'fastify';
import pingRoute from './routes/pingRoute.js';
import healthCheck from './routes/helthCheck.js';
import helloWorld from './routes/helloword.js';
import gameRoutes from './routes/gameRoutes.js';
import config from './config/default.js';

const app: FastifyInstance = fastify({
    logger: config.debug === 'yes' ? true : false
});

if (config.debug === 'yes') {
    console.log('🐛 DEBUG MODE ENABLED');
    console.log('📋 Config:', {
        server: config.server,
        debug: config.debug
    });
}

pingRoute(app);
healthCheck(app);
helloWorld(app);
app.register(gameRoutes);

const start = async (): Promise<void> => {
    try {
        await app.listen({ 
            port: config.server.port,
            host: config.server.host 
        });
        console.log(`Pong server ready on ${config.server.host}:${config.server.port}`);
        
        if (config.debug === 'yes') {
            console.log('🐛 DEBUG MODE ENABLED');
            console.log('🔍 Debug endpoints available:');
            console.log(`  - Health: http://${config.server.host}:${config.server.port}/health`);
            console.log(`  - Ping: http://${config.server.host}:${config.server.port}/ping`);
        }
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();