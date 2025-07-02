import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

async function helloWorld(fastify: FastifyInstance): Promise<void> {
    fastify.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
        return {
            message: "Pong Game Server",
            version: "1.0.0"
        };
    });
}

export default helloWorld;
