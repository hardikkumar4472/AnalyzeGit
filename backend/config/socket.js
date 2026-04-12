const { Server } = require('socket.io');
let io;
const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:5173",
            methods: ["GET", "POST"]
        }
    });
    io.on('connection', (socket) => {
        console.log('User Connected:', socket.id);
        
        socket.on('join-analysis', (userId) => {
            console.log(`Frontend requested join-analysis for userId: ${userId}`);
            if (userId && userId !== 'anonymous') {
                socket.join(`user-${userId}`);
                console.log(`Socket ${socket.id} joined room: user-${userId}`);
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
