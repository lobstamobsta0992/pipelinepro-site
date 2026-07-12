// ============================================================================
// DEX Paper Trading Engine — Simulated DEX swaps with live price feeds
// ============================================================================
// Users get $100k in demo funds to simulate trading on DEX-like conditions
// with realistic slippage, price impact, and E's commentary.
// ============================================================================

import * as db from './supabase';

const DEMO_STARTING_BALANCE = 100_000; // $100k USD demo funds
const SUPPORTED_ASSETS = ['BTC', 'ETH', 'SOL', 'USDC', 'LINK', 'AVAX', 'MATIC'];

export interface PaperAccount {
  user_id: string;
  cash_balance: number;
  total_value: number;        // cash + portfolio value
  starting_balance: number;
  created_at: string;
  updated_at: string;
}

export interface PaperTradeResult {
  success: boolean;
  asset: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  total: number;
  slippage_paid: number;
  fee: number;
  new_cash_balance: number;
  commentary: string;
  execution_time_ms: number;
}

// ─── Account Management ─────────────────────────────────────────────────────

/** Get or create a paper trading account for a user */
export async function getOrCreateAccount(userId: string): Promise<PaperAccount> {
  try {
    const { data, error } = await db.getSupabase()
      .from('paper_accounts')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data && !error) {
      // Calculate current total value (cash + portfolio value)
      const portfolioValue = await getPortfolioValue(userId);
      return {
        ...data,
        total_value: (data.cash_balance || 0) + portfolioValue,
      } as PaperAccount;
    }

    // Create new account with $100k starting balance
    const { data: newAccount, error: createError } = await db.getSupabase()
      .from('paper_accounts')
      .insert({
        user_id: userId,
        cash_balance: DEMO_STARTING_BALANCE,
        starting_balance: DEMO_STARTING_BALANCE,
      })
      .select()
      .single();

    if (createError) throw createError;
    return {
      ...newAccount,
      total_value: DEMO_STARTING_BALANCE,
    } as PaperAccount;
  } catch (err) {
    console.error('Failed to get/create paper account:', err);
    throw new Error('Failed to initialize paper trading account');
  }
}

/** Get portfolio value from current holdings */
async function getPortfolioValue(userId: string): Promise<number> {
  try {
    const { data } = await db.getSupabase()
      .from('user_portfolios')
      .select('asset, quantity')
      .eq('user_id', userId)
      .eq('is_manual', false); // Use false for paper trades (or we can add paper=true)

    if (!data || data.length === 0) return 0;

    // We'll use a simplified price lookup
    let total = 0;
    for (const holding of data) {
      const price = await getAssetPrice(holding.asset);
      total += holding.quantity * price;
    }
    return total;
  } catch {
    return 0;
  }
}

// ─── Price Feeds ───────────────────────────────────────────────────────────

/** Get real-time price for an asset from CoinGecko cache or live API */
async function getAssetPrice(asset: string): Promise<number> {
  const coinId = assetToCoinGeckoId(asset);
  if (!coinId) return 0;

  try {
    const { data } = await db.getSupabase()
      .from('market_data_cache')
      .select('current_price')
      .eq('coin_id', coinId)
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();

    if (data?.current_price) return data.current_price;
  } catch {
    // Cache miss — fallback prices
  }

  return getFallbackPrice(asset);
}

function assetToCoinGeckoId(asset: string): string | null {
  const map: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'USDC': 'usd-coin',
    'LINK': 'chainlink',
    'AVAX': 'avalanche-2',
    'MATIC': 'matic-network',
  };
  return map[asset] || null;
}

function getFallbackPrice(asset: string): number {
  const prices: Record<string, number> = {
    'BTC': 67500,
    'ETH': 3450,
    'SOL': 145,
    'USDC': 1,
    'LINK': 16.50,
    'AVAX': 38.20,
    'MATIC': 0.72,
  };
  return prices[asset] || 1;
}

// ─── DEX Swap Simulation ───────────────────────────────────────────────────

interface SwapParams {
  asset_in: string;
  asset_out: string;
  amount_in: number;
  slippage_tolerance: number; // 0.01 = 1%
}

interface SwapResult {
  amount_out: number;
  price: number;
  price_impact: number;
  slippage: number;
  fee: number;
}

/**
 * Simulate a DEX swap (Uniswap/Raydium style constant product AMM).
 * Calculates realistic price impact using x*y=k formula.
 */
function simulateDexSwap(params: SwapParams, poolLiquidityUsd: number): SwapResult {
  const { amount_in, slippage_tolerance } = params;

  // Simulate constant product AMM (x * y = k)
  // Pool depth determines price impact
  const reserveRatio = poolLiquidityUsd > 0
    ? amount_in / poolLiquidityUsd
    : amount_in / 1_000_000; // Default $1M pool depth

  // Price impact: for a $10k trade in a $1M pool, ~1% impact
  // Using simplified formula: impact = (reserveRatio) / (1 - reserveRatio)
  const price_impact = reserveRatio > 0
    ? Math.min(reserveRatio / Math.max(1 - reserveRatio, 0.01), 0.5) // Cap at 50%
    : 0;

  // Slippage: random factor within user's tolerance
  const slippage = (Math.random() * slippage_tolerance);

  // Fee: 0.3% standard DEX fee (Uniswap)
  const fee = amount_in * 0.003;

  // Amount out after impact, slippage, and fee
  const effectiveAmountIn = amount_in * (1 - price_impact) * (1 - slippage);
  const amount_out = effectiveAmountIn - fee;

  return {
    amount_out: Math.max(amount_out, 0),
    price: amount_in / Math.max(amount_out, 0.0001),
    price_impact,
    slippage,
    fee,
  };
}

// ─── Trade Execution ───────────────────────────────────────────────────────

/**
 * Execute a paper trade — buy or sell an asset using live prices
 * with simulated DEX conditions.
 */
export async function executePaperTrade(
  userId: string,
  side: 'buy' | 'sell',
  asset: string,
  quantity: number,
  slippageTolerance = 0.01 // 1% default
): Promise<PaperTradeResult> {
  const startTime = Date.now();

  // Validate asset
  if (!SUPPORTED_ASSETS.includes(asset)) {
    throw new Error(`Unsupported asset: ${asset}. Supported: ${SUPPORTED_ASSETS.join(', ')}`);
  }

  // Get or create account
  const account = await getOrCreateAccount(userId);

  // Get current price
  const currentPrice = await getAssetPrice(asset);
  if (currentPrice <= 0) {
    throw new Error(`Unable to fetch price for ${asset}`);
  }

  const totalCost = side === 'buy' ? quantity * currentPrice : 0;
  const totalValue = side === 'sell' ? quantity * currentPrice : 0;

  // Check if user has enough balance
  if (side === 'buy' && totalCost > account.cash_balance) {
    throw new Error(`Insufficient funds. Need $${totalCost.toFixed(2)} but have $${account.cash_balance.toFixed(2)}`);
  }

  // Check if user has enough of the asset to sell
  if (side === 'sell') {
    const { data: holding } = await db.getSupabase()
      .from('user_portfolios')
      .select('quantity')
      .eq('user_id', userId)
      .eq('asset', asset)
      .single();

    const ownedQuantity = (holding?.quantity as number) || 0;
    if (quantity > ownedQuantity) {
      throw new Error(`Insufficient ${asset}. You own ${ownedQuantity.toFixed(4)} but trying to sell ${quantity.toFixed(4)}`);
    }
  }

  // Simulate DEX swap with realistic parameters
  const poolDepth = currentPrice * 500_000; // Assume 500k tokens in pool
  const swapParams: SwapParams = {
    asset_in: side === 'buy' ? 'USD' : asset,
    asset_out: side === 'buy' ? asset : 'USD',
    amount_in: side === 'buy' ? totalCost : quantity,
    slippage_tolerance: slippageTolerance,
  };

  const dexResult = simulateDexSwap(swapParams, poolDepth);
  const effectiveQuantity = side === 'buy'
    ? dexResult.amount_out / currentPrice  // How much we actually got after impact
    : quantity * (1 - dexResult.price_impact) * (1 - dexResult.slippage) - dexResult.fee / currentPrice;

  const executionPrice = currentPrice * (1 + (side === 'buy' ? dexResult.price_impact : -dexResult.price_impact));

  // Update cash balance
  const cashDelta = side === 'buy'
    ? -(totalCost + dexResult.fee)
    : (totalValue * (1 - dexResult.price_impact) * (1 - dexResult.slippage)) - dexResult.fee;

  const newCashBalance = account.cash_balance + cashDelta;

  // Update portfolio holdings
  const quantityDelta = side === 'buy' ? effectiveQuantity : -quantity;

  // Upsert portfolio holding
  await db.getSupabase()
    .from('user_portfolios')
    .upsert({
      user_id: userId,
      asset,
      quantity: quantityDelta, // This will be absolute after read-modify-write
      is_manual: false,
    }, { onConflict: 'user_id, asset' });

  // Actually do a proper read-modify-write for portfolio
  const { data: existingHolding } = await db.getSupabase()
    .from('user_portfolios')
    .select('quantity')
    .eq('user_id', userId)
    .eq('asset', asset)
    .single();

  const currentQty = (existingHolding?.quantity as number) || 0;
  const newQty = Math.max(0, currentQty + quantityDelta);

  await db.getSupabase()
    .from('user_portfolios')
    .upsert({
      user_id: userId,
      asset,
      quantity: newQty,
      is_manual: false,
    }, { onConflict: 'user_id, asset' });

  // Update cash balance
  if (newCashBalance >= 0) {
    await db.getSupabase()
      .from('paper_accounts')
      .update({ cash_balance: newCashBalance })
      .eq('user_id', userId);
  }

  // Record the trade
  await db.getSupabase()
    .from('trade_executions')
    .insert({
      user_id: userId,
      asset,
      side,
      quantity: effectiveQuantity,
      price: executionPrice,
      total_usd: side === 'buy' ? totalCost : totalValue,
      status: 'filled',
      executed_at: new Date().toISOString(),
    });

  // Generate E's commentary
  const commentary = generateTradeCommentary(side, asset, quantity, executionPrice, dexResult);

  const executionTime = Date.now() - startTime;

  return {
    success: true,
    asset,
    side,
    quantity: effectiveQuantity,
    price: executionPrice,
    total: side === 'buy' ? totalCost : totalValue,
    slippage_paid: totalCost * dexResult.slippage,
    fee: dexResult.fee,
    new_cash_balance: newCashBalance,
    commentary,
    execution_time_ms: executionTime,
  };
}

// ─── E's Trade Commentary ──────────────────────────────────────────────────

function generateTradeCommentary(
  side: 'buy' | 'sell',
  asset: string,
  quantity: number,
  price: number,
  dexResult: SwapResult
): string {
  const total = quantity * price;
  const formattedTotal = total > 1000 ? `$${(total / 1000).toFixed(1)}K` : `$${total.toFixed(2)}`;
  const formattedPrice = price > 100 ? `$${price.toFixed(2)}` : `$${price.toFixed(4)}`;

  const openers: Record<string, string[]> = {
    buy: [
      `Boom. Bought the dip on ${asset}. `,
      `${asset} acquisition executed. `,
      `Position opened: ${asset}. `,
      `You're now long ${asset}. `,
    ],
    sell: [
      `Sold ${asset}. Locking in those gains. `,
      `${asset} position closed. Profit is profit. `,
      `Exited ${asset}. `,
      `Sold ${asset} — discipline beats alpha every time. `,
    ],
  };

  const opener = openers[side][Math.floor(Math.random() * openers[side].length)];
  const impactNote = dexResult.price_impact > 0.02
    ? `\n\n⚠️ Price impact was ${(dexResult.price_impact * 100).toFixed(1)}% — this was a chunky trade relative to pool depth. Next time consider splitting it up to save on slippage.`
    : '';

  const summary = side === 'buy'
    ? `${opener}${formattedQuantity(quantity)} ${asset} at ${formattedPrice} (${formattedTotal}). Slippage: ${(dexResult.slippage * 100).toFixed(2)}%. DEX fee: ${(dexResult.fee).toFixed(2)} USD.${impactNote}`
    : `${opener}${formattedQuantity(quantity)} ${asset} at ${formattedPrice} (${formattedTotal}). ${impactNote}`;

  return summary;
}

function formattedQuantity(qty: number): string {
  if (qty >= 1) return qty.toFixed(4);
  if (qty >= 0.001) return qty.toFixed(6);
  return qty.toFixed(8);
}

// ─── Portfolio View ────────────────────────────────────────────────────────

/** Get user's full paper trading portfolio */
export async function getPaperPortfolio(userId: string) {
  const account = await getOrCreateAccount(userId);

  const { data: holdings } = await db.getSupabase()
    .from('user_portfolios')
    .select('asset, quantity, average_entry_price')
    .eq('user_id', userId)
    .eq('is_manual', false);

  const portfolioItems = await Promise.all(
    (holdings || [])
      .filter(h => h.quantity > 0)
      .map(async (h) => {
        const currentPrice = await getAssetPrice(h.asset);
        const value = h.quantity * currentPrice;
        const costBasis = h.quantity * (h.average_entry_price || currentPrice);
        return {
          asset: h.asset,
          quantity: h.quantity,
          current_price: currentPrice,
          value,
          pnl: value - costBasis,
          pnl_percent: costBasis > 0 ? ((value - costBasis) / costBasis * 100) : 0,
        };
      })
  );

  const portfolioValue = portfolioItems.reduce((sum, item) => sum + item.value, 0);

  return {
    cash_balance: account.cash_balance,
    portfolio_value: portfolioValue,
    total_value: account.cash_balance + portfolioValue,
    starting_balance: account.starting_balance,
    total_pnl: (account.cash_balance + portfolioValue) - account.starting_balance,
    total_pnl_percent: account.starting_balance > 0
      ? (((account.cash_balance + portfolioValue) - account.starting_balance) / account.starting_balance * 100)
      : 0,
    holdings: portfolioItems,
    positions_count: portfolioItems.length,
  };
}

// ─── Trade History ─────────────────────────────────────────────────────────

/** Get paper trade history for a user */
export async function getPaperTradeHistory(userId: string, limit = 20) {
  const { data } = await db.getSupabase()
    .from('trade_executions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data || []).map(tx => ({
    ...tx,
    commentary: generateTradeCommentary(
      tx.side as 'buy' | 'sell',
      tx.asset,
      tx.quantity,
      tx.price,
      { price_impact: 0.01, slippage: 0.005, fee: tx.total_usd * 0.003, amount_out: tx.quantity, price: tx.price }
    ),
  }));
}