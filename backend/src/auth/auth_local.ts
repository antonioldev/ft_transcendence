import { FastifyInstance } from 'fastify';
import { getUserBySession } from '../data/validation.js'; // <-- change path if needed

const COOKIE_NAME = 'sid';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

export default async function sessionBindRoutes(fastify: FastifyInstance) {
  // POST /api/auth/session/bind   (if you register this file with { prefix: '/api' })
  // If you DON'T use a prefix, change the path below to '/api/auth/session/bind'
  fastify.post('/api/auth/session/bind', async (req, reply) => {
    console.log('[BIND] HIT', req.method, req.url);
    console.log('[BIND] cookie header =', req.headers.cookie);

    try {
      const body: any = req.body || {};
      console.log('[BIND] body =', body);

      const sid = body.sid;
      if (!sid || typeof sid !== 'string') {
        console.log('[BIND] missing sid');
        reply.code(400).send({ ok: false, error: 'missing_sid' });
        return;
      }

      const user = getUserBySession(sid);
      console.log('[BIND] lookup sid', (sid || '').slice(0, 8), '-> user =', user);

      if (!user) {
        console.log('[BIND] invalid or expired sid');
        reply.code(401).send({ ok: false, error: 'invalid_or_expired' });
        return;
      }

      reply.setCookie(COOKIE_NAME, sid, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',  // use 'none' ONLY if your frontend is on a different site
        path: '/',
        maxAge: COOKIE_MAX_AGE,
      });
	  reply.send({ ok: true });

      console.log('[BIND] cookie set, responding ok');
      reply.send({ ok: true });
    } catch (e) {
      console.error('[BIND] ERROR', e);
      reply.code(500).send({ ok: false, error: 'server_error' });
    }
  });

  // GET /api/auth/session/me   (same note about prefix)
  fastify.get('/api/auth/session/me', async (req, reply) => {
    console.log('[ME] HIT', req.method, req.url);
    console.log('[ME] cookie header =', req.headers.cookie);

    const sid = (req as any).cookies?.[COOKIE_NAME];
    console.log('[ME] sid from cookie =', sid);

    if (!sid) {
      reply.code(401).send({ ok: false, error: 'no_cookie' });
      return;
    }

    const user = getUserBySession(sid);
    console.log('[ME] lookup user =', user);

    if (!user) {
      reply.code(401).send({ ok: false, error: 'invalid_or_expired' });
      return;
    }

    reply.send({ ok: true, user });
  });
}

