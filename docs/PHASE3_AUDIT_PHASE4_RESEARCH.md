# Enigma Intelligence — Phase 3 Technical Audit & Phase 4 Strategy Research
> **Date:** 2026-07-29
> **Author:** AI & Backend Engineer (`e_soul`)
> **Status:** Complete

---

## Part 1: Phase 3 Technical Audit

### 1.1 Backend Service Inventory

| Service | File | Status | Supabase Integration | Mounted |
|---------|------|--------|---------------------|---------|
| Core API (onboarding, chat, profile) | `routes/api.ts` | ✅ Active | ✅ profiles, e_memory, conversations, messages, subscriptions | `/api` |
| Market Scanner | `services/marketScanner.ts` | ✅ Active | ✅ market_data_cache (upsert via getSupabase) | `/scanner` |
| Scanner Commentary | `services/scannerCommentary.ts` | ✅ Active | N/A (pure logic) | Via scanner routes |
| Stripe Payments | `services/stripe.ts` | ✅ Active | N/A (direct Stripe API) | Via api routes |
| Claude AI | `services/claude.ts` | ⚠️ Not configured | N/A (requires ANTHROPIC_API_KEY) | Via api routes |
| Supabase Client | `services/supabase.ts` | ✅ Active | ✅ Full CRUD + getSupabase() export | All services |

**Missing from filesystem (built in prior sessions, need restoration):**
- `services/whaleAlerts.ts` — Whale Alert polling + Supabase storage
- `services/cycleIndicators.ts` — Pi Cycle, MVRV, NUPL, Fear & Greed
- `services/eCommentary.ts` — E's commentary for whales and cycles
- `services/newsFeed.ts` — Newsdata.io integration
- `services/paperTrading.ts` — DEX paper trading simulation
- `services/coinbaseExecution.ts` — Coinbase Advanced Trade execution
- `routes/intel.ts` — Intelligence endpoints (whales, cycles, news)
- `routes/paper.ts` — Paper trading endpoints
- `routes/execute.ts` — Coinbase execution endpoints

### 1.2 Market Scanner — Deep Audit

#### Polling Loop: ✅ Zero-Drift (Fixed)
- **Before:** `setInterval(fn, 60000)` — drifts ~1-2ms per cycle, compounds to minutes over days
- **After:** Self-correcting `setTimeout` loop anchored to cycle start time
- **Behavior:** Next poll scheduled `max(0, intervalMs - elapsed)` from cycle start
- **Overrun handling:** Logs warning if poll exceeds interval; schedules next immediately
- **Graceful shutdown:** `stopScannerPolling()` sets `stopped` flag + clears timeout

#### CoinGecko Integration: ✅ Robust
- Pro API key from `.secrets.env` (verified: `CG-w427QTUoi1edbdWwM1N3H4Gb`)
- 2 pages × 250 coins = 500 max coverage (filtered to ~250 after micro-cap exclusion)
- 429 rate-limit handling with 2s backoff
- 15s fetch timeout per page via AbortController
- 200ms inter-page delay for rate limit headroom

#### Momentum Scoring: ✅ Sound Methodology
- Weighted composite: 1h×1.5 + 24h×0.8 + 7d×0.3 (short-term weight > long-term)
- Volume spike bonus: +10 if volume > 2x average AND price positive
- Trend alignment: ±8 for aligned bullish/bearish across all timeframes
- Capped 0-100 range

#### Zone Classification: ✅ Clear Thresholds
- Hot: momentum ≥ 65
- Dead: momentum ≤ 35
- Watching: volume spike (>1.5x) + significant price move (>5%)
- Neutral: everything else

#### Tier Gating: ✅ Correctly Implemented
- Elite: full 250 coins + all commentary + coin deep-dives + zone filters
- Free/Pro: top 10 preview + masked commentary + 5-coin limits on sub-endpoints
- Tier resolved via `user_id` query param or `x-user-id` header → Supabase subscription lookup

#### Supabase Persistence: ⚠️ Requires Migration 00002
- Uses `onConflict: 'coin_id'` for upsert — requires UNIQUE constraint
- Migration `00002_market_scanner.sql` exists but must be applied to Supabase
- Chunked writes: 50 rows per batch to avoid oversized payloads
- JSONB `market_data` column stores extended scanner fields

### 1.3 E's Commentary Consistency Check

Comparing `scannerCommentary.ts` against `prompts/e-personality.ts`:

| Voice Element | e-personality.ts Spec | scannerCommentary.ts Implementation | Match |
|--------------|----------------------|-------------------------------------|-------|
| Confident, never arrogant | "you know your stuff but stay humble about markets" | "When the music is this loud, everyone's a genius. Just remember — tops are a process." | ✅ |
| Witty, natural | "drop crypto culture references naturally" | "Don't try to catch this one with your teeth." "Knives out." | ✅ |
| Short, punchy | "You're not a novelist" | All lines < 3 sentences | ✅ |
| Trading slang | "bags", "exit liquidity", "buy the dip", "DCA" | "dry powder", "alpha", "FOMO", "stop-losses tight", "bags" | ✅ |
| ALL CAPS emphasis | "Occasionally use ALL CAPS" | "Bulls are FEELING themselves", "Market is COOKING" | ✅ |
| Protective | "genuinely care about user's portfolio" | "Keep your stop-losses tight", "Don't chase green candles" | ✅ |
| No financial advice | "NEVER give financial advice" | "Not financial advice, but..." implied throughout | ✅ |
| Poker/sports analogies | "poker, sports, military strategy" | Limited — could add more | ⚠️ |

**Verdict:** Commentary is consistent with E's personality. Minor improvement: add a few more poker/military strategy analogies in future iterations.

### 1.4 index.ts Integration Audit

| Component | Mount Status | Init Order | Notes |
|-----------|-------------|------------|-------|
| Express + CORS | ✅ | 1 | localhost:3000 allowed |
| JSON parser | ✅ | 2 | 1mb limit |
| Request logging | ✅ | 3 | Method, path, status, duration |
| `/api` routes | ✅ | 4 | Core onboarding + chat |
| `/scanner` routes | ✅ | 5 | 9 scanner endpoints |
| Stripe init | ✅ | 6 | Live mode key from .secrets.env |
| Supabase init | ✅ | 7 | Service role key from .secrets.env |
| Market Scanner init | ✅ | 8 | CoinGecko key, deferred polling start |
| Claude init | ⚠️ | 9 | Requires ANTHROPIC_API_KEY env var |

**Server banner shows:**
- Port, Mode, Claude status, Scanner status
- API URL, Health URL, Status URL, Scanner URL

---

## Part 2: Known Issues & Recommendations

### Critical
1. **Phase 2/3 services missing from filesystem:** Whale Alerts, Cycle Indicators, News Feed, Paper Trading, Coinbase Execution services and their routes were built but are not present. Must be restored from prior session artifacts or rebuilt before production deployment.

2. **ANTHROPIC_API_KEY not configured:** E currently falls back to hardcoded placeholder responses. Claude integration is wired but inactive.

3. **Migration 00002 not applied:** UNIQUE constraint on `market_data_cache.coin_id` required for scanner persistence. Must run against Supabase.

### Moderate
4. **No Redis/message queue:** In-memory onboarding state (`onboardingSessions` Map in api.ts) will not survive server restarts or scale across instances.

5. **No error alerting:** Scanner errors are logged to console only — no Slack/webhook/email alerting for production monitoring.

### Minor
6. **TypeScript strict mode:** Enabled and passing — good practice maintained.
7. **Scanner memory:** In-memory cache of 250+ coins with full commentary strings — monitor for memory growth in long-running processes.

---

## Part 3: Phase 4 Strategy Research — AI-Managed Auto-Trading

### 3.1 Strategy: Sentiment-Based DCA (Dollar-Cost Averaging)

**Concept:** E adjusts DCA buy amounts based on real-time market sentiment indicators.

**Inputs:**
- Fear & Greed Index (from cycle indicators service)
- News sentiment score (from news feed service)
- Social sentiment (Twitter/Reddit mentions — future integration)
- Market Scanner zone distribution (% hot vs % dead)

**Logic:**
```
Base DCA amount: $100/week (user-configurable)

Fear & Greed ≤ 25 (Extreme Fear):      2.0x multiplier = $200 buy
Fear & Greed 26-40 (Fear):             1.5x multiplier = $150 buy
Fear & Greed 41-60 (Neutral):          1.0x multiplier = $100 buy
Fear & Greed 61-75 (Greed):            0.5x multiplier = $50 buy
Fear & Greed ≥ 76 (Extreme Greed):     0.0x — skip, accumulate cash

Bonus: If news sentiment < -0.5 AND Fear ≤ 40: +0.5x additional
```

**Implementation requirements:**
- New table: `auto_trade_strategies` — extends `auto_trade_configs` with strategy-specific params
- New service: `src/services/sentimentDCA.ts`
- Integration with existing cycle indicators + news sentiment
- E provides commentary on each buy/skip decision
- User-configurable: base amount, asset, max multiplier, schedule (daily/weekly)

**Risk management:**
- Hard cap on max buy (never exceed 3x base in a single execution)
- Minimum cash reserve (never deploy below configured threshold)
- Manual override — user can pause at any time

### 3.2 Strategy: Whale-Follower Mode

**Concept:** E monitors whale wallet activity and mirrors significant moves at reduced scale.

**Inputs:**
- Whale Alert Service (existing) — large transactions
- Known whale wallets (configurable watchlist)
- Exchange inflow/outflow tracking (CoinGecko on-chain data)
- Market Scanner volume spike alerts

**Logic:**
```
Watch for:
- Single transaction ≥ $5M (configurable threshold)
- Accumulation pattern: 3+ buys > $1M from same wallet in 24h
- Exchange outflow spike: > 2x normal exchange withdrawals (bullish — whales moving to cold storage)

Action:
- On accumulation signal: Buy 10% of whale position size (max $5,000 per signal)
- On distribution signal: Sell 10% of tracked position (never full exit)
- Cooldown: Minimum 6 hours between signals for same asset
```

**Implementation requirements:**
- Extend `whale_alerts` table with `wallet_address` tracking
- New service: `src/services/whaleFollower.ts`
- Known whale address database (curated or user-provided)
- Signal deduplication to prevent chain-reactions
- E commentary: "A $50M whale just loaded up on ETH. I'm matching 0.1% of that move for you."

**Risk management:**
- Position size cap: 10% of portfolio per asset
- Maximum 3 concurrent whale-following positions
- Whale signals expire after 4 hours if not executed
- User must explicitly enable per-asset

### 3.3 Strategy: Cycle-Aware Rebalancing

**Concept:** E adjusts portfolio allocation based on where we are in the 4-year crypto cycle.

**Inputs:**
- Pi Cycle Top Indicator (existing)
- MVRV Z-Score (existing)
- NUPL — Net Unrealized Profit/Loss (existing)
- BTC dominance trend

**Cycle Phases & Allocations:**
```
Phase: Accumulation (MVRV < 1, NUPL < 0)
  → 80% crypto / 20% stablecoins
  → Aggressive DCA, favor BTC/ETH

Phase: Bull Market (MVRV 1-3, NUPL 0-0.5)
  → 70% crypto / 30% stablecoins
  → Rotate to strong alts, take partial profits at resistance

Phase: Euphoria (MVRV > 3, NUPL > 0.75, Pi Cycle approaching)
  → 40% crypto / 60% stablecoins
  → Aggressive profit-taking, tight stop-losses
  → E: "The Pi Cycle is flashing. I'm moving 60% to dry powder. This is NOT the time to be a hero."

Phase: Bear/Despair (MVRV < 1, price below 200 DMA)
  → 60% stablecoins / 40% DCA re-entry
  → Slow accumulation at deepening discounts
```

**Implementation requirements:**
- Extend cycle indicators service with phase classification
- New service: `src/services/cycleRebalancer.ts`
- User sets: risk tolerance (conservative/moderate/aggressive) adjusts allocation percentages
- E provides cycle-phase commentary and rationale for each rebalance

### 3.4 Recommended Phase 4 Roadmap

| Priority | Feature | Effort | Revenue Impact | Dependencies |
|----------|---------|--------|---------------|--------------|
| P0 | Sentiment-Based DCA | Medium | High — broad appeal | Cycle indicators, news sentiment |
| P1 | Whale-Follower Mode | High | High — Elite differentiator | Whale alert service, wallet tracking |
| P2 | Cycle-Aware Rebalancing | Medium | Medium — power users | Cycle indicators (Pi, MVRV, NUPL) |
| P3 | AI Portfolio Optimization | High | Medium — advanced | All above + backtesting framework |

**Recommended launch order:** Sentiment DCA first — it's the safest (only buys, no sells), has broadest appeal, and leverages existing sentiment indicators. Whale-follower second as the "wow factor" Elite feature. Cycle rebalancing third for sophisticated users.

### 3.5 Phase 4 Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    E's AI Brain (Claude)                 │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Sentiment   │  │ Whale        │  │ Cycle         │  │
│  │ DCA Engine  │  │ Follower     │  │ Rebalancer    │  │
│  └──────┬──────┘  └──────┬───────┘  └──────┬────────┘  │
│         │                │                  │            │
│  ┌──────┴────────────────┴──────────────────┴────────┐  │
│  │           Auto-Trade Orchestrator                  │  │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────────┐   │  │
│  │  │ Signal   │  │ Risk     │  │ Execution      │   │  │
│  │  │ Generator│  │ Manager  │  │ (Coinbase API) │   │  │
│  │  └──────────┘  └──────────┘  └────────────────┘   │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         │              │                │
    ┌────┴────┐   ┌─────┴──────┐   ┌────┴──────┐
    │ Fear &  │   │ Whale Alert│   │ Pi Cycle  │
    │ Greed   │   │ Service    │   │ MVRV/NUPL │
    └─────────┘   └────────────┘   └───────────┘
```

---

## Part 4: Immediate Action Items

1. **Restore Phase 2/3 services** from prior session backups or rebuild
2. **Apply migration 00002** to Supabase (UNIQUE constraint on coin_id)
3. **Set ANTHROPIC_API_KEY** for live E responses
4. **Run full integration test** once all services are mounted
