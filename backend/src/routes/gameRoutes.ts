import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { createGame, getGame } from '../controllers/gameController.js';

async function gameRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
    fastify.post('/games', createGame);
    fastify.get('/games/:id', getGame);
}

export default gameRoutes;