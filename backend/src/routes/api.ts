// ============================================================================
// API Routes — E's Chat & Onboarding Endpoints
// ============================================================================

import { Router, Request, Response } from 'express';
import { createOnboardingState, processOnboardingMessage, getWelcomeMessage } from '../services/onboarding';
import { buildSystemPrompt } from '../prompts/e-personality';
import { chatWithClaude } from '../services/claude';
import * as db from '../services/supabase';
import { verifyStripeConnection } from '../services/stripe';
import { OnboardingState, EChatResponse } from '../types';

// Import sub-routers
import intelRouter from './intel';
import paperRouter from './paper';
import executeRouter from './execute';

const router = Router();

// ─── Sub-Routes ─────────────────────────────────────────────────────────────

router.use('/intel', intelRouter);
router.use('/paper', paperRouter);
router.use('/execute', executeRouter);

// ─── Health / Status ────────────────────────────────────────────────────────

/** Health check endpoint */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    },
  });
});

/** Environment check — verify connected services */
router.get('/status', async (_req: Request, res: Response) => {
  const stripeStatus = await verifyStripeConnection();

  res.json({
    success: true,
    data: {
      anthropic_configured: !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.length > 0,
      stripe_configured: stripeStatus.valid,
      stripe_mode: stripeStatus.mode,
      supabase_configured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
  });
});

// ─── Onboarding ─────────────────────────────────────────────────────────────

// In-memory onboarding state store (for MVP — replace with Redis/DB later)
const onboardingSessions = new Map<string, OnboardingState>();

/** POST /onboarding/start — Begin the "Meet E" flow */
router.post('/onboarding/start', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      res.status(400).json({ success: false, error: 'user_id is required' });
      return;
    }

    const state = createOnboardingState(user_id);
    onboardingSessions.set(user_id, state);

    const welcome = getWelcomeMessage();

    res.json({
      success: true,
      data: {
        message: welcome,
        onboarding: true,
        step: state.current_step,
      },
    });
  } catch (err) {
    console.error('Failed to start onboarding:', err);
    res.status(500).json({ success: false, error: 'Failed to start onboarding' });
  }
});

/** POST /onboarding/message — Continue the "Meet E" conversation */
router.post('/onboarding/message', async (req: Request, res: Response) => {
  try {
    const { user_id, message } = req.body;
    if (!user_id || !message) {
      res.status(400).json({ success: false, error: 'user_id and message are required' });
      return;
    }

    // Get or create session state
    let state = onboardingSessions.get(user_id);
    if (!state) {
      state = createOnboardingState(user_id);
      onboardingSessions.set(user_id, state);
    }

    const { response, updatedState, profileComplete } = await processOnboardingMessage(
      user_id,
      message,
      state
    );

    // Update in-memory state
    onboardingSessions.set(user_id, updatedState);

    res.json({
      success: true,
      data: {
        message: response,
        onboarding: !profileComplete,
        step: updatedState.current_step,
        profile_complete: profileComplete,
      },
    });
  } catch (err) {
    console.error('Failed to process onboarding message:', err);
    res.status(500).json({ success: false, error: 'Failed to process message' });
  }
});

// ─── E Chat (Post-Onboarding) ───────────────────────────────────────────────

/** POST /chat — Send a message to E (after onboarding) */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { user_id, message, conversation_id } = req.body;
    if (!user_id || !message) {
      res.status(400).json({ success: false, error: 'user_id and message are required' });
      return;
    }

    // Get user profile for context
    const profile = await db.getProfile(user_id);
    if (!profile) {
      res.status(404).json({ success: false, error: 'User profile not found. Please complete onboarding first.' });
      return;
    }

    // Get subscription info
    const subscription = await db.getSubscriptionInfo(user_id);

    // Get user memory for E's context
    const memory = await db.getMemory(user_id, 'onboarding_summary');

    // Build E's system prompt with full context
    const systemPrompt = buildSystemPrompt({
      name: profile.display_name,
      experience_level: profile.experience_level,
      goals: profile.trading_goals,
      holdings: memory?.holdings as string | undefined,
      is_onboarding: false,
    });

    // Get or create conversation
    let activeConversationId = conversation_id;
    if (!activeConversationId) {
      const conv = await db.createConversation(user_id, `Chat with E`);
      activeConversationId = conv.id;
    }

    // Save user message
    await db.saveMessage(activeConversationId, 'user', message);

    // Get recent messages for context
    const recentMessages = await db.getConversationMessages(activeConversationId);
    const formattedMessages = recentMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Get E's response
    let responseContent: string;
    let tokensUsed = 0;

    if (process.env.ANTHROPIC_API_KEY) {
      const claudeResponse = await chatWithClaude({
        systemPrompt,
        messages: formattedMessages,
        userExperience: profile.experience_level,
      });
      responseContent = claudeResponse.content;
      tokensUsed = claudeResponse.tokensUsed;
    } else {
      // Fallback when Claude isn't configured
      responseContent = `*E nods thoughtfully*\n\nI'm tracking that, ${profile.display_name}. Right now I'm seeing some interesting movement on BTC — but let me get my data feeds warmed up. In the meantime, ask me anything about the markets, your portfolio, or what I'm seeing on-chain.\n\n*Note: Claude API key not configured. Set ANTHROPIC_API_KEY for full AI responses.*`;
    }

    // Save E's response
    await db.saveMessage(activeConversationId, 'assistant', responseContent, tokensUsed);

    const response: EChatResponse = {
      message: responseContent,
      conversation_id: activeConversationId,
      metadata: {
        mode: 'chat',
        experience_level: profile.experience_level,
        tokens_used: tokensUsed,
      },
    };

    res.json({ success: true, data: response });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ success: false, error: 'Failed to process chat message' });
  }
});

// ─── Profile ────────────────────────────────────────────────────────────────

/** GET /profile/:userId — Get user profile */
router.get('/profile/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const profile = await db.getProfile(userId);

    if (!profile) {
      res.status(404).json({ success: false, error: 'Profile not found' });
      return;
    }

    res.json({ success: true, data: profile });
  } catch (err) {
    console.error('Failed to fetch profile:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

/** PUT /profile/:userId — Update user profile */
router.put('/profile/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const profile = await db.upsertProfile(userId, req.body);
    res.json({ success: true, data: profile });
  } catch (err) {
    console.error('Failed to update profile:', err);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

// ─── Subscription / Trial ───────────────────────────────────────────────────

/** GET /subscription/:userId — Get user's subscription info */
router.get('/subscription/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const subscription = await db.getSubscriptionInfo(userId);

    if (!subscription) {
      res.json({
        success: true,
        data: {
          status: 'none',
          tier: 'free',
          trial: null,
        },
      });
      return;
    }

    const trialInfo = {
      is_trialing: subscription.status === 'trialing',
      trial_ends_at: subscription.trial_ends_at,
      days_remaining: subscription.trial_ends_at
        ? Math.max(0, Math.floor(
            (new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          ))
        : null,
    };

    const tierData = Array.isArray(subscription.tiers)
      ? (subscription.tiers as Array<{ slug: string; name: string }>)[0]
      : subscription.tiers as { slug: string; name: string } | undefined;

    res.json({
      success: true,
      data: {
        status: subscription.status,
        tier: tierData?.slug,
        tier_name: tierData?.name,
        trial: trialInfo,
      },
    });
  } catch (err) {
    console.error('Failed to fetch subscription:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch subscription' });
  }
});

export default router;