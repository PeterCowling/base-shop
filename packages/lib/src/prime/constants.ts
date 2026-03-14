/**
 * Shared Prime messaging constants.
 *
 * These constants are shared across the reception → prime functions boundary.
 * Values here must remain stable — they are embedded in database records and
 * used as stable identifiers across app boundaries.
 *
 * @module @acme/lib/prime
 */

/**
 * The stable thread ID for the whole-hostel broadcast channel.
 *
 * This value is used by reception's prime-compose route to build telemetry
 * thread IDs and by prime functions to identify the broadcast channel.
 *
 * Value: 'broadcast_whole_hostel'
 * Derivation: buildBroadcastChannelId('whole_hostel') in prime's directMessageChannel.ts
 *
 * IMPORTANT: this value is embedded in database records and must not change.
 */
export const WHOLE_HOSTEL_BROADCAST_CHANNEL_ID = 'broadcast_whole_hostel' as const;
