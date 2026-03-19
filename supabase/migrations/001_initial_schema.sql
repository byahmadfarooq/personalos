-- ============================================================
-- Personal OS Dashboard — Supabase Schema
-- 10 Core Tables + RLS Policies + Indexes
-- ============================================================

-- 1. DAILY LOGS
-- Tracks 10 daily habits (prayer times) + win log + tomorrow task
CREATE TABLE daily_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  fajr BOOLEAN DEFAULT FALSE,
  dhuhr BOOLEAN DEFAULT FALSE,
  asr BOOLEAN DEFAULT FALSE,
  maghrib BOOLEAN DEFAULT FALSE,
  isha BOOLEAN DEFAULT FALSE,
  quran BOOLEAN DEFAULT FALSE,
  exercise BOOLEAN DEFAULT FALSE,
  deep_work BOOLEAN DEFAULT FALSE,
  content_creation BOOLEAN DEFAULT FALSE,
  outreach BOOLEAN DEFAULT FALSE,
  win_log TEXT,
  tomorrow_task TEXT,
  day_complete BOOLEAN DEFAULT FALSE,
  most_important_task TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_logs_date ON daily_logs(date DESC);

-- 2. GOALS
-- 5 active goals with measurable metrics
CREATE TABLE goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  metric TEXT NOT NULL,
  target NUMERIC NOT NULL,
  current NUMERIC DEFAULT 0,
  timeline TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. WEEKLY REVIEWS
-- Sunday review screen — one corrective action per goal per week
CREATE TABLE weekly_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start DATE NOT NULL,
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  on_track BOOLEAN DEFAULT TRUE,
  corrective_action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(week_start, goal_id)
);

CREATE INDEX idx_weekly_reviews_week ON weekly_reviews(week_start DESC);

-- 4. PIPELINE
-- Consulting pipeline with stage tracking
CREATE TABLE pipeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('lead', 'discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
  offer TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  last_action TEXT,
  last_action_date DATE,
  next_action TEXT,
  next_action_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pipeline_stage ON pipeline(stage);

-- 5. REVENUE
-- Monthly revenue tracking: consulting + product
CREATE TABLE revenue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month DATE NOT NULL UNIQUE, -- first day of the month
  consulting_revenue NUMERIC DEFAULT 0,
  product_revenue NUMERIC DEFAULT 0,
  total NUMERIC GENERATED ALWAYS AS (consulting_revenue + product_revenue) STORED,
  target NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_revenue_month ON revenue(month DESC);

-- 6. LINKEDIN METRICS
-- Daily LinkedIn growth tracking
CREATE TABLE linkedin_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  followers INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  dms_sent INTEGER DEFAULT 0,
  dms_received INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_linkedin_date ON linkedin_metrics(date DESC);

-- 7. CURRICULUM
-- Personal learning tracker — books/courses by month
CREATE TABLE curriculum (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_title TEXT NOT NULL,
  month DATE NOT NULL, -- first day of the month
  chapter_current INTEGER DEFAULT 0,
  chapter_total INTEGER NOT NULL,
  application_log TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_curriculum_month ON curriculum(month DESC);

-- 8. PRODUCT METRICS
-- GTM Brief and other product KPIs
CREATE TABLE product_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  product_name TEXT NOT NULL,
  signups INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  mrr NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, product_name)
);

CREATE INDEX idx_product_metrics_date ON product_metrics(date DESC);

-- 9. CONTENT LOG
-- Track posts across platforms for The Build Log + LinkedIn
CREATE TABLE content_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'twitter', 'newsletter', 'blog', 'youtube', 'other')),
  post_type TEXT NOT NULL CHECK (post_type IN ('text', 'carousel', 'video', 'article', 'newsletter', 'thread')),
  pillar TEXT NOT NULL,
  title TEXT,
  impressions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_log_date ON content_log(date DESC);
CREATE INDEX idx_content_log_platform ON content_log(platform);

-- 10. SLEEP TRACKER
-- One main sleep entry per day + optional nap
CREATE TABLE sleep_tracker (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE, -- enforces ONE entry per day
  main_sleep_start TIMESTAMPTZ NOT NULL,
  main_sleep_end TIMESTAMPTZ NOT NULL,
  total_main_sleep_hours NUMERIC GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (main_sleep_end - main_sleep_start)) / 3600.0
  ) STORED,
  nap_duration_minutes INTEGER DEFAULT 0,
  optimal_sleep_score INTEGER DEFAULT 0 CHECK (optimal_sleep_score >= 0 AND optimal_sleep_score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sleep_date ON sleep_tracker(date DESC);

-- ============================================================
-- UPDATED_AT TRIGGER
-- Automatically sets updated_at on row modification
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'daily_logs', 'goals', 'weekly_reviews', 'pipeline',
      'revenue', 'linkedin_metrics', 'curriculum',
      'product_metrics', 'content_log', 'sleep_tracker'
    ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      tbl
    );
  END LOOP;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- Enable RLS on all tables (permissive for anon key usage)
-- ============================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'daily_logs', 'goals', 'weekly_reviews', 'pipeline',
      'revenue', 'linkedin_metrics', 'curriculum',
      'product_metrics', 'content_log', 'sleep_tracker'
    ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format(
      'CREATE POLICY "Allow all access" ON %I FOR ALL USING (true) WITH CHECK (true);',
      tbl
    );
  END LOOP;
END;
$$;

-- ============================================================
-- SLEEP ANALYSIS FUNCTION
-- Analyzes sleep patterns and returns insights
-- ============================================================
CREATE OR REPLACE FUNCTION analyze_sleep(days_back INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'avg_sleep_hours', ROUND(AVG(total_main_sleep_hours)::numeric, 2),
    'avg_bedtime_hour', ROUND(AVG(EXTRACT(HOUR FROM main_sleep_start) + EXTRACT(MINUTE FROM main_sleep_start) / 60.0)::numeric, 1),
    'avg_wake_hour', ROUND(AVG(EXTRACT(HOUR FROM main_sleep_end) + EXTRACT(MINUTE FROM main_sleep_end) / 60.0)::numeric, 1),
    'avg_nap_minutes', ROUND(AVG(nap_duration_minutes)::numeric, 0),
    'avg_score', ROUND(AVG(optimal_sleep_score)::numeric, 0),
    'best_score_day', (
      SELECT date FROM sleep_tracker
      WHERE date >= CURRENT_DATE - days_back
      ORDER BY optimal_sleep_score DESC LIMIT 1
    ),
    'worst_score_day', (
      SELECT date FROM sleep_tracker
      WHERE date >= CURRENT_DATE - days_back
      ORDER BY optimal_sleep_score ASC LIMIT 1
    ),
    'days_with_optimal_nap', (
      SELECT COUNT(*) FROM sleep_tracker
      WHERE date >= CURRENT_DATE - days_back
      AND nap_duration_minutes BETWEEN 20 AND 30
    ),
    'days_with_excessive_nap', (
      SELECT COUNT(*) FROM sleep_tracker
      WHERE date >= CURRENT_DATE - days_back
      AND nap_duration_minutes > 30
    ),
    'consistency_score', (
      SELECT ROUND(
        100 - (STDDEV(EXTRACT(HOUR FROM main_sleep_start)) * 10)::numeric,
        0
      )
      FROM sleep_tracker
      WHERE date >= CURRENT_DATE - days_back
    ),
    'recommendation', CASE
      WHEN (SELECT AVG(total_main_sleep_hours) FROM sleep_tracker WHERE date >= CURRENT_DATE - days_back) < 7
        THEN 'You are sleeping less than 7 hours on average. Aim for 7-9 hours for optimal performance.'
      WHEN (SELECT AVG(nap_duration_minutes) FROM sleep_tracker WHERE date >= CURRENT_DATE - days_back) > 30
        THEN 'Your naps average over 30 minutes. Keep naps to 20-30 minutes to avoid sleep inertia.'
      WHEN (SELECT STDDEV(EXTRACT(HOUR FROM main_sleep_start)) FROM sleep_tracker WHERE date >= CURRENT_DATE - days_back) > 1.5
        THEN 'Your bedtime varies significantly. Consistent sleep/wake times improve circadian rhythm.'
      ELSE 'Your sleep patterns look healthy. Keep maintaining consistency.'
    END
  ) INTO result
  FROM sleep_tracker
  WHERE date >= CURRENT_DATE - days_back;

  RETURN result;
END;
$$ LANGUAGE plpgsql;
