const FIREBASE_CUSTOM_TOKEN_AUDIENCE =
  'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit';
const FIREBASE_CUSTOM_TOKEN_TTL_SECONDS = 60 * 60;

interface FirebaseCustomTokenPayload {
  uid: string;
  claims: Record<string, unknown>;
}

interface FirebaseCustomTokenOptions {
  serviceAccountEmail: string;
  serviceAccountPrivateKey: string;
  nowMs?: number;
}

function normalizePemPrivateKey(privateKey: string): string {
  return privateKey.replace(/\\n/g, '\n').trim();
}

function base64Encode(bytes: Uint8Array): string {
  if (typeof btoa === 'function') {
    let binary = '';
    for (let index = 0; index < bytes.length; index += 1) {
      binary += String.fromCharCode(bytes[index]);
    }
    return btoa(binary);
  }

  const maybeBuffer = (globalThis as { Buffer?: any }).Buffer;
  if (maybeBuffer) {
    return maybeBuffer.from(bytes).toString('base64');
  }

  throw new Error('No base64 encoder available in this runtime');
}

function base64Decode(base64: string): Uint8Array {
  if (typeof atob === 'function') {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  const maybeBuffer = (globalThis as { Buffer?: any }).Buffer;
  if (maybeBuffer) {
    return new Uint8Array(maybeBuffer.from(base64, 'base64'));
  }

  throw new Error('No base64 decoder available in this runtime');
}

function base64UrlEncodeJson(payload: Record<string, unknown>): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  return base64Encode(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlEncodeBytes(bytes: ArrayBuffer): string {
  return base64Encode(new Uint8Array(bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function pemToPkcs8Bytes(privateKeyPem: string): ArrayBuffer {
  const normalizedPem = normalizePemPrivateKey(privateKeyPem);
  const base64 = normalizedPem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '');

  return base64Decode(base64).buffer;
}

async function signRs256(data: string, privateKeyPem: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToPkcs8Bytes(privateKeyPem),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign'],
  );

  const signed = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(data),
  );

  return base64UrlEncodeBytes(signed);
}

/**
 * Creates a Firebase custom token signed with a service account private key.
 * The token can be exchanged client-side via `signInWithCustomToken`.
 */
export async function createFirebaseCustomToken(
  payload: FirebaseCustomTokenPayload,
  options: FirebaseCustomTokenOptions,
): Promise<string> {
  const nowSeconds = Math.floor((options.nowMs ?? Date.now()) / 1000);
  const tokenHeader = {
    alg: 'RS256',
    typ: 'JWT',
  };
  const tokenPayload = {
    iss: options.serviceAccountEmail,
    sub: options.serviceAccountEmail,
    aud: FIREBASE_CUSTOM_TOKEN_AUDIENCE,
    iat: nowSeconds,
    exp: nowSeconds + FIREBASE_CUSTOM_TOKEN_TTL_SECONDS,
    uid: payload.uid,
    claims: payload.claims,
  };

  const encodedHeader = base64UrlEncodeJson(tokenHeader);
  const encodedPayload = base64UrlEncodeJson(tokenPayload);
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = await signRs256(signingInput, options.serviceAccountPrivateKey);
  return `${signingInput}.${signature}`;
}
