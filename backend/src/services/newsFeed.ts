// ============================================================================
// News Feed Service — Powered by Newsdata.io API
// ============================================================================

import * as db from './supabase';

export interface NewsArticle {
  article_id: string;
  title: string;
  description: string;
  content: string;
  source: string;
  source_url: string;
  category: string[];
  country: string[];
  language: string;
  pub_date: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  is_crypto_related: boolean;
}

const NEWS_CACHE_KEY = 'news_feed_cache';
const CACHE_TTL_MS = parseInt(process.env.NEWS_CACHE_TTL || '300000', 5); // 5 min default

// ─── Fetching ──────────────────────────────────────────────────────────────

/**
 * Fetch crypto news from Newsdata.io API.
 * Uses the stored API key from .secrets.env.
 */
async function fetchNewsFromAPI(): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWSDATA_API_KEY;

  if (!apiKey) {
    console.warn('⚠ NEWSDATA_API_KEY not configured — generating demo news');
    return generateDemoNews();
  }

  try {
    // Newsdata.io API v2 — crypto news endpoint
    const url = new URL('https://newsdata.io/api/2/news');
    url.searchParams.set('apikey', apiKey);
    url.searchParams.set('category', 'business,technology');
    url.searchParams.set('q', 'crypto OR bitcoin OR ethereum OR blockchain OR defi OR web3');
    url.searchParams.set('language', 'en');
    url.searchParams.set('size', '10');

    const response = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Newsdata.io API: ${response.status} ${response.statusText}`);
    }

    const data: any = await response.json();
    const results = data.results || [];

    return results.map((article: Record<string, unknown>) => ({
      article_id: article.article_id as string || `news_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: (article.title as string) || '',
      description: (article.description as string) || '',
      content: (article.content as string) || '',
      source: (article.source_id as string) || 'Unknown',
      source_url: (article.link as string) || '',
      category: (article.category as string[]) || [],
      country: (article.country as string[]) || [],
      language: (article.language as string) || 'en',
      pub_date: (article.pubDate as string) || new Date().toISOString(),
      sentiment: detectSentiment(article),
      is_crypto_related: true,
    }));
  } catch (err) {
    console.error('Newsdata.io fetch error:', err);
    return generateDemoNews();
  }
}

/** Simple sentiment detection based on content keywords */
function detectSentiment(article: Record<string, unknown>): 'positive' | 'negative' | 'neutral' {
  const text = [
    article.title as string || '',
    article.description as string || '',
    article.content as string || '',
  ].join(' ').toLowerCase();

  const positiveWords = ['surge', 'rally', 'bullish', 'gain', 'adoption', 'breakthrough', 'launch', 'upgrade', 'partnership', 'approval'];
  const negativeWords = ['crash', 'dump', 'bearish', 'ban', 'hack', 'scam', 'regulation', 'crackdown', 'fraud', 'loss', 'decline'];

  const positiveScore = positiveWords.filter(w => text.includes(w)).length;
  const negativeScore = negativeWords.filter(w => text.includes(w)).length;

  if (positiveScore > negativeScore) return 'positive';
  if (negativeScore > positiveScore) return 'negative';
  return 'neutral';
}

/** Generate demo crypto news for development/testing */
function generateDemoNews(): NewsArticle[] {
  const headlines = [
    { title: 'Bitcoin Surges Past $70K as Institutional Inflows Hit Record High', sentiment: 'positive' as const },
    { title: 'Ethereum ETF Approval Sparks Rally — Analysts Eye $5K', sentiment: 'positive' as const },
    { title: 'Fed Chair Comments on Crypto: "We\'re Watching Closely"', sentiment: 'neutral' as const },
    { title: 'Solana DeFi TVL Crosses $10B — Ecosystem Expansion Continues', sentiment: 'positive' as const },
    { title: 'Regulatory Uncertainty Weighs on Altcoin Markets', sentiment: 'negative' as const },
    { title: 'Whale Accumulation Spotted: 50K BTC Moves to Cold Storage', sentiment: 'positive' as const },
    { title: 'DeFi Hack: $5M Exploited on Cross-Chain Bridge', sentiment: 'negative' as const },
    { title: 'Crypto Market Cap Adds $100B in 24 Hours — What’s Driving It?', sentiment: 'positive' as const },
  ];

  return headlines.map((h, i) => ({
    article_id: `demo_${Date.now()}_${i}`,
    title: h.title,
    description: `${h.title}. Market analysts weigh in on the latest developments in the crypto space.`,
    content: `${h.title}. This is developing news in the cryptocurrency market. Stay tuned for updates.`,
    source: ['CoinDesk', 'CoinTelegraph', 'Blockworks', 'The Block', 'Decrypt'][Math.floor(Math.random() * 5)],
    source_url: 'https://example.com/crypto-news',
    category: ['business', 'technology'],
    country: ['us'],
    language: 'en',
    pub_date: new Date(Date.now() - i * 60000).toISOString(),
    sentiment: h.sentiment,
    is_crypto_related: true,
  }));
}

// ─── Caching ────────────────────────────────────────────────────────────────

/** Cache news articles in memory (simple TTL-based cache) */
let cachedNews: NewsArticle[] = [];
let lastNewsFetch = 0;

/**
 * Get the latest news articles. Returns cached if fresh, fetches otherwise.
 */
export async function getNews(forceRefresh = false): Promise<NewsArticle[]> {
  const now = Date.now();

  if (!forceRefresh && cachedNews.length > 0 && (now - lastNewsFetch) < CACHE_TTL_MS) {
    return cachedNews;
  }

  try {
    const articles = await fetchNewsFromAPI();
    cachedNews = articles;
    lastNewsFetch = now;

    // Cache to Supabase for persistence
    await db.getSupabase()
      .from('market_data_cache')
      .upsert({
        coin_id: NEWS_CACHE_KEY,
        symbol: 'NEWS',
        name: 'Crypto News Feed',
        market_data: {
          articles: articles.slice(0, 10),
          fetched_at: new Date().toISOString(),
          source: process.env.NEWSDATA_API_KEY ? 'newdata.io' : 'demo',
        },
        fetched_at: new Date().toISOString(),
      }, { onConflict: 'coin_id' });

    return articles;
  } catch (err) {
    console.error('Failed to fetch news:', err);
    return cachedNews.length > 0 ? cachedNews : generateDemoNews();
  }
}

// ─── E's Commentary ─────────────────────────────────────────────────────────

const HOT_TAKES: Record<string, string[]> = {
  positive: [
    `This is the kind of headline that moves markets. Green candles incoming? 📈`,
    `Bullish narrative building. This is exactly the kind of news that breaks through retail apathy.`,
    `Love to see it. This isn't just noise — this is fundamental adoption happening in real-time.`,
  ],
  negative: [
    `FUD alert. But remember — every dip in a bull market is a gift. Don't panic. 🧊`,
    `This is the kind of headline that scares new people. For us? It's just Tuesday in crypto.`,
    `Fear drives exits. Smart money buys fear. Let's see how this plays out before reacting.`,
  ],
  neutral: [
    `Interesting but not actionable yet. Keeping this on my radar.`,
    `The market hasn't priced this in yet. Worth watching for the next 48 hours.`,
    `Neutral signal for now, but context matters. Let me cross-reference this with on-chain data.`,
  ],
};

/** Generate E's hot take on a news article */
export function generateNewsHotTake(article: NewsArticle): string {
  const sentiment = article.sentiment || 'neutral';
  const takes = HOT_TAKES[sentiment];
  const take = takes[Math.floor(Math.random() * takes.length)];

  // Add article-specific context
  const articleLower = (article.title + ' ' + article.description).toLowerCase();
  let context = '';

  if (articleLower.includes('bitcoin') || articleLower.includes('btc')) {
    context = '\n\nBTC is the king for a reason. When BTC moves, everything follows.';
  } else if (articleLower.includes('ethereum') || articleLower.includes('eth')) {
    context = '\n\nETH ecosystem is where the real innovation happens. Keep an eye on L2s.';
  } else if (articleLower.includes('solana') || articleLower.includes('sol')) {
    context = '\n\nSolana has been on a tear. The speed and adoption are undeniable.';
  } else if (articleLower.includes('regulat') || articleLower.includes('sec') || articleLower.includes('ban')) {
    context = '\n\nRegulation is inevitable, but clarity is actually bullish long-term. Markets hate uncertainty more than they hate rules.';
  } else if (articleLower.includes('hack') || articleLower.includes('exploit') || articleLower.includes('scam')) {
    context = '\n\nSecurity is everything in this space. If you\'re not self-custodying, you\'re doing it wrong.';
  }

  return `${take}${context}`;
}