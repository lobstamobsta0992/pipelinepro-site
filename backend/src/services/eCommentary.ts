// ============================================================================
// E's Commentary Generator — Provides personality-driven commentary on market
// events (whale alerts, cycle indicators) adapted to user experience level.
// ============================================================================

import { WhaleTransaction } from './whaleAlerts';

/**
 * Generate E's street-smart commentary on a whale transaction.
 * Adapts tone based on the alert severity.
 */
export function generateAlertCommentary(alert: WhaleTransaction): string {
  const { asset, usd_value, blockchain, transaction_type, alert_level } = alert;
  const formattedValue = `$${(usd_value / 1_000_000).toFixed(1)}M`;

  // Pool of commentary templates by alert level
  const commentaries: Record<string, string[]> = {
    whale: [
      `A massive ${formattedValue} ${asset} move on ${blockchain}. That's not a retail play — that's someone repositioning. When the big money moves, you pay attention. 👀`,
      `Whale alert: ${formattedValue} ${asset} just hit the chain on ${blockchain}. Whether it's accumulation or distribution depends on where it lands. Watching closely.`,
      `${formattedValue} ${asset} just moved on ${blockchain}. This isn't noise — this is signal. I've seen moves like this precede major swings. Stay frosty. 🧊`,
    ],
    major: [
      `${formattedValue} ${asset} transfer detected on ${blockchain}. Not the biggest move I've seen today, but definitely worth noting. Smart money is always moving.`,
      `Heads up: ${formattedValue} ${asset} just moved on ${blockchain}. Could be an exchange deposit, cold wallet rotation, or OTC settlement. I'm watching the follow-up.`,
      `${formattedValue} ${asset} just moved. On-chain activity like this is the market's pulse — and I've got my finger on it.`,
    ],
    minor: [
      `${formattedValue} ${asset} transfer on ${blockchain}. Normal activity, but I'm flagging it because sometimes smaller moves are the first domino.`,
      `Small-ish move: ${formattedValue} ${asset} on ${blockchain}. Probably nothing, but that's what they said before the last rally too.`,
    ],
  };

  const level = alert_level === 'whale' ? 'whale' : alert_level === 'major' ? 'major' : 'minor';
  const pool = commentaries[level];
  const commentary = pool[Math.floor(Math.random() * pool.length)];

  // Add exchange-specific context if the destination looks like an exchange
  if (alert.to_address && alert.to_address.toLowerCase().includes('binance')) {
    return `${commentary}\n\nAlso — that's going to Binance. A ${formattedValue} ${asset} deposit to an exchange usually means one thing: somebody is getting ready to trade. Could be selling. Could be repositioning. Either way — order books, check 'em. 📊`;
  }

  return commentary;
}

/**
 * Generate E's interpretation of cycle indicators based on user experience.
 */
export function generateCycleCommentary(
  indicators: Record<string, unknown>,
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(indicators)) {
    if (value === null || value === undefined) continue;
    parts.push(getIndicatorExplanation(key, value, experienceLevel));
  }

  return parts.join('\n\n');
}

/** Explain a single indicator at the right technical depth */
function getIndicatorExplanation(
  name: string,
  value: unknown,
  level: 'beginner' | 'intermediate' | 'advanced'
): string {
  const numVal = typeof value === 'number' ? value : 0;

  switch (name) {
    case 'fear_greed_index':
      return fearGreedIndex(numVal, level);
    case 'pi_cycle_top':
      return piCycleExplanation(numVal, level);
    case 'mvrv_z_score':
      return mvrvExplanation(numVal, level);
    case 'nupl':
      return nuplExplanation(numVal, level);
    default:
      return `**${name}**: ${value}`;
  }
}

function fearGreedIndex(value: number, level: string): string {
  const label = value <= 25 ? 'Extreme Fear' : value <= 45 ? 'Fear' : value <= 55 ? 'Neutral' : value <= 75 ? 'Greed' : 'Extreme Greed';

  if (level === 'beginner') {
    return `**Fear & Greed Index: ${value} (${label})** — This is like a market mood ring. When it's in "Fear" territory, people are panicking (often a buying opportunity). When it's "Greed," everyone's euphoric (time to be careful). Right now we're at ${label}.`;
  }

  if (level === 'intermediate') {
    return `**Fear & Greed: ${value} (${label})** — Contrarian indicator. Extreme Fear has historically been a buy zone. Extreme Greed signals potential tops. Current reading suggests ${label.toLowerCase()} sentiment.`;
  }

  return `**Fear & Greed Index: ${value}** — Current market sentiment reading. ${label}. Useful as a mean-reversion signal when it hits extremes (below 10 or above 90). Volume-weighted derivative data suggests ${value > 60 ? 'institutional accumulation' : 'retail-driven selling'}.`;
}

function piCycleExplanation(value: number, level: string): string {
  const isNearTop = value > 2.4;
  const ratio = value.toFixed(2);

  if (level === 'beginner') {
    const status = isNearTop ? 'flashing a potential top signal' : 'looking healthy';
    return `**Pi Cycle Top: ${ratio}x** — This indicator compares short-term vs long-term moving averages. When it hits certain levels, it's historically signaled market tops. Right now it's ${status}.`;
  }

  return `**Pi Cycle Top Multiplier: ${ratio}x** — 111DMA / 350DMA x 2 ratio. Historically, when this crosses above 2.4 (currently ${isNearTop ? 'ABOVE' : 'below'} that threshold), it has marked Bitcoin cycle tops within days. ${isNearTop ? '⚠️ Caution zone' : '✅ Normal range'}.`;
}

function mvrvExplanation(value: number, level: string): string {
  const zone = value <= 0 ? 'Undervalued (buy zone)' : value <= 1 ? 'Fair Value' : value <= 3 ? 'Bull Market (profit)' : 'Overvalued (sell zone)';

  if (level === 'beginner') {
    return `**MVRV Z-Score: ${value.toFixed(2)}** — Think of this as a "cheap vs expensive" meter for Bitcoin. When it's low (green), BTC is historically cheap. When it's high (red), it's been a good time to take profits. Currently: ${zone}.`;
  }

  return `**MVRV Z-Score: ${value.toFixed(2)} (${zone})** — Market Value to Realized Value ratio. Standard deviations from the mean. ${value <= 0 ? 'Below zero — unrealized losses across the market. Historically a strong accumulation signal.' : value > 3 ? 'Above 3 — extreme unrealized profits. Previous tops occurred here.' : 'Within normal bull market range.'}`;
}

function nuplExplanation(value: number, level: string): string {
  const phase = value <= 0 ? 'Capitulation' : value <= 0.25 ? 'Hope / Recovery' : value <= 0.5 ? 'Optimism' : value <= 0.75 ? 'Belief / Euphoria' : 'Greed / Top zone';

  if (level === 'beginner') {
    return `**NUPL: ${(value * 100).toFixed(1)}% (${phase})** — Net Unrealized Profit/Loss. It tells us whether the average Bitcoin holder is in profit or loss. ${phase} is where the market is emotionally right now.`;
  }

  return `**NUPL: ${(value * 100).toFixed(1)}% — ${phase}** — (Market Cap - Realized Cap) / Market Cap. ${value < 0 ? 'Market in net loss — pain but opportunity.' : value > 0.75 ? 'Market in extreme profit — historically near cycle tops.' : 'Healthy profit range for bull market.'}`;
}