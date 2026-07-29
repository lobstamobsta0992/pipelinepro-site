const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export interface OnboardingStartResponse {
  message: string;
  step: string;
  userId: string;
}

export interface OnboardingMessageResponse {
  message: string;
  step: string;
  isComplete: boolean;
  profile?: any;
}

export interface ChatResponse {
  message: string;
  usage?: {
    daily_count: number;
    daily_limit: number;
  };
}

export async function startOnboarding(): Promise<OnboardingStartResponse> {
  // Generate a random temporary ID for onboarding session if not present
  const userId = `anon_${Math.random().toString(36).substring(2, 11)}`;
  
  const res = await fetch(`${API_BASE_URL}/onboarding/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });
  
  if (!res.ok) throw new Error("Failed to start onboarding");
  const json = await res.json();
  
  return {
    ...json.data,
    userId: userId // Return the ID we used
  };
}

export async function sendOnboardingMessage(
  userId: string,
  message: string,
  depth: string
): Promise<OnboardingMessageResponse> {
  const res = await fetch(`${API_BASE_URL}/onboarding/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, message, depth }),
  });
  
  if (!res.ok) throw new Error("Failed to send onboarding message");
  const json = await res.json();
  
  return {
    message: json.data.message,
    step: json.data.step,
    isComplete: json.data.profile_complete,
    profile: json.data.profile
  };
}

export async function sendChatMessage(
  userId: string,
  message: string,
  depth: string
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, message, depth }),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to send chat message");
  }
  const json = await res.json();
  return json.data;
}

export async function getSubscription(userId: string) {
  const res = await fetch(`${API_BASE_URL}/subscription/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch subscription");
  const json = await res.json();
  return json.data;
}

export async function getProfile(userId: string) {
  const res = await fetch(`${API_BASE_URL}/profile/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch profile");
  const json = await res.json();
  return json.data;
}

// --- Paper Trading ---

export async function getPaperAccount(userId: string) {
  const res = await fetch(`${API_BASE_URL}/paper/account`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) throw new Error("Failed to get paper account");
  const json = await res.json();
  return json.data;
}

export async function executePaperTrade(
  userId: string,
  side: "buy" | "sell",
  asset: string,
  quantity: number,
  slippage: number = 0.01
) {
  const res = await fetch(`${API_BASE_URL}/paper/trade`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      side,
      asset,
      quantity,
      slippage_tolerance: slippage,
    }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to execute paper trade");
  }
  const json = await res.json();
  return json.data;
}

export async function getPaperPortfolio(userId: string) {
  const res = await fetch(`${API_BASE_URL}/paper/portfolio/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch paper portfolio");
  const json = await res.json();
  return json.data;
}

export async function getPaperHistory(userId: string, limit: number = 20) {
  const res = await fetch(`${API_BASE_URL}/paper/history/${userId}?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch paper history");
  const json = await res.json();
  return json.data;
}

export async function getTradableAssets() {
  const res = await fetch(`${API_BASE_URL}/paper/assets`);
  if (!res.ok) throw new Error("Failed to fetch assets");
  const json = await res.json();
  return json.data;
}

// --- Coinbase Advanced Trade (Elite) ---

export async function checkCoinbaseCredentials(userId: string) {
  const res = await fetch(`${API_BASE_URL}/execute/credentials/${userId}/check`);
  if (!res.ok) throw new Error("Failed to check credentials");
  const json = await res.json();
  return json.data;
}

export async function saveCoinbaseCredentials(userId: string, apiKey: string, apiSecret: string) {
  const res = await fetch(`${API_BASE_URL}/execute/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, api_key: apiKey, api_secret: apiSecret }),
  });
  if (!res.ok) throw new Error("Failed to save credentials");
  const json = await res.json();
  return json.data;
}

export async function getCoinbaseBalances(userId: string) {
  const res = await fetch(`${API_BASE_URL}/execute/accounts/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch Coinbase balances");
  const json = await res.json();
  return json.data;
}

export async function executeCoinbaseOrder(
  userId: string,
  productId: string,
  side: "BUY" | "SELL",
  type: "MARKET" | "LIMIT",
  size: number,
  limitPrice?: number,
  mock: boolean = false
) {
  const res = await fetch(`${API_BASE_URL}/execute/order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      product_id: productId,
      side,
      type,
      size,
      limit_price: limitPrice,
      mock
    }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to execute order");
  }
  const json = await res.json();
  return json.data;
}

export async function getCoinbaseOrderStatus(userId: string, orderId: string) {
  const res = await fetch(`${API_BASE_URL}/execute/order/${userId}/${orderId}`);
  if (!res.ok) throw new Error("Failed to fetch order status");
  const json = await res.json();
  return json.data;
}

// --- Market Scanner ---

export async function getScannerOverview() {
  const res = await fetch(`${API_BASE_URL}/scanner/overview`);
  if (!res.ok) throw new Error("Failed to fetch scanner overview");
  const json = await res.json();
  return json.data;
}

export async function getScannerHot() {
  const res = await fetch(`${API_BASE_URL}/scanner/hot`);
  if (!res.ok) throw new Error("Failed to fetch hot assets");
  const json = await res.json();
  return json.data;
}

export async function getScannerDead() {
  const res = await fetch(`${API_BASE_URL}/scanner/dead`);
  if (!res.ok) throw new Error("Failed to fetch dead assets");
  const json = await res.json();
  return json.data;
}

export async function getScannerTrending() {
  const res = await fetch(`${API_BASE_URL}/scanner/trending`);
  if (!res.ok) throw new Error("Failed to fetch trending assets");
  const json = await res.json();
  return json.data;
}

export async function getScannerCoin(coinId: string) {
  const res = await fetch(`${API_BASE_URL}/scanner/coin/${coinId}`);
  if (!res.ok) throw new Error("Failed to fetch coin deep-dive");
  const json = await res.json();
  return json.data;
}

export async function searchScanner(query: string) {
  const res = await fetch(`${API_BASE_URL}/scanner/search?q=${query}`);
  if (!res.ok) throw new Error("Failed to search scanner");
  const json = await res.json();
  return json.data;
}
