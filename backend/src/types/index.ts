// ============================================================================
// Enigma Intelligence — Core Types
// ============================================================================

/** User's crypto trading experience level — E adapts technical depth */
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

/** User's trading risk profile */
export type TradingStyle = 'conservative' | 'moderate' | 'aggressive';

/** Role in a conversation */
export type MessageRole = 'user' | 'assistant' | 'system';

/** Onboarding step in the "Meet E" flow */
export type OnboardingStep =
  | 'greeting'
  | 'ask_name'
  | 'ask_experience'
  | 'ask_style'
  | 'ask_goals'
  | 'ask_holdings'
  | 'summary'
  | 'complete';

/** Profile data collected during onboarding */
export interface UserProfile {
  id?: string;
  display_name: string;
  experience_level: ExperienceLevel;
  trading_style?: TradingStyle;
  trading_goals: string[];
  holdings?: string;          // free-text description of portfolio
  onboarded: boolean;
}

/** Onboarding session state */
export interface OnboardingState {
  user_id: string;
  current_step: OnboardingStep;
  profile: Partial<UserProfile>;
  started_at: string;
  updated_at: string;
}

/** Chat message format */
export interface ChatMessage {
  role: MessageRole;
  content: string;
  metadata?: Record<string, unknown>;
}

/** E's response to a chat message */
export interface EChatResponse {
  message: string;
  conversation_id: string;
  metadata: {
    mode: 'onboarding' | 'chat';
    experience_level: ExperienceLevel;
    tokens_used: number;
  };
}

/** System prompt configuration for E */
export interface EPromptConfig {
  personality: string;
  experience_level: ExperienceLevel;
  user_context?: {
    name?: string;
    goals?: string[];
    holdings?: string;
  };
  is_onboarding: boolean;
}

/** API response envelope */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, unknown>;
}

/** Stripe-related types for trial management */
export interface TrialInfo {
  is_trialing: boolean;
  trial_ends_at: string | null;
  days_remaining: number | null;
}