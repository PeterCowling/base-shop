/**
 * directMessageChannel.ts
 *
 * Helpers for deterministic direct-message channel IDs.
 * A and B always resolve to the same channel regardless of ordering.
 */

const DIRECT_MESSAGE_CHANNEL_PREFIX = 'dm';

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
