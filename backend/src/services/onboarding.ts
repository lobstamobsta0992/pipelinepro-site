// ============================================================================
// Onboarding Service — "Meet E" guided conversation flow
// ============================================================================
// Orchestrates the multi-step onboarding where E gets to know the user
// through natural conversation, stores profile data, and activates their trial.
// ============================================================================

import { OnboardingState, OnboardingStep, ChatMessage, UserProfile, ExperienceLevel } from '../types';
import { buildSystemPrompt, ONBOARDING_PROMPTS } from '../prompts/e-personality';
import { chatWithClaude } from './claude';
import * as db from './supabase';

/**
 * Determine the next step in the onboarding flow based on what we know.
 */
function getNextStep(state: Partial<UserProfile>): OnboardingStep {
  if (!state.display_name) return 'ask_name';
  if (!state.experience_level) return 'ask_experience';
  if (!state.trading_style) return 'ask_style';
  if (!state.trading_goals?.length) return 'ask_goals';
  if (!state.holdings) return 'ask_holdings';
  return 'summary';
}

/**
 * Extract user profile data from natural conversation.
 * E uses Claude to parse structured data from the user's responses,
 * so we keep it feeling like a chat rather than a form.
 */
function extractProfileFromMessages(
  messages: ChatMessage[],
  currentState: Partial<UserProfile>
): Partial<UserProfile> {
  const allUserText = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content.toLowerCase())
    .join('\n');

  const profile: Partial<UserProfile> = { ...currentState };

  // If we don't have a name yet, look for it (first meaningful answer after greeting)
  if (!profile.display_name) {
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length > 0) {
      const firstResponse = userMessages[0].content.trim();
      // If the user said more than a simple word, use first part as name
      if (firstResponse.length > 0 && firstResponse.length < 100) {
        profile.display_name = firstResponse.split(/[.,!?]/)[0].trim();
      }
    }
  }

  // Detect experience level from keywords
  if (!profile.experience_level) {
    const beginner = /beginner|new|starting|just started|learning|first time|noob/i;
    const advanced = /advanced|expert|pro|seasoned|veteran|been trading|deep|on-chain|defi/i;

    if (advanced.test(allUserText)) profile.experience_level = 'advanced';
    else if (beginner.test(allUserText)) profile.experience_level = 'beginner';
    else if (allUserText.includes('intermediate') || allUserText.includes('moderate')) profile.experience_level = 'intermediate';
  }

  // Detect trading style
  if (!profile.trading_style) {
    if (/conservative|safe|slow|steady|dca|hold|long.?term/i.test(allUserText)) {
      profile.trading_style = 'conservative';
    } else if (/aggressive|active|freq|scalp|short|leverage|degen/i.test(allUserText)) {
      profile.trading_style = 'aggressive';
    } else if (/moderate|mix|balance|both|hybrid/i.test(allUserText)) {
      profile.trading_style = 'moderate';
    }
  }

  // Detect goals from text
  if (!profile.trading_goals?.length) {
    const goals: string[] = [];
    if (/grow|long.?term|wealth|financial.?freedom|retire/i.test(allUserText)) goals.push('long-term growth');
    if (/learn|understand|fundamental|education/i.test(allUserText)) goals.push('learn fundamentals');
    if (/trade|active|scalp|swing|short.?term/i.test(allUserText)) goals.push('active trading');
    if (/defi|stak|yield|liquid|farm/i.test(allUserText)) goals.push('DeFi & yield');
    if (/institution|serious|large|capital/i.test(allUserText)) goals.push('capital deployment');
    profile.trading_goals = goals;
  }

  return profile;
}

/**
 * Extract holdings info from user messages.
 */
function extractHoldings(messages: ChatMessage[]): string | undefined {
  const userMessages = messages.filter(m => m.role === 'user');
  if (userMessages.length === 0) return undefined;

  const lastMessage = userMessages[userMessages.length - 1].content;
  // If it's not a simple greeting, it could be holdings info
  const greetingWords = ['hi', 'hey', 'hello', 'what\'s up', 'yo', 'sup', 'howdy'];
  const isGreeting = greetingWords.some(g => lastMessage.toLowerCase().trim() === g || lastMessage.toLowerCase().startsWith(g));

  if (!isGreeting && lastMessage.length > 10) {
    return lastMessage;
  }
  return undefined;
}

/**
 * Get the appropriate prompt for the current onboarding step.
 */
function getStepPrompt(step: OnboardingStep, userName?: string): string {
  switch (step) {
    case 'ask_name':
      return `Nice to meet you! What should I call you?`;
    case 'ask_experience':
      return `Great question. So how deep are you in crypto? Are you a beginner just starting out, intermediate with some experience, or advanced?`;
    case 'ask_style':
      return `What's your trading style? Conservative (slow and steady), moderate (balanced), or aggressive (active trading)?`;
    case 'ask_goals':
      return `What are your main goals in crypto? Long-term growth, learning, active trading, or exploring DeFi?`;
    case 'ask_holdings':
      return `What's in your portfolio right now? Any BTC, ETH, or other coins you're holding or watching?`;
    case 'summary':
      return `Awesome! Here's what I've got for you...`;
    case 'complete':
      return `You're all set! Your 5-day Elite trial is active and I'm watching the markets for you.`;
    default:
      return `Tell me more about yourself!`;
  }
}

/**
 * Process a message during onboarding and return E's response.
 * This is the main handler for the "Meet E" flow.
 */
export async function processOnboardingMessage(
  userId: string,
  message: string,
  currentState: OnboardingState
): Promise<{
  response: string;
  updatedState: OnboardingState;
  profileComplete: boolean;
}> {
  const profile = currentState.profile;
  const messages: ChatMessage[] = [
    { role: 'user', content: message },
  ];

  // Extract any profile data from this message
  const extractedProfile = extractProfileFromMessages(messages, profile);

  // Extract holdings if we're at that step
  if (currentState.current_step === 'ask_holdings') {
    const holdings = extractHoldings(messages);
    if (holdings) extractedProfile.holdings = holdings;
  }

  // Determine next step
  const nextStep = getNextStep(extractedProfile);

  // Build E's system prompt for this stage
  const systemPrompt = buildSystemPrompt({
    name: extractedProfile.display_name,
    experience_level: extractedProfile.experience_level || 'beginner',
    goals: extractedProfile.trading_goals,
    holdings: extractedProfile.holdings,
    is_onboarding: true,
  });

  // Get the step prompt to guide E
  const stepPrompt = getStepPrompt(nextStep, extractedProfile.display_name);
  const assistantMessage = `${stepPrompt}`;

  // For now, we'll use the step prompt directly (Claude integration is ready but
  // requires an API key to be set)
  let responseContent = assistantMessage;

  // If Claude API key is configured, use the full AI response
  try {
    const claudeResponse = await chatWithClaude({
      systemPrompt,
      messages: [
        ...(currentState.current_step !== 'greeting'
          ? [{ role: 'user' as const, content: `Current step: ${currentState.current_step}. User said: "${message}"` }]
          : []),
        { role: 'user' as const, content: message },
      ],
    });
    responseContent = claudeResponse.content;
  } catch {
    // Claude not configured — use step prompts. This is fine for development.
  }

  const updatedState: OnboardingState = {
    ...currentState,
    current_step: nextStep,
    profile: extractedProfile,
    updated_at: new Date().toISOString(),
  };

  // If onboarding is complete, save everything
  const profileComplete = nextStep === 'complete' || nextStep === 'summary';

  if (profileComplete) {
    // Save profile to Supabase
    try {
      await db.upsertProfile(userId, extractedProfile as Partial<UserProfile>);
      await db.completeOnboarding(userId);

      // Save memory of initial meeting
      await db.setMemory(userId, 'onboarding_summary', {
        name: extractedProfile.display_name,
        experience_level: extractedProfile.experience_level,
        trading_style: extractedProfile.trading_style,
        goals: extractedProfile.trading_goals,
        holdings: extractedProfile.holdings,
        onboarded_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to save onboarding data:', err);
    }
  }

  return {
    response: responseContent,
    updatedState,
    profileComplete,
  };
}

/**
 * Start a new onboarding session for a user.
 */
export function createOnboardingState(userId: string): OnboardingState {
  return {
    user_id: userId,
    current_step: 'greeting',
    profile: {},
    started_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Get the opening greeting from E.
 */
export function getWelcomeMessage(): string {
  return `Hey! I'm **E** — your crypto trading partner and market intelligence. I've got my eyes on the cycles, the whales, and the charts 24/7.

Before we dive into the deep end, let's get acquainted. What's your name?`;
}