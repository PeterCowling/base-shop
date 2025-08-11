// packages/auth/src/mfa.ts
import { randomBytes, createHmac } from "node:crypto";

interface MfaRecord {
  secret: string;
  enabled: boolean;
}

// In-memory storage for MFA secrets; in a real app this would be a database.
const mfaStore = new Map<string, MfaRecord>();

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function toBase32(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function fromBase32(secret: string): Buffer {
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  for (const char of secret.toUpperCase()) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

function totp(secret: string, step = 30, digits = 6, window = 0): string {
  const counter = Math.floor(Date.now() / 1000 / step) + window;
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(0, 0);
  buffer.writeUInt32BE(counter, 4);
  const key = fromBase32(secret);
  const hmac = createHmac("sha1", key).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 10 ** digits;
  return code.toString().padStart(digits, "0");
}

export function generateMfaSecret(customerId: string): { secret: string; otpauth: string } {
  const buf = randomBytes(20);
  const secret = toBase32(buf);
  mfaStore.set(customerId, { secret, enabled: false });
  const otpauth = `otpauth://totp/BaseShop:${customerId}?secret=${secret}&issuer=BaseShop`;
  return { secret, otpauth };
}

export function verifyMfaToken(customerId: string, token: string): boolean {
  const record = mfaStore.get(customerId);
  if (!record) return false;
  const { secret } = record;
  for (const w of [0, -1, 1]) {
    if (totp(secret, 30, 6, w) === token) {
      mfaStore.set(customerId, { secret, enabled: true });
      return true;
    }
  }
  return false;
}

export function isMfaEnabled(customerId: string): boolean {
  return mfaStore.get(customerId)?.enabled ?? false;
}

export function disableMfa(customerId: string): void {
  mfaStore.delete(customerId);
}

export { mfaStore }; // exported for testing or external persistence
