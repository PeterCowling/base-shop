/**
 * Actor claims signing for Reception → Prime staff requests.
 *
 * Implementation lives in @acme/lib/prime — shared with apps/prime/functions/lib/actor-claims.ts
 * so that both apps use byte-identical HMAC-SHA256 serialization.
 *
 * Reception only signs; it never needs to verify actor claims.
 */
export { signActorClaims } from '@acme/lib/prime';
