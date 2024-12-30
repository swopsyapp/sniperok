import { sveltekit } from '@sveltejs/kit/vite';
import { type ViteDevServer, defineConfig } from 'vite';

import { Server } from 'socket.io';

const webSocketServer = {
    name: 'webSocketServer',
    configureServer(server: ViteDevServer) {
        if (!server.httpServer) return;

        const io = new Server(server.httpServer);

        io.on('connection', (socket) => {
            socket.emit('eventFromServer', 'Welcome to rps-2.0 dev server 👋');
        });
    }
};

export default defineConfig({
    plugins: [sveltekit(), webSocketServer],
    test: {
        globals: true,
        environment: 'happy-dom'
    }
});
