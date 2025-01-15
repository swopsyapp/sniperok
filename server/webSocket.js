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
        socket.on('worldChat', (worldChatMsg) => {
            // TODO check sender inside of worldChatMsg verify that they can send to world
            console.log('Received: ', worldChatMsg);
            io.emit('worldChat', worldChatMsg);
        });

        socket.on('joinGame', (joinGameMsg) => {
            console.log('Received: ', joinGameMsg);
            const username = joinGameMsg.sender;
            const gameRoom = `gameRoom:${joinGameMsg.gameId}`;
            socket.join(gameRoom);

            socket.on('gameChat', (gameChatMsg) => {
                if (gameChatMsg.sender == 'Guest') {
                    gameChatMsg.sender = username;
                }
                console.log('Received: ', gameChatMsg);
                io.to(gameRoom).emit('gameChat', gameChatMsg);
            });

            socket.on('startRound', (startRoundMsg) => {
                if (startRoundMsg.sender == 'Guest') {
                    startRoundMsg.sender = username;
                }
                console.log('Received: ', startRoundMsg);
                io.to(gameRoom).emit('gameChat', startRoundMsg);
            });

            io.to(gameRoom).emit('startRound', joinGameMsg);
        });
        
        const username = socket.handshake.query?.username;
        console.log('Connected as ', username);
        if (username) {
            const incomingRoomName = `userRoom:${username}`
            socket.join(incomingRoomName);

            socket.on('userChat', (userChatMsg) => {
                console.log('Received: ', userChatMsg);
                const outgoingRoomName = `userRoom:${userChatMsg.receiver}`;
                io.to(outgoingRoomName).emit('userChat', userChatMsg);
            });
        }

        socket.emit('eventFromServer', welcomeMessage);
    });

    globalThis.io = io;
    return io;
}

export { webSocket };
