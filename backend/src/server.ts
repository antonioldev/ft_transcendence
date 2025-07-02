import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import pingRoute from './routes/pingRoute.js';
import healthCheck from './routes/helthCheck.js';
import helloWorld from './routes/helloword.js';

const {
    ADDRESS = '0.0.0.0',
    PORT = '3000'
} = process.env;

const app: FastifyInstance = fastify({
    logger: true
});


pingRoute(app);
healthCheck(app);
helloWorld(app);

const start = async (): Promise<void> => {
    try {
        await app.listen({ 
            port: parseInt(PORT, 10), 
            host: ADDRESS 
        });
        console.log(`Pong server ready on ${ADDRESS}:${PORT}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();