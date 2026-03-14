/**
 * HMAC-SHA256 actor claims signing for Reception → Prime staff requests.
 *
 * This is the Reception-side signing half of the actor claims contract.
 * The corresponding verification half lives in:
 *   apps/prime/functions/lib/actor-claims.ts
 *
 * Both implementations use identical HMAC-SHA256 logic and payload serialization
 * so that sign (Reception) / verify (Prime) round-trips always match.
 *
 * Header format: `x-prime-actor-claims: <b64url-payload>.<b64url-sig>`
 *
 * Payload schema: `{ uid: string, roles: string[], iat: number }`
 *   - Fixed field order for canonical serialization
 *
 * Key requirement: `PRIME_ACTOR_CLAIMS_SECRET` MUST be distinct from
 * `RECEPTION_PRIME_ACCESS_TOKEN`. Using the gateway token as the signing
 * key would allow any gateway-token holder to mint valid claims for any UID.
 */

const ALGORITHM = { name: 'HMAC', hash: 'SHA-256' };

/**
 * Encode bytes as base64url (no padding).
 */
function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (let i = 0; i < arr.byteLength; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Sign actor claims with HMAC-SHA256 using the given secret.
 *
 * @param claims - Actor identity: `uid` (required, non-empty), `roles`, optional `iat`
 * @param secret - Signing secret (min 32 chars); MUST differ from RECEPTION_PRIME_ACCESS_TOKEN
 * @returns `<b64url-payload>.<b64url-sig>` header value
 */
export async function signActorClaims(
  claims: { uid: string; roles: string[]; iat?: number },
  secret: string,
): Promise<string> {
  if (!claims.uid) {
    throw new Error('signActorClaims: uid must be a non-empty string');
  }
  const iat = claims.iat ?? Math.floor(Date.now() / 1000);
  // Fixed field order: uid, roles, iat — canonical for this header contract.
  const payloadJson = JSON.stringify({ uid: claims.uid, roles: claims.roles, iat });
  const payloadBytes = new TextEncoder().encode(payloadJson);
  const payloadB64 = toBase64Url(payloadBytes);

  const keyBytes = new TextEncoder().encode(secret);
  const key = await crypto.subtle.importKey('raw', keyBytes, ALGORITHM, false, ['sign']);
  const sigBytes = await crypto.subtle.sign(ALGORITHM, key, payloadBytes);
  const sigB64 = toBase64Url(sigBytes);

  return `${payloadB64}.${sigB64}`;
}
