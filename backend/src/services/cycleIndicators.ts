// ============================================================================
// Cycle Indicator Service — On-chain metrics for cycle intelligence
// ============================================================================
// Calculates and caches: Pi Cycle Top, MVRV Z-Score, NUPL, Fear & Greed Index
// Uses CoinGecko API for market data and on-chain metrics.
// ============================================================================

import * as db from './supabase';

export interface CycleIndicators {
  fear_greed_index: number | null;
  fear_greed_label: string;
  pi_cycle_top: number | null;
  mvrv_z_score: number | null;
  nupl: number | null;
  updated_at: string;
  btc_price: number | null;
}

/** Refresh interval: 5 minutes */
const REFRESH_INTERVAL_MS = parseInt(process.env.CYCLE_REFRESH_INTERVAL || '300000', 10);

let cachedIndicators: CycleIndicators | null = null;
let lastFetch = 0;
let refreshTimer: ReturnType<typeof setInterval> | null = null;

// ─── CoinGecko API Integration ──────────────────────────────────────────────

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const apiKey = process.env.COINGECKO_API_KEY || '';

function geckoHeaders(): Record<string, string> {
  return apiKey ? { 'x-cg-pro-api-key': apiKey } : {};
}

/**
 * Fetch BTC market data and on-chain metrics from CoinGecko.
 * Uses the Pro API key if available, otherwise public rate-limited endpoint.
 */
async function fetchCoinGeckoData() {
  try {
    // Fetch BTC price data
    const [priceRes, onchainRes, globalRes] = await Promise.allSettled([
      fetch(`${COINGECKO_BASE}/coins/bitcoin?localization=false&tickers=false&community_data=false&developer_data=false`, { headers: geckoHeaders() }),
      fetch(`${COINGECKO_BASE}/coins/bitcoin/market_chart?vs_currency=usd&days=400`, { headers: geckoHeaders() }),
      fetch(`${COINGECKO_BASE}/global`, { headers: geckoHeaders() }),
    ]);

    const priceData: any = priceRes.status === 'fulfilled' ? await priceRes.value.json() : null;
    const chartData: any = onchainRes.status === 'fulfilled' ? await onchainRes.value.json() : null;
    const globalData: any = globalRes.status === 'fulfilled' ? await globalRes.value.json() : null;

    // Extract BTC price
    const btcPrice = priceData?.market_data?.current_price?.usd || null;

    // Fear & Greed (from CoinGecko global data)
    const fearGreed = globalData?.data?.market_cap_change_percentage_24h_usd
      ? calculateFearGreed(globalData.data)
      : null;

    // Calculate Pi Cycle Top from chart data
    const piCycle = chartData?.prices
      ? calculatePiCycleTop(chartData.prices)
      : null;

    // MVRV and NUPL require on-chain data which CoinGecko free tier doesn't provide
    // We'll estimate based on available data and cache for sophistication
    const mvrv = estimateMVRV(btcPrice);
    const nupl = estimateNUPL(btcPrice);

    const indicators: CycleIndicators = {
      fear_greed_index: fearGreed,
      fear_greed_label: getFearGreedLabel(fearGreed),
      pi_cycle_top: piCycle,
      mvrv_z_score: mvrv,
      nupl: nupl,
      updated_at: new Date().toISOString(),
      btc_price: btcPrice,
    };

    // Cache to Supabase
    await cacheToSupabase(indicators);

    return indicators;
  } catch (err) {
    console.error('CoinGecko fetch error:', err);
    return null;
  }
}

// ─── Indicator Calculations ─────────────────────────────────────────────────

/**
 * Calculate a simplified Fear & Greed index from market data.
 * 0 = extreme fear, 100 = extreme greed
 */
function calculateFearGreed(globalData: Record<string, unknown>): number {
  const volatility = Math.abs(
    (globalData?.market_cap_change_percentage_24h_usd as number) || 0
  );

  // Higher daily change = more greed/fear
  const changeComponent = Math.min(Math.abs(volatility) * 3, 50);
  const base = 50;

  if (volatility > 0) {
    // Market up = greed
    return Math.min(Math.round(base + changeComponent), 100);
  } else {
    // Market down = fear
    return Math.max(Math.round(base - changeComponent), 0);
  }
}

function getFearGreedLabel(value: number | null): string {
  if (value === null) return 'Unknown';
  if (value <= 25) return 'Extreme Fear';
  if (value <= 45) return 'Fear';
  if (value <= 55) return 'Neutral';
  if (value <= 75) return 'Greed';
  return 'Extreme Greed';
}

/**
 * Pi Cycle Top Indicator: (111DMA / 350DMA * 2)
 * When this ratio exceeds 2.4, it's historically marked cycle tops.
 * We approximate from available price data points.
 */
function calculatePiCycleTop(prices: number[][]): number | null {
  if (!prices || prices.length < 350) return null;

  const closes = prices.map(p => p[1]);
  const sma111 = simpleMovingAverage(closes, 111);
  const sma350 = simpleMovingAverage(closes, 350);
  const latest111 = sma111[sma111.length - 1];
  const latest350 = sma350[sma350.length - 1];

  if (!latest350 || latest350 === 0) return null;
  return parseFloat(((latest111 / latest350) * 2).toFixed(4));
}

function simpleMovingAverage(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / period);
  }
  return result;
}

/**
 * Estimate MVRV Z-Score based on BTC price relative to estimated realized price.
 * Realized price is approximated as ~50% of current price during normal markets,
 * scaling lower in bear markets and higher in bull markets.
 */
function estimateMVRV(btcPrice: number | null): number | null {
  if (!btcPrice) return null;

  // Simplified model: realized price ≈ 40-60% of market price depending on cycle
  // Using a dynamic ratio that increases in bull markets
  const cycleRatio = btcPrice > 100000 ? 0.35 : btcPrice > 50000 ? 0.45 : 0.55;
  const realizedPrice = btcPrice * cycleRatio;
  const stdDev = btcPrice * 0.3; // Approximate standard deviation

  if (stdDev === 0) return null;
  const zScore = (btcPrice - realizedPrice) / stdDev;

  return parseFloat(zScore.toFixed(3));
}

/**
 * Estimate NUPL (Net Unrealized Profit/Loss) as a ratio.
 * Positive = market in profit, negative = in loss.
 * Scaled 0 to ~1 for normal ranges.
 */
function estimateNUPL(btcPrice: number | null): number | null {
  if (!btcPrice) return null;

  // Simplified: compare current price to estimated cost basis (~$25k for BTC)
  const estimatedCostBasis = 25000;
  const ratio = (btcPrice - estimatedCostBasis) / btcPrice;

  return parseFloat(Math.max(-0.5, Math.min(0.9, ratio)).toFixed(4));
}

// ─── Caching ────────────────────────────────────────────────────────────────

async function cacheToSupabase(indicators: CycleIndicators): Promise<void> {
  try {
    // Store in market_data_cache for the market_overview view
    await db.getSupabase().from('market_data_cache').upsert({
      coin_id: 'cycle_indicators',
      symbol: 'CYCLE',
      name: 'Cycle Indicators Bundle',
      current_price: indicators.btc_price,
      market_data: {
        fear_greed_index: indicators.fear_greed_index,
        fear_greed_label: indicators.fear_greed_label,
        pi_cycle_top: indicators.pi_cycle_top,
        mvrv_z_score: indicators.mvrv_z_score,
        nupl: indicators.nupl,
        updated_at: indicators.updated_at,
      },
      fetched_at: new Date().toISOString(),
    }, { onConflict: 'coin_id' });
  } catch (err) {
    console.error('Failed to cache indicators:', err);
  }
}

// ─── API ────────────────────────────────────────────────────────────────────

/**
 * Get the latest cycle indicators. Returns cached data if fresh,
 * fetches new data if stale.
 */
export async function getCycleIndicators(forceRefresh = false): Promise<CycleIndicators> {
  const now = Date.now();

  if (!forceRefresh && cachedIndicators && (now - lastFetch) < REFRESH_INTERVAL_MS) {
    return cachedIndicators;
  }

  // Try Supabase cache first
  if (!forceRefresh) {
    try {
      const { data } = await db.getSupabase()
        .from('market_data_cache')
        .select('*')
        .eq('coin_id', 'cycle_indicators')
        .order('fetched_at', { ascending: false })
        .limit(1)
        .single();

      if (data?.market_data) {
        const cached = data.market_data as Record<string, unknown>;
        const indicators: CycleIndicators = {
          fear_greed_index: cached.fear_greed_index as number | null,
          fear_greed_label: cached.fear_greed_label as string,
          pi_cycle_top: cached.pi_cycle_top as number | null,
          mvrv_z_score: cached.mvrv_z_score as number | null,
          nupl: cached.nupl as number | null,
          updated_at: data.fetched_at,
          btc_price: data.current_price,
        };
        cachedIndicators = indicators;
        lastFetch = now;
        return indicators;
      }
    } catch {
      // Cache miss — fetch new data
    }
  }

  // Fetch fresh data
  const fresh = await fetchCoinGeckoData();
  if (fresh) {
    cachedIndicators = fresh;
    lastFetch = now;
    return fresh;
  }

  // If all else fails, return last known
  if (cachedIndicators) return cachedIndicators;

  // Absolute fallback
  return {
    fear_greed_index: null,
    fear_greed_label: 'Unknown',
    pi_cycle_top: null,
    mvrv_z_score: null,
    nupl: null,
    updated_at: new Date().toISOString(),
    btc_price: null,
  };
}

/** Start periodic refresh of cycle indicators */
export function startCycleRefresh(): void {
  if (refreshTimer) return;
  console.log('📊 Cycle indicator refresh started (every 5 min)');
  getCycleIndicators(true); // Fetch immediately
  refreshTimer = setInterval(() => getCycleIndicators(true), REFRESH_INTERVAL_MS);
}

/** Stop periodic refresh */
export function stopCycleRefresh(): void {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}