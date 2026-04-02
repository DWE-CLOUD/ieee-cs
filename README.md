# Perfect Pixel Platform

This project no longer depends on Supabase at runtime.

It now runs as:

- `React + Vite` frontend
- `Express` backend in the same repo
- `PostgreSQL` database
- local file uploads for avatars, gallery images, and application files

The stack is designed to run entirely on Railway with:

- one app service for the website + API
- one Railway PostgreSQL service
- one mounted Railway volume for uploads

## Local development

1. Install dependencies:

```sh
npm install
```

2. Create `.env` from `.env.example`.

3. Start the backend:

```sh
npm run start
```

4. In another terminal, start Vite:

```sh
npm run dev
```

Vite proxies `/api` and `/uploads` to `http://localhost:3000`.

## Railway deployment

### 1. Create the project

- Push this repo to GitHub.
- In Railway, create a new project from the repo.
- Add a PostgreSQL service to the same Railway project.

### 2. Configure the app service

Set these variables on the web service:

- `DATABASE_URL`
  Railway will usually inject this automatically after you link the Postgres service.
- `JWT_SECRET`
  Use a long random value.
- `ADMIN_EMAILS`
  Comma-separated list of emails that should become admins when they sign up.
- `PUBLIC_APP_URL`
  Your Railway-generated domain or custom domain, for example `https://your-app.up.railway.app`
- `ALLOWED_ORIGINS`
  Usually the same value as `PUBLIC_APP_URL`

Optional:

- `UPLOADS_DIR`
  Leave unset if your Railway volume is mounted to `/app/data/uploads`.

### 3. Add a Railway volume

Create a volume for the web service and mount it at:

```txt
/app/data/uploads
```

This stores:

- public avatars
- public gallery images
- private application uploads/resumes

Without the volume, uploaded files will be lost on redeploy.

### 4. Deploy

Railway should detect:

- build command: `npm run build`
- start command: `npm run start`

The server exposes a health endpoint at:

```txt
/api/health
```

### 5. Bootstrap the admin account

- Add your email to `ADMIN_EMAILS`
- deploy
- sign up through `/auth`

That account will receive the `admin` role automatically.

## Database behavior

- The backend bootstraps the schema automatically on startup.
- Default teams are inserted automatically if they do not already exist.

## Supabase migration notes

This codebase has been migrated off client-side Supabase access, but existing Supabase data is not auto-imported by default.

What is already handled:

- schema replacement
- custom auth/session layer
- file upload/storage replacement
- Railway-compatible backend deployment

What you may still need if you already have live Supabase data:

- export/import existing content tables into Railway Postgres
- recreate or manually migrate existing user accounts
- re-upload or copy existing Supabase storage objects if you need old files preserved

## Verification

Verified in this repo:

- `npm run build`
- backend modules load successfully with a valid `DATABASE_URL`

`npm run lint` still fails on pre-existing repo issues in UI helper files such as:

- `src/components/ui/command.tsx`
- `src/components/ui/textarea.tsx`
- `tailwind.config.ts`
