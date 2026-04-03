# Ieee Cs

This app is now set up to run fully on Railway without Supabase.

The stack is:

- frontend: React + Vite
- backend: Express
- database: PostgreSQL
- file storage: local uploads directory backed by a Railway volume

Everything is meant to run in one Railway web service plus one Railway Postgres service.

## What you need before starting

Make sure you have:

1. a GitHub repo with this code pushed
2. a Railway account
3. one email address you want to use as the first admin account
4. a random long secret string for JWT sessions

## Step-by-step Railway deployment

### Step 1: Push the project to GitHub

If you have not already done this:

```sh
git add .
git commit -m "Prepare Railway deployment"
git push
```

### Step 2: Create a new Railway project

1. Open Railway.
2. Click `New Project`.
3. Choose `Deploy from GitHub repo`.
4. Select this repository.

Railway will create your main app service from the repo.

### Step 3: Add PostgreSQL

1. Inside the same Railway project, click `New`.
2. Add a `PostgreSQL` service.
3. Wait until it finishes provisioning.

Your app needs the Postgres `DATABASE_URL` from this Railway Postgres service.

### Step 4: Attach a volume for uploads

This app stores uploaded files on disk, so you must add a volume or files will disappear after redeploys.

1. Open your web service in Railway.
2. Go to the storage/volumes section.
3. Create a volume.
4. Mount it at:

```txt
/app/data/uploads
```

This path matches the app defaults.

The volume will hold:

- avatars
- gallery images
- application uploads and resumes

### Step 5: Set environment variables

Open the web service variables and set these:

```txt
DATABASE_URL=<Railway Postgres DATABASE_URL>
JWT_SECRET=<long-random-secret>
ADMIN_EMAILS=your-email@example.com
PUBLIC_APP_URL=https://your-service.up.railway.app
ALLOWED_ORIGINS=https://your-service.up.railway.app
APP_NAME=IEEE Computer Society
RESEND_API_KEY=<resend-api-key>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_FAMILY=4
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
MAIL_FROM=your-email@gmail.com
GMAIL_CLIENT_ID=<google-oauth-client-id>
GMAIL_CLIENT_SECRET=<google-oauth-client-secret>
GMAIL_REFRESH_TOKEN=<google-oauth-refresh-token>
GMAIL_REDIRECT_URI=https://developers.google.com/oauthplayground
```

Notes:

- `DATABASE_URL`: usually Railway can provide this from the Postgres service connection
- `JWT_SECRET`: use a long random value, not a simple word
- `ADMIN_EMAILS`: comma-separated if you want more than one admin email
- `PUBLIC_APP_URL`: use your Railway public URL first, then replace it later with your custom domain if needed
- `ALLOWED_ORIGINS`: should match the frontend URL that will open the app in the browser
- `RESEND_API_KEY` with `MAIL_FROM`: recommended on Railway Hobby for welcome emails, forgot-password emails, and magic login emails
- for Gmail on Railway, use `SMTP_PORT=587` and `SMTP_SECURE=false` first; it is typically more reliable than implicit TLS on `465`
- on Railway Hobby, Gmail SMTP still times out because outbound SMTP is blocked; use Gmail API credentials instead

Optional:

```txt
UPLOADS_DIR=/app/data/uploads
SESSION_COOKIE_NAME=ppp_session
```

You usually do not need to set those because the defaults already match Railway.

### Step 6: Confirm build and start commands

Railway should use:

- build command: `npm run build`
- start command: `npm run start`

If Railway does not auto-detect them, set them manually.

### Step 7: Deploy

Trigger a deploy from Railway.

When the deploy finishes:

1. open the generated Railway URL
2. confirm the homepage loads
3. confirm `https://your-service.up.railway.app/api/health` returns a healthy response

### Step 8: Create the first admin account

This app auto-assigns admin access when a newly registered email matches `ADMIN_EMAILS`.

To create the first admin:

1. open `/auth`
2. sign up using the same email you put in `ADMIN_EMAILS`
3. log in
4. open `/admin`

If the email matches, you should have admin access immediately.

### Step 9: Add your real content

After admin login, go through the admin dashboard and add:

1. teams
2. positions
3. events
4. gallery albums
5. gallery images
6. manager assignments if needed

### Step 10: Add a custom domain

If you want your own domain:

1. add the custom domain in Railway
2. update DNS as Railway tells you
3. once the domain works, update:

```txt
PUBLIC_APP_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com
```

Then redeploy.

## Local development

### Step 1: Install dependencies

```sh
npm install
```

### Step 2: Create a local env file

Copy `.env.example` to `.env` and fill it in.

Example:

```txt
DATABASE_URL=postgresql://postgres:password@localhost:5432/perfect_pixel_platform
JWT_SECRET=replace-with-a-long-random-secret
ADMIN_EMAILS=you@example.com
PUBLIC_APP_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:8080
APP_NAME=IEEE Computer Society
RESEND_API_KEY=
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_FAMILY=4
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
MAIL_FROM=your-email@gmail.com
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=
GMAIL_REDIRECT_URI=https://developers.google.com/oauthplayground
```

### Step 3: Start the backend

```sh
npm run start
```

### Step 4: Start the frontend

In another terminal:

```sh
npm run dev
```

Vite proxies `/api` and `/uploads` to the backend on port `3000`.

Frontend dev URL:

```txt
http://localhost:8080
```

Backend URL:

```txt
http://localhost:3000
```

## First-time behavior

On startup, the backend will:

1. connect to PostgreSQL
2. create the required tables if they do not exist
3. create default teams if they do not exist
4. ensure the upload directories exist

You do not need to run Supabase migrations anymore.

## Email auth features

This app now supports:

1. welcome email after signup
2. forgot-password email with reset link
3. magic login email with one-time sign-in link

Required for those features:

1. set `PUBLIC_APP_URL` correctly
2. on Railway Hobby, either set `RESEND_API_KEY` or use Gmail API OAuth variables in Railway
3. if you later move to a plan that allows SMTP, SMTP is still supported as fallback

Frontend routes used by email links:

- `/forgot-password`
- `/reset-password`
- `/magic-login`

## Important limitation if you already used Supabase

This repo is migrated off Supabase runtime usage, but your old Supabase data is not automatically copied into Railway.

If you already have live data in Supabase, you still need to migrate:

1. database records
2. user accounts
3. uploaded files from Supabase storage

Without that migration, Railway will start as a fresh system.

## Files to check

- backend entry: [server/index.js](./server/index.js)
- database schema: [server/schema.sql](./server/schema.sql)
- API helper: [src/lib/api.ts](./src/lib/api.ts)
- auth hook: [src/hooks/useAuth.tsx](./src/hooks/useAuth.tsx)
- env example: [.env.example](./.env.example)

## Verification status

Verified:

- `npm run build`
- backend modules load with a valid `DATABASE_URL`

Not fully cleaned up:

- `npm run lint` still reports older repo issues in some unrelated UI helper files such as `src/components/ui/command.tsx`, `src/components/ui/textarea.tsx`, and `tailwind.config.ts`

## Official Railway docs

Useful references:

- https://docs.railway.com/
- https://docs.railway.com/guides/django
