import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env';
import { initDatabase } from './config/database';
import { initRedis } from './config/redis';
import { sessionMiddleware } from './middleware/session';

// Route modules
import magicLinkRouter from './routes/api/auth/magic-link';
import verifyRouter from './routes/api/auth/verify';
import meRouter from './routes/api/users/me';
import profileRouter from './routes/api/users/profile';
import leaderboardRouter from './routes/api/leaderboard/index';
import adminEventsRouter from './routes/api/admin/events';
import adminUploadRouter from './routes/api/admin/upload';

async function bootstrap(): Promise<void> {
  // ── Database & Redis (skipped in dev — in-memory store is used instead) ─────
  if (!env.isDev) {
    console.log('[MMXP] Connecting to database...');
    await initDatabase();
    console.log('[MMXP] Database connected');

    console.log('[MMXP] Connecting to Redis...');
    await initRedis();
    console.log('[MMXP] Redis connected');
  } else {
    console.log('[MMXP] Dev mode — using in-memory store (no database or Redis required)');
  }

  // ── Express App ─────────────────────────────────────────────────────────────
  const app = express();

  app.set('trust proxy', 1);

  // Security headers
  app.use(helmet());

  // CORS — separate from Revv's CORS config; only allow the MMXP frontend origin
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Request logging
  app.use(morgan(env.isDev ? 'dev' : 'combined'));

  // Body parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Session — uses mmxp_session cookie, completely separate from Revv's pid cookie
  app.use(sessionMiddleware);

  // ── Routes ───────────────────────────────────────────────────────────────────
  app.use('/api/auth/magic-link', magicLinkRouter);
  app.use('/api/auth', verifyRouter);

  app.use('/api/users/me', meRouter);
  app.use('/api/users/profile', profileRouter);

  app.use('/api/leaderboard', leaderboardRouter);

  app.use('/api/admin/events', adminEventsRouter);
  app.use('/api/admin/upload', adminUploadRouter);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'mmxp', ts: new Date().toISOString() });
  });

  // 404 catch-all
  app.use((_req, res) => {
    res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  // ── Start listening ──────────────────────────────────────────────────────────
  app.listen(env.PORT, () => {
    console.log(`[MMXP] Server running on port ${env.PORT} (${env.NODE_ENV})`);
  });
}

bootstrap().catch((err) => {
  console.error('[MMXP] Fatal startup error:', err);
  process.exit(1);
});
