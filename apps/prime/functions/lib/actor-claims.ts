/**
 * HMAC-SHA256 signed actor claims for Prime staff endpoints.
 *
 * Header format: `x-prime-actor-claims: <b64url-payload>.<b64url-sig>`
 *
 * Payload schema: `{ uid: string, roles: string[], iat: number }`
 *   - `uid`: staff Firebase UID
 *   - `roles`: flat array of role strings (e.g. ['owner'] or ['admin'])
 *   - `iat`: issued-at timestamp in seconds (Unix epoch)
 *
 * Clock-skew window: ±5 minutes (300 seconds).
 *
 * Key requirement: `PRIME_ACTOR_CLAIMS_SECRET` MUST be distinct from
 * `PRIME_STAFF_OWNER_GATE_TOKEN`. Using the gateway token as the signing
 * key would allow any gateway-token holder to mint valid claims for any UID.
 *
 * Minimum secret length: 32 characters.
 */

const ALGORITHM = { name: 'HMAC', hash: 'SHA-256' };
const CLOCK_SKEW_SECONDS = 300; // ±5 minutes

export interface ActorClaims {
  uid: string;
  roles: string[];
  iat: number;
}

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
 * Decode base64url string to bytes. Returns null on invalid input.
 */
function fromBase64Url(str: string): Uint8Array | null {
  try {
    const padded = str.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (padded.length % 4)) % 4;
    const b64 = padded + '='.repeat(padLen);
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

/**
 * Import a string secret as a CryptoKey for HMAC-SHA256.
 */
async function importKey(secret: string): Promise<CryptoKey> {
  const keyBytes = new TextEncoder().encode(secret);
  return crypto.subtle.importKey('raw', keyBytes, ALGORITHM, false, ['sign', 'verify']);
}

/**
 * Produce a canonical JSON payload with fixed field order to ensure
 * sign/verify round-trips produce identical byte sequences.
 */
function serializePayload(claims: ActorClaims): string {
  // Fixed field order: uid, roles, iat — canonical for this header contract.
  return JSON.stringify({ uid: claims.uid, roles: claims.roles, iat: claims.iat });
}

/**
 * Sign actor claims with HMAC-SHA256 using the given secret.
 *
 * @param claims - Actor identity: `uid` (required, non-empty), `roles`, optional `iat`
 * @param secret - Signing secret (min 32 chars); MUST differ from PRIME_STAFF_OWNER_GATE_TOKEN
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
  const payload: ActorClaims = { uid: claims.uid, roles: claims.roles, iat };
  const payloadJson = serializePayload(payload);
  const payloadBytes = new TextEncoder().encode(payloadJson);
  const payloadB64 = toBase64Url(payloadBytes);

  const key = await importKey(secret);
  const sigBytes = await crypto.subtle.sign(ALGORITHM, key, payloadBytes);
  const sigB64 = toBase64Url(sigBytes);

  return `${payloadB64}.${sigB64}`;
}

/**
 * Verify an actor claims header and return the extracted claims, or null on failure.
 *
 * Returns null when:
 * - The header is missing or malformed (no `.` separator)
 * - The base64url encoding is invalid
 * - The HMAC signature does not match (wrong secret or tampered payload)
 * - The `iat` timestamp is outside the ±5-minute clock-skew window
 *
 * @param header - Value of `x-prime-actor-claims` header
 * @param secret - Verification secret (must match signing secret)
 * @returns Verified `{ uid, roles }` or `null`
 */
export async function verifyActorClaims(
  header: string | null | undefined,
  secret: string,
): Promise<{ uid: string; roles: string[] } | null> {
  if (!header) return null;

  const dotIndex = header.indexOf('.');
  if (dotIndex === -1) return null;

  const payloadB64 = header.slice(0, dotIndex);
  const sigB64 = header.slice(dotIndex + 1);

  const payloadBytes = fromBase64Url(payloadB64);
  const sigBytes = fromBase64Url(sigB64);
  if (!payloadBytes || !sigBytes) return null;

  // Verify HMAC before parsing payload to avoid parsing untrusted JSON
  const key = await importKey(secret);
  const valid = await crypto.subtle.verify(ALGORITHM, key, sigBytes, payloadBytes);
  if (!valid) return null;

  // Parse payload after signature is confirmed
  let claims: unknown;
  try {
    claims = JSON.parse(new TextDecoder().decode(payloadBytes));
  } catch {
    return null;
  }

  if (
    typeof claims !== 'object' ||
    claims === null ||
    typeof (claims as Record<string, unknown>).uid !== 'string' ||
    !Array.isArray((claims as Record<string, unknown>).roles) ||
    typeof (claims as Record<string, unknown>).iat !== 'number'
  ) {
    return null;
  }

  const { uid, roles, iat } = claims as ActorClaims;

  // Timestamp window check
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - iat) > CLOCK_SKEW_SECONDS) {
    return null;
  }

  return { uid, roles };
}
