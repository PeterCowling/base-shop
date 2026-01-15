import { vi } from "vitest";

type Pattern = string | RegExp;

function normaliseMessage(args: unknown[]): string {
  const [first] = args;
  if (typeof first === "string") {
    return first;
  }
  if (first instanceof Error) {
    return first.message;
  }
  try {
    return JSON.stringify(first);
  } catch {
    return String(first);
  }
}

function matchesPattern(message: string, pattern: Pattern): boolean {
  return typeof pattern === "string" ? message.includes(pattern) : pattern.test(message);
}

/**
 * Suppress console.error output that matches any of the supplied patterns.
 * Returns a cleanup function that restores the original console.error.
 */
export function suppressConsoleErrors(patterns: readonly Pattern[]): () => void {
  const original = console.error;
  const spy = vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    const message = normaliseMessage(args);
    if (patterns.some((pattern) => matchesPattern(message, pattern))) {
      return;
    }
    original(...args);
  });
  return () => {
    spy.mockRestore();
  };
}