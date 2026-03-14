/**
 * AES-256-GCM credential encryption for payment-manager.
 *
 * Uses the Web Crypto API (`crypto.subtle`) which is available in both
 * Cloudflare Workers V8 isolates and Node.js 22 (Jest test environment).
 * No `node:crypto` dependency — compatible with CF Workers runtime.
 *
 * Storage format: base64(<12-byte-IV><ciphertext>)
 *   - IV:         bytes [0..11]  (12 bytes, NIST recommended for AES-GCM)
 *   - Ciphertext: bytes [12..]   (plaintext length + 16-byte GCM auth tag)
 *
 * Key format: base64-encoded 32 bytes (256 bits).
 *   Minimum 44 characters when base64-encoded (no padding truncation).
 *   Source: PAYMENT_MANAGER_ENCRYPTION_KEY Worker secret.
 */

const IV_BYTES = 12; // NIST SP 800-38D recommended IV size for AES-GCM
const KEY_BYTES = 32; // AES-256

/**
 * Import a base64-encoded 32-byte key string as a CryptoKey for AES-256-GCM.
 * Throws with a descriptive message if the key is missing or the wrong length.
 *
 * @param base64Key - base64 string produced by `wrangler secret put` or a test fixture.
 */
async function importKeyFromBase64(base64Key: string): Promise<CryptoKey> {
  if (!base64Key || typeof base64Key !== "string") {
    throw new Error(
      "PAYMENT_MANAGER_ENCRYPTION_KEY is required but was not provided", // i18n-exempt -- PM-0003 internal crypto error, not UI copy [ttl=2027-12-31]
    );
  }

  const keyBytes = Buffer.from(base64Key, "base64");
  if (keyBytes.length !== KEY_BYTES) {
    throw new Error(
      `PAYMENT_MANAGER_ENCRYPTION_KEY must decode to exactly 32 bytes for AES-256 (got ${keyBytes.length}). Generate with: openssl rand -base64 32`, // i18n-exempt -- PM-0003 internal crypto error [ttl=2027-12-31]
    );
  }

  return crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false, // non-extractable
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 *
 * A unique 12-byte IV is generated per call — two encryptions of the same
 * plaintext will always produce different ciphertexts (TC-03-03).
 *
 * @param plaintext - The value to encrypt (e.g. a Stripe secret key).
 * @param base64Key - Base64-encoded 32-byte encryption key.
 * @returns Base64 string encoding `<12-byte-IV><ciphertext+16-byte-auth-tag>`.
 */
export async function encrypt(plaintext: string, base64Key: string): Promise<string> {
  const key = await importKeyFromBase64(base64Key);

  const iv = new Uint8Array(IV_BYTES);
  crypto.getRandomValues(iv);

  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

  // Pack IV + ciphertext into a single buffer for storage.
  const combined = new Uint8Array(IV_BYTES + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), IV_BYTES);

  return Buffer.from(combined).toString("base64");
}

/**
 * Decrypt a base64-encoded AES-256-GCM ciphertext produced by `encrypt`.
 *
 * Throws if:
 * - The key is wrong (GCM auth tag verification fails) — TC-03-02
 * - The stored value is truncated / malformed
 * - The key length is invalid
 *
 * Decrypted values are never logged. Callers must not store the return value
 * in logs or error messages.
 *
 * @param storedBase64 - Value returned by a previous `encrypt` call.
 * @param base64Key    - Base64-encoded 32-byte encryption key.
 * @returns Original plaintext string.
 */
export async function decrypt(storedBase64: string, base64Key: string): Promise<string> {
  const key = await importKeyFromBase64(base64Key);

  const stored = Buffer.from(storedBase64, "base64");
  if (stored.length <= IV_BYTES) {
    throw new Error(
      "Stored credential value is too short — it may be corrupt or not encrypted", // i18n-exempt -- PM-0003 internal crypto error [ttl=2027-12-31]
    );
  }

  const iv = stored.slice(0, IV_BYTES);
  const ciphertext = stored.slice(IV_BYTES);

  const plainBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(plainBuffer);
}

/**
 * Generate a fresh base64-encoded AES-256 key.
 * Useful in tests and the key rotation runbook.
 */
export async function generateEncryptionKey(): Promise<string> {
  const raw = new Uint8Array(KEY_BYTES);
  crypto.getRandomValues(raw);
  return Buffer.from(raw).toString("base64");
}
