/**
 * chatFeatureFlags.ts
 *
 * Feature flag system for chat functionality.
 * Controls visibility and availability of chat features in production.
 *
 * Strategy:
 * - All chat features OFF by default in production for safety
 * - Can be enabled via environment variables or development overrides
 * - Hierarchical flags: directMessaging requires chat to be enabled
 *
 * Usage:
 * - Check flags before rendering chat UI components
 * - Disable send/report actions when flags are off
 * - Display appropriate messaging when features are disabled
 */

/**
 * Chat feature flags configuration.
 */
export interface ChatFeatureFlags {
  /** Enable group chat functionality */
  chatEnabled: boolean;
  /** Enable direct messaging between guests */
  directMessagingEnabled: boolean;
}

/**
 * Default feature flags (production-safe defaults).
 * All features OFF until controls are verified.
 */
export const DEFAULT_FLAGS: ChatFeatureFlags = {
  chatEnabled: false,
  directMessagingEnabled: false,
};

/**
 * Get default feature flags.
 * Returns production-safe defaults with all features disabled.
 *
 * @returns Default feature flags
 */
export function getDefaultFlags(): ChatFeatureFlags {
  return { ...DEFAULT_FLAGS };
}

/**
 * Check if chat is enabled.
 *
 * @param flags - Feature flags to check
 * @returns True if chat is enabled
 */
export function isChatEnabled(flags: ChatFeatureFlags): boolean {
  return flags.chatEnabled;
}

/**
 * Check if direct messaging is enabled.
 * Direct messaging requires chat to be enabled as a prerequisite.
 *
 * @param flags - Feature flags to check
 * @returns True if direct messaging is enabled
 */
export function isDirectMessagingEnabled(flags: ChatFeatureFlags): boolean {
  return flags.chatEnabled && flags.directMessagingEnabled;
}

/**
 * Get feature flags from environment variables.
 * Falls back to defaults if not configured.
 *
 * Environment variables:
 * - NEXT_PUBLIC_CHAT_ENABLED=true - Enable group chat
 * - NEXT_PUBLIC_DIRECT_MESSAGING_ENABLED=true - Enable direct messaging
 *
 * @returns Feature flags from environment or defaults
 */
export function getFlagsFromEnvironment(): ChatFeatureFlags {
  if (typeof window === 'undefined') {
    // Server-side: use defaults
    return getDefaultFlags();
  }

  // Client-side: check environment variables
  const chatEnabled = process.env.NEXT_PUBLIC_CHAT_ENABLED === 'true';
  const directMessagingEnabled =
    process.env.NEXT_PUBLIC_DIRECT_MESSAGING_ENABLED === 'true';

  return {
    chatEnabled,
    directMessagingEnabled,
  };
}

/**
 * Get feature flags with development overrides.
 * Allows local development to enable features via localStorage.
 *
 * localStorage overrides (development only):
 * - localStorage.setItem('dev:chatEnabled', 'true')
 * - localStorage.setItem('dev:directMessagingEnabled', 'true')
 *
 * @returns Feature flags with development overrides applied
 */
export function getFlagsWithDevOverrides(): ChatFeatureFlags {
  const baseFlags = getFlagsFromEnvironment();

  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    // Server-side or production: no overrides
    return baseFlags;
  }

  // Development: check localStorage overrides
  try {
    const chatOverride = localStorage.getItem('dev:chatEnabled');
    const dmOverride = localStorage.getItem('dev:directMessagingEnabled');

    return {
      chatEnabled: chatOverride === 'true' ? true : baseFlags.chatEnabled,
      directMessagingEnabled:
        dmOverride === 'true' ? true : baseFlags.directMessagingEnabled,
    };
  } catch {
    // localStorage not available or error - return base flags
    return baseFlags;
  }
}
