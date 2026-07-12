// ============================================================================
// Claude API Service — Handles all communication with Anthropic's Claude
// ============================================================================

import Anthropic from '@anthropic-ai/sdk';
import { ChatMessage, ExperienceLevel } from '../types';

const CLAUDE_MODEL = 'claude-3-5-sonnet-20240620';
const MAX_TOKENS = 1024;

let anthropic: Anthropic | null = null;

/** Initialize the Claude client with API key */
export function initClaude(apiKey: string): void {
  anthropic = new Anthropic({ apiKey });
}

/** Check if Claude client is initialized */
function ensureClient(): Anthropic {
  if (!anthropic) {
    throw new Error(
      'Claude API client not initialized. Call initClaude() with an API key first.'
    );
  }
  return anthropic;
}

export interface ClaudeRequest {
  systemPrompt: string;
  messages: ChatMessage[];
  maxTokens?: number;
  userExperience?: ExperienceLevel;
}

export interface ClaudeResponse {
  content: string;
  tokensUsed: number;
}

/**
 * Send a message to Claude and get E's response.
 * The system prompt carries E's personality and user context.
 */
export async function chatWithClaude(request: ClaudeRequest): Promise<ClaudeResponse> {
  const client = ensureClient();

  const formattedMessages = request.messages.map((msg) => ({
    role: msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
    content: msg.content,
  }));

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: request.maxTokens ?? MAX_TOKENS,
    system: request.systemPrompt,
    messages: formattedMessages,
  });

  // Extract text content from response
  const textContent = response.content
    .filter((block) => block.type === 'text')
    .map((block) => ('text' in block ? block.text : ''))
    .join('');

  return {
    content: textContent,
    tokensUsed: response.usage?.input_tokens ?? 0 + (response.usage?.output_tokens ?? 0),
  };
}

/**
 * Simple ping to verify the API key works
 */
export async function verifyClaudeConnection(): Promise<boolean> {
  try {
    const client = ensureClient();
    await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 10,
      system: 'Respond with just the word: connected',
      messages: [{ role: 'user', content: 'ping' }],
    });
    return true;
  } catch {
    return false;
  }
}