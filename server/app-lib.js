import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sharp from 'sharp';
import { config, isProduction } from './config.js';
import { query } from './db.js';

export const distDir = path.join(process.cwd(), 'dist');
export const publicUploadsDir = path.join(config.uploadsDir, 'public');
export const privateUploadsDir = path.join(config.uploadsDir, 'private');

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: isProduction,
  path: '/',
  maxAge: 1000 * 60 * 60 * 24 * 7,
};

export const normalizeEmail = (email) => email.trim().toLowerCase();
export const parseArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (!value) {
    return [];
  }
  return String(value)
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
};
export const toSlug = (value) =>
  String(value || 'file')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'file';

export const allowedOrigins = new Set(
  [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    ...config.allowedOrigins,
    config.appUrl,
    config.railwayPublicDomain ? `https://${config.railwayPublicDomain}` : '',
  ]
    .filter(Boolean)
    .map((origin) => origin.toLowerCase())
);

export const isAdminEmail = (email) => config.adminEmails.includes(normalizeEmail(email));

export const ensureDirectories = async () => {
  await fs.mkdir(path.join(publicUploadsDir, 'avatars'), { recursive: true });
  await fs.mkdir(path.join(publicUploadsDir, 'gallery'), { recursive: true });
  await fs.mkdir(path.join(publicUploadsDir, '.cache'), { recursive: true });
  await fs.mkdir(path.join(privateUploadsDir, 'resumes'), { recursive: true });
};

export const writeUpload = async (bucket, fileName, buffer, isPrivate = false) => {
  const baseDir = isPrivate ? privateUploadsDir : publicUploadsDir;
  const fullDir = path.join(baseDir, bucket);
  await fs.mkdir(fullDir, { recursive: true });
  const fullPath = path.join(fullDir, fileName);
  await fs.writeFile(fullPath, buffer);
  return isPrivate ? `${bucket}/${fileName}` : `/uploads/${bucket}/${fileName}`;
};

export const optimizeUploadedImage = async (buffer, options = {}) => {
  const {
    width = 1920,
    height,
    quality = 80,
  } = options;

  return sharp(buffer)
    .rotate()
    .resize({
      width,
      height,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality })
    .toBuffer();
};

export const resolvePrivatePath = (relativePath) => {
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
  return path.join(privateUploadsDir, normalized);
};

export const signSession = (user) =>
  jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, { expiresIn: '7d' });

export const setSessionCookie = (res, user) => {
  res.cookie(config.cookieName, signSession(user), cookieOptions);
};

export const clearSessionCookie = (res) => {
  res.clearCookie(config.cookieName, { ...cookieOptions, maxAge: undefined });
};

const getTokenUserId = (req) => {
  const token = req.cookies[config.cookieName];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    return payload.sub;
  } catch {
    return null;
  }
};

export const loadViewer = async (userId) => {
  if (!userId) return null;

  const { rows: users } = await query(
    `
      SELECT
        u.id,
        u.email,
        p.display_name,
        p.phone,
        p.bio,
        p.avatar_url,
        p.headline,
        p.location,
        p.website_url,
        p.cover_image_url,
        p.public_slug,
        p.theme_primary,
        p.theme_secondary,
        p.theme_surface,
        p.profile_intro_label,
        p.about_title,
        p.specialties_title,
        p.highlights_title,
        p.connect_title,
        p.focus_title,
        p.focus_body,
        p.cta_label,
        p.cta_url,
        p.specialties,
        p.achievements,
        p.favorite_quote,
        p.linkedin_url,
        p.github_url,
        p.twitter_url
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.id = $1
    `,
    [userId]
  );

  if (!users[0]) return null;

  const { rows: roles } = await query(
    'SELECT role FROM user_roles WHERE user_id = $1 ORDER BY role',
    [userId]
  );
  const { rows: managedTeams } = await query(
    `
      SELECT t.id AS team_id, t.name AS team_name
      FROM team_managers tm
      JOIN teams t ON t.id = tm.team_id
      WHERE tm.user_id = $1
      ORDER BY t.name
    `,
    [userId]
  );
  const { rows: collaborators } = await query(
    'SELECT 1 FROM gallery_collaborators WHERE user_id = $1',
    [userId]
  );

  const roleList = roles.map((row) => row.role);

  return {
    user: {
      id: users[0].id,
      email: users[0].email,
    },
    profile: {
      user_id: users[0].id,
      display_name: users[0].display_name,
      email: users[0].email,
      phone: users[0].phone,
      bio: users[0].bio,
      avatar_url: users[0].avatar_url,
      headline: users[0].headline,
      location: users[0].location,
      website_url: users[0].website_url,
      cover_image_url: users[0].cover_image_url,
      public_slug: users[0].public_slug,
      theme_primary: users[0].theme_primary,
      theme_secondary: users[0].theme_secondary,
      theme_surface: users[0].theme_surface,
      profile_intro_label: users[0].profile_intro_label,
      about_title: users[0].about_title,
      specialties_title: users[0].specialties_title,
      highlights_title: users[0].highlights_title,
      connect_title: users[0].connect_title,
      focus_title: users[0].focus_title,
      focus_body: users[0].focus_body,
      cta_label: users[0].cta_label,
      cta_url: users[0].cta_url,
      specialties: users[0].specialties || [],
      achievements: users[0].achievements || [],
      favorite_quote: users[0].favorite_quote,
      linkedin_url: users[0].linkedin_url,
      github_url: users[0].github_url,
      twitter_url: users[0].twitter_url,
    },
    roles: roleList,
    isAdmin: roleList.includes('admin'),
    isManager: roleList.includes('manager'),
    isGalleryCollaborator: collaborators.length > 0,
    managedTeams,
  };
};

export const authMiddleware = async (req, _res, next) => {
  req.viewer = await loadViewer(getTokenUserId(req));
  next();
};

export const requireAuth = (req, res, next) => {
  if (!req.viewer) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  next();
};

export const requireAdmin = (req, res, next) => {
  if (!req.viewer?.isAdmin) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
};

export const requireAdminOrGallery = (req, res, next) => {
  if (!req.viewer?.isAdmin && !req.viewer?.isGalleryCollaborator) {
    res.status(403).json({ error: 'Gallery access required' });
    return;
  }
  next();
};

export const canManageTeam = (viewer, teamId) =>
  Boolean(viewer?.isAdmin || viewer?.managedTeams.some((team) => team.team_id === teamId));

export const ensurePositionAccess = async (viewer, positionId) => {
  const { rows } = await query('SELECT team_id FROM positions WHERE id = $1', [positionId]);
  const teamId = rows[0]?.team_id;
  return teamId ? canManageTeam(viewer, teamId) : Boolean(viewer?.isAdmin);
};

export const buildApplicationsForViewer = async (viewer) => {
  const params = [];
  let whereClause = '';

  if (!viewer.isAdmin) {
    const managedTeamIds = viewer.managedTeams.map((team) => team.team_id);
    params.push(viewer.user.id);
    if (managedTeamIds.length > 0) {
      params.push(managedTeamIds);
      whereClause = `
        WHERE a.user_id = $1
          OR p.team_id = ANY($2::uuid[])
      `;
    } else {
      whereClause = 'WHERE a.user_id = $1';
    }
  }

  const { rows } = await query(
    `
      SELECT
        a.*,
        json_build_object(
          'id', p.id,
          'title', p.title,
          'team_id', p.team_id
        ) AS positions
      FROM applications a
      JOIN positions p ON p.id = a.position_id
      ${whereClause}
      ORDER BY a.created_at DESC
    `,
    params
  );

  return rows;
};

export const sendError = (res, error) => {
  const message = error instanceof Error ? error.message : 'Unexpected server error';
  res.status(500).json({ error: message });
};

export const hashPassword = (password) => bcrypt.hash(password, 10);
export const verifyPassword = (password, hash) => bcrypt.compare(password, hash);

export const generatePlainToken = () => crypto.randomBytes(32).toString('hex');
export const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

export const buildAbsoluteUrl = (requestPath) => {
  if (!config.appUrl) {
    return requestPath;
  }

  return new URL(requestPath, config.appUrl).toString();
};
