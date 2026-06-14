export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: "month" | "year";
  features: string[];
  tier: "free" | "pro" | "elite";
  trialDays?: number;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "price_free_preview",
    name: "Enigma Free",
    price: 0,
    interval: "month",
    features: [
      "2 Daily Messages with E",
      "Basic Market Sentiment Preview",
      "Delayed Whale Alerts (>$10M)",
    ],
    tier: "free",
  },
  {
    id: "price_pro_monthly",
    name: "Enigma Pro",
    price: 49,
    interval: "month",
    features: [
      "20 Daily Messages with E",
      "Full Cycle Intelligence Panel",
      "Research Tools (Coin Deep Dives)",
      "Real-time Whale Alerts (>$1M)",
      "5-Day Elite Free Trial included",
    ],
    tier: "pro",
    trialDays: 5,
  },
  {
    id: "price_elite_monthly",
    name: "Enigma Elite",
    price: 149,
    interval: "month",
    features: [
      "Unlimited Messages with E (No limits)",
      "Full Market Scanner (200+ Coins)",
      "Coinbase Auto-Trading Engine",
      "Early Signal Access",
      "Elite Whale Alerts (>$500k)",
      "5-Day Elite Free Trial included",
    ],
    tier: "elite",
    trialDays: 5,
  },
];

// Helper skeleton function to trigger standard stripe checkout session creation, to be connected by backend/Stripe webhook
export async function createCheckoutSession(
  priceId: string,
  userEmail: string,
  userId: string
): Promise<{ url: string | null; error?: string }> {
  try {
    console.log(`Creating Stripe Checkout Session for ${priceId} (User: ${userId}, Email: ${userEmail})`);
    
    // In actual implementation, this will call our API endpoint: /api/stripe/checkout
    // which initiates the Stripe API call and returns a session URL.
    
    return {
      url: `/api/stripe/checkout?price_id=${priceId}&user_id=${userId}`,
    };
  } catch (err: any) {
    console.error("Stripe Checkout error:", err);
    return { url: null, error: err.message || "Failed to initiate subscription" };
  }
}
