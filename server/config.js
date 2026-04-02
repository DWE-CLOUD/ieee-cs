import path from 'node:path';

const rootDir = process.cwd();

const parseList = (value) =>
  (value || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

export const config = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  uploadsDir: process.env.UPLOADS_DIR || path.join(rootDir, 'data', 'uploads'),
  appUrl: process.env.PUBLIC_APP_URL || '',
  allowedOrigins: parseList(process.env.ALLOWED_ORIGINS),
  adminEmails: parseList(process.env.ADMIN_EMAILS),
  cookieName: process.env.SESSION_COOKIE_NAME || 'ppp_session',
};

export const isProduction = config.nodeEnv === 'production';
