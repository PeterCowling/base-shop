/**
 * Compute a stable SHA-256 hex digest for a given UTF-8 string.
 *
 * Used for optimistic concurrency checks without relying on git commit SHAs
 * (which can be ambiguous across merges/branches).
 *
 * Uses the Web Crypto API which works in both Node.js and Edge runtimes.
 */
export async function computeFileSha(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const subtle =
    globalThis.crypto?.subtle ??
    (await import("node:crypto")).webcrypto.subtle;
  const hashBuffer = await subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
