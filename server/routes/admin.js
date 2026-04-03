import path from 'node:path';
import express from 'express';
import { query, withTransaction } from '../db.js';
import {
  buildApplicationsForViewer,
  canManageTeam,
  ensurePositionAccess,
  parseArray,
  requireAdmin,
  requireAdminOrGallery,
  requireAuth,
  resolvePrivatePath,
  sendError,
  toSlug,
  upload,
  writeUpload,
} from '../app-lib.js';

const router = express.Router();

router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const applications = await buildApplicationsForViewer(req.viewer);
    const canSeeUsers = req.viewer.isAdmin;
    const users = canSeeUsers
      ? (
          await query(
            `
              SELECT id, user_id, display_name, email
              FROM profiles
              ORDER BY COALESCE(display_name, email)
            `
          )
        ).rows
      : [];
    const roles = canSeeUsers ? (await query('SELECT user_id, role FROM user_roles')).rows : [];
    const teams = (await query('SELECT * FROM teams ORDER BY name')).rows;
    const positions = (
      await query(
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
      )
    ).rows;
    const events = (await query('SELECT * FROM events ORDER BY date ASC')).rows;

    res.json({
      teams,
      positions: req.viewer.isAdmin
        ? positions
        : positions.filter((position) => position.team_id && canManageTeam(req.viewer, position.team_id)),
      applications,
      users: canSeeUsers
        ? users.map((profile) => ({
            ...profile,
            roles: roles.filter((role) => role.user_id === profile.user_id),
          }))
        : [],
      events,
    });
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/site-content/home', requireAdmin, async (_req, res) => {
  try {
    const { rows } = await query('SELECT content FROM site_content WHERE key = $1', ['home']);
    res.json(rows[0]?.content || {});
  } catch (error) {
    sendError(res, error);
  }
});

router.patch('/site-content/home', requireAdmin, async (req, res) => {
  const content = req.body;
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    res.status(400).json({ error: 'A content object is required' });
    return;
  }

  try {
    await query(
      `
        INSERT INTO site_content (key, content)
        VALUES ('home', $1::jsonb)
        ON CONFLICT (key)
        DO UPDATE SET content = $1::jsonb
      `,
      [JSON.stringify(content)]
    );

    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

router.post('/positions', requireAuth, async (req, res) => {
  const data = req.body || {};
  const teamId = data.team_id || null;
  if (!req.viewer.isAdmin && (!teamId || !canManageTeam(req.viewer, teamId))) {
    res.status(403).json({ error: 'Position access denied' });
    return;
  }

  try {
    const { rows } = await query(
      `
        INSERT INTO positions (title, description, requirements, team_id, type, location, status, deadline, form_fields)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
        RETURNING *
      `,
      [
        data.title,
        data.description,
        parseArray(data.requirements),
        teamId,
        data.type || 'Volunteer',
        data.location || 'Remote',
        data.status || 'open',
        data.deadline || null,
        JSON.stringify(data.form_fields || []),
      ]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    sendError(res, error);
  }
});

router.patch('/positions/:id', requireAuth, async (req, res) => {
  const allowed = await ensurePositionAccess(req.viewer, req.params.id);
  if (!allowed) {
    res.status(403).json({ error: 'Position access denied' });
    return;
  }

  const data = req.body || {};
  try {
    const { rows } = await query(
      `
        UPDATE positions
        SET
          title = $2,
          description = $3,
          requirements = $4,
          team_id = $5,
          type = $6,
          location = $7,
          status = $8,
          deadline = $9,
          form_fields = $10::jsonb
        WHERE id = $1
        RETURNING *
      `,
      [
        req.params.id,
        data.title,
        data.description,
        parseArray(data.requirements),
        data.team_id || null,
        data.type || 'Volunteer',
        data.location || 'Remote',
        data.status || 'open',
        data.deadline || null,
        JSON.stringify(data.form_fields || []),
      ]
    );
    res.json(rows[0]);
  } catch (error) {
    sendError(res, error);
  }
});

router.delete('/positions/:id', requireAuth, async (req, res) => {
  const allowed = await ensurePositionAccess(req.viewer, req.params.id);
  if (!allowed) {
    res.status(403).json({ error: 'Position access denied' });
    return;
  }

  try {
    await query('DELETE FROM positions WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

router.post('/teams', requireAdmin, async (req, res) => {
  try {
    const { rows } = await query(
      'INSERT INTO teams (name, description, color) VALUES ($1, $2, $3) RETURNING *',
      [req.body.name, req.body.description || null, req.body.color || '#3B82F6']
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    sendError(res, error);
  }
});

router.patch('/teams/:id', requireAdmin, async (req, res) => {
  try {
    const { rows } = await query(
      'UPDATE teams SET name = $2, description = $3, color = $4 WHERE id = $1 RETURNING *',
      [req.params.id, req.body.name, req.body.description || null, req.body.color || '#3B82F6']
    );
    res.json(rows[0]);
  } catch (error) {
    sendError(res, error);
  }
});

router.delete('/teams/:id', requireAdmin, async (req, res) => {
  try {
    await query('DELETE FROM teams WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

router.post('/events', requireAdmin, async (req, res) => {
  const data = req.body || {};
  try {
    const { rows } = await query(
      `
        INSERT INTO events (title, description, date, end_date, location, type, image_url, registration_url, is_featured, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `,
      [
        data.title,
        data.description || null,
        data.date,
        data.end_date || null,
        data.location || null,
        data.type || 'Workshop',
        data.image_url || null,
        data.registration_url || null,
        Boolean(data.is_featured),
        data.status || 'upcoming',
      ]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    sendError(res, error);
  }
});

router.patch('/events/:id', requireAdmin, async (req, res) => {
  const data = req.body || {};
  try {
    const { rows } = await query(
      `
        UPDATE events
        SET
          title = $2,
          description = $3,
          date = $4,
          end_date = $5,
          location = $6,
          type = $7,
          image_url = $8,
          registration_url = $9,
          is_featured = $10,
          status = $11
        WHERE id = $1
        RETURNING *
      `,
      [
        req.params.id,
        data.title,
        data.description || null,
        data.date,
        data.end_date || null,
        data.location || null,
        data.type || 'Workshop',
        data.image_url || null,
        data.registration_url || null,
        Boolean(data.is_featured),
        data.status || 'upcoming',
      ]
    );
    res.json(rows[0]);
  } catch (error) {
    sendError(res, error);
  }
});

router.delete('/events/:id', requireAdmin, async (req, res) => {
  try {
    await query('DELETE FROM events WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

router.patch('/applications/:id/status', requireAuth, async (req, res) => {
  try {
    const { rows: apps } = await query('SELECT * FROM applications WHERE id = $1', [req.params.id]);
    const application = apps[0];
    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    const canUpdate =
      req.viewer.isAdmin ||
      (await ensurePositionAccess(req.viewer, application.position_id));
    if (!canUpdate) {
      res.status(403).json({ error: 'Application access denied' });
      return;
    }

    await withTransaction(async (client) => {
      await client.query(
        `
          UPDATE applications
          SET status = $2, remarks = $3, accepted_by = $4
          WHERE id = $1
        `,
        [
          req.params.id,
          req.body.status,
          req.body.remarks || null,
          req.body.status === 'accepted' ? req.viewer.user.id : null,
        ]
      );

      if (req.body.status === 'accepted') {
        const { rows: positions } = await client.query(
          'SELECT team_id, title FROM positions WHERE id = $1',
          [application.position_id]
        );
        const position = positions[0];
        if (position?.team_id) {
          await client.query(
            `
              INSERT INTO team_members (user_id, team_id, position_title)
              VALUES ($1, $2, $3)
              ON CONFLICT (user_id, team_id)
              DO UPDATE SET position_title = EXCLUDED.position_title
            `,
            [application.user_id, position.team_id, position.title]
          );
        }
      }
    });

    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/applications/:id/responses', requireAuth, async (req, res) => {
  try {
    const { rows: apps } = await query(
      'SELECT position_id, user_id, resume_url FROM applications WHERE id = $1',
      [req.params.id]
    );
    const application = apps[0];
    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    const canView =
      req.viewer.isAdmin ||
      application.user_id === req.viewer.user.id ||
      (await ensurePositionAccess(req.viewer, application.position_id));
    if (!canView) {
      res.status(403).json({ error: 'Application access denied' });
      return;
    }

    const responses = (
      await query(
        'SELECT * FROM application_responses WHERE application_id = $1 ORDER BY created_at ASC',
        [req.params.id]
      )
    ).rows;
    res.json({ responses, resume_url: application.resume_url });
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/applications/:id/resume', requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT position_id, user_id, resume_url FROM applications WHERE id = $1',
      [req.params.id]
    );
    const application = rows[0];
    const requestedPath = typeof req.query.path === 'string' ? req.query.path : application?.resume_url;
    if (!requestedPath) {
      res.status(404).json({ error: 'Resume not found' });
      return;
    }

    const canView =
      req.viewer.isAdmin ||
      application.user_id === req.viewer.user.id ||
      (await ensurePositionAccess(req.viewer, application.position_id));
    if (!canView) {
      res.status(403).json({ error: 'Resume access denied' });
      return;
    }

    res.download(resolvePrivatePath(requestedPath));
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/users', requireAdmin, async (_req, res) => {
  try {
    const profiles = (
      await query('SELECT id, user_id, display_name, email FROM profiles ORDER BY COALESCE(display_name, email)')
    ).rows;
    const roles = (await query('SELECT user_id, role FROM user_roles ORDER BY role')).rows;
    res.json(
      profiles.map((profile) => ({
        ...profile,
        roles: roles.filter((role) => role.user_id === profile.user_id),
      }))
    );
  } catch (error) {
    sendError(res, error);
  }
});

router.post('/users/:userId/roles/admin', requireAdmin, async (req, res) => {
  try {
    await query(
      'INSERT INTO user_roles (user_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.params.userId, 'admin']
    );
    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

router.delete('/users/:userId/roles/admin', requireAdmin, async (req, res) => {
  try {
    await query('DELETE FROM user_roles WHERE user_id = $1 AND role = $2', [
      req.params.userId,
      'admin',
    ]);
    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/team-managers/:userId', requireAdmin, async (req, res) => {
  try {
    const { rows } = await query(
      `
        SELECT
          tm.*,
          json_build_object('id', t.id, 'name', t.name, 'color', t.color) AS teams
        FROM team_managers tm
        JOIN teams t ON t.id = tm.team_id
        WHERE tm.user_id = $1
      `,
      [req.params.userId]
    );
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
});

router.post('/team-managers', requireAdmin, async (req, res) => {
  try {
    await withTransaction(async (client) => {
      await client.query(
        'INSERT INTO user_roles (user_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [req.body.user_id, 'manager']
      );
      await client.query(
        'INSERT INTO team_managers (user_id, team_id) VALUES ($1, $2)',
        [req.body.user_id, req.body.team_id]
      );
    });
    res.status(201).json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

router.delete('/team-managers/:id', requireAdmin, async (req, res) => {
  try {
    const { rows } = await query('SELECT user_id FROM team_managers WHERE id = $1', [req.params.id]);
    const assignment = rows[0];
    await withTransaction(async (client) => {
      await client.query('DELETE FROM team_managers WHERE id = $1', [req.params.id]);
      if (assignment?.user_id) {
        const remaining = (
          await client.query('SELECT id FROM team_managers WHERE user_id = $1 LIMIT 1', [assignment.user_id])
        ).rows;
        if (remaining.length === 0) {
          await client.query('DELETE FROM user_roles WHERE user_id = $1 AND role = $2', [
            assignment.user_id,
            'manager',
          ]);
        }
      }
    });
    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/team-members', requireAuth, async (req, res) => {
  try {
    let members = (
      await query(
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
          ORDER BY tm.joined_at DESC
        `
      )
    ).rows;

    if (!req.viewer.isAdmin) {
      const managedTeamIds = req.viewer.managedTeams.map((team) => team.team_id);
      members = members.filter((member) => managedTeamIds.includes(member.team_id));
    }

    const userIds = [...new Set(members.map((member) => member.user_id))];
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
      members.map((member) => ({
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

router.patch('/team-members/:id', requireAuth, async (req, res) => {
  try {
    const { rows } = await query('SELECT team_id FROM team_members WHERE id = $1', [req.params.id]);
    const member = rows[0];
    if (!member || !canManageTeam(req.viewer, member.team_id)) {
      res.status(403).json({ error: 'Team access denied' });
      return;
    }

    const nextIsHead = Boolean(req.body.is_head);
    await withTransaction(async (client) => {
      if (nextIsHead) {
        await client.query('UPDATE team_members SET is_head = false WHERE team_id = $1', [member.team_id]);
      }

      await client.query('UPDATE team_members SET is_head = $2 WHERE id = $1', [
        req.params.id,
        nextIsHead,
      ]);
    });
    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

router.delete('/team-members/:id', requireAuth, async (req, res) => {
  try {
    const { rows } = await query('SELECT team_id FROM team_members WHERE id = $1', [req.params.id]);
    const member = rows[0];
    if (!member || !canManageTeam(req.viewer, member.team_id)) {
      res.status(403).json({ error: 'Team access denied' });
      return;
    }

    await query('DELETE FROM team_members WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/gallery/collaborators', requireAdmin, async (_req, res) => {
  try {
    const collaborators = (
      await query(
        `
          SELECT
            gc.*,
            json_build_object('display_name', p.display_name, 'email', p.email) AS profile
          FROM gallery_collaborators gc
          LEFT JOIN profiles p ON p.user_id = gc.user_id
          ORDER BY gc.created_at DESC
        `
      )
    ).rows;
    res.json(collaborators);
  } catch (error) {
    sendError(res, error);
  }
});

router.post('/gallery/collaborators', requireAdmin, async (req, res) => {
  try {
    await query('INSERT INTO gallery_collaborators (user_id) VALUES ($1)', [req.body.user_id]);
    res.status(201).json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

router.delete('/gallery/collaborators/:id', requireAdmin, async (req, res) => {
  try {
    await query('DELETE FROM gallery_collaborators WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

router.post('/gallery/albums', requireAuth, requireAdminOrGallery, upload.single('cover'), async (req, res) => {
  try {
    let coverUrl = req.body.cover_image_url || null;
    if (req.file) {
      const ext = path.extname(req.file.originalname) || '.jpg';
      const fileName = `${Date.now()}-${toSlug(req.body.title)}${ext}`;
      coverUrl = await writeUpload('gallery', fileName, req.file.buffer);
    }

    const { rows } = await query(
      `
        INSERT INTO gallery_albums (title, description, cover_image_url, event_date, is_featured)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
      [
        req.body.title,
        req.body.description || null,
        coverUrl,
        req.body.event_date || null,
        req.body.is_featured === 'true' || req.body.is_featured === true,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    sendError(res, error);
  }
});

router.patch('/gallery/albums/:id', requireAuth, requireAdminOrGallery, upload.single('cover'), async (req, res) => {
  try {
    let coverUrl = req.body.cover_image_url || null;
    if (req.file) {
      const ext = path.extname(req.file.originalname) || '.jpg';
      const fileName = `${Date.now()}-${toSlug(req.body.title)}${ext}`;
      coverUrl = await writeUpload('gallery', fileName, req.file.buffer);
    }

    const { rows } = await query(
      `
        UPDATE gallery_albums
        SET
          title = $2,
          description = $3,
          cover_image_url = $4,
          event_date = $5,
          is_featured = $6
        WHERE id = $1
        RETURNING *
      `,
      [
        req.params.id,
        req.body.title,
        req.body.description || null,
        coverUrl,
        req.body.event_date || null,
        req.body.is_featured === 'true' || req.body.is_featured === true,
      ]
    );
    res.json(rows[0]);
  } catch (error) {
    sendError(res, error);
  }
});

router.delete('/gallery/albums/:id', requireAuth, requireAdminOrGallery, async (req, res) => {
  try {
    await query('DELETE FROM gallery_albums WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

router.post('/gallery/images', requireAuth, requireAdminOrGallery, upload.array('images'), async (req, res) => {
  if (!req.files?.length) {
    res.status(400).json({ error: 'At least one image is required' });
    return;
  }

  try {
    const inserted = [];
    for (const [index, file] of req.files.entries()) {
      const ext = path.extname(file.originalname) || '.jpg';
      const baseTitle = req.body.title || file.originalname.replace(/\.[^.]+$/, '');
      const fileName = `${Date.now()}-${index}-${toSlug(baseTitle)}${ext}`;
      const imageUrl = await writeUpload('gallery', fileName, file.buffer);
      const title = req.files.length > 1 ? `${baseTitle} (${index + 1})` : baseTitle;
      const { rows } = await query(
        `
          INSERT INTO gallery_images (album_id, title, description, category, image_url, event_date, is_featured)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `,
        [
          req.body.album_id,
          title,
          req.body.description || null,
          req.body.category || 'Event',
          imageUrl,
          req.body.event_date || null,
          req.body.is_featured === 'true' || req.body.is_featured === true,
        ]
      );
      inserted.push(rows[0]);
    }
    res.status(201).json(inserted);
  } catch (error) {
    sendError(res, error);
  }
});

router.patch('/gallery/images/:id', requireAuth, requireAdminOrGallery, upload.single('image'), async (req, res) => {
  try {
    let imageUrl = req.body.image_url || null;
    if (req.file) {
      const ext = path.extname(req.file.originalname) || '.jpg';
      const fileName = `${Date.now()}-${toSlug(req.body.title)}${ext}`;
      imageUrl = await writeUpload('gallery', fileName, req.file.buffer);
    }

    const { rows } = await query(
      `
        UPDATE gallery_images
        SET
          title = $2,
          description = $3,
          category = $4,
          image_url = $5,
          event_date = $6,
          is_featured = $7
        WHERE id = $1
        RETURNING *
      `,
      [
        req.params.id,
        req.body.title,
        req.body.description || null,
        req.body.category || 'Event',
        imageUrl,
        req.body.event_date || null,
        req.body.is_featured === 'true' || req.body.is_featured === true,
      ]
    );
    res.json(rows[0]);
  } catch (error) {
    sendError(res, error);
  }
});

router.delete('/gallery/images/:id', requireAuth, requireAdminOrGallery, async (req, res) => {
  try {
    await query('DELETE FROM gallery_images WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
