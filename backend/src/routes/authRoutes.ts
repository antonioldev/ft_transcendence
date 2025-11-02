// Session routes for binding a client-side token to a server-side session
import { FastifyInstance } from 'fastify';
import { OAuth2Client } from 'google-auth-library';
import * as validation from '../data/validation.js';
import { createClientConnection, getClientConnection } from './utils.js';

// Google OAuth2 client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function authGoogle(app: FastifyInstance) {
	app.post('/api/google', async (request, reply) => {
		try {
			const { sid } = request.query as { sid: string };
			if (!sid) {
				return reply.code(400).send({ error: 'Missing SID' });
			}
		
			let client = getClientConnection(sid);
			if (!client) {
				client = createClientConnection(sid);
			}
			const { token } = request.body as { token: string };
			if (!token) return reply.code(400).send({ success: false, message: 'Error: Token not provided' });

			const ticket = await googleClient.verifyIdToken({
				idToken: token,
				audience: process.env.GOOGLE_CLIENT_ID,
			});
			const payload = ticket.getPayload();
			if (!payload) return reply.code(401).send({ error: 'Invalid Google Token' });

			const user = validation.findOrCreateGoogleUser(payload as any);
			if (!user) return reply.code(500).send({ error: 'Could not find or create user' });

			const isActive = validation.isUserActive(user.username);
			if (isActive) {
				return reply.send({
					success: false,
					message: 'User already logged in from another device',
					user: {
						username: user.username,
						email: user.email,
					},
				});
			} else {
				validation.setUserActiveStatus(user.username, true);
			}

			client.setInfo(user.username, user.email, '');
			client.loggedIn = true;

			return reply.send({
				success: true,
				message: "Google restore successful",
				user: {
					username: user.username,
					email: user.email,
				},
			});
		} catch (error) {
			request.log.error('Google authentication failed', error);
			return reply.code(500).send({ error: 'Authentication failed' });
		}
	});

}
