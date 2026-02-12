/**
 * Tests for chatFeatureFlags.ts
 * TC-04: Feature flag control
 */

import {
  type ChatFeatureFlags,
  DEFAULT_FLAGS,
  getDefaultFlags,
  isChatEnabled,
  isDirectMessagingEnabled,
} from '../chatFeatureFlags';

describe('ChatFeatureFlags', () => {
  describe('TC-04: Feature flag control', () => {
    it('returns false when chat flag is disabled', () => {
      const flags: ChatFeatureFlags = {
        chatEnabled: false,
        directMessagingEnabled: false,
      };
      expect(isChatEnabled(flags)).toBe(false);
    });

    it('returns true when chat flag is enabled', () => {
      const flags: ChatFeatureFlags = {
        chatEnabled: true,
        directMessagingEnabled: false,
      };
      expect(isChatEnabled(flags)).toBe(true);
    });

    it('returns false when direct messaging flag is disabled', () => {
      const flags: ChatFeatureFlags = {
        chatEnabled: true,
        directMessagingEnabled: false,
      };
      expect(isDirectMessagingEnabled(flags)).toBe(false);
    });

    it('returns true when direct messaging flag is enabled', () => {
      const flags: ChatFeatureFlags = {
        chatEnabled: true,
        directMessagingEnabled: true,
      };
      expect(isDirectMessagingEnabled(flags)).toBe(true);
    });

    it('direct messaging requires chat to be enabled', () => {
      const flags: ChatFeatureFlags = {
        chatEnabled: false,
        directMessagingEnabled: true,
      };
      // Direct messaging should be disabled if chat is disabled
      expect(isDirectMessagingEnabled(flags)).toBe(false);
    });
  });

  describe('getDefaultFlags', () => {
    it('returns default flags with both features disabled in production', () => {
      const flags = getDefaultFlags();
      expect(flags.chatEnabled).toBe(false);
      expect(flags.directMessagingEnabled).toBe(false);
    });

    it('default flags match DEFAULT_FLAGS constant', () => {
      const flags = getDefaultFlags();
      expect(flags).toEqual(DEFAULT_FLAGS);
    });
  });

  describe('DEFAULT_FLAGS configuration', () => {
    it('has both features disabled by default for production safety', () => {
      expect(DEFAULT_FLAGS.chatEnabled).toBe(false);
      expect(DEFAULT_FLAGS.directMessagingEnabled).toBe(false);
    });
  });
});
