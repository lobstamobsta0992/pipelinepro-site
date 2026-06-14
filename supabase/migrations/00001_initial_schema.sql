-- ============================================================================
-- Enigma Intelligence — Supabase Schema v1.0
-- ============================================================================
-- This migration creates the core data model for the Enigma Intelligence
-- crypto trading platform. Run this against a Supabase project with
-- auth schema enabled.
-- ============================================================================

-- 0. Extensions
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Enum Types
-- ============================================================================

CREATE TYPE user_experience_level AS ENUM (
  'beginner',
  'intermediate',
  'advanced'
);

CREATE TYPE user_trading_style AS ENUM (
  'conservative',
  'moderate',
  'aggressive'
);

CREATE TYPE subscription_status AS ENUM (
  'active',
  'trialing',
  'cancelled',
  'expired',
  'past_due'
);

CREATE TYPE message_role AS ENUM (
  'user',
  'assistant',
  'system'
);

CREATE TYPE alert_transaction_type AS ENUM (
  'transfer',
  'buy',
  'sell',
  'swap'
);

CREATE TYPE alert_level AS ENUM (
  'minor',
  'major',
  'whale'
);

-- 2. Core Tables
-- ============================================================================

-- 2a. User Profiles
-- Extends Supabase auth.users with Enigma-specific profile data.
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT UNIQUE,
  display_name    TEXT NOT NULL DEFAULT '',
  avatar_url      TEXT,
  experience_level user_experience_level NOT NULL DEFAULT 'beginner',
  trading_style   user_trading_style NOT NULL DEFAULT 'moderate',
  trading_goals   JSONB NOT NULL DEFAULT '[]'::jsonb,
  onboarded       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'User profiles extending auth.users with crypto trading persona data.';
COMMENT ON COLUMN public.profiles.experience_level IS 'AI adapts technical depth: beginner → intermediate → advanced.';
COMMENT ON COLUMN public.profiles.trading_style IS 'Risk profile: conservative, moderate, or aggressive.';
COMMENT ON COLUMN public.profiles.trading_goals IS 'Array of goal strings: ["learn fundamentals", "scalping", "long-term hold"]';
COMMENT ON COLUMN public.profiles.onboarded IS 'Whether user completed the "Meet E" onboarding flow.';

-- 2b. Tiers (Subscription Plans)
-- Defines available subscription tiers and their feature limits.
CREATE TABLE public.tiers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL UNIQUE,
  slug                TEXT NOT NULL UNIQUE,
  price_cents         INTEGER NOT NULL DEFAULT 0,
  daily_message_limit INTEGER,       -- NULL = unlimited
  whale_alert_min_usd BIGINT NOT NULL DEFAULT 1000000000,  -- minimum whale tx value in USD
  has_auto_trading    BOOLEAN NOT NULL DEFAULT FALSE,
  has_market_scanner  BOOLEAN NOT NULL DEFAULT FALSE,
  has_research_tools  BOOLEAN NOT NULL DEFAULT FALSE,
  has_early_signals   BOOLEAN NOT NULL DEFAULT FALSE,
  has_email_alerts    BOOLEAN NOT NULL DEFAULT FALSE,
  has_cycle_intel     BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.tiers IS 'Pricing tiers. Free, Pro ($49/mo), Elite ($149/mo). Controls all feature gating.';

-- Seed default tiers
INSERT INTO public.tiers (name, slug, price_cents, daily_message_limit, whale_alert_min_usd, has_auto_trading, has_market_scanner, has_research_tools, has_early_signals, has_email_alerts, has_cycle_intel, sort_order) VALUES
  ('Free',     'free',    0,    5,    1000000000, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 1),
  ('Pro',      'pro',     4900, 20,   1000000,    FALSE, FALSE, TRUE,  FALSE, FALSE, TRUE,  2),
  ('Elite',    'elite',   14900,NULL, 500000,     TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  3);

-- 2c. Subscriptions
-- Links users to their current subscription tier with Stripe integration.
CREATE TABLE public.subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id               UUID NOT NULL REFERENCES public.tiers(id),
  status                subscription_status NOT NULL DEFAULT 'active',
  trial_ends_at         TIMESTAMPTZ,       -- NULL unless in trial
  current_period_start  TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end    TIMESTAMPTZ NOT NULL,
  stripe_subscription_id TEXT UNIQUE,       -- Stripe subscription ID for webhook mapping
  stripe_customer_id    TEXT,               -- Stripe customer ID
  cancelled_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_tier_id ON public.subscriptions(tier_id);

COMMENT ON TABLE public.subscriptions IS 'User subscription assignments. Supports 5-day trial period and Stripe lifecycle.';

-- 2d. E Memory (Persistent AI Context)
-- Stores durable context about each user for E's personality and memory.
CREATE TABLE public.e_memory (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_key  TEXT NOT NULL,              -- e.g., 'personality_traits', 'recent_interests', 'preferred_style'
  content     JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at  TIMESTAMPTZ,               -- Optional TTL for ephemeral memories
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, memory_key)
);

CREATE INDEX idx_e_memory_user_id ON public.e_memory(user_id);
CREATE INDEX idx_e_memory_expires ON public.e_memory(expires_at);

COMMENT ON TABLE public.e_memory IS 'Persistent AI memory for E. Each user has key-value memory entries that persist across sessions.';

-- 2e. Conversations (Chat Sessions)
CREATE TABLE public.conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT,
  message_count INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,  -- e.g., { "topic": "bitcoin", "sentiment": "bullish" }
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_active ON public.conversations(is_active);
CREATE INDEX idx_conversations_updated ON public.conversations(updated_at DESC);

COMMENT ON TABLE public.conversations IS 'Chat sessions between users and E. Supports context tracking across a conversation.';

-- 2f. Messages
CREATE TABLE public.messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role              message_role NOT NULL,
  content           TEXT NOT NULL,
  tokens_used       INTEGER,               -- Token count for billing/limits
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,  -- sentiment, coin mentions, etc.
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created ON public.messages(created_at);

COMMENT ON TABLE public.messages IS 'Individual chat messages within conversations. Powers daily usage counting.';

-- 2g. Daily Usage Tracking
-- Tracks message usage per user per day for enforcing tier limits.
CREATE TABLE public.user_daily_usage (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  message_count INTEGER NOT NULL DEFAULT 0,
  tokens_used   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_date)
);

CREATE INDEX idx_user_daily_usage_user_date ON public.user_daily_usage(user_id, usage_date);

COMMENT ON TABLE public.user_daily_usage IS 'Daily usage counters for enforcing message limits per tier.';

-- 2h. Portfolio Tracking
CREATE TABLE public.user_portfolios (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset               TEXT NOT NULL,              -- 'BTC', 'ETH', 'SOL', etc.
  quantity            NUMERIC NOT NULL DEFAULT 0,
  average_entry_price NUMERIC,                    -- USD
  notes               TEXT,
  is_manual           BOOLEAN NOT NULL DEFAULT TRUE, -- TRUE = manual entry, FALSE = synced from Coinbase
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, asset)
);

CREATE INDEX idx_user_portfolios_user_id ON public.user_portfolios(user_id);

COMMENT ON TABLE public.user_portfolios IS 'User portfolio holdings. Supports manual entry and Coinbase sync.';

-- 2i. Whale Alerts
CREATE TABLE public.whale_alerts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_hash  TEXT NOT NULL,
  blockchain        TEXT NOT NULL,               -- 'bitcoin', 'ethereum', 'solana', etc.
  from_address      TEXT,
  to_address        TEXT,
  asset             TEXT NOT NULL,               -- 'BTC', 'ETH', 'USDC', etc.
  amount            NUMERIC NOT NULL,
  usd_value         NUMERIC NOT NULL,
  transaction_type  alert_transaction_type NOT NULL DEFAULT 'transfer',
  alert_level       alert_level NOT NULL,        -- minor (< $500k), major ($500k-$1M), whale ($1M+)
  detected_at       TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_whale_alerts_detected ON public.whale_alerts(detected_at DESC);
CREATE INDEX idx_whale_alerts_usd_value ON public.whale_alerts(usd_value DESC);
CREATE INDEX idx_whale_alerts_asset ON public.whale_alerts(asset);

COMMENT ON TABLE public.whale_alerts IS 'Real-time whale transaction alerts from blockchain monitors.';

-- 2j. Market Data Cache
CREATE TABLE public.market_data_cache (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coin_id         TEXT NOT NULL,                 -- CoinGecko ID: 'bitcoin', 'ethereum'
  symbol          TEXT NOT NULL,                 -- 'btc', 'eth'
  name            TEXT NOT NULL,
  current_price   NUMERIC,
  market_cap      NUMERIC,
  volume_24h      NUMERIC,
  price_change_24h NUMERIC,
  market_data     JSONB NOT NULL DEFAULT '{}'::jsonb, -- Full raw data blob
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_market_data_cache_coin_id ON public.market_data_cache(coin_id);
CREATE INDEX idx_market_data_cache_fetched ON public.market_data_cache(fetched_at DESC);

COMMENT ON TABLE public.market_data_cache IS 'Cached market data from CoinGecko/other APIs. Reduces API call volume.';

-- 2k. Auto Trade Configurations
CREATE TABLE public.auto_trade_configs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,             -- 'My BTC DCA Strategy'
  is_active           BOOLEAN NOT NULL DEFAULT FALSE,
  config              JSONB NOT NULL DEFAULT '{}'::jsonb, -- Strategy parameters
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_auto_trade_configs_user ON public.auto_trade_configs(user_id);

COMMENT ON TABLE public.auto_trade_configs IS 'Elite-tier auto-trading strategy configurations for Coinbase Advanced Trade.';

-- 2l. Trade Execution History
CREATE TABLE public.trade_executions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  config_id           UUID REFERENCES public.auto_trade_configs(id),
  order_id            TEXT,                      -- Coinbase order ID
  asset               TEXT NOT NULL,
  side                TEXT NOT NULL,             -- 'buy' or 'sell'
  quantity            NUMERIC NOT NULL,
  price               NUMERIC,                   -- Execution price
  total_usd           NUMERIC,
  status              TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'filled', 'failed', 'cancelled'
  failure_reason      TEXT,
  executed_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trade_executions_user ON public.trade_executions(user_id);
CREATE INDEX idx_trade_executions_status ON public.trade_executions(status);

COMMENT ON TABLE public.trade_executions IS 'Historical record of auto-traded positions via Coinbase Advanced Trade API.';

-- 3. Row Level Security (RLS)
-- ============================================================================
-- Security policies ensuring users can only access their own data.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.e_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_trade_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_executions ENABLE ROW LEVEL SECURITY;

-- User can read/write own profile
CREATE POLICY "profiles_self" ON public.profiles
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Users can read tiers (public data)
CREATE POLICY "tiers_public_read" ON public.tiers
  FOR SELECT USING (TRUE);

-- Users can read own subscriptions
CREATE POLICY "subscriptions_self" ON public.subscriptions
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can read/write own E memory
CREATE POLICY "e_memory_self" ON public.e_memory
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can read/write own conversations
CREATE POLICY "conversations_self" ON public.conversations
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can read messages in their conversations
CREATE POLICY "messages_self" ON public.messages
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
  );

-- Users can read own daily usage
CREATE POLICY "user_daily_usage_self" ON public.user_daily_usage
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can read/write own portfolio
CREATE POLICY "user_portfolios_self" ON public.user_portfolios
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can read whale alerts (public data)
CREATE POLICY "whale_alerts_public_read" ON public.whale_alerts
  FOR SELECT USING (TRUE);

-- Users can read market data cache (public data)
CREATE POLICY "market_data_cache_public_read" ON public.market_data_cache
  FOR SELECT USING (TRUE);

-- Users can read/write own auto trade configs
CREATE POLICY "auto_trade_configs_self" ON public.auto_trade_configs
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can read own trade executions
CREATE POLICY "trade_executions_self" ON public.trade_executions
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. Functions & Triggers
-- ============================================================================

-- 4a. Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );

  -- Start a 5-day Elite trial for every new user
  INSERT INTO public.subscriptions (
    user_id,
    tier_id,
    status,
    trial_ends_at,
    current_period_end
  )
  VALUES (
    NEW.id,
    (SELECT id FROM public.tiers WHERE slug = 'elite'),
    'trialing',
    now() + INTERVAL '5 days',
    now() + INTERVAL '5 days'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4b. Auto-update updated_at columns
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER e_memory_updated_at
  BEFORE UPDATE ON public.e_memory
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER user_daily_usage_updated_at
  BEFORE UPDATE ON public.user_daily_usage
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER user_portfolios_updated_at
  BEFORE UPDATE ON public.user_portfolios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tiers_updated_at
  BEFORE UPDATE ON public.tiers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER auto_trade_configs_updated_at
  BEFORE UPDATE ON public.auto_trade_configs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4c. Increment message count on new message
CREATE OR REPLACE FUNCTION public.increment_message_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update conversation message count
  UPDATE public.conversations
  SET message_count = message_count + 1,
      updated_at = now()
  WHERE id = NEW.conversation_id;

  -- Upsert daily usage
  INSERT INTO public.user_daily_usage (user_id, usage_date, message_count, tokens_used)
  VALUES (
    (SELECT user_id FROM public.conversations WHERE id = NEW.conversation_id),
    CURRENT_DATE,
    1,
    COALESCE(NEW.tokens_used, 0)
  )
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET
    message_count = public.user_daily_usage.message_count + 1,
    tokens_used = public.user_daily_usage.tokens_used + COALESCE(NEW.tokens_used, 0),
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_created ON public.messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.increment_message_count();

-- 4d. Check message limit before allowing new messages
CREATE OR REPLACE FUNCTION public.check_message_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_tier_daily_limit INTEGER;
  v_usage_today INTEGER;
BEGIN
  -- Get user's current tier daily message limit
  SELECT t.daily_message_limit INTO v_tier_daily_limit
  FROM public.subscriptions s
  JOIN public.tiers t ON s.tier_id = t.id
  WHERE s.user_id = (SELECT user_id FROM public.conversations WHERE id = NEW.conversation_id)
    AND s.status IN ('active', 'trialing')
  LIMIT 1;

  -- NULL means unlimited
  IF v_tier_daily_limit IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get today's usage
  SELECT COALESCE(message_count, 0) INTO v_usage_today
  FROM public.user_daily_usage
  WHERE user_id = (SELECT user_id FROM public.conversations WHERE id = NEW.conversation_id)
    AND usage_date = CURRENT_DATE;

  IF v_usage_today >= v_tier_daily_limit THEN
    RAISE EXCEPTION 'DAILY_MESSAGE_LIMIT_REACHED'
      USING HINT = format('You have reached your daily limit of %s messages. Upgrade to continue.', v_tier_daily_limit);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS before_message_insert ON public.messages;
CREATE TRIGGER before_message_insert
  BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.check_message_limit();

-- 5. Materialized Views (for performance)
-- ============================================================================

-- 5a. User entitlement snapshot — fast lookup for feature gating
CREATE MATERIALIZED VIEW public.user_entitlements AS
SELECT
  p.id AS user_id,
  p.experience_level,
  p.onboarded,
  s.status AS subscription_status,
  s.trial_ends_at,
  t.slug AS tier_slug,
  t.daily_message_limit,
  t.whale_alert_min_usd,
  t.has_auto_trading,
  t.has_market_scanner,
  t.has_research_tools,
  t.has_early_signals,
  t.has_email_alerts,
  t.has_cycle_intel
FROM public.profiles p
LEFT JOIN public.subscriptions s ON p.id = s.user_id AND s.status IN ('active', 'trialing')
LEFT JOIN public.tiers t ON s.tier_id = t.id;

CREATE UNIQUE INDEX idx_user_entitlements ON public.user_entitlements(user_id);

COMMENT ON MATERIALIZED VIEW public.user_entitlements IS 'Fast lookup for checking user entitlements and feature access. Refresh periodically.';

-- Refresh function
CREATE OR REPLACE FUNCTION public.refresh_user_entitlements()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_entitlements;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 5b. Market overview — top coins by market cap
CREATE MATERIALIZED VIEW public.market_overview AS
SELECT
  coin_id,
  symbol,
  name,
  current_price,
  market_cap,
  volume_24h,
  price_change_24h,
  fetched_at
FROM public.market_data_cache
ORDER BY market_cap DESC NULLS LAST;

CREATE UNIQUE INDEX idx_market_overview ON public.market_overview(coin_id);

COMMENT ON MATERIALIZED VIEW public.market_overview IS 'Top coins by market cap for the Cycle Intelligence dashboard.';

-- 6. Seed Data — Default Tiers (already inserted above)
-- ============================================================================
-- Tiers are inserted in the table definition section.

-- 7. Verification Queries (for reference)
-- ============================================================================

-- To check tiers:
-- SELECT name, slug, price_cents, daily_message_limit, has_auto_trading FROM public.tiers ORDER BY sort_order;
--
-- To check user entitlements:
-- SELECT * FROM public.user_entitlements WHERE user_id = '<uuid>';
--
-- To check daily usage:
-- SELECT * FROM public.user_daily_usage WHERE user_id = '<uuid>' ORDER BY usage_date DESC;