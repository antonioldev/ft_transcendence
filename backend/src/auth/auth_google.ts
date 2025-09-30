// Authentication routes (Google Sign-In + session management)
import { FastifyInstance } from 'fastify';
import { OAuth2Client } from 'google-auth-library';
import * as validation from '../data/validation.js';

// Google OAuth2 client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Session cookie settings
const COOKIE_NAME = 'sid';
const COOKIE_MAX_AGE = 60 * 60; // 1 hour

export async function authRoutes(fastify: FastifyInstance) {
	// Route: Google login
	fastify.post('/api/auth/google', async (request, reply) => {
		try {
			// Get token from request body
			const { token } = request.body as { token: string };
			if (!token) return reply.code(400).send({ error: 'Token not provided' });

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

			// Create a session for the user
			const sid = validation.getSessionByUsername(user.username); // string | undefined
			if (!sid) return reply.code(409).send({ error: 'Active session already exists' });

			// Set session cookie
			const COOKIE_OPTS = {
				httpOnly: true,
				secure: true,
				sameSite: 'none' as const,
				path: '/',
				domain: '.42london.com',
				maxAge: COOKIE_MAX_AGE,
			};
			reply.setCookie(COOKIE_NAME, sid, COOKIE_OPTS);

			// Send response with user info (safe fields only)
			return reply.send({
				success: true,
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

	// Route: Get current session by cookie
	fastify.get('/api/auth/session', async (req, reply) => {
		const sid = req.cookies?.[COOKIE_NAME];
		if (!sid) return reply.code(401).send({ authenticated: false });

		const user = validation.getUserBySession(sid);
		if (!user) return reply.code(401).send({ authenticated: false });

		return reply.send({ authenticated: true, user });
	});
}
