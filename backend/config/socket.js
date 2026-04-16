const { Server } = require('socket.io');
let io;
const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });
    io.on('connection', (socket) => {
        console.log('User Connected:', socket.id);
        
        socket.on('join-analysis', (userId) => {
            if (userId && userId !== 'anonymous') {
                if (userId.startsWith('guest_')) {
                    socket.join(`socket-${userId}`);
                    console.log(`Guest Socket ${socket.id} joined persistent link: socket-${userId}`);
                } else {
                    socket.join(`user-${userId}`);
                    console.log(`Socket ${socket.id} joined room: user-${userId}`);
                }
            } else {
                socket.join(`socket-${socket.id}`);
                console.log(`Guest Socket ${socket.id} joined private room: socket-${socket.id}`);
            }
        });
        socket.on('disconnect', () => {
            console.log('User Disconnected:', socket.id);
        });
    });
    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

module.exports = { initSocket, getIO };
