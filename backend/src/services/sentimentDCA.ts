// ============================================================================
// Sentiment DCA Engine — Phase 4 P0 Auto-Trading Strategy
// ============================================================================
// Adjusts Dollar-Cost Averaging buy amounts based on real-time market sentiment:
// - Fear & Greed Index (from cycle indicators)
// - News sentiment score (from news feed)
// - Market Scanner zone distribution (% hot vs % dead)
//
// Strategy: Buy MORE when fearful, LESS when greedy, skip at extreme greed.
// Elite-only feature. Integrates with Coinbase Execution Engine.
// ============================================================================

import { getSupabase } from './supabase';
import { getCycleIndicators, CycleIndicators } from './cycleIndicators';
import { getNews, NewsArticle } from './newsFeed';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DCAStrategy {
  id: string;
  user_id: string;
  name: string;
  asset: string;                // e.g., "BTC", "ETH"
  base_amount: number;          // base USD per DCA period
  frequency: DCAFrequency;      // "daily" | "weekly" | "biweekly"
  max_multiplier: number;       // never buy more than this × base
  min_cash_reserve: number;     // keep this much USD in reserve
  is_active: boolean;
  paused: boolean;              // manual override
  created_at: string;
  updated_at: string;
}

export type DCAFrequency = 'daily' | 'weekly' | 'biweekly';

export interface DCAExecution {
  id?: string;
  strategy_id: string;
  asset: string;
  base_amount: number;
  multiplier: number;
  buy_amount: number;
  fear_greed: number;
  fear_greed_label: string;
  news_sentiment_score: number;
  hot_zone_pct: number;
  executed: boolean;
  skipped: boolean;
  skip_reason?: string;
  commentary: string;
  scheduled_at: string;
  executed_at?: string;
  coinbase_order_id?: string;
}

// ─── Sentiment Calculation ───────────────────────────────────────────────────

export interface SentimentSnapshot {
  fear_greed_index: number;
  fear_greed_label: string;
  news_sentiment_score: number;    // -1.0 (very negative) to +1.0 (very positive)
  hot_zone_pct: number;            // % of coins in hot zone (0-100)
  dca_multiplier: number;          // 0.0 to 3.0
  should_buy: boolean;
  reasoning: string;
}

/** Calculate the DCA multiplier and buy decision from sentiment */
export async function calculateSentiment(): Promise<SentimentSnapshot> {
  const [indicators, news] = await Promise.all([
    getCycleIndicators().catch(() => null),
    getNews().catch(() => []),
  ]);

  const fearGreed = indicators?.fear_greed_index ?? 50;
  const fearLabel = indicators?.fear_greed_label ?? 'Neutral';

  // Calculate news sentiment score (-1 to +1)
  const newsScore = calculateNewsSentimentScore(news ?? []);

  // Hot zone % — simplified: use fear/greed as proxy when scanner unavailable
  // In production, integrate with Market Scanner's getScannerData()
  const hotZonePct = estimateHotZonePct(fearGreed);

  // Determine DCA multiplier from Fear & Greed
  const { multiplier, reasoning } = getDCAMultiplier(fearGreed, newsScore);

  return {
    fear_greed_index: fearGreed,
    fear_greed_label: fearLabel,
    news_sentiment_score: Math.round(newsScore * 100) / 100,
    hot_zone_pct: hotZonePct,
    dca_multiplier: multiplier,
    should_buy: multiplier > 0,
    reasoning,
  };
}

/** Calculate aggregate news sentiment score from recent articles */
function calculateNewsSentimentScore(articles: NewsArticle[]): number {
  if (!articles.length) return 0;

  const scores = articles.map((a) => {
    switch (a.sentiment) {
      case 'positive': return 0.5;
      case 'negative': return -0.5;
      default: return 0;
    }
  });

  // Weighted: recent articles matter more (first 5 are most recent)
  let weightedSum = 0;
  let totalWeight = 0;
  for (let i = 0; i < Math.min(scores.length, 10); i++) {
    const weight = 10 - i; // decreasing weight
    weightedSum += scores[i] * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/** Estimate hot zone % — production should use Market Scanner */
function estimateHotZonePct(fearGreed: number): number {
  // Rough correlation: high fear = few hot, high greed = many hot
  if (fearGreed <= 25) return 5;
  if (fearGreed <= 40) return 15;
  if (fearGreed <= 60) return 35;
  if (fearGreed <= 75) return 55;
  return 70;
}

/** Get DCA multiplier based on Fear & Greed + news bonus */
function getDCAMultiplier(
  fearGreed: number,
  newsScore: number
): { multiplier: number; reasoning: string } {
  let multiplier: number;
  let phase: string;

  if (fearGreed <= 25) {
    multiplier = 2.0;
    phase = 'Extreme Fear';
  } else if (fearGreed <= 40) {
    multiplier = 1.5;
    phase = 'Fear';
  } else if (fearGreed <= 60) {
    multiplier = 1.0;
    phase = 'Neutral';
  } else if (fearGreed <= 75) {
    multiplier = 0.5;
    phase = 'Greed';
  } else {
    multiplier = 0.0;
    phase = 'Extreme Greed';
  }

  const reasoning: string[] = [
    `Fear & Greed: ${fearGreed} (${phase}) → base multiplier: ${multiplier.toFixed(1)}x`,
  ];

  // Bonus: news is very negative AND fear is elevated → +0.5x
  if (newsScore < -0.5 && fearGreed <= 40) {
    multiplier += 0.5;
    reasoning.push(`News sentiment severely negative (${newsScore.toFixed(2)}) + Fear zone → +0.5x bonus`);
  }

  // Cap at 3.0x
  multiplier = Math.min(3.0, multiplier);

  if (multiplier === 0) {
    reasoning.push('Extreme greed — skipping DCA to accumulate cash. The best entries come when nobody wants to buy.');
  } else if (multiplier >= 2.0) {
    reasoning.push(`🟢 Aggressive buy signal. Fear is high — this is where the best cost bases are built.`);
  } else if (multiplier >= 1.5) {
    reasoning.push(`🟡 Elevated buy. Market is nervous — good time to scale in.`);
  } else if (multiplier >= 1.0) {
    reasoning.push(`⚪ Normal DCA. Steady as she goes.`);
  } else {
    reasoning.push(`🔴 Reduced buy. Greed is creeping in — scaling back, saving powder.`);
  }

  return { multiplier, reasoning: reasoning.join(' | ') };
}

// ─── Strategy Management ─────────────────────────────────────────────────────

/** Get all DCA strategies for a user */
export async function getDCAStrategies(userId: string): Promise<DCAStrategy[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('dca_strategies')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to get strategies: ${error.message}`);
  return (data ?? []).map(mapStrategy);
}

/** Create a new DCA strategy */
export async function createDCAStrategy(params: {
  user_id: string;
  name?: string;
  asset: string;
  base_amount: number;
  frequency?: DCAFrequency;
  max_multiplier?: number;
  min_cash_reserve?: number;
}): Promise<DCAStrategy> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('dca_strategies')
    .insert({
      user_id: params.user_id,
      name: params.name ?? `DCA ${params.asset}`,
      asset: params.asset.toUpperCase(),
      base_amount: params.base_amount,
      frequency: params.frequency ?? 'weekly',
      max_multiplier: params.max_multiplier ?? 3.0,
      min_cash_reserve: params.min_cash_reserve ?? 0,
      is_active: true,
      paused: false,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create strategy: ${error.message}`);
  return mapStrategy(data);
}

/** Toggle pause on a strategy */
export async function togglePause(strategyId: string, paused: boolean): Promise<DCAStrategy> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('dca_strategies')
    .update({ paused, updated_at: new Date().toISOString() })
    .eq('id', strategyId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update strategy: ${error.message}`);
  return mapStrategy(data);
}

/** Delete a DCA strategy */
export async function deleteDCAStrategy(strategyId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('dca_strategies')
    .delete()
    .eq('id', strategyId);

  if (error) throw new Error(`Failed to delete strategy: ${error.message}`);
}

// ─── DCA Execution ───────────────────────────────────────────────────────────

/** Execute one DCA cycle — called by scheduler or manual trigger */
export async function executeDCACycle(strategyId: string): Promise<DCAExecution> {
  const supabase = getSupabase();

  // Get strategy
  const { data: strategy } = await supabase
    .from('dca_strategies')
    .select('*')
    .eq('id', strategyId)
    .single();

  if (!strategy) throw new Error('Strategy not found');
  if (!strategy.is_active || strategy.paused) {
    throw new Error('Strategy is paused or inactive');
  }

  // Get sentiment
  const sentiment = await calculateSentiment();
  const buyAmount = strategy.base_amount * sentiment.dca_multiplier;

  // Determine execution
  const execution: DCAExecution = {
    strategy_id: strategyId,
    asset: strategy.asset,
    base_amount: strategy.base_amount,
    multiplier: sentiment.dca_multiplier,
    buy_amount: buyAmount,
    fear_greed: sentiment.fear_greed_index,
    fear_greed_label: sentiment.fear_greed_label,
    news_sentiment_score: sentiment.news_sentiment_score,
    hot_zone_pct: sentiment.hot_zone_pct,
    executed: false,
    skipped: !sentiment.should_buy,
    skip_reason: sentiment.should_buy ? undefined : 'Extreme greed — accumulating cash',
    commentary: generateDCACommentary(strategy, sentiment, buyAmount),
    scheduled_at: new Date().toISOString(),
  };

  // If buying, trigger Coinbase execution
  if (sentiment.should_buy && buyAmount > 0) {
    try {
      const { placeOrder } = await import('./coinbaseExecution');
      const order = await placeOrder(strategy.user_id, {
        product_id: `${strategy.asset}-USD`,
        side: 'BUY',
        size: buyAmount.toFixed(2),
        type: 'MARKET',
      });
      execution.executed = true;
      execution.executed_at = new Date().toISOString();
      execution.coinbase_order_id = order.order_id;
    } catch (err) {
      // Log failure but don't crash — Coinbase may not be configured
      console.warn(`DCA execution failed for ${strategy.asset}:`, (err as Error).message);
      execution.executed = false;
      execution.skip_reason = `Execution failed: ${(err as Error).message}`;
    }
  }

  // Save execution record
  const { data: saved, error } = await supabase
    .from('dca_executions')
    .insert({
      strategy_id: execution.strategy_id,
      asset: execution.asset,
      base_amount: execution.base_amount,
      multiplier: execution.multiplier,
      buy_amount: execution.buy_amount,
      fear_greed: execution.fear_greed,
      fear_greed_label: execution.fear_greed_label,
      news_sentiment_score: execution.news_sentiment_score,
      hot_zone_pct: execution.hot_zone_pct,
      executed: execution.executed,
      skipped: execution.skipped,
      skip_reason: execution.skip_reason,
      commentary: execution.commentary,
      coinbase_order_id: execution.coinbase_order_id,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save execution: ${error.message}`);

  return { ...execution, id: saved.id };
}

/** Get execution history for a strategy */
export async function getDCAExecutions(strategyId: string, limit = 20): Promise<DCAExecution[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('dca_executions')
    .select('*')
    .eq('strategy_id', strategyId)
    .order('scheduled_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to get executions: ${error.message}`);
  return (data ?? []).map(mapExecution);
}

// ─── Commentary ──────────────────────────────────────────────────────────────

function generateDCACommentary(
  strategy: any,
  sentiment: SentimentSnapshot,
  buyAmount: number
): string {
  if (!sentiment.should_buy) {
    return `⏸️ **DCA skipped.** Fear & Greed is at ${sentiment.fear_greed_index} (${sentiment.fear_greed_label}) — too greedy to buy. I'm keeping your $${strategy.base_amount.toFixed(0)} in cash. The best entries come when blood is in the streets, not when everyone's popping champagne. 🍾`;
  }

  const lines = [
    `🤖 **Sentiment DCA — ${strategy.asset}**`,
    ``,
    `Fear & Greed: ${sentiment.fear_greed_index} (${sentiment.fear_greed_label}) → ${sentiment.dca_multiplier.toFixed(1)}x multiplier`,
    `News sentiment: ${sentiment.news_sentiment_score > 0 ? 'positive' : sentiment.news_sentiment_score < 0 ? 'negative' : 'neutral'} (${sentiment.news_sentiment_score.toFixed(2)})`,
  ];

  if (sentiment.dca_multiplier >= 2.0) {
    lines.push(``);
    lines.push(`🟢 **BUYING $${buyAmount.toFixed(2)} of ${strategy.asset}.** Fear is your friend. When the market panics, we deploy capital. This is how legends are made.`);
  } else if (sentiment.dca_multiplier >= 1.5) {
    lines.push(``);
    lines.push(`🟡 **Buying $${buyAmount.toFixed(2)} of ${strategy.asset}.** Elevated fear — good time to scale in. Not a fire sale, but definitely a discount.`);
  } else if (sentiment.dca_multiplier > 0) {
    lines.push(``);
    lines.push(`⚪ **Buying $${buyAmount.toFixed(2)} of ${strategy.asset}.** Standard DCA. Slow and steady — that's how real wealth is built.`);
  }

  if (sentiment.dca_multiplier > 2.5) {
    lines.push(``);
    lines.push(`💎 *"Be fearful when others are greedy, and greedy when others are fearful."* — Warren Buffett. This is that moment.`);
  }

  return lines.join('\n');
}

// ─── Scheduler ───────────────────────────────────────────────────────────────

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

export function startDCAScheduler(checkIntervalMs = 300_000): void {
  if (schedulerInterval) return;

  console.log(`DCA Scheduler: checking every ${checkIntervalMs / 1000}s`);

  schedulerInterval = setInterval(async () => {
    try {
      const supabase = getSupabase();

      const { data: strategies } = await supabase
        .from('dca_strategies')
        .select('*')
        .eq('is_active', true)
        .eq('paused', false);

      if (!strategies?.length) return;

      for (const strat of strategies) {
        // Check if it's time for this strategy's next DCA
        const shouldExecute = await shouldExecuteNow(strat);
        if (!shouldExecute) continue;

        console.log(`DCA: executing ${strat.name} (${strat.asset})`);
        await executeDCACycle(strat.id);
      }
    } catch (err) {
      console.error('DCA scheduler error:', (err as Error).message);
    }
  }, checkIntervalMs);
}

export function stopDCAScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
}

async function shouldExecuteNow(strategy: any): Promise<boolean> {
  const supabase = getSupabase();

  // Check when was the last execution
  const { data: lastExec } = await supabase
    .from('dca_executions')
    .select('scheduled_at')
    .eq('strategy_id', strategy.id)
    .order('scheduled_at', { ascending: false })
    .limit(1)
    .single();

  if (!lastExec) return true; // Never executed — run now

  const lastTime = new Date(lastExec.scheduled_at).getTime();
  const now = Date.now();
  const interval = getFrequencyMs(strategy.frequency as DCAFrequency);

  return (now - lastTime) >= interval;
}

function getFrequencyMs(frequency: DCAFrequency): number {
  switch (frequency) {
    case 'daily': return 24 * 60 * 60 * 1000;
    case 'weekly': return 7 * 24 * 60 * 60 * 1000;
    case 'biweekly': return 14 * 24 * 60 * 60 * 1000;
    default: return 7 * 24 * 60 * 60 * 1000;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapStrategy(data: any): DCAStrategy {
  return {
    id: data.id,
    user_id: data.user_id,
    name: data.name,
    asset: data.asset,
    base_amount: Number(data.base_amount),
    frequency: data.frequency,
    max_multiplier: Number(data.max_multiplier),
    min_cash_reserve: Number(data.min_cash_reserve),
    is_active: data.is_active,
    paused: data.paused,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

function mapExecution(data: any): DCAExecution {
  return {
    id: data.id,
    strategy_id: data.strategy_id,
    asset: data.asset,
    base_amount: Number(data.base_amount),
    multiplier: Number(data.multiplier),
    buy_amount: Number(data.buy_amount),
    fear_greed: Number(data.fear_greed),
    fear_greed_label: data.fear_greed_label,
    news_sentiment_score: Number(data.news_sentiment_score),
    hot_zone_pct: Number(data.hot_zone_pct),
    executed: data.executed,
    skipped: data.skipped,
    skip_reason: data.skip_reason,
    commentary: data.commentary,
    scheduled_at: data.scheduled_at,
    executed_at: data.executed_at,
    coinbase_order_id: data.coinbase_order_id,
  };
}
