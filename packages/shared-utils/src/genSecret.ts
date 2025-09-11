// packages/shared-utils/src/genSecret.ts

/** Generate a random secret represented as a hexadecimal string. */
export function genSecret(bytes = 16): string {
  const envSecret = process.env.GEN_SECRET;
  if (envSecret) return envSecret;
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj || typeof cryptoObj.getRandomValues !== "function") {
    throw new Error("crypto.getRandomValues is not available");
  }
  const array = new Uint8Array(bytes);
  cryptoObj.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

