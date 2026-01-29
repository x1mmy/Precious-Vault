# Deploy PreciousVault to Vercel + Neon

## 1. Create Neon database

1. Go to [neon.tech](https://neon.tech) and sign in (or create an account).
2. Create a new project (e.g. name it `preciousvalt`).
3. In the project dashboard, open **Connection details**.
4. Copy the **connection string**. Use the **pooled** connection (recommended for serverless). It looks like:
   ```
   postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
   Keep this for the next step.

## 2. Push schema to Neon (one-time)

From your machine, point Drizzle at Neon and create the tables:

```bash
# Temporarily use Neon URL (replace with your actual URL)
DATABASE_URL="postgresql://..." pnpm db:push
```

Or: create a `.env.production` (or a separate env file) with your Neon `DATABASE_URL`, then run:

```bash
pnpm db:push
```

(Ensure that env file is loaded, or set `DATABASE_URL` in your shell for this command.)

## 3. Deploy to Vercel

1. Push your code to GitHub (if you haven’t already).
2. Go to [vercel.com](https://vercel.com) → **Add New** → **Project** → import your repo.
3. **Environment variables** — add these in the Vercel project settings (all environments or Production/Preview as needed):

   | Name | Value | Notes |
   |------|--------|--------|
   | `DATABASE_URL` | Your Neon connection string | Pooled connection from step 1 |
   | `AUTH_SECRET` | Random string (e.g. `openssl rand -base64 32`) | Required for NextAuth |
   | `METALS_DEV_KEY` | Your Metals.dev API key | Same as local |
   | `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Your Vercel app URL (replace with real URL) |
   | `CRON_SECRET` | Optional random string | Protects daily digest cron; set if you use Vercel Cron |

4. Deploy (Vercel will run `pnpm build`).

After the first deploy, note your app URL and set `NEXT_PUBLIC_APP_URL` to it if you didn’t know the URL beforehand (then redeploy).

## 4. (Optional) Protect the daily digest cron

The app has a cron that runs once per day (8:00 UTC) and sends Discord daily digests.

- In Vercel → Project → **Settings** → **Environment Variables**, add:
  - `CRON_SECRET` = any long random string (e.g. from `openssl rand -base64 32`).
- Vercel Cron will send `Authorization: Bearer <CRON_SECRET>` when it hits `/api/cron/daily-digest`. The route only accepts the request when `CRON_SECRET` matches.

If you don’t set `CRON_SECRET`, the route still runs but is unprotected (anyone who finds the URL could trigger it).

## 5. Quick checklist

- [ ] Neon project created, connection string copied (pooled).
- [ ] `pnpm db:push` run once with `DATABASE_URL` pointing at Neon.
- [ ] Repo connected to Vercel, env vars set (`DATABASE_URL`, `AUTH_SECRET`, `METALS_DEV_KEY`, `NEXT_PUBLIC_APP_URL`).
- [ ] First deploy successful; `NEXT_PUBLIC_APP_URL` updated to real URL if needed.
- [ ] (Optional) `CRON_SECRET` set for daily digest cron.

You can sign up on the deployed app and use it like local; Discord daily digest will run on the cron schedule.
