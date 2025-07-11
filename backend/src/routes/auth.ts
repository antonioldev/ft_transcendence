import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function authRoutes(fastify: FastifyInstance<any, any, any, any, any, any, any, any>) {
    fastify.post('/api/auth/google', async (request: any, reply: any) => {
        try {
            const { token } = request.body as { token: string };

            if (!token) {
                return reply.status(400).send({ error: 'Token não fornecido' });
            }

            const ticket = await googleClient.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();

            if (!payload) {
                return reply.status(401).send({ error: 'Token do Google inválido' });
            }

            const userProfile = {
                id: payload.sub,
                name: payload.name,
                email: payload.email,
                picture: payload.picture
            };

            const sessionToken = fastify.jwt.sign({ user: userProfile });

            return reply.send({ sessionToken });

        } catch (error) {
            fastify.log.error('Falha na autenticação do Google', error);
            return reply.status(500).send({ error: 'Falha na autenticação' });
        }
    });
}