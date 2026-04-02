import path from 'node:path';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { ensureSchema, pool } from './db.js';
import {
  allowedOrigins,
  authMiddleware,
  distDir,
  ensureDirectories,
  publicUploadsDir,
} from './app-lib.js';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';

const app = express();

const normalizeHost = (value) => {
  const rawValue = String(value || '').trim().toLowerCase();
  if (!rawValue) {
    return '';
  }

  try {
    return new URL(`https://${rawValue}`).host.toLowerCase();
  } catch {
    return rawValue;
  }
};

const getRequestHost = (req) =>
  normalizeHost(req.headers['x-forwarded-host'] || req.headers.host || '');

const isSameHostOrigin = (origin, req) => {
  try {
    const originUrl = new URL(origin);
    return normalizeHost(originUrl.host) === getRequestHost(req);
  } catch {
    return false;
  }
};

app.use(
  cors((req, callback) => {
    const origin = req.header('Origin');

    if (!origin) {
      callback(null, { origin: true, credentials: true });
      return;
    }

    const normalizedOrigin = origin.toLowerCase();
    const allowRequest =
      allowedOrigins.size === 0 ||
      allowedOrigins.has(normalizedOrigin) ||
      isSameHostOrigin(origin, req);

    if (allowRequest) {
      callback(null, { origin: true, credentials: true });
      return;
    }

    callback(new Error(`Origin ${origin} not allowed by CORS`));
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(authMiddleware);
app.use('/uploads', express.static(publicUploadsDir, { fallthrough: true }));

app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);

app.use(express.static(distDir));
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    next();
    return;
  }

  res.sendFile(path.join(distDir, 'index.html'));
});

const start = async () => {
  await ensureDirectories();
  await ensureSchema();
  await pool.query('SELECT 1');
  app.listen(config.port, () => {
    console.log(`Server listening on ${config.port}`);
  });
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
