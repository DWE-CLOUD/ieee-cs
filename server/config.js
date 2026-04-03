import path from 'node:path';

const rootDir = process.cwd();

const parseList = (value) =>
  (value || '')
    .split(/[,\n]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

export const config = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  uploadsDir: process.env.UPLOADS_DIR || path.join(rootDir, 'data', 'uploads'),
  appUrl: process.env.PUBLIC_APP_URL || '',
  railwayPublicDomain: process.env.RAILWAY_PUBLIC_DOMAIN || '',
  allowedOrigins: parseList(process.env.ALLOWED_ORIGINS),
  adminEmails: parseList(process.env.ADMIN_EMAILS),
  cookieName: process.env.SESSION_COOKIE_NAME || 'ppp_session',
  appName: process.env.APP_NAME || 'IEEE Computer Society',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 465),
  smtpSecure: String(process.env.SMTP_SECURE || 'true').toLowerCase() !== 'false',
  smtpService: process.env.SMTP_SERVICE || '',
  smtpFamily: Number(process.env.SMTP_FAMILY || 4),
  smtpConnectionTimeoutMs: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 15000),
  smtpGreetingTimeoutMs: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 15000),
  smtpSocketTimeoutMs: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 20000),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  mailFrom: process.env.MAIL_FROM || process.env.SMTP_USER || '',
  passwordResetPath: process.env.PASSWORD_RESET_PATH || '/reset-password',
  magicLoginPath: process.env.MAGIC_LOGIN_PATH || '/magic-login',
};

export const isProduction = config.nodeEnv === 'production';
