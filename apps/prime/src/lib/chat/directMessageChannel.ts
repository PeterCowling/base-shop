/**
 * directMessageChannel.ts
 *
 * Helpers for deterministic direct-message channel IDs.
 * A and B always resolve to the same channel regardless of ordering.
 */

const DIRECT_MESSAGE_CHANNEL_PREFIX = 'dm';
const STAFF_THREAD_CHANNEL_PREFIX = 'staff_thread';
const BROADCAST_CHANNEL_PREFIX = 'broadcast';

export type PrimeMessageChannelKind = 'direct' | 'staff_thread' | 'broadcast';

/**
 * Build a stable direct-message channel id for two guests.
 */
export function buildDirectMessageChannelId(
  firstGuestUuid: string,
  secondGuestUuid: string,
): string {
  if (!firstGuestUuid || !secondGuestUuid) {
    throw new Error('Both guest UUIDs are required to build a direct-message channel ID.');
  }

  const [left, right] = [firstGuestUuid, secondGuestUuid].sort((a, b) =>
    a.localeCompare(b),
  );

  return DIRECT_MESSAGE_CHANNEL_PREFIX + '_' + left + '_' + right;
}

export function buildStaffThreadChannelId(threadId: string): string {
  if (!threadId) {
    throw new Error('threadId is required to build a staff-thread channel ID.');
  }

  return `${STAFF_THREAD_CHANNEL_PREFIX}_${threadId}`;
}

export function buildBroadcastChannelId(audienceKey: string): string {
  if (!audienceKey) {
    throw new Error('audienceKey is required to build a broadcast channel ID.');
  }

  return `${BROADCAST_CHANNEL_PREFIX}_${audienceKey}`;
}

/**
 * Check whether a channel id is in direct-message format.
 */
export function isDirectMessageChannelId(
  channelId: string | null | undefined,
): boolean {
  if (!channelId) {
    return false;
  }

  return channelId.startsWith(DIRECT_MESSAGE_CHANNEL_PREFIX + '_');
}

export function isStaffThreadChannelId(
  channelId: string | null | undefined,
): boolean {
  if (!channelId) {
    return false;
  }

  return channelId.startsWith(STAFF_THREAD_CHANNEL_PREFIX + '_');
}

export function isBroadcastChannelId(
  channelId: string | null | undefined,
): boolean {
  if (!channelId) {
    return false;
  }

  return channelId.startsWith(BROADCAST_CHANNEL_PREFIX + '_');
}

export function getPrimeMessageChannelKind(
  channelId: string | null | undefined,
): PrimeMessageChannelKind | null {
  if (isDirectMessageChannelId(channelId)) {
    return 'direct';
  }
  if (isStaffThreadChannelId(channelId)) {
    return 'staff_thread';
  }
  if (isBroadcastChannelId(channelId)) {
    return 'broadcast';
  }

  return null;
}

/**
 * The canonical whole-hostel broadcast channel ID.
 * Used as a fixed thread ID for the `broadcast_whole_hostel` Prime messaging channel.
 * This constant must remain stable — it is both the RTDB channel key and the D1 thread ID.
 *
 * Computation: buildBroadcastChannelId('whole_hostel') → `broadcast_whole_hostel`
 * The result is fully deterministic: it is pure string concatenation of
 * BROADCAST_CHANNEL_PREFIX + '_' + audienceKey, with no random or timestamp
 * component. The value 'broadcast_whole_hostel' is stable across all environments
 * and process restarts. Do not change the audienceKey argument without a coordinated
 * RTDB + D1 migration, as existing records are keyed on this value.
 */
export const WHOLE_HOSTEL_BROADCAST_CHANNEL_ID: string = buildBroadcastChannelId('whole_hostel');

/**
 * Check whether a direct-message channel ID includes a specific guest UUID.
 */
export function directMessageChannelIncludesGuest(
  channelId: string | null | undefined,
  guestUuid: string | null | undefined,
): boolean {
  if (!channelId || !guestUuid || !isDirectMessageChannelId(channelId)) {
    return false;
  }

  return channelId.startsWith(`dm_${guestUuid}_`) || channelId.endsWith(`_${guestUuid}`);
}
