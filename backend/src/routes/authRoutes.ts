// Session routes for binding a client-side token to a server-side session
import { FastifyInstance } from 'fastify';
import { OAuth2Client } from 'google-auth-library';
import * as validation from '../data/validation.js';

// Google OAuth2 client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function authGoogle(app: FastifyInstance) {
	// Route: Google login
	app.post('/api/google', async (request, reply) => {
		try {
			// Get token from request body
			const { token } = request.body as { token: string };
			if (!token) return reply.code(400).send({ success: false, message: 'Error: Token not provided' });

			// Verify Google ID token
			const ticket = await googleClient.verifyIdToken({
				idToken: token,
				audience: process.env.GOOGLE_CLIENT_ID,
			});
			const payload = ticket.getPayload();
			if (!payload) return reply.code(401).send({ error: 'Invalid Google Token' });

			// Find or create user in local DB
			const user = validation.findOrCreateGoogleUser(payload as any);
			if (!user) return reply.code(500).send({ error: 'Could not find or create user' });

			// Send response with user info (safe fields only)
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
