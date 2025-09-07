// Session routes for binding a client-side token to a server-side session
import { FastifyInstance } from 'fastify';
import { getUserBySession } from '../data/validation.js';

// Cookie settings
const COOKIE_NAME = 'sid';
const COOKIE_MAX_AGE = 60 * 60; // 1 hour in seconds

export default async function sessionBindRoutes(fastify: FastifyInstance) {
	/**
	 * POST /api/auth/session/bind
	 * - Reads a session ID from the request body
	 * - Verifies it exists in the DB
	 * - If valid, sets it as a secure HTTP-only cookie
	 */
	fastify.post('/api/auth/session/bind', async (req, reply) => {
		console.log('[BIND] HIT', req.method, req.url);
		console.log('[BIND] cookie header =', req.headers.cookie);

		try {
			// Get request body
			const body: any = req.body || {};
			console.log('[BIND] body =', body);

			// Extract and validate sid
			const sid = body.sid;
			if (!sid || typeof sid !== 'string') {
				console.log('[BIND] missing sid');
				return reply.code(400).send({ ok: false, error: 'missing_sid' });
			}

			// Check if sid corresponds to a valid session
			const user = getUserBySession(sid);
			console.log('[BIND] lookup sid', (sid || '').slice(0, 8), '-> user =', user);

			if (!user) {
				console.log('[BIND] invalid or expired sid');
				return reply.code(401).send({ ok: false, error: 'invalid_or_expired' });
			}

			// Set session cookie
			reply.setCookie(COOKIE_NAME, sid, {
				httpOnly: true,   // Not accessible from client JS
				secure: true,     // Only sent over HTTPS
				sameSite: 'strict',  // Helps mitigate CSRF
				path: '/',
				maxAge: COOKIE_MAX_AGE,
			});

			// Send success response
			return reply.send({ ok: true });
		} catch (err) {
			console.error('[BIND] server error:', err);
			return reply.code(500).send({ ok: false, error: 'server_error' });
		}
	});

	/**
	 * GET /api/auth/session/me
	 * - Reads the sid cookie
	 * - Looks up the user from DB
	 * - Returns user info if session is valid
	 */
	fastify.get('/api/auth/session/me', async (req, reply) => {
		console.log('[ME] HIT', req.method, req.url);
		console.log('[ME] cookie header =', req.cookies);

		// Get sid from cookie
		const sid = (req as any).cookies?.[COOKIE_NAME];
		console.log('[ME] sid from cookie =', sid);

		if (!sid) {
			return reply.code(401).send({ ok: false, error: 'no_cookie' });
		}

		// Validate session and fetch user
		const user = getUserBySession(sid);
		console.log('[ME] lookup user =', user);

		if (!user) {
			return reply.code(401).send({ ok: false, error: 'invalid_or_expired' });
		}

		// Send authenticated user info
		return reply.send({ ok: true, user });
	});
}
