/**
 * @acme/lib/prime — shared Prime messaging contracts
 *
 * Exports the three cross-app coupling points that must stay in sync between
 * apps/reception and apps/prime/functions:
 *
 * 1. Channel names (`PRIME_CHANNELS`, `PrimeReviewChannel`)
 * 2. Actor claims utilities (`signActorClaims`, `verifyActorClaims`, `ActorClaims`)
 * 3. Broadcast channel constant (`WHOLE_HOSTEL_BROADCAST_CHANNEL_ID`)
 *
 * Usage:
 *   import { PRIME_CHANNELS, PrimeReviewChannel } from '@acme/lib/prime';
 *   import { signActorClaims, verifyActorClaims, ActorClaims } from '@acme/lib/prime';
 *   import { WHOLE_HOSTEL_BROADCAST_CHANNEL_ID } from '@acme/lib/prime';
 */

export { type ActorClaims, signActorClaims, verifyActorClaims } from './actor-claims';
export { PRIME_CHANNELS, type PrimeReviewChannel } from './channels';
export { WHOLE_HOSTEL_BROADCAST_CHANNEL_ID } from './constants';
