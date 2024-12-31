import { sveltekit } from '@sveltejs/kit/vite';
import { type ViteDevServer, defineConfig } from 'vite';

import { webSocket } from './server/webSocket';

const webSocketServer = {
    name: 'webSocketServer',
    configureServer(server: ViteDevServer) {
        if (!server.httpServer) return;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const io = webSocket(server.httpServer, 'Welcome to rps-2.0 dev server 👋');
    }
};

export default defineConfig({
    plugins: [sveltekit(), webSocketServer],
    test: {
        globals: true,
        environment: 'happy-dom'
    }
});
