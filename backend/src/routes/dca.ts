// ============================================================================
// Sentiment DCA Routes — Phase 4 P0 Auto-Trading API
// ============================================================================
// Elite-only API for managing Sentiment-Based DCA strategies.
// Integrates Fear & Greed Index + news sentiment → intelligent DCA.
// ============================================================================

import { Router, Request, Response } from 'express';
import {
  getDCAStrategies,
  createDCAStrategy,
  togglePause,
  deleteDCAStrategy,
  executeDCACycle,
  getDCAExecutions,
  calculateSentiment,
  startDCAScheduler,
  stopDCAScheduler,
} from '../services/sentimentDCA';
import * as db from '../services/supabase';

const router = Router();

// ─── Tier Check Middleware ───────────────────────────────────────────────────

async function requireElite(req: Request, res: Response, next: Function): Promise<void> {
  const userId = (req.query.user_id as string) || (req.headers['x-user-id'] as string) || req.body.user_id;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  try {
    const subscription = await db.getSubscriptionInfo(userId);
    const tierData = Array.isArray(subscription?.tiers)
      ? (subscription.tiers as Array<{ slug: string }>)[0]
      : (subscription?.tiers as { slug: string } | undefined);

    if (tierData?.slug !== 'elite') {
      res.status(403).json({
        success: false,
        error: 'Sentiment DCA is an Elite-only feature. Upgrade to unlock AI-managed auto-trading.',
      });
      return;
    }
    next();
  } catch {
    res.status(500).json({ success: false, error: 'Failed to verify subscription' });
  }
}

// ─── Sentiment Snapshot ──────────────────────────────────────────────────────

/** GET /dca/sentiment — Current sentiment snapshot (shows what a DCA would do) */
router.get('/sentiment', async (req: Request, res: Response) => {
  try {
    const sentiment = await calculateSentiment();
    res.json({ success: true, data: sentiment });
  } catch (err) {
    console.error('DCA sentiment error:', err);
    res.status(500).json({ success: false, error: 'Failed to calculate sentiment' });
  }
});

// ─── Strategy CRUD ──────────────────────────────────────────────────────────

/** GET /dca/strategies — List all DCA strategies for a user */
router.get('/strategies', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.user_id as string) || (req.headers['x-user-id'] as string);
    if (!userId) {
      res.status(400).json({ success: false, error: 'user_id required' });
      return;
    }

    const strategies = await getDCAStrategies(userId);
    res.json({ success: true, data: strategies });
  } catch (err) {
    console.error('DCA strategies error:', err);
    res.status(500).json({ success: false, error: 'Failed to get strategies' });
  }
});

/** POST /dca/strategies — Create a new DCA strategy (Elite only) */
router.post('/strategies', requireElite, async (req: Request, res: Response) => {
  try {
    const { user_id, name, asset, base_amount, frequency, max_multiplier, min_cash_reserve } = req.body;

    if (!user_id || !asset || !base_amount) {
      res.status(400).json({ success: false, error: 'user_id, asset, and base_amount are required' });
      return;
    }

    const strategy = await createDCAStrategy({
      user_id,
      name,
      asset,
      base_amount,
      frequency,
      max_multiplier,
      min_cash_reserve,
    });

    res.status(201).json({ success: true, data: strategy });
  } catch (err) {
    console.error('DCA create error:', err);
    res.status(500).json({ success: false, error: 'Failed to create strategy' });
  }
});

/** PATCH /dca/strategies/:id/pause — Toggle pause */
router.patch('/strategies/:id/pause', requireElite, async (req: Request, res: Response) => {
  try {
    const { paused } = req.body;
    const strategy = await togglePause(req.params.id, paused ?? true);
    res.json({
      success: true,
      data: strategy,
      message: paused ? '⏸️ DCA strategy paused. No buys will execute until resumed.' : '▶️ DCA strategy resumed. Next cycle will execute on schedule.',
    });
  } catch (err) {
    console.error('DCA pause error:', err);
    res.status(500).json({ success: false, error: 'Failed to toggle pause' });
  }
});

/** DELETE /dca/strategies/:id — Delete a strategy */
router.delete('/strategies/:id', requireElite, async (req: Request, res: Response) => {
  try {
    await deleteDCAStrategy(req.params.id);
    res.json({ success: true, message: 'Strategy deleted' });
  } catch (err) {
    console.error('DCA delete error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete strategy' });
  }
});

// ─── Execution ───────────────────────────────────────────────────────────────

/** POST /dca/execute/:strategyId — Manually trigger a DCA cycle (Elite only) */
router.post('/execute/:strategyId', requireElite, async (req: Request, res: Response) => {
  try {
    const execution = await executeDCACycle(req.params.strategyId);
    res.json({ success: true, data: execution });
  } catch (err) {
    const message = (err as Error).message;
    console.error('DCA execute error:', err);
    res.status(400).json({ success: false, error: message });
  }
});

/** GET /dca/executions/:strategyId — Execution history */
router.get('/executions/:strategyId', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const executions = await getDCAExecutions(req.params.strategyId, limit);
    res.json({ success: true, data: executions });
  } catch (err) {
    console.error('DCA executions error:', err);
    res.status(500).json({ success: false, error: 'Failed to get executions' });
  }
});

export default router;
