const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');
const { getToken } = require('next-auth/jwt');
const { initDatabase, get } = require('./src/lib/db');

const AUTH_SECRET = process.env.NEXTAUTH_SECRET || 'priyo-collection-secret-key-change-in-production-2026';

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

  io.use(async (socket, nextSocket) => {
    try {
      const token = await getToken({ req: socket.request, secret: AUTH_SECRET });
      if (token?.userType) {
        socket.data.userId = Number(token.id);
        socket.data.userType = token.userType;
      } else {
        const guestPhone = String(socket.handshake.auth?.guestPhone || '').trim();
        socket.data.guestPhone = guestPhone;
        socket.data.userType = guestPhone ? 'customer' : 'guest';
      }
    } catch (error) {
      socket.data.userType = 'guest';
    }
    nextSocket();
  });

  async function canAccessConversation(socket, conversationId) {
    if (socket.data.userType === 'admin') return true;
    if (socket.data.userType !== 'customer') return false;

    await initDatabase();
    const conversation = get('SELECT user_id FROM conversations WHERE id = ?', [conversationId]);
    if (!conversation) return false;
    if (socket.data.userId && Number(conversation.user_id) === Number(socket.data.userId)) return true;

    if (socket.data.guestPhone) {
      const owner = get(
        "SELECT id FROM users WHERE id = ? AND phone = ? AND user_type = 'customer'",
        [conversation.user_id, socket.data.guestPhone]
      );
      if (owner) {
        socket.data.userId = Number(owner.id);
        return true;
      }
    }
    return false;
  }

  // Track online users
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // User comes online
    socket.on('user:online', async () => {
      if (!socket.data.userId && socket.data.guestPhone) {
        await initDatabase();
        const user = get("SELECT id FROM users WHERE phone = ? AND user_type = 'customer' AND status = 'active'", [socket.data.guestPhone]);
        if (user) socket.data.userId = Number(user.id);
      }

      const userId = socket.data.userId;
      const userType = socket.data.userType;
      if (!userId || !['customer', 'admin'].includes(userType)) return;
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
      if (socket.data.userType === 'admin') socket.join('admins');
    });

    // Join conversation room
    socket.on('conversation:join', async (conversationId) => {
      if (await canAccessConversation(socket, conversationId)) {
        socket.join(`conversation:${conversationId}`);
      }
    });

    // Leave conversation room
    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // New message
    socket.on('message:send', async (data) => {
      const { conversationId, message } = data || {};
      if (!message || message.sender_type !== socket.data.userType || !(await canAccessConversation(socket, conversationId))) return;
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
    socket.on('typing:start', async (data) => {
      const { conversationId } = data || {};
      if (!(await canAccessConversation(socket, conversationId))) return;
      socket.to(`conversation:${conversationId}`).emit('typing:show', {
        userId: socket.data.userId,
        userType: socket.data.userType,
      });
    });

    socket.on('typing:stop', async (data) => {
      const { conversationId } = data || {};
      if (!(await canAccessConversation(socket, conversationId))) return;
      socket.to(`conversation:${conversationId}`).emit('typing:stop', {
        userId: socket.data.userId,
        userType: socket.data.userType,
      });
    });

    // Message read
    socket.on('message:read', async (data) => {
      const { conversationId } = data || {};
      if (!(await canAccessConversation(socket, conversationId))) return;
      io.to(`conversation:${conversationId}`).emit('message:read', {
        conversationId,
        readBy: socket.data.userId,
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      if (socket.data.userId) {
        onlineUsers.delete(socket.data.userId);
        if (socket.data.userType === 'customer') {
          io.to('admins').emit('customer:offline', { userId: socket.data.userId });
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
