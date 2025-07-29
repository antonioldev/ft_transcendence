import { FastifyInstance } from 'fastify';
import { OAuth2Client } from 'google-auth-library';
import * as validation from '../data/validation.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * @brief Configures the authentication routes for the application.
 * @details This function sets up the route for Google authentication, where it verifies the token received from the frontend,
 * finds or creates a user in the database, and returns a session token.
 * @param fastify - The Fastify instance to register the routes on.
 */
export async function authRoutes(fastify: FastifyInstance) {

    fastify.post('/api/auth/google', async (request, reply) => {
        console.log('Google auth endpoint called');
        try {
            const { token } = request.body as { token: string };
            console.log('Received token:', token ? 'present' : 'missing');
            
            if (!token) {
                console.log('❌ Token not provided');
                return reply.status(400).send({ error: 'Token not provided' });
            }

            console.log('Verifying Google token...');
            // Verify the Google token
            const ticket = await googleClient.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            
            console.log('Google token verified successfully');
            const payload = ticket.getPayload();
            if (!payload) {
                console.log('❌ Invalid Google Token - no payload');
                return reply.status(401).send({ error: 'Invalid Google Token' });
            }

            console.log('Google payload received:', payload.sub, payload.name);
            // Find or create the user in our database
            const user = validation.findOrCreateGoogleUser(payload as any);
            if (!user) {
                console.log('❌ Could not find or create user');
                return reply.status(500).send({ error: 'Could not find or create user' });
            }

            console.log('User found/created:', user.username);
            // Create a session token for the user
            const sessionToken = fastify.jwt.sign({ user });
            console.log('Session token generated successfully');

            // Send the session token back to the client
            return reply.send({ 
                success: true,
                sessionToken: sessionToken,
                user: user 
            });

        } catch (error) {
            console.log('❌ Google authentication failed:', error);
            fastify.log.error('Google authentication failed', error);
            return reply.status(500).send({ error: 'Authentication failed' });
        }
    });
}