// ============================================================================
// Supabase Service — Database operations for user profiles, memory, and tiers
// ============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, OnboardingState, ExperienceLevel } from '../types';

let supabase: SupabaseClient | null = null;

/** Initialize Supabase client */
export function initSupabase(url: string, serviceRoleKey: string): void {
  supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

function ensureClient(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase not initialized. Call initSupabase() with URL and key first.');
  }
  return supabase;
}

/** Export client for direct access */
export function getSupabase(): SupabaseClient {
  return ensureClient();
}

// ─── Profile Operations ─────────────────────────────────────────────────────

/** Get user profile by ID */
export async function getProfile(userId: string): Promise<UserProfile | null> {
  const client = ensureClient();
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    display_name: data.display_name ?? '',
    experience_level: data.experience_level as ExperienceLevel,
    trading_style: data.trading_style,
    trading_goals: data.trading_goals ?? [],
    onboarded: data.onboarded ?? false,
  };
}

/** Create or update user profile */
export async function upsertProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile> {
  const client = ensureClient();
  const { data, error } = await client
    .from('profiles')
    .upsert({
      id: userId,
      ...(profile.display_name !== undefined && { display_name: profile.display_name }),
      ...(profile.experience_level !== undefined && { experience_level: profile.experience_level }),
      ...(profile.trading_style !== undefined && { trading_style: profile.trading_style }),
      ...(profile.trading_goals !== undefined && { trading_goals: profile.trading_goals }),
      ...(profile.onboarded !== undefined && { onboarded: profile.onboarded }),
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to upsert profile: ${error.message}`);
  return {
    id: data.id,
    display_name: data.display_name,
    experience_level: data.experience_level,
    trading_style: data.trading_style,
    trading_goals: data.trading_goals,
    onboarded: data.onboarded,
  };
}

/** Mark user as onboarded */
export async function completeOnboarding(userId: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client
    .from('profiles')
    .update({ onboarded: true })
    .eq('id', userId);

  if (error) throw new Error(`Failed to complete onboarding: ${error.message}`);
}

// ─── E Memory Operations ───────────────────────────────────────────────────

/** Get a specific memory entry for a user */
export async function getMemory(userId: string, key: string): Promise<Record<string, unknown> | null> {
  const client = ensureClient();
  const { data, error } = await client
    .from('e_memory')
    .select('content')
    .eq('user_id', userId)
    .eq('memory_key', key)
    .single();

  if (error || !data) return null;
  return data.content as Record<string, unknown>;
}

/** Save a memory entry for a user (upserts by key) */
export async function setMemory(userId: string, key: string, content: Record<string, unknown>): Promise<void> {
  const client = ensureClient();
  const { error } = await client
    .from('e_memory')
    .upsert({
      user_id: userId,
      memory_key: key,
      content,
    }, { onConflict: 'user_id, memory_key' });

  if (error) throw new Error(`Failed to set memory: ${error.message}`);
}

// ─── Subscription / Trial Operations ───────────────────────────────────────

/** Get user's subscription and trial info */
export async function getSubscriptionInfo(userId: string) {
  const client = ensureClient();
  const { data, error } = await client
    .from('subscriptions')
    .select(`
      status,
      trial_ends_at,
      tier_id,
      tiers!inner(name, slug, price_cents, daily_message_limit)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data;
}

// ─── Conversation Operations ───────────────────────────────────────────────

/** Create a new conversation */
export async function createConversation(userId: string, title?: string) {
  const client = ensureClient();
  const { data, error } = await client
    .from('conversations')
    .insert({ user_id: userId, title })
    .select()
    .single();

  if (error) throw new Error(`Failed to create conversation: ${error.message}`);
  return data;
}

/** Save a message to a conversation */
export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  tokensUsed?: number
) {
  const client = ensureClient();
  const { data, error } = await client
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role,
      content,
      tokens_used: tokensUsed,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save message: ${error.message}`);
  return data;
}

/** Get conversation history */
export async function getConversationMessages(conversationId: string) {
  const client = ensureClient();
  const { data, error } = await client
    .from('messages')
    .select('role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to fetch messages: ${error.message}`);
  return data;
}