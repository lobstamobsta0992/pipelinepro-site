// ============================================================================
// Market Intelligence Routes — Whale Alerts & Cycle Indicators
// ============================================================================

import { Router, Request, Response } from 'express';
import * as whaleService from '../services/whaleAlerts';
import type { WhaleTransaction } from '../services/whaleAlerts';
import * as cycleService from '../services/cycleIndicators';
import * as newsService from '../services/newsFeed';
import { generateCycleCommentary } from '../services/eCommentary';
import * as db from '../services/supabase';

const router = Router();

// ─── Whale Alerts ──────────────────────────────────────────────────────────

/** GET /intel/whales — Get recent whale alerts */
router.get('/whales', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const minUsd = req.query.min_usd ? parseInt(req.query.min_usd as string) : undefined;
    const alerts = await whaleService.getRecentAlerts(limit, minUsd);

    res.json({
      success: true,
      data: alerts,
      metadata: {
        count: alerts.length,
        source: process.env.WHALE_ALERT_API_KEY ? 'live' : 'demo',
      },
    });
  } catch (err) {
    console.error('Failed to fetch whales:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch whale alerts' });
  }
});

/** GET /intel/whales/alert/:txHash — Get E's commentary on a specific alert */
router.get('/whales/commentary/:txHash', async (req: Request, res: Response) => {
  try {
    const { txHash } = req.params;
    const { data } = await db.getSupabase()
      .from('whale_alerts')
      .select('*')
      .eq('transaction_hash', txHash)
      .single();

    if (!data) {
      res.status(404).json({ success: false, error: 'Alert not found' });
      return;
    }

    const { generateAlertCommentary } = await import('../services/eCommentary');
    const commentary = generateAlertCommentary(data as WhaleTransaction);

    res.json({ success: true, data: { alert: data, commentary } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to generate commentary' });
  }
});

// ─── Cycle Indicators ──────────────────────────────────────────────────────

/** GET /intel/cycle — Get current cycle indicators */
router.get('/cycle', async (req: Request, res: Response) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const indicators = await cycleService.getCycleIndicators(forceRefresh);

    res.json({
      success: true,
      data: indicators,
      metadata: {
        source: process.env.COINGECKO_API_KEY ? 'live (CoinGecko Pro)' : 'estimated',
        btc_price: indicators.btc_price,
      },
    });
  } catch (err) {
    console.error('Failed to fetch cycle indicators:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch cycle indicators' });
  }
});

/** GET /intel/cycle/commentary — Get E's interpretation of current cycle */
router.get('/cycle/commentary', async (req: Request, res: Response) => {
  try {
    const experienceLevel = (req.query.level as string) || 'intermediate';
    const indicators = await cycleService.getCycleIndicators();
    const commentary = generateCycleCommentary(
      indicators as unknown as Record<string, unknown>,
      experienceLevel as 'beginner' | 'intermediate' | 'advanced'
    );

    res.json({
      success: true,
      data: {
        indicators,
        commentary,
        experience_level: experienceLevel,
      },
    });
  } catch (err) {
    console.error('Failed to generate commentary:', err);
    res.status(500).json({ success: false, error: 'Failed to generate commentary' });
  }
});

// ─── News Feed ─────────────────────────────────────────────────────────────

/** GET /intel/news — Get latest crypto news */
router.get('/news', async (req: Request, res: Response) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const articles = await newsService.getNews(forceRefresh);

    res.json({
      success: true,
      data: articles,
      metadata: {
        count: articles.length,
        source: process.env.NEWSDATA_API_KEY ? 'newsdata.io' : 'demo',
      },
    });
  } catch (err) {
    console.error('Failed to fetch news:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch news' });
  }
});

/** GET /intel/news/hottake/:articleId — Get E's hot take on a specific article */
router.get('/news/hottake/:articleId', async (req: Request, res: Response) => {
  try {
    const { articleId } = req.params;
    const articles = await newsService.getNews();
    const article = articles.find(a => a.article_id === articleId);

    if (!article) {
      res.status(404).json({ success: false, error: 'Article not found' });
      return;
    }

    const hotTake = newsService.generateNewsHotTake(article);

    res.json({
      success: true,
      data: {
        article,
        hot_take: hotTake,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to generate hot take' });
  }
});

// ─── Combined Market Intelligence ──────────────────────────────────────────

/** GET /intel/dashboard — Combined market snapshot for frontend dashboard */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const [whales, cycle, news] = await Promise.all([
      whaleService.getRecentAlerts(5),
      cycleService.getCycleIndicators(),
      newsService.getNews(),
    ]);

    res.json({
      success: true,
      data: {
        cycle_indicators: cycle,
        recent_whales: whales,
        news: news.slice(0, 5),
        summary: {
          btc_price: cycle.btc_price,
          market_sentiment: cycle.fear_greed_label,
          whale_activity_24h: whales.length,
          top_story: news[0]?.title || null,
        },
      },
    });
  } catch (err) {
    console.error('Failed to fetch dashboard:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch market dashboard' });
  }
});

export default router;