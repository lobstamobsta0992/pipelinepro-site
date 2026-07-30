// ============================================================================
// Enigma Intelligence — Backend Server Entry Point
// ============================================================================
// Express server that powers E's AI brain, onboarding flow, and API.
// ============================================================================

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend directory
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import apiRoutes from './routes/api';
import scannerRoutes from './routes/scanner';
import dcaRoutes from './routes/dca';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// ─── Middleware ──────────────────────────────────────────────────────────────

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// ─── Request Logging ────────────────────────────────────────────────────────

app.use((req, _res, next) => {
  const start = Date.now();
  _res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${_res.statusCode} ${duration}ms`);
  });
  next();
});

// ─── Routes ─────────────────────────────────────────────────────────────────

app.use('/api', apiRoutes);
app.use('/scanner', scannerRoutes);
app.use('/dca', dcaRoutes);

// ─── Initialize Services ────────────────────────────────────────────────────

async function initializeServices() {
  // Load all secrets from the shared secrets file
  try {
    const fs = await import('fs');
    const secretsPath = '/home/team/shared/.secrets.env';
    
    if (fs.existsSync(secretsPath)) {
      const secretsContent = fs.readFileSync(secretsPath, 'utf-8');
      
      // Helper to extract a key from the secrets file
      const getSecret = (key: string): string | null => {
        const match = secretsContent.match(new RegExp(`${key}=(.+)`));
        return match ? match[1].trim() : null;
      };

      // Initialize Stripe
      const stripeKey = getSecret('STRIPE_SECRET_KEY');
      if (stripeKey) {
        const { initStripe } = await import('./services/stripe');
        initStripe(stripeKey);
        console.log('✓ Stripe initialized (live mode)');
      }

      // Initialize Supabase
      const supabaseUrl = getSecret('SUPABASE_URL');
      const supabaseKey = getSecret('SUPABASE_SERVICE_ROLE_KEY');
      if (supabaseUrl && supabaseKey) {
        // Set env vars for downstream status checks
        process.env.SUPABASE_URL = supabaseUrl;
        process.env.SUPABASE_SERVICE_ROLE_KEY = supabaseKey;
        const { initSupabase } = await import('./services/supabase');
        initSupabase(supabaseUrl, supabaseKey);
        console.log('✓ Supabase client initialized');
      } else {
        console.log('ℹ Supabase not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .secrets.env.');
      }

      // Initialize Market Scanner (CoinGecko Pro)
      const coinGeckoKey = getSecret('COINGECKO_API_KEY');
      if (coinGeckoKey) {
        process.env.COINGECKO_API_KEY = coinGeckoKey;
        const { initMarketScanner, startScannerPolling } = await import('./services/marketScanner');
        initMarketScanner(coinGeckoKey);
        // Start polling after server is up
        setImmediate(() => startScannerPolling(60_000));
        console.log('✓ Market Scanner initialized (CoinGecko Pro)');
      } else {
        console.log('ℹ Market Scanner not configured. Add COINGECKO_API_KEY to .secrets.env.');
      }
    }
  } catch (err) {
    console.warn('⚠ Secrets initialization skipped:', (err as Error).message);
  }

  // Initialize Claude if API key is set
  if (process.env.ANTHROPIC_API_KEY) {
    const { initClaude } = await import('./services/claude');
    initClaude(process.env.ANTHROPIC_API_KEY);
    console.log('✓ Claude API initialized');
  } else {
    console.log('ℹ Claude API not configured. Set ANTHROPIC_API_KEY for AI responses.');
  }

  // Initialize DCA Scheduler (Phase 4)
  const { startDCAScheduler } = await import('./services/sentimentDCA');
  startDCAScheduler(300_000); // Check every 5 minutes
  console.log('✓ DCA Scheduler initialized (5min check)');
}

// ─── Start Server ───────────────────────────────────────────────────────────

async function start() {
  await initializeServices();

  app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║     Enigma Intelligence — Backend Server     ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║  Port:     ${PORT.toString().padEnd(33)}║`);
    console.log(`║  Mode:     ${process.env.NODE_ENV || 'development'.padEnd(33)}║`);
    console.log(`║  Claude:   ${process.env.ANTHROPIC_API_KEY ? '✓ Configured'.padEnd(30) : '○ Not configured'.padEnd(32)}║`);
    console.log(`║  Scanner:  ${process.env.COINGECKO_API_KEY ? '✓ Active (60s)'.padEnd(28) : '○ Not configured'.padEnd(32)}║`);
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');
    console.log(`📡 API ready at http://0.0.0.0:${PORT}/api`);
    console.log(`🏥 Health: http://0.0.0.0:${PORT}/api/health`);
    console.log(`📋 Status: http://0.0.0.0:${PORT}/api/status`);
    console.log(`🔍 Scanner: http://0.0.0.0:${PORT}/scanner/overview`);
    console.log(`🤖 Sentiment DCA: http://0.0.0.0:${PORT}/dca/sentiment`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});