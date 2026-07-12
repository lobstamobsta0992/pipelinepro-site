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
