import { FastifyRequest, FastifyReply } from 'fastify';
import { createGameService, getGameService } from '../services/gameService.js'

export const createGame = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const game = await createGameService(req.body);
        reply.code(201).send(game);
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            message: 'Failed to create game'
        });
    }
};

export const getGame = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
    const game = await getGameService(req.params.id);
    reply.send(game);
  } catch (err) {
    console.error(err);
    reply.code(500).send({ message: 'Failed to get game' });
  }
}