/**
 * messagingPolicy.test.ts
 *
 * Unit tests for messaging policy helpers.
 * Tests mutual consent, blocking, and visibility rules.
 */

import type { GuestProfile } from '../../../types/guestProfile';
import {
  addBlockedUser,
  canSendDirectMessage,
  isBlocked,
  isThreadReadOnly,
  isVisibleInDirectory,
  removeBlockedUser,
} from '../messagingPolicy';

describe('messagingPolicy', () => {
  const createProfile = (overrides: Partial<GuestProfile> = {}): GuestProfile => ({
    bookingId: 'booking_123',
    profileStatus: 'complete',
    intent: 'social',
    interests: [],
    stayGoals: [],
    pace: 'active',
    socialOptIn: true,
    chatOptIn: true,
    blockedUsers: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  });

  describe('canSendDirectMessage', () => {
    it('returns true for mutually opted-in users', () => {
      const sender = createProfile({ chatOptIn: true });
      const recipient = createProfile({ chatOptIn: true });

      expect(canSendDirectMessage(sender, 'uuid-1', recipient, 'uuid-2')).toBe(true);
    });

    it('returns false if sender has chatOptIn disabled', () => {
      const sender = createProfile({ chatOptIn: false });
      const recipient = createProfile({ chatOptIn: true });

      expect(canSendDirectMessage(sender, 'uuid-1', recipient, 'uuid-2')).toBe(false);
    });

    it('returns false if recipient has chatOptIn disabled', () => {
      const sender = createProfile({ chatOptIn: true });
      const recipient = createProfile({ chatOptIn: false });

      expect(canSendDirectMessage(sender, 'uuid-1', recipient, 'uuid-2')).toBe(false);
    });

    it('returns false if sender blocked recipient', () => {
      const sender = createProfile({ chatOptIn: true, blockedUsers: ['uuid-2'] });
      const recipient = createProfile({ chatOptIn: true });

      expect(canSendDirectMessage(sender, 'uuid-1', recipient, 'uuid-2')).toBe(false);
    });

    it('returns false if recipient blocked sender', () => {
      const sender = createProfile({ chatOptIn: true });
      const recipient = createProfile({ chatOptIn: true, blockedUsers: ['uuid-1'] });

      expect(canSendDirectMessage(sender, 'uuid-1', recipient, 'uuid-2')).toBe(false);
    });

    it('returns false if sender profile is null', () => {
      const recipient = createProfile({ chatOptIn: true });

      expect(canSendDirectMessage(null, 'uuid-1', recipient, 'uuid-2')).toBe(false);
    });

    it('returns false if recipient profile is null', () => {
      const sender = createProfile({ chatOptIn: true });

      expect(canSendDirectMessage(sender, 'uuid-1', null, 'uuid-2')).toBe(false);
    });

    it('returns false if sender UUID is null', () => {
      const sender = createProfile({ chatOptIn: true });
      const recipient = createProfile({ chatOptIn: true });

      expect(canSendDirectMessage(sender, null, recipient, 'uuid-2')).toBe(false);
    });

    it('returns false if recipient UUID is null', () => {
      const sender = createProfile({ chatOptIn: true });
      const recipient = createProfile({ chatOptIn: true });

      expect(canSendDirectMessage(sender, 'uuid-1', recipient, null)).toBe(false);
    });
  });

  describe('isVisibleInDirectory', () => {
    it('returns true for mutually opted-in users', () => {
      const profile = createProfile({ chatOptIn: true });
      const viewer = createProfile({ chatOptIn: true });

      expect(isVisibleInDirectory(profile, 'uuid-1', viewer, 'uuid-2')).toBe(true);
    });

    it('returns false if profile has chatOptIn disabled', () => {
      const profile = createProfile({ chatOptIn: false });
      const viewer = createProfile({ chatOptIn: true });

      expect(isVisibleInDirectory(profile, 'uuid-1', viewer, 'uuid-2')).toBe(false);
    });

    it('returns false if viewer has chatOptIn disabled', () => {
      const profile = createProfile({ chatOptIn: true });
      const viewer = createProfile({ chatOptIn: false });

      expect(isVisibleInDirectory(profile, 'uuid-1', viewer, 'uuid-2')).toBe(false);
    });

    it('returns false if profile blocked viewer', () => {
      const profile = createProfile({ chatOptIn: true, blockedUsers: ['uuid-2'] });
      const viewer = createProfile({ chatOptIn: true });

      expect(isVisibleInDirectory(profile, 'uuid-1', viewer, 'uuid-2')).toBe(false);
    });

    it('returns false if viewer blocked profile', () => {
      const profile = createProfile({ chatOptIn: true });
      const viewer = createProfile({ chatOptIn: true, blockedUsers: ['uuid-1'] });

      expect(isVisibleInDirectory(profile, 'uuid-1', viewer, 'uuid-2')).toBe(false);
    });

    it('returns false if profile is null', () => {
      const viewer = createProfile({ chatOptIn: true });

      expect(isVisibleInDirectory(null, 'uuid-1', viewer, 'uuid-2')).toBe(false);
    });

    it('returns false if viewer is null', () => {
      const profile = createProfile({ chatOptIn: true });

      expect(isVisibleInDirectory(profile, 'uuid-1', null, 'uuid-2')).toBe(false);
    });
  });

  describe('isThreadReadOnly', () => {
    it('returns false when messaging is allowed', () => {
      const sender = createProfile({ chatOptIn: true });
      const recipient = createProfile({ chatOptIn: true });

      expect(isThreadReadOnly(sender, 'uuid-1', recipient, 'uuid-2')).toBe(false);
    });

    it('returns true when sender opts out', () => {
      const sender = createProfile({ chatOptIn: false });
      const recipient = createProfile({ chatOptIn: true });

      expect(isThreadReadOnly(sender, 'uuid-1', recipient, 'uuid-2')).toBe(true);
    });

    it('returns true when recipient opts out', () => {
      const sender = createProfile({ chatOptIn: true });
      const recipient = createProfile({ chatOptIn: false });

      expect(isThreadReadOnly(sender, 'uuid-1', recipient, 'uuid-2')).toBe(true);
    });

    it('returns true when either user blocks the other', () => {
      const sender = createProfile({ chatOptIn: true, blockedUsers: ['uuid-2'] });
      const recipient = createProfile({ chatOptIn: true });

      expect(isThreadReadOnly(sender, 'uuid-1', recipient, 'uuid-2')).toBe(true);
    });
  });

  describe('isBlocked', () => {
    it('returns true when targetUuid is in blockedUsers', () => {
      const profile = createProfile({ blockedUsers: ['uuid-2', 'uuid-3'] });

      expect(isBlocked(profile, 'uuid-2')).toBe(true);
    });

    it('returns false when targetUuid is not in blockedUsers', () => {
      const profile = createProfile({ blockedUsers: ['uuid-2'] });

      expect(isBlocked(profile, 'uuid-4')).toBe(false);
    });

    it('returns false when blockedUsers is empty', () => {
      const profile = createProfile({ blockedUsers: [] });

      expect(isBlocked(profile, 'uuid-2')).toBe(false);
    });

    it('returns false when profile is null', () => {
      expect(isBlocked(null, 'uuid-2')).toBe(false);
    });

    it('returns false when targetUuid is null', () => {
      const profile = createProfile({ blockedUsers: ['uuid-2'] });

      expect(isBlocked(profile, null)).toBe(false);
    });
  });

  describe('addBlockedUser', () => {
    it('adds new user to empty block list', () => {
      const result = addBlockedUser([], 'uuid-2');

      expect(result).toEqual(['uuid-2']);
    });

    it('adds new user to existing block list', () => {
      const result = addBlockedUser(['uuid-1'], 'uuid-2');

      expect(result).toEqual(['uuid-1', 'uuid-2']);
    });

    it('does not add duplicate user', () => {
      const result = addBlockedUser(['uuid-1', 'uuid-2'], 'uuid-2');

      expect(result).toEqual(['uuid-1', 'uuid-2']);
    });

    it('does not mutate original array', () => {
      const original = ['uuid-1'];
      const result = addBlockedUser(original, 'uuid-2');

      expect(original).toEqual(['uuid-1']);
      expect(result).toEqual(['uuid-1', 'uuid-2']);
    });
  });

  describe('removeBlockedUser', () => {
    it('removes user from block list', () => {
      const result = removeBlockedUser(['uuid-1', 'uuid-2'], 'uuid-2');

      expect(result).toEqual(['uuid-1']);
    });

    it('returns empty array when removing last user', () => {
      const result = removeBlockedUser(['uuid-2'], 'uuid-2');

      expect(result).toEqual([]);
    });

    it('returns same array when user not in list', () => {
      const result = removeBlockedUser(['uuid-1', 'uuid-2'], 'uuid-3');

      expect(result).toEqual(['uuid-1', 'uuid-2']);
    });

    it('does not mutate original array', () => {
      const original = ['uuid-1', 'uuid-2'];
      const result = removeBlockedUser(original, 'uuid-2');

      expect(original).toEqual(['uuid-1', 'uuid-2']);
      expect(result).toEqual(['uuid-1']);
    });
  });
});
