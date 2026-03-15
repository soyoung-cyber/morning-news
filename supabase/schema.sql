-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,
  summary TEXT,
  source TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('design', 'it', 'startup')),
  image_url TEXT,
  published_at TIMESTAMPTZ,
  collected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_collected_at ON articles(collected_at DESC);

-- Enable Row Level Security
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (needed for frontend with anon key)
CREATE POLICY "Public read access" ON articles
  FOR SELECT USING (true);

-- Only service role can write (used by collector script)
CREATE POLICY "Service role write access" ON articles
  FOR ALL USING (auth.role() = 'service_role');
