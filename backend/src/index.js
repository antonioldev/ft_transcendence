const fastify = require("fastify")({ logger: true });

// Environment variables (keeps your Docker setup working)
const { ADDRESS = '0.0.0.0', PORT = '3000' } = process.env;

fastify.get("/", async (request, reply) => {
    return { message: "Pong Game Server" };
});

const start = async () => {
    try {
        await fastify.listen({ 
            port: parseInt(PORT, 10), 
            host: ADDRESS 
        });
        console.log(`Pong server ready on ${ADDRESS}:${PORT}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();