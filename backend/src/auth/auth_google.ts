import { FastifyInstance } from 'fastify';
import { OAuth2Client } from 'google-auth-library';
import * as validation from '../data/validation.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const COOKIE_NAME = 'sid';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/api/auth/google', async (request, reply) => {
    try {
      const { token } = request.body as { token: string };
      if (!token) return reply.code(400).send({ error: 'Token not provided' });

      // 1) Verify Google ID token
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload) return reply.code(401).send({ error: 'Invalid Google Token' });

      // 2) Find or create local user
      const user = validation.findOrCreateGoogleUser(payload as any);
      if (!user) return reply.code(500).send({ error: 'Could not find or create user' });

      // 3) Create a DB session (same as classic)
      const sid = validation.getSessionByUsername(user.username);            // returns string | undefined
      if (!sid) {
        // you currently block multiple active sessions; adjust message if you prefer rotating
        return reply.code(409).send({ error: 'Active session already exists' });
      }
      const COOKIE_OPTS = {
        httpOnly: true,               // not accessible from JS (prevents XSS stealing)
        secure: true,                 // cookie only sent over HTTPS
        sameSite: 'lax' as const,     // prevents most CSRF attacks
        path: '/',                    // available on all routes
        maxAge: COOKIE_MAX_AGE      // 7 days in seconds
        };

      // 4) Set the cookie
      reply.setCookie('sid', sid, COOKIE_OPTS);

      // 5) Return a minimal payload (no need to expose any token)
      return reply.send({
        success: true,
        user: {
          username: user.username,
          email: user.email,
          // any other safe public fields
        }
      });
    } catch (error) {
      request.log.error('Google authentication failed', error);
      return reply.code(500).send({ error: 'Authentication failed' });
    }
  });
    fastify.get('/api/auth/session', async (req, reply) => {
    const sid = req.cookies?.[COOKIE_NAME];
    if (!sid) return reply.code(401).send({ authenticated: false });

    const user = validation.getUserBySession(sid); // your existing helper
    if (!user) return reply.code(401).send({ authenticated: false });

    return reply.send({ authenticated: true, user });
    });
}


