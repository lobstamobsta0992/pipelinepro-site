// ============================================================================
// Whale Alert Service — Monitors large blockchain transactions in real-time
// ============================================================================

import * as db from './supabase';
import { generateAlertCommentary } from './eCommentary';

export interface WhaleTransaction {
  id?: string;
  transaction_hash: string;
  blockchain: 'bitcoin' | 'ethereum' | 'solana' | 'polygon' | 'bsc';
  from_address: string;
  to_address: string;
  asset: string;
  amount: number;
  usd_value: number;
  transaction_type: 'transfer' | 'buy' | 'sell' | 'swap';
  alert_level: 'minor' | 'major' | 'whale';
  detected_at: string;
}

/** Polling interval in ms (30s for development, 60s for production) */
const POLL_INTERVAL_MS = parseInt(process.env.WHALE_POLL_INTERVAL || '30000', 10);

let pollingTimer: ReturnType<typeof setInterval> | null = null;
let subscribers: Array<(alert: WhaleTransaction & { commentary: string }) => void> = [];

// ─── Subscriber Management (for WebSocket/SSE push) ─────────────────────────

/** Subscribe to new whale alerts */
export function subscribe(callback: (alert: WhaleTransaction & { commentary: string }) => void): () => void {
  subscribers.push(callback);
  return () => {
    subscribers = subscribers.filter(cb => cb !== callback);
  };
}

function notifySubscribers(alert: WhaleTransaction & { commentary: string }) {
  for (const cb of subscribers) {
    try { cb(alert); } catch { /* skip failed subscriber */ }
  }
}

// ─── Data Fetching ──────────────────────────────────────────────────────────

/**
 * Fetch whales from Whale Alert API (requires WHALE_ALERT_API_KEY env var).
 * If the key isn't set, generates simulated alerts for development/demo.
 */
async function fetchWhaleData(): Promise<WhaleTransaction[]> {
  const apiKey = process.env.WHALE_ALERT_API_KEY;

  if (apiKey) {
    try {
      // Whale Alert API v1: https://api.whale-alert.io/v1/transactions
      const response = await fetch(
        `https://api.whale-alert.io/v1/transactions?api_key=${apiKey}&limit=10`,
        { headers: { 'Accept': 'application/json' } }
      );
      if (!response.ok) throw new Error(`Whale Alert API: ${response.status}`);
      const data: any = await response.json();
      return (data.transactions || []).map((tx: any) => ({
        transaction_hash: tx.hash as string,
        blockchain: (tx.blockchain as string)?.toLowerCase() || 'ethereum',
        from_address: (tx.from?.address as string) || '',
        to_address: (tx.to?.address as string) || '',
        asset: (tx.symbol as string)?.toUpperCase() || 'UNKNOWN',
        amount: tx.amount as number,
        usd_value: (tx.amount_usd as number) || 0,
        transaction_type: 'transfer',
        alert_level: (tx.amount_usd as number) > 1_000_000 ? 'whale' : (tx.amount_usd as number) > 500_000 ? 'major' : 'minor',
        detected_at: (tx.timestamp as string) || new Date().toISOString(),
      }));
    } catch (err) {
      console.error('Whale Alert API error:', err);
      return generateDemoAlerts();
    }
  }

  return generateDemoAlerts();
}

/** Generate realistic demo whale alerts when no API key is set */
function generateDemoAlerts(): WhaleTransaction[] {
  const BLOCKCHAINS = ['bitcoin', 'ethereum', 'solana'] as const;
  const ASSETS: Record<string, { chains: string[]; baseValue: number }> = {
    'BTC': { chains: ['bitcoin'], baseValue: 65000 },
    'ETH': { chains: ['ethereum'], baseValue: 3500 },
    'SOL': { chains: ['solana'], baseValue: 140 },
    'USDC': { chains: ['ethereum', 'solana'], baseValue: 1 },
    'USDT': { chains: ['ethereum', 'solana'], baseValue: 1 },
  };

  const alerts: WhaleTransaction[] = [];
  const now = Date.now();

  // Generate 1-3 random alerts
  const count = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < count; i++) {
    const assets = Object.keys(ASSETS);
    const asset = assets[Math.floor(Math.random() * assets.length)];
    const assetInfo = ASSETS[asset];
    const blockchain = assetInfo.chains[Math.floor(Math.random() * assetInfo.chains.length)] as WhaleTransaction['blockchain'];
    const amount = Math.floor(Math.random() * 5000) + 100;
    const usdValue = amount * assetInfo.baseValue * (Math.random() * 2 + 0.5);

    alerts.push({
      transaction_hash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      blockchain,
      from_address: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      to_address: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      asset,
      amount,
      usd_value: Math.round(usdValue),
      transaction_type: Math.random() > 0.5 ? 'transfer' : 'swap',
      alert_level: usdValue > 1_000_000 ? 'whale' : usdValue > 500_000 ? 'major' : 'minor',
      detected_at: new Date(now - Math.random() * 10000).toISOString(),
    });
  }

  return alerts;
}

// ─── Storage ────────────────────────────────────────────────────────────────

/** Save a whale alert to Supabase */
async function saveAlert(alert: WhaleTransaction): Promise<boolean> {
  try {
    await db.getSupabase().from('whale_alerts').upsert({
      transaction_hash: alert.transaction_hash,
      blockchain: alert.blockchain,
      from_address: alert.from_address,
      to_address: alert.to_address,
      asset: alert.asset,
      amount: alert.amount,
      usd_value: alert.usd_value,
      transaction_type: alert.transaction_type,
      alert_level: alert.alert_level,
      detected_at: alert.detected_at,
    }, { onConflict: 'transaction_hash' });
    return true;
  } catch (err) {
    console.error('Failed to save whale alert:', err);
    return false;
  }
}

// ─── Polling Engine ─────────────────────────────────────────────────────────

/** Start polling for new whale alerts */
export function startPolling(): void {
  if (pollingTimer) return;

  console.log(`🐋 Whale Alert polling started (every ${POLL_INTERVAL_MS / 1000}s)`);

  const poll = async () => {
    try {
      const alerts = await fetchWhaleData();
      for (const alert of alerts) {
        const saved = await saveAlert(alert);
        if (saved) {
          const commentary = generateAlertCommentary(alert);
          notifySubscribers({ ...alert, commentary });
          console.log(`🐋 ${alert.alert_level.toUpperCase()}: ${alert.usd_value.toLocaleString()} USD ${alert.asset} on ${alert.blockchain}`);
        }
      }
    } catch (err) {
      console.error('Whale poll error:', err);
    }
  };

  // Run immediately, then on interval
  poll();
  pollingTimer = setInterval(poll, POLL_INTERVAL_MS);
}

/** Stop polling */
export function stopPolling(): void {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
    console.log('🐋 Whale Alert polling stopped');
  }
}

// ─── Direct Query ───────────────────────────────────────────────────────────

/** Get recent whale alerts from the database */
export async function getRecentAlerts(limit = 20, minUsd?: number): Promise<WhaleTransaction[]> {
  try {
    let query = db.getSupabase()
      .from('whale_alerts')
      .select('*')
      .order('detected_at', { ascending: false })
      .limit(limit);

    if (minUsd) {
      query = query.gte('usd_value', minUsd);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as WhaleTransaction[];
  } catch (err) {
    console.error('Failed to fetch whale alerts:', err);
    return [];
  }
}