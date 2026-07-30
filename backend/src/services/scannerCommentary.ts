// ============================================================================
// Scanner Commentary — E's personality-driven market scanner summaries
// ============================================================================
// Generates "Hot vs Dead" zone commentary in E's voice — confident, witty,
// street-smart takes on what the market scanner is seeing right now.
// ============================================================================

import type { ScannerCoin } from './marketScanner';

// ─── Main Commentary Generator ───────────────────────────────────────────────

export function generateScannerCommentary(
  allCoins: ScannerCoin[],
  hot: ScannerCoin[],
  dead: ScannerCoin[],
  watching: ScannerCoin[]
): string {
  const lines: string[] = [];

  // ── Overall market pulse ─────────────────────────────────────────────────
  const avgChange = allCoins.length
    ? Math.round((allCoins.reduce((s, c) => s + c.price_change_24h, 0) / allCoins.length) * 100) / 100
    : 0;

  lines.push(marketPulseLine(avgChange, hot.length, dead.length));

  // ── Hot zone highlights ──────────────────────────────────────────────────
  if (hot.length > 0) {
    lines.push('');
    lines.push(hotZoneLine(hot));
  }

  // ── Dead zone warnings ───────────────────────────────────────────────────
  if (dead.length > 0) {
    lines.push('');
    lines.push(deadZoneLine(dead));
  }

  // ── Watching zone (potential setups) ─────────────────────────────────────
  if (watching.length > 0) {
    lines.push('');
    lines.push(watchingZoneLine(watching));
  }

  // ── Specific callouts ────────────────────────────────────────────────────
  const topGainer = allCoins.sort((a, b) => b.price_change_24h - a.price_change_24h)[0];
  const topLoser = allCoins.sort((a, b) => a.price_change_24h - b.price_change_24h)[0];
  const volKing = allCoins.sort((a, b) => b.volume_spike_ratio - a.volume_spike_ratio)[0];

  if (topGainer && topLoser && volKing) {
    lines.push('');
    lines.push(specificCalloutLine(topGainer, topLoser, volKing));
  }

  return lines.join('\n');
}

// ─── Zone-Specific Commentary ────────────────────────────────────────────────

export function generateZoneCommentary(
  zone: string,
  coins: ScannerCoin[]
): string {
  switch (zone) {
    case 'hot':
      return hotZoneLine(coins);
    case 'dead':
      return deadZoneLine(coins);
    case 'watching':
      return watchingZoneLine(coins);
    default:
      return `*E scans the neutral zone.* Nothing screaming at me here. ${coins.length} coins just vibing sideways. Not every day is a trading day — patience is the game.`;
  }
}

// ─── Single-Coin Commentary ──────────────────────────────────────────────────

export function generateCoinCommentary(coin: ScannerCoin): string {
  const { name, symbol, zone, momentum_score, price_change_24h, volume_spike_ratio, trend_shift } = coin;

  const icon = zone === 'hot' ? '🔥' : zone === 'dead' ? '💀' : zone === 'watching' ? '👀' : '📊';

  const snippets: string[] = [`${icon} **${name} (${symbol})** — Momentum: ${momentum_score}/100`];

  switch (trend_shift) {
    case 'surging':
      snippets.push(`This one's got legs. ${name} is surging with conviction — ${price_change_24h > 0 ? '+' : ''}${price_change_24h.toFixed(1)}% in 24h. Not financial advice, but this is what breakouts look like.`);
      break;
    case 'breaking up — reversal':
      snippets.push(`Reversal alert. ${name} was getting hammered but the tide is turning. ${price_change_24h > 0 ? '+' : ''}${price_change_24h.toFixed(1)}% today. Bottom fishers might be onto something.`);
      break;
    case 'rolling over':
      snippets.push(`Getting heavy. ${name} is starting to roll over after a run. ${price_change_24h.toFixed(1)}% today. Could be profit-taking, could be the start of something uglier. Watch the volume.`);
      break;
    case 'free-falling':
      snippets.push(`Knives out. ${name} is in free-fall — ${price_change_24h.toFixed(1)}% in 24h. Don't try to catch this one with your teeth. Let the dust settle first.`);
      break;
    case 'consolidating':
      snippets.push(`${name} is building a base. Quiet accumulation phase — the kind of boring price action that smart money loves. No need to rush here.`);
      break;
    case 'volatile — watching for direction':
      snippets.push(`Whiplash territory. ${name} is swinging both ways — shorts and longs are getting rekt. Wait for a clear direction before committing capital.`);
      break;
    default:
      snippets.push(`${name} is moving at ${price_change_24h > 0 ? '+' : ''}${price_change_24h.toFixed(1)}% today. Volume is ${volume_spike_ratio > 1.5 ? 'elevated' : 'average'}. Watching.`);
  }

  return snippets.join('\n\n');
}

// ─── Private Helpers ─────────────────────────────────────────────────────────

function marketPulseLine(avgChange: number, hotCount: number, deadCount: number): string {
  const changeStr = avgChange > 0 ? `+${avgChange}%` : `${avgChange}%`;

  if (hotCount > deadCount * 2 && avgChange > 2) {
    const options = [
      `🚀 **Market Pulse: Risk-On.** Average coin is up ${changeStr}. Bulls are FEELING themselves right now. ${hotCount} coins in the hot zone — this is what euphoria looks like, fam. Enjoy the ride but keep your stop-losses tight.`,
      `🔥 **Market is COOKING.** ${hotCount} coins running hot, average move is ${changeStr}. When the music is this loud, everyone's a genius. Just remember — tops are a process, not a moment. Stay sharp.`,
      `📈 **Bullish sentiment running high.** ${changeStr} average move, ${hotCount} coins heating up. The market's giving out free alpha right now. Take profits on the way up — nobody ever went broke booking gains.`,
    ];
    return options[Math.floor(Math.random() * options.length)];
  }

  if (deadCount > hotCount * 2 && avgChange < -2) {
    const options = [
      `🧊 **Market Pulse: Risk-Off.** Average coin bleeding ${changeStr}. ${deadCount} coins in the dead zone. Fear is the dominant emotion right now — and that's when the best opportunities hide. Zoom out.`,
      `💀 **Red candles everywhere.** ${deadCount} coins dropping, average ${changeStr}. This is the part where tourists panic and pros go shopping. Be the pro.`,
      `📉 **Market's having a rough day.** ${changeStr} average, ${deadCount} coins in the morgue. Remember: the best entries happen when nobody wants to buy. Patience pays.`,
    ];
    return options[Math.floor(Math.random() * options.length)];
  }

  const options = [
    `⚖️ **Market Pulse: Mixed.** Average move is ${changeStr}. ${hotCount} hot / ${deadCount} dead — no clear direction. Choppy waters. Sometimes the best trade is no trade.`,
    `🔄 **Sideways shuffle.** ${changeStr} average. The market can't decide which way it wants to go. ${hotCount} coins pumping, ${deadCount} dumping. Rotation is messy today.`,
    `📊 **Range-bound and uncertain.** ${changeStr} across the board. ${hotCount} hot, ${deadCount} dead. When in doubt, zoom out. The trend will declare itself soon enough.`,
  ];
  return options[Math.floor(Math.random() * options.length)];
}

function hotZoneLine(hot: ScannerCoin[]): string {
  const top3 = hot.slice(0, 3);
  const names = top3.map((c) => `**${c.symbol}** (+${c.price_change_24h.toFixed(1)}%)`).join(', ');

  if (hot.length > 10) {
    return `🔥 **HOT ZONE** — ${hot.length} coins are running. The market's got some serious energy. Leaders: ${names}. Don't chase green candles at the top of wicks — wait for pullbacks. Discipline > FOMO.`;
  }

  return `🔥 **HOT ZONE** — ${hot.length} coins showing real strength: ${names}. Select pockets of momentum. Quality over quantity here.`;
}

function deadZoneLine(dead: ScannerCoin[]): string {
  const top3 = dead.slice(0, 3);
  const names = top3.map((c) => `**${c.symbol}** (${c.price_change_24h.toFixed(1)}%)`).join(', ');

  if (dead.length > 50) {
    return `💀 **DEAD ZONE** — ${dead.length} coins getting absolutely wrecked. This is a bloodbath: ${names}. Capitulation smells like this. Keep dry powder ready — the best buys happen when it feels the worst.`;
  }

  if (dead.length > 20) {
    return `💀 **DEAD ZONE** — ${dead.length} coins in the red today. Losers: ${names}. Not quite panic territory, but people are definitely hurting. Watch for climactic volume on these names — that's the flush.`;
  }

  return `💀 **DEAD ZONE** — ${dead.length} coins lagging behind: ${names}. Select underperformance — not a market-wide issue, but these names have weak hands right now.`;
}

function watchingZoneLine(watching: ScannerCoin[]): string {
  const top3 = watching.slice(0, 3);
  const names = top3.map((c) => {
    const dir = c.price_change_24h > 0 ? '+' : '';
    return `**${c.symbol}** (${dir}${c.price_change_24h.toFixed(1)}%)`;
  }).join(', ');

  return `👀 **WATCHING** — ${watching.length} coins at inflection points: ${names}. Volume is picking up on these names — could break either way. These are the setups to have on your radar. Don't jump early.`;
}

function specificCalloutLine(
  topGainer: ScannerCoin,
  topLoser: ScannerCoin,
  volKing: ScannerCoin
): string {
  const lines: string[] = ['**Quick hits:**'];

  lines.push(
    `🏆 Top 24h: **${topGainer.symbol}** (${topGainer.name}) +${topGainer.price_change_24h.toFixed(1)}%`
  );

  lines.push(
    `📉 Worst 24h: **${topLoser.symbol}** (${topLoser.name}) ${topLoser.price_change_24h.toFixed(1)}%`
  );

  if (volKing.volume_spike_ratio > 2) {
    lines.push(
      `📊 Volume alert: **${volKing.symbol}** is trading ${volKing.volume_spike_ratio.toFixed(1)}x normal volume — something's up.`
    );
  }

  return lines.join('\n');
}
