import path from 'node:path';
import express from 'express';
import { query, withTransaction } from '../db.js';
import {
  buildAbsoluteUrl,
  canManageTeam,
  clearSessionCookie,
  ensurePositionAccess,
  generatePlainToken,
  hashToken,
  hashPassword,
  isAdminEmail,
  normalizeEmail,
  parseArray,
  requireAuth,
  resolvePrivatePath,
  sendError,
  setSessionCookie,
  toSlug,
  upload,
  verifyPassword,
  writeUpload,
} from '../app-lib.js';
import { config } from '../config.js';
import { sendEmail } from '../mailer.js';
import {
  buildMagicLoginEmail,
  buildPasswordResetEmail,
  buildWelcomeEmail,
} from '../email-templates.js';

const router = express.Router();

const PASSWORD_RESET_WINDOW_MS = 1000 * 60 * 60;
const MAGIC_LOGIN_WINDOW_MS = 1000 * 60 * 20;

const persistAuthToken = async (userId, purpose, durationMs) => {
  const token = generatePlainToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + durationMs).toISOString();

  await query(
    `
      INSERT INTO auth_tokens (user_id, purpose, token_hash, expires_at)
      VALUES ($1, $2, $3, $4)
    `,
    [userId, purpose, tokenHash, expiresAt]
  );

  return token;
};

const consumeAuthToken = async (purpose, plainToken) => {
  const tokenHash = hashToken(plainToken);
  const { rows } = await query(
    `
      UPDATE auth_tokens
      SET consumed_at = now()
      WHERE token_hash = $1
        AND purpose = $2
        AND consumed_at IS NULL
        AND expires_at > now()
      RETURNING user_id
    `,
    [tokenHash, purpose]
  );

  return rows[0]?.user_id || null;
};

const sendWelcomeEmailSafely = async ({ email, fullName }) => {
  try {
    const template = buildWelcomeEmail({ email, fullName });
    await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  } catch (error) {
    console.error('Welcome email failed', error);
  }
};

const buildPasswordResetUrl = (token) =>
  buildAbsoluteUrl(`${config.passwordResetPath}?token=${encodeURIComponent(token)}`);

const buildMagicLoginUrl = (token) =>
  buildAbsoluteUrl(`${config.magicLoginPath}?token=${encodeURIComponent(token)}`);

router.get('/health', (_req, res) => {
  res.json({ ok: true });
});

router.get('/site-content/home', async (_req, res) => {
  try {
    const { rows } = await query('SELECT content FROM site_content WHERE key = $1', ['home']);
    res.json(rows[0]?.content || {});
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/auth/session', async (req, res) => {
  if (!req.viewer) {
    res.json({
      user: null,
      session: null,
      profile: null,
      isAdmin: false,
      isManager: false,
      managedTeams: [],
      isGalleryCollaborator: false,
    });
    return;
  }

  res.json({
    user: req.viewer.user,
    session: { user: req.viewer.user },
    profile: req.viewer.profile,
    isAdmin: req.viewer.isAdmin,
    isManager: req.viewer.isManager,
    managedTeams: req.viewer.managedTeams,
    isGalleryCollaborator: req.viewer.isGalleryCollaborator,
  });
});

router.post('/auth/signup', async (req, res) => {
  const { email, password, fullName } = req.body || {};
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    const normalizedEmail = normalizeEmail(email);
    const passwordHash = await hashPassword(password);

    const user = await withTransaction(async (client) => {
      const { rows } = await client.query(
        `
          INSERT INTO users (email, password_hash, full_name)
          VALUES ($1, $2, $3)
          RETURNING id, email
        `,
        [normalizedEmail, passwordHash, fullName || null]
      );

      const createdUser = rows[0];
      await client.query(
        `
          INSERT INTO profiles (user_id, display_name, email)
          VALUES ($1, $2, $3)
        `,
        [createdUser.id, fullName || normalizedEmail.split('@')[0], normalizedEmail]
      );
      await client.query(
        'INSERT INTO user_roles (user_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [createdUser.id, 'user']
      );

      if (isAdminEmail(normalizedEmail)) {
        await client.query(
          'INSERT INTO user_roles (user_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [createdUser.id, 'admin']
        );
      }

      return createdUser;
    });

    setSessionCookie(res, user);
    void sendWelcomeEmailSafely({ email: normalizedEmail, fullName });
    res.status(201).json({ ok: true });
  } catch (error) {
    if (String(error.message).includes('users_email_key')) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }
    sendError(res, error);
  }
});

router.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  try {
    const normalizedEmail = normalizeEmail(email);
    const { rows } = await query('SELECT id, email FROM users WHERE email = $1', [normalizedEmail]);
    const user = rows[0];

    if (user) {
      await query(
        "DELETE FROM auth_tokens WHERE user_id = $1 AND purpose = 'password_reset'",
        [user.id]
      );
      const token = await persistAuthToken(user.id, 'password_reset', PASSWORD_RESET_WINDOW_MS);
      const resetUrl = buildPasswordResetUrl(token);
      const template = buildPasswordResetEmail({ email: user.email, resetUrl });
      await sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
    }

    res.json({
      ok: true,
      message: 'If an account exists for that email, a reset link has been sent.',
    });
  } catch (error) {
    sendError(res, error);
  }
});

router.post('/auth/reset-password', async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) {
    res.status(400).json({ error: 'Token and password are required' });
    return;
  }

  if (String(password).length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  try {
    const userId = await consumeAuthToken('password_reset', token);
    if (!userId) {
      res.status(400).json({ error: 'This reset link is invalid or has expired' });
      return;
    }

    const passwordHash = await hashPassword(password);
    await query('UPDATE users SET password_hash = $2 WHERE id = $1', [userId, passwordHash]);
    await query("DELETE FROM auth_tokens WHERE user_id = $1 AND purpose = 'password_reset'", [userId]);

    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

router.post('/auth/magic-link', async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  try {
    const normalizedEmail = normalizeEmail(email);
    const { rows } = await query('SELECT id, email FROM users WHERE email = $1', [normalizedEmail]);
    const user = rows[0];

    if (user) {
      await query(
        "DELETE FROM auth_tokens WHERE user_id = $1 AND purpose = 'magic_login'",
        [user.id]
      );
      const token = await persistAuthToken(user.id, 'magic_login', MAGIC_LOGIN_WINDOW_MS);
      const magicUrl = buildMagicLoginUrl(token);
      const template = buildMagicLoginEmail({ email: user.email, magicUrl });
      await sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
    }

    res.json({
      ok: true,
      message: 'If an account exists for that email, a magic login link has been sent.',
    });
  } catch (error) {
    sendError(res, error);
  }
});

router.post('/auth/magic/verify', async (req, res) => {
  const { token } = req.body || {};
  if (!token) {
    res.status(400).json({ error: 'Token is required' });
    return;
  }

  try {
    const userId = await consumeAuthToken('magic_login', token);
    if (!userId) {
      res.status(400).json({ error: 'This magic link is invalid or has expired' });
      return;
    }

    const { rows } = await query('SELECT id, email FROM users WHERE id = $1', [userId]);
    const user = rows[0];
    if (!user) {
      res.status(400).json({ error: 'User not found' });
      return;
    }

    await query("DELETE FROM auth_tokens WHERE user_id = $1 AND purpose = 'magic_login'", [userId]);
    setSessionCookie(res, user);
    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

router.post('/auth/signin', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    const normalizedEmail = normalizeEmail(email);
    const { rows } = await query(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [normalizedEmail]
    );
    const user = rows[0];

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    setSessionCookie(res, user);
    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

router.post('/auth/signout', (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

router.get('/positions', async (_req, res) => {
  try {
    const { rows } = await query(
      `
        SELECT
          p.*,
          CASE
            WHEN t.id IS NULL THEN NULL
            ELSE json_build_object('id', t.id, 'name', t.name, 'color', t.color)
          END AS teams
        FROM positions p
        LEFT JOIN teams t ON t.id = p.team_id
        ORDER BY p.created_at DESC
      `
    );
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/teams', async (_req, res) => {
  try {
    const { rows } = await query('SELECT * FROM teams ORDER BY name');
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/events', async (_req, res) => {
  try {
    const { rows } = await query('SELECT * FROM events ORDER BY date ASC');
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/events/upcoming', async (_req, res) => {
  try {
    const { rows } = await query(
      `
        SELECT *
        FROM events
        WHERE status = 'upcoming' AND date >= now()
        ORDER BY date ASC
        LIMIT 6
      `
    );
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/gallery/preview', async (_req, res) => {
  try {
    const { rows } = await query(
      'SELECT id, title, category, image_url FROM gallery_images ORDER BY display_order ASC, created_at DESC LIMIT 8'
    );
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/gallery/albums', async (_req, res) => {
  try {
    const { rows } = await query(
      `
        SELECT
          ga.*,
          COUNT(gi.id)::int AS image_count
        FROM gallery_albums ga
        LEFT JOIN gallery_images gi ON gi.album_id = ga.id
        GROUP BY ga.id
        ORDER BY ga.display_order ASC, ga.created_at DESC
      `
    );
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/gallery/albums/:albumId/images', async (req, res) => {
  try {
    const { rows } = await query(
      `
        SELECT *
        FROM gallery_images
        WHERE album_id = $1
        ORDER BY display_order ASC, created_at DESC
      `,
      [req.params.albumId]
    );
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/gallery/images', async (req, res) => {
  try {
    const params = [];
    let whereClause = '';
    if (req.query.albumId) {
      params.push(req.query.albumId);
      whereClause = 'WHERE album_id = $1';
    }
    const { rows } = await query(
      `
        SELECT *
        FROM gallery_images
        ${whereClause}
        ORDER BY display_order ASC, created_at DESC
      `,
      params
    );
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/teams-with-members', async (_req, res) => {
  try {
    const { rows: teams } = await query('SELECT * FROM teams ORDER BY name');
    const { rows: members } = await query(
      `
        SELECT
          tm.*,
          json_build_object(
            'display_name', p.display_name,
            'avatar_url', p.avatar_url,
            'linkedin_url', p.linkedin_url,
            'github_url', p.github_url
          ) AS profiles
        FROM team_members tm
        LEFT JOIN profiles p ON p.user_id = tm.user_id
        ORDER BY tm.joined_at ASC
      `
    );

    res.json(
      teams.map((team) => ({
        ...team,
        members: members
          .filter((member) => member.team_id === team.id)
          .sort((a, b) => Number(Boolean(b.is_head)) - Number(Boolean(a.is_head))),
      }))
    );
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/profile', requireAuth, async (req, res) => {
  res.json(req.viewer.profile);
});

router.patch('/profile', requireAuth, async (req, res) => {
  const { display_name, phone, bio, linkedin_url, github_url, twitter_url } = req.body || {};
  try {
    await query(
      `
        UPDATE profiles
        SET
          display_name = $2,
          phone = $3,
          bio = $4,
          linkedin_url = $5,
          github_url = $6,
          twitter_url = $7
        WHERE user_id = $1
      `,
      [
        req.viewer.user.id,
        display_name || null,
        phone || null,
        bio || null,
        linkedin_url || null,
        github_url || null,
        twitter_url || null,
      ]
    );
    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

router.post('/profile/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Avatar file is required' });
    return;
  }

  try {
    const ext = path.extname(req.file.originalname) || '.png';
    const fileName = `${req.viewer.user.id}${ext}`;
    const publicUrl = await writeUpload('avatars', fileName, req.file.buffer);

    await query('UPDATE profiles SET avatar_url = $2 WHERE user_id = $1', [
      req.viewer.user.id,
      publicUrl,
    ]);

    res.json({ avatar_url: publicUrl });
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/team-memberships/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      `
        SELECT
          tm.id,
          tm.team_id,
          tm.position_title,
          tm.joined_at,
          json_build_object(
            'id', t.id,
            'name', t.name,
            'color', t.color
          ) AS teams
        FROM team_members tm
        JOIN teams t ON t.id = tm.team_id
        WHERE tm.user_id = $1
      `,
      [req.viewer.user.id]
    );
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/applications/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      `
        SELECT
          a.id,
          a.status,
          a.created_at,
          a.updated_at,
          json_build_object(
            'id', p.id,
            'title', p.title,
            'team',
            CASE
              WHEN t.id IS NULL THEN NULL
              ELSE json_build_object('name', t.name, 'color', t.color)
            END
          ) AS position
        FROM applications a
        JOIN positions p ON p.id = a.position_id
        LEFT JOIN teams t ON t.id = p.team_id
        WHERE a.user_id = $1
        ORDER BY a.created_at DESC
      `,
      [req.viewer.user.id]
    );
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
});

router.post('/applications', requireAuth, upload.any(), async (req, res) => {
  const body = req.body || {};
  if (!body.position_id) {
    res.status(400).json({ error: 'position_id is required' });
    return;
  }

  try {
    const fileMap = new Map((req.files || []).map((file) => [file.fieldname, file]));
    const responsesPayload = body.responses ? JSON.parse(body.responses) : [];

    const application = await withTransaction(async (client) => {
      const { rows: insertedApplications } = await client.query(
        `
          INSERT INTO applications (position_id, user_id, full_name, email, phone, cover_letter, resume_url, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
          RETURNING *
        `,
        [
          body.position_id,
          req.viewer.user.id,
          body.full_name || req.viewer.profile.display_name || req.viewer.user.email.split('@')[0],
          req.viewer.user.email,
          body.phone || null,
          body.cover_letter || null,
          null,
        ]
      );

      const insertedApplication = insertedApplications[0];
      let resumePath = null;
      const responseRows = [];

      for (const response of responsesPayload) {
        let value = response.response_value;
        if (response.field_type === 'file') {
          const file = fileMap.get(response.field_id);
          if (file) {
            const ext = path.extname(file.originalname) || '';
            const fileName = `${req.viewer.user.id}-${insertedApplication.id}-${toSlug(response.field_id)}${ext}`;
            value = await writeUpload('resumes', fileName, file.buffer, true);
            if (!resumePath) {
              resumePath = value;
            }
          }
        }

        if (value !== undefined && value !== null && value !== '') {
          responseRows.push([
            insertedApplication.id,
            response.field_id,
            response.field_label,
            response.field_type,
            Array.isArray(value) ? value.join(', ') : String(value),
          ]);
        }
      }

      if (resumePath) {
        await client.query('UPDATE applications SET resume_url = $2 WHERE id = $1', [
          insertedApplication.id,
          resumePath,
        ]);
      }

      if (responseRows.length > 0) {
        const values = [];
        const placeholders = responseRows
          .map((row, index) => {
            const offset = index * 5;
            values.push(...row);
            return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`;
          })
          .join(', ');

        await client.query(
          `
            INSERT INTO application_responses (
              application_id,
              field_id,
              field_label,
              field_type,
              response_value
            )
            VALUES ${placeholders}
          `,
          values
        );
      }

      return insertedApplication;
    });

    res.status(201).json(application);
  } catch (error) {
    if (String(error.message).includes('applications_position_id_user_id_key')) {
      res.status(409).json({ error: 'You have already applied for this position' });
      return;
    }
    sendError(res, error);
  }
});

router.get('/manager/team-members', requireAuth, async (req, res) => {
  const teamId = String(req.query.teamId || '');
  if (!teamId || !canManageTeam(req.viewer, teamId)) {
    res.status(403).json({ error: 'Team access denied' });
    return;
  }

  try {
    const { rows } = await query(
      `
        SELECT
          tm.*,
          json_build_object(
            'display_name', p.display_name,
            'email', p.email,
            'phone', p.phone,
            'bio', p.bio,
            'linkedin_url', p.linkedin_url,
            'github_url', p.github_url,
            'twitter_url', p.twitter_url
          ) AS profiles
        FROM team_members tm
        LEFT JOIN profiles p ON p.user_id = tm.user_id
        WHERE tm.team_id = $1
        ORDER BY tm.joined_at DESC
      `,
      [teamId]
    );

    const userIds = rows.map((row) => row.user_id);
    const applications = userIds.length
      ? (await query('SELECT id, user_id FROM applications WHERE user_id = ANY($1::uuid[])', [userIds])).rows
      : [];
    const appIds = applications.map((application) => application.id);
    const responses = appIds.length
      ? (
          await query(
            'SELECT application_id, field_label, response_value FROM application_responses WHERE application_id = ANY($1::uuid[])',
            [appIds]
          )
        ).rows
      : [];

    res.json(
      rows.map((member) => ({
        ...member,
        applicationResponses: applications
          .filter((application) => application.user_id === member.user_id)
          .flatMap((application) =>
            responses
              .filter((response) => response.application_id === application.id)
              .map((response) => ({
                field_label: response.field_label,
                response_value: response.response_value,
              }))
          ),
      }))
    );
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/applications/:id/file', requireAuth, async (req, res) => {
  try {
    const { rows: apps } = await query(
      'SELECT position_id, user_id, resume_url FROM applications WHERE id = $1',
      [req.params.id]
    );
    const application = apps[0];
    const requestedPath = typeof req.query.path === 'string' ? req.query.path : application?.resume_url;
    if (!requestedPath) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    const canView =
      req.viewer.isAdmin ||
      application.user_id === req.viewer.user.id ||
      (await ensurePositionAccess(req.viewer, application.position_id));
    if (!canView) {
      res.status(403).json({ error: 'File access denied' });
      return;
    }

    res.download(resolvePrivatePath(requestedPath));
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
