// ============================================================================
// Coinbase Execution Routes — Elite tier auto-trading API
// ============================================================================

import { Router, Request, Response } from 'express';
import * as coinbase from '../services/coinbaseExecution';
import * as sentimentDCA from '../services/sentimentDCA';

const router = Router();

// ─── Credentials Management ────────────────────────────────────────────────

/** POST /execute/credentials — Store Coinbase API credentials */
router.post('/credentials', async (req: Request, res: Response) => {
  try {
    const { user_id, api_key, api_secret } = req.body;
    if (!user_id || !api_key || !api_secret) {
      res.status(400).json({ success: false, error: 'user_id, api_key, and api_secret are required' });
      return;
    }
    await coinbase.storeCredentials(user_id, api_key, api_secret);
    res.json({ success: true, data: { message: 'Credentials stored securely' } });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

/** DELETE /execute/credentials/:userId — Remove stored credentials */
router.delete('/credentials/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    await coinbase.deleteCredentials(userId);
    res.json({ success: true, data: { message: 'Credentials removed' } });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

/** GET /execute/credentials/:userId/check — Check if credentials exist */
router.get('/credentials/:userId/check', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const creds = await coinbase.getCredentials(userId);
    res.json({ success: true, data: { configured: !!creds } });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// ─── Order Execution ───────────────────────────────────────────────────────

/** POST /execute/order — Place a trade on Coinbase */
router.post('/order', async (req: Request, res: Response) => {
  try {
    const { user_id, product_id, side, type, size, limit_price, mock } = req.body;

    if (!user_id || !product_id || !side || !size) {
      res.status(400).json({ success: false, error: 'user_id, product_id, side, and size are required' });
      return;
    }

    const order: coinbase.OrderRequest = {
      product_id: product_id.toUpperCase(),
      side: side.toUpperCase() as 'BUY' | 'SELL',
      type: (type || 'MARKET').toUpperCase() as 'MARKET' | 'LIMIT' | 'STOP',
      size: size.toString(),
      limit_price: limit_price?.toString(),
    };

    // Use mock mode for testing, real API for production
    const result = mock
      ? await coinbase.placeMockOrder(user_id, order)
      : await coinbase.placeOrder(user_id, order);

    const commentary = coinbase.generateTradeConfirmCommentary(result);

    res.json({
      success: true,
      data: {
        order: result,
        commentary,
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

/** GET /execute/order/:userId/:orderId — Check order status */
router.get('/order/:userId/:orderId', async (req: Request, res: Response) => {
  try {
    const { userId, orderId } = req.params;

    // Check if mock order
    if (orderId.startsWith('mock_')) {
      const { data } = await coinbase.getMockOrderStatus(userId, orderId);
      res.json({ success: true, data: data });
      return;
    }

    const status = await coinbase.getOrderStatus(userId, orderId);
    res.json({ success: true, data: status });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// ─── Account ───────────────────────────────────────────────────────────────

/** GET /execute/accounts/:userId — Get Coinbase account balances */
router.get('/accounts/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const balances = await coinbase.getAccountBalances(userId);
    res.json({ success: true, data: balances });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// ─── Strategy Management ───────────────────────────────────────────────────

/** POST /execute/strategies — Save auto-trading strategy */
router.post('/strategies', async (req: Request, res: Response) => {
  try {
    const { user_id, name, is_active, config } = req.body;
    if (!user_id || !name || !config) {
      res.status(400).json({ success: false, error: 'user_id, name, and config are required' });
      return;
    }
    await coinbase.saveStrategy(user_id, { user_id, name, is_active: is_active ?? true, config });
    res.json({ success: true, data: { message: `Strategy "${name}" saved` } });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

/** GET /execute/strategies/:userId — Get user's strategies */
router.get('/strategies/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const strategies = await coinbase.getStrategies(userId);
    res.json({ success: true, data: strategies });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

/** POST /execute/dca — Execute DCA strategy */
router.post('/dca', async (req: Request, res: Response) => {
  try {
    const { user_id, asset, amount, mock } = req.body;
    if (!user_id || !asset || !amount) {
      res.status(400).json({ success: false, error: 'user_id, asset, and amount are required' });
      return;
    }

    const strategy: coinbase.AutoTradeConfig = {
      user_id,
      name: `DCA ${asset}`,
      is_active: true,
      config: { strategy: 'dca', asset, amount },
    };

    const order = await coinbase.executeDCA(user_id, strategy);
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});


// ─── Sentiment DCA (Phase 4) ───────────────────────────────────────────────

/** GET /execute/executions/:strategyId — Get execution history for a strategy */
router.get('/executions/:strategyId', async (req: Request, res: Response) => {
  try {
    const { strategyId } = req.params;
    const { limit } = req.query;
    const executions = await sentimentDCA.getDCAExecutions(strategyId, limit ? parseInt(limit as string) : 20);
    res.json({ success: true, data: executions });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

/** GET /execute/sentiment — Get current sentiment snapshot for DCA */
router.get('/sentiment', async (_req: Request, res: Response) => {
  try {
    const snapshot = await sentimentDCA.calculateSentiment();
    res.json({ success: true, data: snapshot });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;
