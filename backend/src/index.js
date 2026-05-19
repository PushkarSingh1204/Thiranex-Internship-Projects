import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import { socketAuthenticate } from './middleware/auth.js';
import './db.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.set('io', io);

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

io.use(socketAuthenticate);

io.on('connection', (socket) => {
  const room = `user:${socket.user.id}`;
  socket.join(room);
  socket.emit('connected', { userId: socket.user.id });

  socket.on('disconnect', () => {
    socket.leave(room);
  });
});

const PORT = process.env.PORT || 3001;

if (!process.env.JWT_SECRET) {
  console.warn('Warning: JWT_SECRET not set. Using insecure default for development.');
  process.env.JWT_SECRET = 'dev-secret-change-in-production';
}

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
