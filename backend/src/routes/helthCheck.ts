import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

async function healthCheck(fastify: FastifyInstance): Promise<void> {
    fastify.get("/health", async (request: FastifyRequest, reply: FastifyReply) => {
        return { 
            status: "healthy",
            timestamp: new Date().toISOString(),
        };
    });
}

export default healthCheck;