# Morning Brief

Automated daily US news dashboard for Design, Tech & Startups.
Collects news every night while you sleep. Built with Python + Next.js + Supabase.

## Sources
- RSS feeds (TechCrunch, The Verge, Wired, Smashing Magazine, Fast Company, etc.)
- Hacker News (top stories)
- Reddit (r/startups, r/technology, r/design, r/webdev, etc.)
- YouTube (via Data API)
- NewsAPI

---

## Setup Guide

### Step 1 — Supabase (Database)

1. Go to [supabase.com](https://supabase.com) → create a free account → new project
2. Go to **SQL Editor** → paste and run the contents of `supabase/schema.sql`
3. Go to **Project Settings → API** and copy:
   - `Project URL` → this is your `SUPABASE_URL`
   - `service_role` key → this is your `SUPABASE_KEY` (for the collector)
   - `anon` key → this is your `SUPABASE_ANON_KEY` (for the frontend)

### Step 2 — YouTube API Key (free)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project
3. Enable **YouTube Data API v3**
4. Go to **Credentials → Create API Key**
5. Copy the key → this is your `YOUTUBE_API_KEY`

### Step 3 — NewsAPI Key (free)

1. Go to [newsapi.org](https://newsapi.org) → create a free account
2. Copy your API key → this is your `NEWSAPI_KEY`

### Step 4 — Frontend on Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → import your repo
3. Set the **Root Directory** to `frontend`
4. Add environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
5. Deploy

### Step 5 — GitHub Actions (automated collector)

1. In your GitHub repo → **Settings → Secrets and variables → Actions**
2. Add these secrets:
   ```
   SUPABASE_URL        = your Supabase project URL
   SUPABASE_KEY        = your Supabase service_role key
   YOUTUBE_API_KEY     = your YouTube API key
   NEWSAPI_KEY         = your NewsAPI key
   ```
3. The workflow in `.github/workflows/collect.yml` runs automatically every night at 2 AM UTC

To trigger manually: **Actions tab → Daily News Collection → Run workflow**

---

## Run locally (optional)

```bash
cd collector
cp .env.example .env
# Fill in your keys in .env

pip install -r requirements.txt
python main.py
```

```bash
cd frontend
cp .env.local.example .env.local
# Fill in your Supabase keys

npm install
npm run dev
# Open http://localhost:3000
```
