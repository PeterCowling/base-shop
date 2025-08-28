// packages/shared-utils/src/genSecret.ts

/** Generate a random secret represented as a hexadecimal string. */
export function genSecret(bytes = 16): string {
  const array = new Uint8Array(bytes);
  globalThis.crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

