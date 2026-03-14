/**
 * HMAC-SHA256 actor claims for Prime staff endpoints.
 *
 * Implementation lives in @acme/lib/prime — shared with apps/reception so that
 * both apps use byte-identical HMAC-SHA256 serialization for sign/verify round-trips.
 *
 * Header format: `x-prime-actor-claims: <b64url-payload>.<b64url-sig>`
 * Payload schema: `{ uid: string, roles: string[], iat: number }` (fixed field order)
 * Clock-skew window: ±5 minutes (300 seconds).
 *
 * Key requirement: `PRIME_ACTOR_CLAIMS_SECRET` MUST be distinct from
 * `PRIME_STAFF_OWNER_GATE_TOKEN`. Using the gateway token as the signing
 * key would allow any gateway-token holder to mint valid claims for any UID.
 *
 * Minimum secret length: 32 characters.
 */
export { type ActorClaims,signActorClaims, verifyActorClaims } from '@acme/lib/prime';
