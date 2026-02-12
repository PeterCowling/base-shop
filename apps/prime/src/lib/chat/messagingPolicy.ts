/**
 * messagingPolicy.ts
 *
 * Guest-to-guest messaging policy helpers.
 * Enforces mutual consent, block lists, and opt-in requirements.
 *
 * Privacy principles:
 * - Mutual opt-in required for direct messaging
 * - Block lists are bilateral (if A blocks B, neither can message)
 * - Opt-out makes existing threads read-only
 * - Directory visibility requires chatOptIn = true
 */

import type { GuestProfile } from '../../types/guestProfile';

/**
 * Check if sender can send a direct message to recipient.
 * Requires mutual chatOptIn and no blocking in either direction.
 *
 * @param senderProfile - Sender's guest profile
 * @param senderUuid - Sender's UUID
 * @param recipientProfile - Recipient's guest profile
 * @param recipientUuid - Recipient's UUID
 * @returns True if direct messaging is allowed
 */
export function canSendDirectMessage(
  senderProfile: GuestProfile | null | undefined,
  senderUuid: string | null | undefined,
  recipientProfile: GuestProfile | null | undefined,
  recipientUuid: string | null | undefined,
): boolean {
  if (!senderProfile || !recipientProfile || !senderUuid || !recipientUuid) {
    return false;
  }

  // Both must have chatOptIn enabled
  if (!senderProfile.chatOptIn || !recipientProfile.chatOptIn) {
    return false;
  }

  // Check if either has blocked the other
  if (isBlocked(senderProfile, recipientUuid)) {
    return false;
  }

  if (isBlocked(recipientProfile, senderUuid)) {
    return false;
  }

  return true;
}

/**
 * Check if a guest profile should be visible in the directory.
 * Requires chatOptIn and not being blocked by the viewer.
 *
 * @param profile - Profile to check visibility for
 * @param profileUuid - UUID of the profile
 * @param viewerProfile - Viewer's guest profile
 * @param viewerUuid - UUID of the viewer
 * @returns True if profile should appear in directory
 */
export function isVisibleInDirectory(
  profile: GuestProfile | null | undefined,
  profileUuid: string | null | undefined,
  viewerProfile: GuestProfile | null | undefined,
  viewerUuid: string | null | undefined,
): boolean {
  if (!profile || !viewerProfile || !profileUuid || !viewerUuid) {
    return false;
  }

  // Both must have chatOptIn enabled
  if (!profile.chatOptIn || !viewerProfile.chatOptIn) {
    return false;
  }

  // Check bilateral blocking
  if (isBlocked(profile, viewerUuid)) {
    return false;
  }

  if (isBlocked(viewerProfile, profileUuid)) {
    return false;
  }

  return true;
}

/**
 * Check if a messaging thread should be read-only.
 * Thread becomes read-only if either party opts out of chatOptIn.
 *
 * @param senderProfile - Sender's guest profile
 * @param senderUuid - Sender's UUID
 * @param recipientProfile - Recipient's guest profile
 * @param recipientUuid - Recipient's UUID
 * @returns True if thread should be read-only
 */
export function isThreadReadOnly(
  senderProfile: GuestProfile | null | undefined,
  senderUuid: string | null | undefined,
  recipientProfile: GuestProfile | null | undefined,
  recipientUuid: string | null | undefined,
): boolean {
  // If we can send messages, thread is not read-only
  return !canSendDirectMessage(senderProfile, senderUuid, recipientProfile, recipientUuid);
}

/**
 * Check if a profile has blocked a specific user.
 *
 * @param profile - Profile to check
 * @param targetUuid - UUID of potential blocked user
 * @returns True if targetUuid is in profile's block list
 */
export function isBlocked(
  profile: GuestProfile | null | undefined,
  targetUuid: string | null | undefined,
): boolean {
  if (!profile || !targetUuid) {
    return false;
  }

  return profile.blockedUsers.includes(targetUuid);
}

/**
 * Add a user to the block list.
 *
 * @param currentBlockedUsers - Current blocked users array
 * @param targetUuid - UUID to block
 * @returns Updated block list
 */
export function addBlockedUser(
  currentBlockedUsers: string[],
  targetUuid: string,
): string[] {
  if (currentBlockedUsers.includes(targetUuid)) {
    return currentBlockedUsers;
  }

  return [...currentBlockedUsers, targetUuid];
}

/**
 * Remove a user from the block list.
 *
 * @param currentBlockedUsers - Current blocked users array
 * @param targetUuid - UUID to unblock
 * @returns Updated block list
 */
export function removeBlockedUser(
  currentBlockedUsers: string[],
  targetUuid: string,
): string[] {
  return currentBlockedUsers.filter((uuid) => uuid !== targetUuid);
}
