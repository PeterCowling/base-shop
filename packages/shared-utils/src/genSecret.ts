// packages/shared-utils/src/genSecret.ts

/** Generate a random secret represented as a hexadecimal string. */
export function genSecret(bytes = 16): string {
  if (!Number.isInteger(bytes) || bytes < 0) {
    // i18n-exempt: developer-facing validation message
    throw new RangeError("bytes must be a non-negative integer");
  }
  const envSecret = process.env.GEN_SECRET;
  if (envSecret) return envSecret;
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj || typeof cryptoObj.getRandomValues !== "function") {
    // i18n-exempt: developer/ops diagnostic message
    throw new Error("crypto.getRandomValues is not available");
  }
  const array = new Uint8Array(bytes);
  cryptoObj.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}
