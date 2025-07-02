import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

async function pingRoute(fastify: FastifyInstance): Promise<void> {
    fastify.get("/ping", async (request: FastifyRequest, reply: FastifyReply) => {
        return {message: "pong"};
    });
}

export default pingRoute;
