-- ============================================================================
-- Enigma Intelligence — Migration 00004: DCA Strategy Tables (Phase 4)
-- ============================================================================
-- Supports the Sentiment-Based DCA auto-trading strategy.
-- dca_strategies stores user configuration, dca_executions logs every cycle.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.dca_strategies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL DEFAULT 'DCA Strategy',
  asset           TEXT NOT NULL,
  base_amount     NUMERIC NOT NULL DEFAULT 100,
  frequency       TEXT NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'biweekly')),
  max_multiplier  NUMERIC NOT NULL DEFAULT 3.0,
  min_cash_reserve NUMERIC NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  paused          BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dca_strategies_user ON public.dca_strategies(user_id);
CREATE INDEX idx_dca_strategies_active ON public.dca_strategies(is_active, paused);

-- DCA execution log
CREATE TABLE IF NOT EXISTS public.dca_executions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id         UUID NOT NULL REFERENCES public.dca_strategies(id) ON DELETE CASCADE,
  asset               TEXT NOT NULL,
  base_amount         NUMERIC NOT NULL,
  multiplier          NUMERIC NOT NULL,
  buy_amount          NUMERIC NOT NULL,
  fear_greed          NUMERIC,
  fear_greed_label    TEXT,
  news_sentiment_score NUMERIC,
  hot_zone_pct        NUMERIC,
  executed            BOOLEAN NOT NULL DEFAULT false,
  skipped             BOOLEAN NOT NULL DEFAULT false,
  skip_reason         TEXT,
  commentary          TEXT,
  coinbase_order_id   TEXT,
  scheduled_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  executed_at         TIMESTAMPTZ
);

CREATE INDEX idx_dca_executions_strategy ON public.dca_executions(strategy_id);
CREATE INDEX idx_dca_executions_scheduled ON public.dca_executions(scheduled_at DESC);

-- RLS: Users access only their own DCA data
ALTER TABLE public.dca_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dca_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dca_strategies_self_only" ON public.dca_strategies
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "dca_executions_self_only" ON public.dca_executions
  FOR ALL USING (strategy_id IN (
    SELECT id FROM public.dca_strategies WHERE user_id = auth.uid()
  ));

-- Auto-update updated_at on strategy changes
CREATE OR REPLACE FUNCTION update_dca_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dca_strategies_updated_at
  BEFORE UPDATE ON public.dca_strategies
  FOR EACH ROW EXECUTE FUNCTION update_dca_updated_at();
