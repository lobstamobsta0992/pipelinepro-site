-- ============================================================================
-- Enigma Intelligence — Migration 00002: Market Scanner Enhancements
-- ============================================================================
-- Adds unique constraint on coin_id for upsert operations in market_data_cache
-- and the necessary index for fast lookups.
-- ============================================================================

-- Add unique constraint on coin_id for upsert operations
ALTER TABLE public.market_data_cache
  ADD CONSTRAINT market_data_cache_coin_id_unique UNIQUE (coin_id);

-- This unique constraint automatically creates an index, but the existing
-- idx_market_data_cache_coin_id may conflict. Drop it if it exists and recreate.
DROP INDEX IF EXISTS idx_market_data_cache_coin_id;
-- The UNIQUE constraint above creates its own index
