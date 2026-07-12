// ============================================================================
// Stripe Service — Trial management and subscription handling
// ============================================================================

import Stripe from 'stripe';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StripeClient = any;

let stripe: StripeClient | null = null;

/** Initialize Stripe with secret key */
export function initStripe(secretKey: string): void {
  stripe = new Stripe(secretKey);
}

function ensureStripe(): StripeClient {
  if (!stripe) {
    throw new Error('Stripe not initialized. Call initStripe() with a secret key first.');
  }
  return stripe;
}

export interface CreateTrialParams {
  email: string;
  userId: string;
}

/**
 * Creates a Stripe customer with a 5-day trial.
 * The actual subscription management is handled by Supabase/webhooks,
 * but this sets up the Stripe-side customer record.
 */
export async function createTrialCustomer(params: CreateTrialParams) {
  const client = ensureStripe();

  const customer = await client.customers.create({
    email: params.email,
    metadata: {
      supabase_user_id: params.userId,
      trial_type: 'elite_5day',
    },
  });

  return {
    customerId: customer.id,
    trialEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Verify the Stripe API key is live/valid
 */
export async function verifyStripeConnection(): Promise<{ valid: boolean; mode: 'live' | 'test' | 'invalid' }> {
  try {
    const client = ensureStripe();
    const balance = await client.balance.retrieve();
    return {
      valid: true,
      mode: balance.livemode ? 'live' : 'test',
    };
  } catch {
    return { valid: false, mode: 'invalid' };
  }
}