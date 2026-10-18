const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');

if (process.argv.includes('--production')) {
  process.env.NODE_ENV = 'production';
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const fs = require('fs');
const path = require('path');

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const MIME_MAP = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
};

app.prepare().then(() => {
  const server = createServer((req, res) => {
    try {
      const parsedUrl = new URL(req.url, `http://${hostname}:${port}`);
      if (parsedUrl.pathname.startsWith('/data/images/')) {
        const rawFilename = parsedUrl.pathname.replace('/data/images/', '');
        const safeFilename = path.basename(decodeURIComponent(rawFilename));
        const filePath = path.join(process.cwd(), 'data', 'images', safeFilename);

        if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
          const ext = path.extname(safeFilename).toLowerCase();
          res.writeHead(200, {
            'Content-Type': MIME_MAP[ext] || 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000, immutable',
          });
          fs.createReadStream(filePath).pipe(res);
          return;
        }
      }
    } catch (e) {
      // Fall through to Next.js handler
    }

    handle(req, res);
  });


  const io = new Server(server, {
    cors: {
      origin: dev ? `http://${hostname}:${port}` : process.env.NEXTAUTH_URL,
      methods: ['GET', 'POST'],
    },
    path: '/api/socketio',
  });

  // Track online users
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // User comes online
    socket.on('user:online', (data) => {
      const { userId, userType } = data;
      onlineUsers.set(userId, { socketId: socket.id, userType, userId });
      socket.userId = userId;
      socket.userType = userType;

      // Join personal room
      socket.join(`user:${userId}`);

      // Notify admins about online status
      if (userType === 'customer') {
        io.to('admins').emit('customer:online', { userId });
      }

      // Broadcast online users to admins
      const customers = Array.from(onlineUsers.values())
        .filter((u) => u.userType === 'customer')
        .map((u) => u.userId);
      io.to('admins').emit('online:customers', customers);
    });

    // Admin joins admin room
    socket.on('admin:join', () => {
      socket.join('admins');
    });

    // Join conversation room
    socket.on('conversation:join', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    // Leave conversation room
    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // New message
    socket.on('message:send', (data) => {
      const { conversationId, message } = data;
      // Broadcast to everyone in the conversation room
      io.to(`conversation:${conversationId}`).emit('message:new', message);
      // Also notify admins
      io.to('admins').emit('conversation:updated', {
        conversationId,
        lastMessage: message.message,
        lastMessageAt: message.created_at,
        senderType: message.sender_type,
      });
    });

    // Typing indicator
    socket.on('typing:start', (data) => {
      const { conversationId, userId, userType } = data;
      socket.to(`conversation:${conversationId}`).emit('typing:show', {
        userId,
        userType,
      });
    });

    socket.on('typing:stop', (data) => {
      const { conversationId, userId, userType } = data;
      socket.to(`conversation:${conversationId}`).emit('typing:hide', {
        userId,
        userType,
      });
    });

    // Message read
    socket.on('message:read', (data) => {
      const { conversationId, userId } = data;
      io.to(`conversation:${conversationId}`).emit('message:read', {
        conversationId,
        readBy: userId,
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        if (socket.userType === 'customer') {
          io.to('admins').emit('customer:offline', { userId: socket.userId });
        }
        const customers = Array.from(onlineUsers.values())
          .filter((u) => u.userType === 'customer')
          .map((u) => u.userId);
        io.to('admins').emit('online:customers', customers);
      }
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  // Store io instance for API routes
  global.io = io;

  server.listen(port, () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║                                                  ║
║   🛍️  NOBO FASHION                               ║
║   Women's Fashion & Three-Piece in Bangladesh    ║
║                                                  ║
║   Server:  http://${hostname}:${port}                  ║
║   Admin:   http://${hostname}:${port}/admin             ║
║   Mode:    ${dev ? 'Development' : 'Production'}                          ║
║                                                  ║
╚══════════════════════════════════════════════════╝
    `);
  });
});
