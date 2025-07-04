import { FastifyInstance } from 'fastify';

async function websocketRoutes(fastify: FastifyInstance) {
    fastify.get('/', {websocket: true}, (socket, req) => {
        console.log('🌐 Connected with ', req.socket.remoteAddress);

        socket.on('message', (message: string) => {
            try {
                const data = JSON.parse(message.toString());
                console.log('📩 Received: ', data);

                socket.send(JSON.stringify({
                    type: 'response',
                    data: data
                  }));
            } catch (error) {
                console.error('❌ Error parsing message: ', error);
            }
        });

        socket.on('close', () => {
            console.log('❌ Client disconnected');
        });

        const welcomeMessage = {
            type: 'welcome',
            message: 'Connected to game server'
        };
        socket.send(JSON.stringify(welcomeMessage));
        console.log('📤 Sent welcome message:', welcomeMessage);
        
    });
}

export default websocketRoutes;