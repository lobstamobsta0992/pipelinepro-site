// ============================================================================
// Market Scanner Service — Real-time monitoring of 200+ coins via CoinGecko
// ============================================================================
// Tracks price changes, volume spikes, and trend shifts.
// Classifies coins into "Hot" vs "Dead" zones with E-style commentary.
// Respects tier limits: Elite only for full scanner access.
// ============================================================================

import { getSupabase } from './supabase';
import { generateScannerCommentary, generateZoneCommentary } from './scannerCommentary';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ScannerZone = 'hot' | 'dead' | 'neutral' | 'watching';

export interface ScannerCoin {
  coin_id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  volume_24h: number;
  price_change_1h: number;
  price_change_24h: number;
  price_change_7d: number;
  volume_spike_ratio: number;    // current volume / 7d avg volume
  momentum_score: number;         // 0-100 composite momentum
  zone: ScannerZone;
  trend_shift: string;            // "breaking up", "rolling over", "consolidating", "surging", etc.
  last_updated: string;
}

export interface ScannerOverview {
  total_coins: number;
  hot_count: number;
  dead_count: number;
  neutral_count: number;
  watching_count: number;
  top_movers: ScannerCoin[];
  worst_performers: ScannerCoin[];
  volume_leaders: ScannerCoin[];
  commentary: string;
  last_refreshed: string;
  cached_until: string;
}

export interface ScannerResult {
  coins: ScannerCoin[];
  overview: ScannerOverview;
}

// ─── State ───────────────────────────────────────────────────────────────────

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const CACHE_TTL_MS = 60_000;        // 60 second cache
const COINS_PER_PAGE = 250;          // max CoinGecko allows
const MAX_COINS = 250;               // monitor top 250
const VOLUME_SPIKE_THRESHOLD = 2.0;  // 2x average = spike
const MIN_MARKET_CAP = 10_000_000;   // ignore micro-caps

let cachedResult: ScannerResult | null = null;
let lastFetchTime = 0;
let isFetching = false;
let coinGeckoApiKey: string | null = null;

type Subscriber = (result: ScannerResult) => void;
const subscribers = new Map<string, Subscriber>();

// ─── Initialization ──────────────────────────────────────────────────────────

export function initMarketScanner(apiKey: string): void {
  coinGeckoApiKey = apiKey;
  console.log('✓ Market Scanner initialized (CoinGecko Pro)');
}

// ─── Public API ──────────────────────────────────────────────────────────────

/** Get the latest scanner data (cached for 60s) */
export async function getScannerData(forceRefresh = false): Promise<ScannerResult> {
  const now = Date.now();
  if (!forceRefresh && cachedResult && (now - lastFetchTime) < CACHE_TTL_MS) {
    return cachedResult;
  }
  return refreshScannerData();
}

/** Subscribe to scanner updates */
export function subscribe(id: string, callback: Subscriber): void {
  subscribers.set(id, callback);
}

/** Unsubscribe from scanner updates */
export function unsubscribe(id: string): void {
  subscribers.delete(id);
}

/** Get a single coin's scanner data */
export function getCoinFromCache(coinId: string): ScannerCoin | null {
  if (!cachedResult) return null;
  return cachedResult.coins.find(
    (c) => c.coin_id === coinId || c.symbol.toLowerCase() === coinId.toLowerCase()
  ) ?? null;
}

/** Search coins by name or symbol */
export function searchCoins(query: string, limit = 20): ScannerCoin[] {
  if (!cachedResult) return [];
  const q = query.toLowerCase();
  return cachedResult.coins
    .filter(
      (c) =>
        c.symbol.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.coin_id.toLowerCase().includes(q)
    )
    .slice(0, limit);
}

/** Get hot zone coins (sorted by momentum) */
export function getHotZone(limit = 25): ScannerCoin[] {
  if (!cachedResult) return [];
  return cachedResult.coins
    .filter((c) => c.zone === 'hot')
    .sort((a, b) => b.momentum_score - a.momentum_score)
    .slice(0, limit);
}

/** Get dead zone coins (sorted by negative momentum) */
export function getDeadZone(limit = 25): ScannerCoin[] {
  if (!cachedResult) return [];
  return cachedResult.coins
    .filter((c) => c.zone === 'dead')
    .sort((a, b) => a.momentum_score - b.momentum_score)
    .slice(0, limit);
}

/** Get trending — coins that recently shifted zones */
export function getTrending(limit = 25): ScannerCoin[] {
  if (!cachedResult) return [];
  return cachedResult.coins
    .filter((c) => c.trend_shift !== 'consolidating' && c.trend_shift !== 'stable')
    .sort((a, b) => Math.abs(b.price_change_24h) - Math.abs(a.price_change_24h))
    .slice(0, limit);
}

/** Get tier-limited preview (Free/Pro get top 10, Elite gets all) */
export function getTierLimitedData(tier: string, limit?: number): ScannerResult | null {
  if (!cachedResult) return null;

  if (tier === 'elite') {
    return cachedResult;
  }

  // Free and Pro get a preview
  const previewLimit = limit ?? 10;
  return {
    coins: cachedResult.coins.slice(0, previewLimit),
    overview: {
      ...cachedResult.overview,
      // Mask commentary for non-elite
      commentary:
        '🔒 **Elite Tier Only** — Upgrade to unlock full market scanner with 200+ coins, hot zone analysis, and E\'s real-time commentary.',
      top_movers: cachedResult.overview.top_movers.slice(0, 5),
      worst_performers: cachedResult.overview.worst_performers.slice(0, 3),
      volume_leaders: cachedResult.overview.volume_leaders.slice(0, 3),
    },
  };
}

// ─── Core Logic ──────────────────────────────────────────────────────────────

async function refreshScannerData(): Promise<ScannerResult> {
  if (isFetching) {
    // Wait for in-flight request
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (cachedResult) return cachedResult;
  }

  isFetching = true;

  try {
    const rawCoins = await fetchAllCoins();
    const scannerCoins = processCoins(rawCoins);
    const overview = buildOverview(scannerCoins);

    cachedResult = { coins: scannerCoins, overview };
    lastFetchTime = Date.now();

    // Persist to Supabase (fire-and-forget)
    persistToSupabase(scannerCoins).catch((err) =>
      console.warn('Scanner: Supabase persist failed:', (err as Error).message)
    );

    // Notify subscribers
    for (const sub of subscribers.values()) {
      try { sub(cachedResult); } catch { /* subscriber errors shouldn't crash us */ }
    }

    console.log(`Scanner: refreshed ${scannerCoins.length} coins | hot: ${overview.hot_count} | dead: ${overview.dead_count}`);
    return cachedResult;
  } catch (err) {
    console.error('Scanner: refresh failed:', (err as Error).message);
    // Return stale cache if available
    if (cachedResult) {
      console.log('Scanner: returning stale cache');
      return cachedResult;
    }
    throw err;
  } finally {
    isFetching = false;
  }
}

async function fetchAllCoins(): Promise<RawCoinGeckoCoin[]> {
  const allCoins: RawCoinGeckoCoin[] = [];
  const pages = Math.ceil(MAX_COINS / COINS_PER_PAGE);

  for (let page = 1; page <= pages; page++) {
    const params = new URLSearchParams({
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: String(COINS_PER_PAGE),
      page: String(page),
      sparkline: 'false',
      price_change_percentage: '1h,24h,7d',
    });

    const url = `${COINGECKO_BASE}/coins/markets?${params}`;
    const headers: Record<string, string> = {};
    if (coinGeckoApiKey) {
      headers['x-cg-pro-api-key'] = coinGeckoApiKey;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch(url, { headers, signal: controller.signal });

      if (!response.ok) {
        if (response.status === 429) {
          console.warn('Scanner: CoinGecko rate limited, waiting before retry...');
          await new Promise((r) => setTimeout(r, 2_000));
          continue; // skip this page, try next
        }
        throw new Error(`CoinGecko returned ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as RawCoinGeckoCoin[];
      allCoins.push(...data);

      // Respect rate limits — CoinGecko Pro allows ~30/min, we use ~2 reqs/cycle
      if (page < pages) {
        await new Promise((r) => setTimeout(r, 200));
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  return allCoins;
}

function processCoins(rawCoins: RawCoinGeckoCoin[]): ScannerCoin[] {
  // Calculate average volume across the set for spike detection
  const volumes = rawCoins
    .filter((c) => c.market_cap >= MIN_MARKET_CAP)
    .map((c) => c.total_volume);

  const avgVolume = volumes.length
    ? volumes.reduce((a, b) => a + b, 0) / volumes.length
    : 100_000_000;

  return rawCoins
    .filter((c) => c.market_cap >= MIN_MARKET_CAP)
    .map((coin) => {
      const volumeSpikeRatio = avgVolume > 0 ? coin.total_volume / avgVolume : 1;
      const momentumScore = calculateMomentumScore(coin, volumeSpikeRatio);
      const zone = classifyZone(coin, momentumScore, volumeSpikeRatio);
      const trendShift = classifyTrendShift(coin);

      return {
        coin_id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        current_price: coin.current_price,
        market_cap: coin.market_cap,
        market_cap_rank: coin.market_cap_rank,
        volume_24h: coin.total_volume,
        price_change_1h: coin.price_change_percentage_1h_in_currency ?? 0,
        price_change_24h: coin.price_change_percentage_24h ?? 0,
        price_change_7d: coin.price_change_percentage_7d_in_currency ?? 0,
        volume_spike_ratio: Math.round(volumeSpikeRatio * 100) / 100,
        momentum_score: Math.round(momentumScore * 100) / 100,
        zone,
        trend_shift: trendShift,
        last_updated: new Date().toISOString(),
      };
    });
}

function calculateMomentumScore(
  coin: RawCoinGeckoCoin,
  volumeSpikeRatio: number
): number {
  let score = 50; // neutral baseline

  // Price change contributions (weighted)
  const h1 = coin.price_change_percentage_1h_in_currency ?? 0;
  const h24 = coin.price_change_percentage_24h ?? 0;
  const d7 = coin.price_change_percentage_7d_in_currency ?? 0;

  score += h1 * 1.5;          // 1h change: 1.5x weight
  score += h24 * 0.8;         // 24h change: 0.8x weight
  score += d7 * 0.3;          // 7d change: 0.3x weight

  // Volume spike boost (if high volume + positive price)
  if (volumeSpikeRatio > VOLUME_SPIKE_THRESHOLD && h24 > 0) {
    score += 10;
  }

  // Trend alignment bonus
  if (h1 > 0 && h24 > 0 && d7 > 0) {
    score += 8;  // aligned bullish across all timeframes
  } else if (h1 < 0 && h24 < 0 && d7 < 0) {
    score -= 8;  // aligned bearish
  }

  // Cap at 0-100
  return Math.max(0, Math.min(100, score));
}

function classifyZone(
  coin: RawCoinGeckoCoin,
  momentumScore: number,
  volumeSpikeRatio: number
): ScannerZone {
  const h24 = coin.price_change_percentage_24h ?? 0;

  if (momentumScore >= 65) return 'hot';
  if (momentumScore <= 35) return 'dead';

  // High volume + price moving = "watching" (potential breakout/breakdown)
  if (volumeSpikeRatio > 1.5 && Math.abs(h24) > 5) return 'watching';

  return 'neutral';
}

function classifyTrendShift(coin: RawCoinGeckoCoin): string {
  const h1 = coin.price_change_percentage_1h_in_currency ?? 0;
  const h24 = coin.price_change_percentage_24h ?? 0;
  const d7 = coin.price_change_percentage_7d_in_currency ?? 0;

  // Surging: strong across all timeframes
  if (h1 > 3 && h24 > 5 && d7 > 0) return 'surging';

  // Breaking up: reversing from negative longer-term
  if (h24 > 5 && d7 < -2) return 'breaking up — reversal';

  // Rolling over: short-term falling while longer-term was positive
  if (h1 < -2 && h24 < 0 && d7 > 5) return 'rolling over';

  // Tanking: negative across all
  if (h1 < -3 && h24 < -5 && d7 < -5) return 'free-falling';

  // Consolidating: flat across timeframes
  if (Math.abs(h1) < 1 && Math.abs(h24) < 3 && Math.abs(d7) < 5) return 'consolidating';

  // Divergence: 1h vs 24h going opposite directions
  if (h1 * h24 < 0) return 'volatile — watching for direction';

  return 'stable';
}

function buildOverview(coins: ScannerCoin[]): ScannerOverview {
  const hot = coins.filter((c) => c.zone === 'hot');
  const dead = coins.filter((c) => c.zone === 'dead');
  const neutral = coins.filter((c) => c.zone === 'neutral');
  const watching = coins.filter((c) => c.zone === 'watching');

  const topMovers = [...coins]
    .sort((a, b) => b.price_change_24h - a.price_change_24h)
    .slice(0, 10);

  const worstPerformers = [...coins]
    .sort((a, b) => a.price_change_24h - b.price_change_24h)
    .slice(0, 10);

  const volumeLeaders = [...coins]
    .sort((a, b) => b.volume_spike_ratio - a.volume_spike_ratio)
    .slice(0, 10);

  const commentary = generateScannerCommentary(coins, hot, dead, watching);

  const now = new Date();
  return {
    total_coins: coins.length,
    hot_count: hot.length,
    dead_count: dead.length,
    neutral_count: neutral.length,
    watching_count: watching.length,
    top_movers: topMovers,
    worst_performers: worstPerformers,
    volume_leaders: volumeLeaders,
    commentary,
    last_refreshed: now.toISOString(),
    cached_until: new Date(now.getTime() + CACHE_TTL_MS).toISOString(),
  };
}

async function persistToSupabase(coins: ScannerCoin[]): Promise<void> {
  const supabase = getSupabase();

  // Batch upsert — process in chunks of 50 to avoid huge payloads
  const CHUNK_SIZE = 50;
  for (let i = 0; i < coins.length; i += CHUNK_SIZE) {
    const chunk = coins.slice(i, i + CHUNK_SIZE);
    const rows = chunk.map((c) => ({
      coin_id: c.coin_id,
      symbol: c.symbol.toLowerCase(),
      name: c.name,
      current_price: c.current_price,
      market_cap: c.market_cap,
      volume_24h: c.volume_24h,
      price_change_24h: c.price_change_24h,
      market_data: {
        rank: c.market_cap_rank,
        price_change_1h: c.price_change_1h,
        price_change_7d: c.price_change_7d,
        volume_spike_ratio: c.volume_spike_ratio,
        momentum_score: c.momentum_score,
        zone: c.zone,
        trend_shift: c.trend_shift,
      },
      fetched_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('market_data_cache')
      .upsert(rows, { onConflict: 'coin_id', ignoreDuplicates: false });

    if (error) {
      throw new Error(`Supabase upsert failed: ${error.message}`);
    }
  }
}

// ─── Raw Types (CoinGecko response) ──────────────────────────────────────────

interface RawCoinGeckoCoin {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_24h?: number;
  price_change_percentage_7d_in_currency?: number;
}

// ─── Scheduled Refresh (Zero-Drift) ──────────────────────────────────────────

let refreshTimeout: ReturnType<typeof setTimeout> | null = null;
let stopped = false;

/**
 * Start the scanner polling loop using self-correcting setTimeout.
 * Unlike setInterval (which drifts), this schedules the next poll
 * exactly `intervalMs` after the *previous poll completes*, ensuring
 * zero cumulative drift over hours/days of operation.
 */
export function startScannerPolling(intervalMs = 60_000): void {
  if (refreshTimeout) {
    console.log('Scanner: polling already running');
    return;
  }

  stopped = false;
  console.log(`Scanner: starting zero-drift polling every ${intervalMs / 1000}s`);

  const poll = async () => {
    if (stopped) return;

    const cycleStart = Date.now();
    try {
      await refreshScannerData();
    } catch (err) {
      console.error('Scanner: poll cycle failed:', (err as Error).message);
    }

    if (stopped) return;

    // Schedule next poll exactly `intervalMs` from when THIS cycle started
    // This prevents cumulative drift — each cycle is anchored to its own start time
    const elapsed = Date.now() - cycleStart;
    const nextDelay = Math.max(0, intervalMs - elapsed);

    if (elapsed > intervalMs) {
      console.warn(`Scanner: poll took ${elapsed}ms (${elapsed - intervalMs}ms over target). Next cycle starts immediately.`);
    }

    refreshTimeout = setTimeout(poll, nextDelay);
  };

  // Immediate first fetch
  poll();
}

export function stopScannerPolling(): void {
  stopped = true;
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
    refreshTimeout = null;
    console.log('Scanner: polling stopped');
  }
}
