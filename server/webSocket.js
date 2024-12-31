import { Server } from 'socket.io'

/**
 * @param {number | import("http").Server | import("http2").Http2Server | undefined} server
 * @param {string} welcomeMessage
 */
function webSocket(server, welcomeMessage) {
    const io = new Server(server, {
        serveClient: false
    });
    
    io.on('connection', (socket) => {
        socket.emit('eventFromServer', welcomeMessage);
        socket.on('worldChat', (worldChatMsg) => {
            // TODO check sender inside of worldChatMsg verify that they can send
            console.log('Received: ', worldChatMsg);
            io.emit('worldChat', worldChatMsg);
        });
    });

    return io;
}

export { webSocket };
