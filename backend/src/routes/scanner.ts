// ============================================================================
// Market Scanner Routes — Real-time coin monitoring & zone analysis
// ============================================================================
// Elite-only feature. Free/Pro users get a limited preview.
// ============================================================================

import { Router, Request, Response } from 'express';
import {
  getScannerData,
  getTierLimitedData,
  getCoinFromCache,
  searchCoins,
  getHotZone,
  getDeadZone,
  getTrending,
} from '../services/marketScanner';
import { generateCoinCommentary, generateZoneCommentary } from '../services/scannerCommentary';
import * as db from '../services/supabase';

const router = Router();

// ─── Tier Resolution Middleware ───────────────────────────────────────────────

async function resolveTier(userId: string): Promise<string> {
  try {
    const subscription = await db.getSubscriptionInfo(userId);
    if (!subscription) return 'free';

    // Elite tier check
    const tierData = Array.isArray(subscription.tiers)
      ? (subscription.tiers as Array<{ slug: string }>)[0]
      : (subscription.tiers as { slug: string } | undefined);

    return tierData?.slug ?? 'free';
  } catch {
    return 'free';
  }
}

async function resolveTierFromQuery(req: Request): Promise<string> {
  const userId = (req.query.user_id as string) || (req.headers['x-user-id'] as string);
  if (userId) return resolveTier(userId);
  return 'free'; // unauthenticated = free tier preview
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/** GET /scanner/overview — Market-wide summary with E's hot take */
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const tier = await resolveTierFromQuery(req);
    const fullData = await getScannerData();
    const data = getTierLimitedData(tier);

    res.json({
      success: true,
      data,
      metadata: {
        tier,
        is_preview: tier !== 'elite',
        last_refreshed: fullData.overview.last_refreshed,
      },
    });
  } catch (err) {
    console.error('Scanner overview error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch market scanner data' });
  }
});

/** GET /scanner/hot — Hot zone coins */
router.get('/hot', async (req: Request, res: Response) => {
  try {
    const tier = await resolveTierFromQuery(req);
    const limit = tier === 'elite' ? parseInt(req.query.limit as string) || 25 : 5;
    const hotCoins = getHotZone(limit);

    if (tier !== 'elite') {
      res.json({
        success: true,
        data: hotCoins,
        metadata: {
          tier,
          is_preview: true,
          message: '🔒 Upgrade to Elite for full hot zone analysis (25+ coins)',
        },
      });
      return;
    }

    res.json({ success: true, data: hotCoins, metadata: { tier } });
  } catch (err) {
    console.error('Scanner hot zone error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch hot zone' });
  }
});

/** GET /scanner/dead — Dead zone coins */
router.get('/dead', async (req: Request, res: Response) => {
  try {
    const tier = await resolveTierFromQuery(req);
    const limit = tier === 'elite' ? parseInt(req.query.limit as string) || 25 : 5;
    const deadCoins = getDeadZone(limit);

    if (tier !== 'elite') {
      res.json({
        success: true,
        data: deadCoins,
        metadata: {
          tier,
          is_preview: true,
          message: '🔒 Upgrade to Elite for full dead zone analysis (25+ coins)',
        },
      });
      return;
    }

    res.json({ success: true, data: deadCoins, metadata: { tier } });
  } catch (err) {
    console.error('Scanner dead zone error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch dead zone' });
  }
});

/** GET /scanner/trending — Coins showing significant trend shifts */
router.get('/trending', async (req: Request, res: Response) => {
  try {
    const tier = await resolveTierFromQuery(req);
    const limit = tier === 'elite' ? parseInt(req.query.limit as string) || 25 : 5;
    const trending = getTrending(limit);

    if (tier !== 'elite') {
      res.json({
        success: true,
        data: trending,
        metadata: {
          tier,
          is_preview: true,
          message: '🔒 Upgrade to Elite for full trending scanner',
        },
      });
      return;
    }

    // Add E's commentary to each trending coin
    const enriched = trending.map((coin) => ({
      ...coin,
      e_take: generateCoinCommentary(coin),
    }));

    res.json({ success: true, data: enriched, metadata: { tier } });
  } catch (err) {
    console.error('Scanner trending error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch trending' });
  }
});

/** GET /scanner/coin/:id — Single coin deep-dive */
router.get('/coin/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tier = await resolveTierFromQuery(req);

    if (tier !== 'elite') {
      res.status(403).json({
        success: false,
        error: 'Coin deep-dive is an Elite-only feature. Upgrade to unlock.',
      });
      return;
    }

    const coin = getCoinFromCache(id);
    if (!coin) {
      res.status(404).json({ success: false, error: `Coin "${id}" not found in scanner cache` });
      return;
    }

    const commentary = generateCoinCommentary(coin);

    res.json({
      success: true,
      data: {
        ...coin,
        e_take: commentary,
      },
    });
  } catch (err) {
    console.error('Scanner coin detail error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch coin details' });
  }
});

/** GET /scanner/search — Search for coins by name/symbol */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || '';
    if (!query || query.length < 2) {
      res.status(400).json({ success: false, error: 'Search query (q) must be at least 2 characters' });
      return;
    }

    const tier = await resolveTierFromQuery(req);
    const limit = tier === 'elite' ? parseInt(req.query.limit as string) || 20 : 5;
    const results = searchCoins(query, limit);

    res.json({
      success: true,
      data: results,
      metadata: {
        tier,
        query,
        count: results.length,
        is_preview: tier !== 'elite',
      },
    });
  } catch (err) {
    console.error('Scanner search error:', err);
    res.status(500).json({ success: false, error: 'Failed to search coins' });
  }
});

/** GET /scanner/refresh — Force-refresh the scanner (Elite only, rate-limited) */
router.get('/refresh', async (req: Request, res: Response) => {
  try {
    const tier = await resolveTierFromQuery(req);

    if (tier !== 'elite') {
      res.status(403).json({
        success: false,
        error: 'Manual refresh is an Elite-only feature.',
      });
      return;
    }

    const data = await getScannerData(true);
    res.json({
      success: true,
      data: data.overview,
      metadata: {
        coins_tracked: data.coins.length,
        last_refreshed: data.overview.last_refreshed,
      },
    });
  } catch (err) {
    console.error('Scanner refresh error:', err);
    res.status(500).json({ success: false, error: 'Failed to refresh scanner' });
  }
});

/** GET /scanner/zone/:zone — Get coins by specific zone */
router.get('/zone/:zone', async (req: Request, res: Response) => {
  try {
    const { zone } = req.params;
    const validZones = ['hot', 'dead', 'neutral', 'watching'];

    if (!validZones.includes(zone)) {
      res.status(400).json({
        success: false,
        error: `Invalid zone. Must be one of: ${validZones.join(', ')}`,
      });
      return;
    }

    const tier = await resolveTierFromQuery(req);

    if (tier !== 'elite') {
      res.status(403).json({
        success: false,
        error: 'Zone filtering is an Elite-only feature. Upgrade to unlock.',
      });
      return;
    }

    const fullData = await getScannerData();
    const zoneCoins = fullData.coins.filter((c) => c.zone === zone);
    const commentary = generateZoneCommentary(zone, zoneCoins);

    res.json({
      success: true,
      data: {
        zone,
        count: zoneCoins.length,
        coins: zoneCoins.slice(0, parseInt(req.query.limit as string) || 50),
        commentary,
      },
    });
  } catch (err) {
    console.error('Scanner zone filter error:', err);
    res.status(500).json({ success: false, error: 'Failed to filter by zone' });
  }
});

export default router;
