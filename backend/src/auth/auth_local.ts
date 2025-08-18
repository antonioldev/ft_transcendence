// // src/routes/auth-session.ts
// import fp from 'fastify-plugin';
// import cookie from '@fastify/cookie';
// import type { FastifyPluginAsync } from 'fastify';
// import { createSession, validateSession, revokeSession, getSidFromCookieHeader } from '../services/session';
// import Database from 'better-sqlite3';
// import * as dbFunction from '../data/database.js';

// let db: Database.Database;

// export function registerDatabaseFunctions(database: Database.Database) {
// 	console.log("registering db");
// 	db = database;
// }

// export const authSessionRoutes: FastifyPluginAsync = fp(async (app) => {
//   await app.register(cookie, { secret: process.env.COOKIE_SECRET });

//   // Call this ONLY after your own "auth_state === LOGIN_SUCCESS"
//   // Body must include a server-trustable userId (or present a temporary server-signed code you validate here).
//   app.post('/auth/session', async (req, reply) => {
//     const { userId } = req.body as { userId: number };


//     const r = createSession(db, userId, req.headers['user-agent'], req.ip);
//     if ('error' in r && r.error === 'ALREADY_LOGGED_IN_ELSEWHERE') {
//       return reply.code(409).send({ error: 'already_logged_in_elsewhere' });
//     }

//     reply.setCookie('sid', r.sid, {
//       path: '/',
//       httpOnly: true,
//       secure: true,          // HTTPS only
//       sameSite: 'lax',       // same-origin frontend <-> backend; use 'none' if cross-site
//       maxAge: 7 * 24 * 3600  // persist across refresh
//     });
//     return reply.send({ ok: true, expiresAt: r.expires });
//   });

//   app.get('/me', async (req, reply) => {
//     const sid = (req.cookies as any)?.sid;
//     if (!sid) return reply.code(401).send();
//     const s = validateSession(db, sid);
//     const now = Math.floor(Date.now()/1000);
//     if (!s || s.revoked || s.expires_at <= now) {
//       reply.clearCookie('sid', { path: '/' });
//       return reply.code(401).send();
//     }
//     // return the profile you need
//     const user = db.prepare('SELECT id, username, email FROM users WHERE id=?').get(s.user_id);
//     return reply.send({ user });
//   });

//   app.post('/logout', async (req, reply) => {
//     const sid = (req.cookies as any)?.sid;
//     if (sid) revokeSession(db, sid);
//     reply.clearCookie('sid', { path: '/' });
//     return reply.send({ ok: true });
//   });
// });
