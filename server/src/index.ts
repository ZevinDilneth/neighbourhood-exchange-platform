import 'dotenv/config';
import dns from 'dns';
// Force IPv4-only public DNS — fixes SRV lookup ECONNREFUSED on some routers
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';

import { connectDB } from './config/db';
import { connectRedis } from './config/redis';
import { errorHandler, notFound } from './middleware/errorHandler';
import { setupSocket } from './socket';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import postRoutes from './routes/posts';
import exchangeRoutes from './routes/exchanges';
import groupRoutes from './routes/groups';

const app = express();
const httpServer = http.createServer(app);

// Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 120000,
  },
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return cb(null, true);
    if (allowedOrigins.some((o) => origin.startsWith(o))) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Health check (both paths for Railway + generic monitors)
let dbReady = false;
const healthHandler = (_req: express.Request, res: express.Response) =>
  res.json({ status: 'ok', db: dbReady, timestamp: new Date().toISOString() });
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/exchanges', exchangeRoutes);
app.use('/api/groups', groupRoutes);

// Socket.IO setup
setupSocket(io);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start listening FIRST so Railway healthcheck passes, then connect to DB/Redis
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});

(async () => {
  try {
    await connectDB();
    dbReady = true;
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    // Don't exit — let Railway see the process is alive; it will retry on next deploy
  }
  try {
    await connectRedis();
  } catch (err) {
    console.warn('⚠️  Redis not available, continuing without cache');
  }
})();
