-- ============================================================================
-- Enigma Intelligence — Schema v1.1: Paper Trading
-- ============================================================================
-- Adds paper trading account table for DEX simulation mode.
-- ============================================================================

-- 1. Paper Accounts (demo balances for paper trading)
CREATE TABLE IF NOT EXISTS public.paper_accounts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  cash_balance      NUMERIC NOT NULL DEFAULT 100000.00,
  starting_balance  NUMERIC NOT NULL DEFAULT 100000.00,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_paper_accounts_user_id ON public.paper_accounts(user_id);

COMMENT ON TABLE public.paper_accounts IS 'Demo trading accounts with virtual cash balances for paper trading mode.';

-- 2. RLS
ALTER TABLE public.paper_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "paper_accounts_self" ON public.paper_accounts
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. Trigger for auto-updating updated_at
CREATE TRIGGER paper_accounts_updated_at
  BEFORE UPDATE ON public.paper_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
