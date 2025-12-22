export function register(): void {
  try {
    Object.defineProperty(globalThis, "window", {
      get: () => undefined,
      set: () => undefined,
      configurable: false,
    });
  } catch {
    // ignore
  }

  try {
    const maybeDocument = (globalThis as unknown as { document?: unknown }).document as
      | { querySelector?: unknown }
      | undefined;
    if (maybeDocument && typeof maybeDocument.querySelector !== "function") {
      (maybeDocument as { querySelector: (selector: string) => null }).querySelector = () => null;
    }
  } catch {
    // ignore
  }
}
