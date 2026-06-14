# Enigma Intelligence — Supabase Schema Documentation

> **Version:** 1.0  
> **Last Updated:** 2026-06-14  
> **Author:** AI & Backend Engineer (`e_soul`)

---

## Overview

This document describes the complete Supabase database schema for the Enigma Intelligence crypto intelligence platform. The schema is designed to support:

- **User management** extending Supabase Auth
- **5-day Elite free trial** with automatic provisioning
- **Tier-based feature locking** (Free → Pro → Elite)
- **Persistent AI memory** for E's contextual awareness
- **Market data** caching for real-time cycle intelligence
- **Portfolio tracking** (manual and Coinbase-synced)
- **Whale alerts** and transaction monitoring
- **Auto-trading** configurations and execution history (Elite tier)

---

## Entity Relationship Diagram (Textual)

```
auth.users (Supabase built-in)
    │
    ├─── profiles (1:1) — user persona & preferences
    ├─── subscriptions (1:N) — tier assignments & billing
    ├─── e_memory (1:N) — persistent AI memory
    ├─── conversations (1:N) — chat sessions
    │       └─── messages (1:N) — individual messages
    ├─── user_daily_usage (1:N) — message/token counters
    ├─── user_portfolios (1:N) — tracked holdings
    ├─── auto_trade_configs (1:N) — trading strategies
    └─── trade_executions (1:N) — executed trades
    
tiers — pricing/feature definitions (seed data)
whale_alerts — blockchain transaction alerts (public)
market_data_cache — CoinGecko/API snapshots (public)
```

---

## Tables

### 1. `profiles`

Extends Supabase `auth.users` with Enigma-specific crypto trading persona data.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `UUID` (PK, FK → auth.users) | — | Matches Supabase Auth user ID |
| `username` | `TEXT UNIQUE` | — | Unique display handle |
| `display_name` | `TEXT` | `''` | Full display name |
| `avatar_url` | `TEXT` | `NULL` | Profile avatar URL |
| `experience_level` | `ENUM` | `'beginner'` | `beginner`, `intermediate`, or `advanced` |
| `trading_style` | `ENUM` | `'moderate'` | `conservative`, `moderate`, or `aggressive` |
| `trading_goals` | `JSONB` | `[]` | Array of goal strings |
| `onboarded` | `BOOLEAN` | `FALSE` | Completed "Meet E" onboarding |
| `created_at` | `TIMESTAMPTZ` | `now()` | — |
| `updated_at` | `TIMESTAMPTZ` | `now()` | Auto-updated |

**RLS:** Users can only read/write their own profile.

---

### 2. `tiers`

Pricing and feature definition table. Seeded with three tiers.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `UUID` (PK) | `gen_random_uuid()` | — |
| `name` | `TEXT UNIQUE` | — | Human-readable: "Free", "Pro", "Elite" |
| `slug` | `TEXT UNIQUE` | — | Machine-readable: `free`, `pro`, `elite` |
| `price_cents` | `INTEGER` | `0` | Price in cents (monthly) |
| `daily_message_limit` | `INTEGER` | `NULL` | Max messages/day; `NULL` = unlimited |
| `whale_alert_min_usd` | `BIGINT` | `1000000000` | Minimum USD value for whale alerts |
| `has_auto_trading` | `BOOLEAN` | `FALSE` | Elite only |
| `has_market_scanner` | `BOOLEAN` | `FALSE` | Elite only |
| `has_research_tools` | `BOOLEAN` | `FALSE` | Pro+ |
| `has_early_signals` | `BOOLEAN` | `FALSE` | Elite only |
| `has_email_alerts` | `BOOLEAN` | `FALSE` | Elite only |
| `has_cycle_intel` | `BOOLEAN` | `FALSE` | Pro+ |
| `sort_order` | `INTEGER` | `0` | Display ordering |
| `created_at` | `TIMESTAMPTZ` | `now()` | — |
| `updated_at` | `TIMESTAMPTZ` | `now()` | Auto-updated |

**Seed Data:**

| Tier | Price | Msg/Day | Whale Min | Features |
|------|-------|---------|-----------|----------|
| **Free** | $0 | 5 | $1B+ | None (preview mode) |
| **Pro** | $49/mo | 20 | $1M+ | Cycle intel, research tools |
| **Elite** | $149/mo | Unlimited | $500k+ | Everything: auto-trading, scanner, signals, alerts |

**RLS:** Public read access (any authenticated user can see tiers).

---

### 3. `subscriptions`

Links users to their subscription tier. Supports Stripe lifecycle management.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `UUID` (PK) | `gen_random_uuid()` | — |
| `user_id` | `UUID` (FK → auth.users) | — | Cascade delete |
| `tier_id` | `UUID` (FK → tiers) | — | Current tier |
| `status` | `ENUM` | `'active'` | `active`, `trialing`, `cancelled`, `expired`, `past_due` |
| `trial_ends_at` | `TIMESTAMPTZ` | `NULL` | 5-day trial expiration |
| `current_period_start` | `TIMESTAMPTZ` | `now()` | Billing period start |
| `current_period_end` | `TIMESTAMPTZ` | — | Billing period end |
| `stripe_subscription_id` | `TEXT UNIQUE` | `NULL` | Stripe reference |
| `stripe_customer_id` | `TEXT` | `NULL` | Stripe customer |
| `cancelled_at` | `TIMESTAMPTZ` | `NULL` | When cancelled |
| `created_at` | `TIMESTAMPTZ` | `now()` | — |
| `updated_at` | `TIMESTAMPTZ` | `now()` | Auto-updated |

**Key Behavior:** On user signup, a trigger auto-creates a 5-day Elite trial subscription.

**RLS:** Users can only read/write their own subscriptions.

---

### 4. `e_memory`

Persistent key-value memory for E's AI context. Each user has multiple memory entries.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `UUID` (PK) | `gen_random_uuid()` | — |
| `user_id` | `UUID` (FK → auth.users) | — | Cascade delete |
| `memory_key` | `TEXT` | — | e.g., `personality_traits`, `recent_interests`, `preferred_style` |
| `content` | `JSONB` | `{}` | Memory data payload |
| `expires_at` | `TIMESTAMPTZ` | `NULL` | Optional TTL for ephemeral memories |
| `created_at` | `TIMESTAMPTZ` | `now()` | — |
| `updated_at` | `TIMESTAMPTZ` | `now()` | Auto-updated |

**Unique:** `(user_id, memory_key)` — one entry per key per user.

**RLS:** Users can only read/write their own memory.

---

### 5. `conversations`

Chat sessions between users and E.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `UUID` (PK) | `gen_random_uuid()` | — |
| `user_id` | `UUID` (FK → auth.users) | — | Cascade delete |
| `title` | `TEXT` | `NULL` | Auto-generated or user-set title |
| `message_count` | `INTEGER` | `0` | Auto-incremented via trigger |
| `is_active` | `BOOLEAN` | `TRUE` | Soft-delete flag |
| `metadata` | `JSONB` | `{}` | e.g., `{"topic": "bitcoin", "sentiment": "bullish"}` |
| `created_at` | `TIMESTAMPTZ` | `now()` | — |
| `updated_at` | `TIMESTAMPTZ` | `now()` | Updated on new message |

**RLS:** Users can only read/write their own conversations.

---

### 6. `messages`

Individual messages within conversations.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `UUID` (PK) | `gen_random_uuid()` | — |
| `conversation_id` | `UUID` (FK → conversations) | — | Cascade delete |
| `role` | `ENUM` | — | `user`, `assistant`, or `system` |
| `content` | `TEXT` | — | Message body |
| `tokens_used` | `INTEGER` | `NULL` | Token count for billing/limits |
| `metadata` | `JSONB` | `{}` | Sentiment, coin mentions, etc. |
| `created_at` | `TIMESTAMPTZ` | `now()` | — |

**Triggers:**
- `before_message_insert` — checks daily message limit against tier. Raises `DAILY_MESSAGE_LIMIT_REACHED` exception if exceeded.
- `after_message_insert` — increments `conversations.message_count` and upserts `user_daily_usage`.

**RLS:** Users can read messages from their own conversations.

---

### 7. `user_daily_usage`

Daily usage counters for enforcing message limits.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `UUID` (PK) | `gen_random_uuid()` | — |
| `user_id` | `UUID` (FK → auth.users) | — | Cascade delete |
| `usage_date` | `DATE` | `CURRENT_DATE` | — |
| `message_count` | `INTEGER` | `0` | Auto-incremented |
| `tokens_used` | `INTEGER` | `0` | Total tokens consumed |
| `created_at` | `TIMESTAMPTZ` | `now()` | — |
| `updated_at` | `TIMESTAMPTZ` | `now()` | Auto-updated |

**Unique:** `(user_id, usage_date)` — one row per user per day.

**RLS:** Users can only read/write their own usage.

---

### 8. `user_portfolios`

Tracked crypto holdings, either manual or synced from Coinbase.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `UUID` (PK) | `gen_random_uuid()` | — |
| `user_id` | `UUID` (FK → auth.users) | — | Cascade delete |
| `asset` | `TEXT` | — | `BTC`, `ETH`, `SOL`, etc. |
| `quantity` | `NUMERIC` | `0` | — |
| `average_entry_price` | `NUMERIC` | `NULL` | USD average entry |
| `notes` | `TEXT` | `NULL` | User notes |
| `is_manual` | `BOOLEAN` | `TRUE` | Manual vs Coinbase sync |
| `created_at` | `TIMESTAMPTZ` | `now()` | — |
| `updated_at` | `TIMESTAMPTZ` | `now()` | Auto-updated |

**Unique:** `(user_id, asset)` — one holding per asset per user.

**RLS:** Users can only read/write their own portfolio.

---

### 9. `whale_alerts`

Publicly visible whale transaction alerts from blockchain monitors.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `UUID` (PK) | `gen_random_uuid()` | — |
| `transaction_hash` | `TEXT` | — | Blockchain tx hash |
| `blockchain` | `TEXT` | — | `bitcoin`, `ethereum`, `solana` |
| `from_address` | `TEXT` | `NULL` | Sender wallet |
| `to_address` | `TEXT` | `NULL` | Receiver wallet |
| `asset` | `TEXT` | — | `BTC`, `ETH`, `USDC` |
| `amount` | `NUMERIC` | — | Raw amount |
| `usd_value` | `NUMERIC` | — | USD equivalent |
| `transaction_type` | `ENUM` | `'transfer'` | `transfer`, `buy`, `sell`, `swap` |
| `alert_level` | `ENUM` | — | `minor`, `major`, `whale` |
| `detected_at` | `TIMESTAMPTZ` | — | When the tx occurred |
| `created_at` | `TIMESTAMPTZ` | `now()` | — |

**Indexes:** `detected_at DESC`, `usd_value DESC`, `asset`.

**RLS:** Public read access (any authenticated user).

---

### 10. `market_data_cache`

Cached market data from CoinGecko and similar APIs.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `UUID` (PK) | `gen_random_uuid()` | — |
| `coin_id` | `TEXT` | — | CoinGecko ID: `bitcoin`, `ethereum` |
| `symbol` | `TEXT` | — | `btc`, `eth` |
| `name` | `TEXT` | — | Full name |
| `current_price` | `NUMERIC` | `NULL` | USD price |
| `market_cap` | `NUMERIC` | `NULL` | — |
| `volume_24h` | `NUMERIC` | `NULL` | — |
| `price_change_24h` | `NUMERIC` | `NULL` | Percentage change |
| `market_data` | `JSONB` | `{}` | Full raw data |
| `fetched_at` | `TIMESTAMPTZ` | `now()` | Last fetch time |

**RLS:** Public read access.

---

### 11. `auto_trade_configs`

Elite-tier auto-trading strategy configurations (Coinbase Advanced Trade).

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `UUID` (PK) | `gen_random_uuid()` | — |
| `user_id` | `UUID` (FK → auth.users) | — | Cascade delete |
| `name` | `TEXT` | — | Strategy name |
| `is_active` | `BOOLEAN` | `FALSE` | Enabled/disabled |
| `config` | `JSONB` | `{}` | Strategy parameters |
| `created_at` | `TIMESTAMPTZ` | `now()` | — |
| `updated_at` | `TIMESTAMPTZ` | `now()` | Auto-updated |

**RLS:** Users can only read/write their own configs.

---

### 12. `trade_executions`

Historical record of trades executed via the auto-trading engine.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `UUID` (PK) | `gen_random_uuid()` | — |
| `user_id` | `UUID` (FK → auth.users) | — | Cascade delete |
| `config_id` | `UUID` (FK → auto_trade_configs) | `NULL` | Source strategy |
| `order_id` | `TEXT` | `NULL` | Coinbase order ID |
| `asset` | `TEXT` | — | Traded asset |
| `side` | `TEXT` | — | `buy` or `sell` |
| `quantity` | `NUMERIC` | — | Amount |
| `price` | `NUMERIC` | `NULL` | Execution price (USD) |
| `total_usd` | `NUMERIC` | `NULL` | Total value |
| `status` | `TEXT` | `'pending'` | `pending`, `filled`, `failed`, `cancelled` |
| `failure_reason` | `TEXT` | `NULL` | If failed |
| `executed_at` | `TIMESTAMPTZ` | `NULL` | When filled |
| `created_at` | `TIMESTAMPTZ` | `now()` | — |

**RLS:** Users can only read/write their own executions.

---

## Auto-Triggers

| Trigger | Timing | Purpose |
|---------|--------|---------|
| `on_auth_user_created` | After INSERT on `auth.users` | Creates profile + 5-day Elite trial |
| `profiles_updated_at` | Before UPDATE on `profiles` | Sets `updated_at = now()` |
| `subscriptions_updated_at` | Before UPDATE on `subscriptions` | Sets `updated_at = now()` |
| `e_memory_updated_at` | Before UPDATE on `e_memory` | Sets `updated_at = now()` |
| `user_daily_usage_updated_at` | Before UPDATE on `user_daily_usage` | Sets `updated_at = now()` |
| `user_portfolios_updated_at` | Before UPDATE on `user_portfolios` | Sets `updated_at = now()` |
| `tiers_updated_at` | Before UPDATE on `tiers` | Sets `updated_at = now()` |
| `auto_trade_configs_updated_at` | Before UPDATE on `auto_trade_configs` | Sets `updated_at = now()` |
| `on_message_created` | After INSERT on `messages` | Increments conversation count + daily usage |
| `before_message_insert` | Before INSERT on `messages` | Checks tier daily message limit |

---

## Materialized Views

### `user_entitlements`

Fast lookup for feature gating. Joins profiles + subscriptions + tiers.

```sql
SELECT * FROM public.user_entitlements WHERE user_id = '<uuid>';
```

Refresh:
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_entitlements;
```

### `market_overview`

Top coins by market cap for the Cycle Intelligence dashboard.

```sql
SELECT * FROM public.market_overview LIMIT 50;
```

---

## Row Level Security (RLS) Summary

| Table | Access Pattern |
|-------|---------------|
| `profiles` | Self only |
| `tiers` | Public read |
| `subscriptions` | Self only |
| `e_memory` | Self only |
| `conversations` | Self only |
| `messages` | Via own conversations |
| `user_daily_usage` | Self only |
| `user_portfolios` | Self only |
| `whale_alerts` | Public read |
| `market_data_cache` | Public read |
| `auto_trade_configs` | Self only |
| `trade_executions` | Self only |

---

## Deployment

### Prerequisites
- Supabase project with Auth enabled
- PostgreSQL 15+

### Run Migration
Execute the migration file against your Supabase database:

```bash
# Via Supabase CLI
supabase migration up

# Or directly via psql
psql "$SUPABASE_DB_URL" -f supabase/migrations/00001_initial_schema.sql
```

### Verify Setup
```sql
-- Check tier seed data
SELECT name, slug, price_cents, daily_message_limit, has_auto_trading 
FROM public.tiers ORDER BY sort_order;

-- Check entitlements view works
SELECT * FROM public.user_entitlements LIMIT 5;

-- Check trigger on auth.users
SELECT trigger_name, event_manipulation, action_timing 
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND event_object_schema = 'auth';
```

---

## Integration Points

### For Frontend (`ui_dev`)
- **Feature gating:** Query `user_entitlements` to determine which features to show
- **Message limits:** Check `user_daily_usage` before allowing chat
- **5-day trial:** Check `subscriptions.trial_ends_at` for countdown display
- **Blurred previews:** Show blurred UI for locked features (check tier flags)

### For E (AI Personality)
- **Personality adaptation:** Read `profiles.experience_level` to adjust technical depth
- **Memory:** Read/write `e_memory` to maintain context across sessions
- **Conversation continuity:** Use `conversations` and `messages` for session history

### For Trading
- **Portfolio:** Read/write `user_portfolios` for manual/Coinbase tracking
- **Auto-trade:** Elite users create configs in `auto_trade_configs`
- **Executions:** Trade results stored in `trade_executions`

### For Alerts
- **Whale filters:** Compare `whale_alerts.usd_value` against `tiers.whale_alert_min_usd`
- **Email alerts:** Trigger via `has_email_alerts` flag for Elite subscribers