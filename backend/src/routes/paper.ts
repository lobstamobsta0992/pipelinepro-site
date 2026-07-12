// ============================================================================
// Paper Trading Routes — DEX simulation API endpoints
// ============================================================================

import { Router, Request, Response } from 'express';
import * as paper from '../services/paperTrading';

const router = Router();

/** POST /paper/account — Create or get paper trading account */
router.post('/account', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      res.status(400).json({ success: false, error: 'user_id is required' });
      return;
    }
    const account = await paper.getOrCreateAccount(user_id);
    res.json({ success: true, data: account });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

/** POST /paper/trade — Execute a paper trade */
router.post('/trade', async (req: Request, res: Response) => {
  try {
    const { user_id, side, asset, quantity, slippage_tolerance } = req.body;

    if (!user_id || !side || !asset || !quantity) {
      res.status(400).json({
        success: false,
        error: 'user_id, side, asset, and quantity are required',
      });
      return;
    }

    if (!['buy', 'sell'].includes(side)) {
      res.status(400).json({ success: false, error: 'side must be "buy" or "sell"' });
      return;
    }

    const result = await paper.executePaperTrade(
      user_id,
      side as 'buy' | 'sell',
      asset.toUpperCase(),
      Number(quantity),
      slippage_tolerance || 0.01
    );

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

/** GET /paper/portfolio/:userId — Get paper trading portfolio */
router.get('/portfolio/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const portfolio = await paper.getPaperPortfolio(userId);
    res.json({ success: true, data: portfolio });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

/** GET /paper/history/:userId — Get paper trade history */
router.get('/history/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const history = await paper.getPaperTradeHistory(userId, limit);
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

/** GET /paper/assets — List supported tradable assets */
router.get('/assets', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      supported_assets: ['BTC', 'ETH', 'SOL', 'USDC', 'LINK', 'AVAX', 'MATIC'],
      starting_balance: 100_000,
      dex_fee_pct: 0.3,
      default_slippage: 1.0,
    },
  });
});

export default router;