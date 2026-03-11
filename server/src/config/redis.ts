import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
  },
});

redisClient.on('error', (err) => console.error('❌ Redis error:', err));
redisClient.on('connect', () => console.log('✅ Redis connected'));

export const connectRedis = async (): Promise<void> => {
  await redisClient.connect();
};
