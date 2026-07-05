const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const { logger } = require('../utils/logger');

let io = null;

const initSocket = (server) => {
    io = socketIO(server, {
        cors: {
            origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174'],
            credentials: true,
            methods: ['GET', 'POST'],
        },
    });

    // Socket middleware for auth
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];
            if (!token) {
                return next(new Error('Authentication error: Token missing'));
            }

            // Handle Bearer prefix if present
            const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
            const decoded = jwt.verify(cleanToken, env.JWT_ACCESS_SECRET);

            const user = await User.findById(decoded.id).select('isActive');
            if (!user || !user.isActive) {
                return next(new Error('Authentication error: User not found or inactive'));
            }

            socket.user = { id: decoded.id };
            next();
        } catch (err) {
            logger.error(`Socket auth failed: ${err.message}`);
            return next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.user.id;
        logger.info(`🔌 User connected to Socket: ${userId}`);

        // Join room specifically for this user
        socket.join(userId);

        socket.on('disconnect', () => {
            logger.info(`🔌 User disconnected from Socket: ${userId}`);
        });
    });

    return io;
};

const getIO = () => {
    return io;
};

/**
 * Sends a real-time event to a specific user
 * @param {String} userId 
 * @param {String} eventName 
 * @param {Object} data 
 */
const sendToUser = (userId, eventName, data) => {
    if (io) {
        io.to(userId.toString()).emit(eventName, data);
        logger.info(`📣 Socket event [${eventName}] emitted to user: ${userId}`);
    } else {
        logger.warn(`Could not emit event [${eventName}] - Socket.io not initialized`);
    }
};

module.exports = {
    initSocket,
    getIO,
    sendToUser,
};
