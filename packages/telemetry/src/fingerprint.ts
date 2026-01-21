// packages/telemetry/src/fingerprint.ts

/**
 * Generate a stable fingerprint for error grouping.
 * Uses SHA-256 hash of: error.name + message + top stack frame
 */
export async function generateFingerprint(error: Error): Promise<string> {
  const stackTop = extractTopFrame(error.stack);
  const input = `${error.name}:${error.message}:${stackTop}`;

  // Use Web Crypto API (available in Node 15+ and browsers)
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Return first 16 chars (64 bits) for shorter IDs
  return hashHex.slice(0, 16);
}

/**
 * Extract the top meaningful stack frame for fingerprinting
 */
function extractTopFrame(stack?: string): string {
  if (!stack) return "";
  const lines = stack.split("\n");

  // Find first non-error-name line with "at "
  for (const line of lines) {
    if (line.includes("at ")) {
      return line.trim();
    }
  }

  // Fallback to second line if no "at " found
  return lines[1]?.trim() || "";
}

/**
 * Trim stack trace to maximum number of lines
 */
export function trimStack(stack: string, maxLines: number): string {
  const lines = stack.split("\n");
  if (lines.length <= maxLines) return stack;
  // i18n-exempt -- OPS-000 [ttl=2025-12-31]: internal stack truncation marker
  return lines.slice(0, maxLines).join("\n") + "\n...[truncated]";
}
