import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import config from '../config/default.js';

async function healthCheck(fastify: FastifyInstance): Promise<void> {
    fastify.get("/health", async (request: FastifyRequest, reply: FastifyReply) => {
        return { 
            status: "healthy",
            timestamp: new Date().toISOString(),
            debug: config.debug
        };
    });
}

export default healthCheck;