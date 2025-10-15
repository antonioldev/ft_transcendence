// Session routes for binding a client-side token to a server-side session
import { FastifyInstance } from 'fastify';
import { getUserBySession } from '../data/validation.js';
import { OAuth2Client } from 'google-auth-library';
import * as validation from '../data/validation.js';

// Google OAuth2 client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Cookie settings
// const COOKIE_NAME = 'sid';
const COOKIE_MAX_AGE = 60 * 60; // 1 hour in seconds

// export async function authLocal(app: FastifyInstance) {
// 	/**
// 	 * POST /api/auth/session/bind
// 	 * - Reads a session ID from the request body
// 	 * - Verifies it exists in the DB
// 	 * - If valid, sets it as a secure HTTP-only cookie
// 	 */
// 	app.post('/api/auth/session/bind', async (req, reply) => {
// 		console.log('[BIND] HIT', req.method, req.url);
// 		console.log('[BIND] cookie header =', req.headers.cookie);

// 		try {
// 			// Get request body
// 			const body: any = req.body || {};
// 			console.log('[BIND] body =', body);

// 			// Extract and validate sid
// 			const sid = body.sid;
// 			if (!sid || typeof sid !== 'string') {
// 				console.log('[BIND] missing sid');
// 				return reply.code(400).send({ ok: false, error: 'missing_sid' });
// 			}

// 			// Check if sid corresponds to a valid session
// 			const user = getUserBySession(sid);
// 			console.log('[BIND] lookup sid', (sid || '').slice(0, 8), '-> user =', user);

// 			if (!user) {
// 				console.log('[BIND] invalid or expired sid');
// 				return reply.code(401).send({ ok: false, error: 'invalid_or_expired' });
// 			}

// 			// // Set session cookie
// 			// reply.setCookie(COOKIE_NAME, sid, {
// 			// 	httpOnly: true,   // Not accessible from client JS
// 			// 	secure: true,     // Only sent over HTTPS
// 			// 	sameSite: 'lax',  // Helps mitigate CSRF
// 			// 	path: '/',
// 			// 	maxAge: COOKIE_MAX_AGE,
// 			// });

// 			// Send success response
// 			return reply.send({ ok: true });
// 		} catch (err) {
// 			console.error('[BIND] server error:', err);
// 			return reply.code(500).send({ ok: false, error: 'server_error' });
// 		}
// 	});

	// /**
	//  * GET /api/auth/session/me
	//  * - Reads the sid cookie
	//  * - Looks up the user from DB
	//  * - Returns user info if session is valid
	//  */
	// app.get('/api/auth/session/me', async (req, reply) => {
	// 	console.log('[ME] HIT', req.method, req.url);
	// 	console.log('[ME] cookie header =', req.cookies);

	// 	// Get sid from cookie
	// 	const sid = (req as any).cookies?.[COOKIE_NAME];
	// 	console.log('[ME] sid from cookie =', sid);

	// 	if (!sid) {
	// 		return reply.code(401).send({ ok: false, error: 'no_cookie' });
	// 	}

	// 	// Validate session and fetch user
	// 	const user = getUserBySession(sid);
	// 	console.log('[ME] lookup user =', user);

	// 	if (!user) {
	// 		return reply.code(401).send({ ok: false, error: 'invalid_or_expired' });
	// 	}

	// 	// Send authenticated user info
	// 	return reply.send({ ok: true, user });
	// });
// }

export async function authGoogle(app: FastifyInstance) {
	// Route: Google login
	app.post('/api/auth/google', async (request, reply) => {
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
				// domain: '.42london.com',			TO CHECK ON 42 COMPUTER
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

	// // Route: Get current session by cookie
	// app.get('/api/auth/session', async (request, reply) => {
	// 	const sid = request.cookies?.[COOKIE_NAME];
	// 	if (!sid) return reply.code(401).send({ authenticated: false });

	// 	const user = validation.getUserBySession(sid);
	// 	if (!user) return reply.code(401).send({ authenticated: false });

	// 	return reply.send({ authenticated: true, user });
	// });
}
