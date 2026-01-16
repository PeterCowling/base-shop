/**
 * Phase 2: Polyfills
 *
 * Provides runtime polyfills for browser/Node APIs that JSDOM or Node may lack.
 * This file runs after environment setup but before global mocks.
 *
 * Includes:
 * - setImmediate/clearImmediate (for streaming libraries)
 * - fetch/Response/Request/Headers (via cross-fetch)
 * - FormData (minimal polyfill)
 * - Web Crypto API (for libraries like ulid)
 * - TransformStream/ReadableStream
 * - BroadcastChannel (for MSW v2)
 * - ResizeObserver (for Radix UI components)
 * - MessageChannel (React 19+ scheduler)
 * - TextEncoder/TextDecoder
 * - URL.createObjectURL/revokeObjectURL
 * - Element.prototype.scrollIntoView
 * - HTMLElement pointer capture methods
 * - HTMLFormElement.requestSubmit
 * - Response.json() static method
 * - confirm() global function
 *
 * IMPORTANT: These polyfills must load before React/Next mocks, as some
 * libraries expect these APIs to exist during module initialization.
 */

// ============================================================================
// DOM Compatibility Polyfills
// ============================================================================

// Re-export the central dom-compat polyfills (TextEncoder, File, crypto, etc.)
import "../polyfills/dom-compat";

// ============================================================================
// setImmediate/clearImmediate
// ============================================================================

// Some streaming libraries (e.g. ZIP builders) expect setImmediate/clearImmediate
// to exist; JSDOM doesn't provide them by default.
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = globalThis as any;
  if (typeof g.setImmediate !== "function") {
    g.setImmediate = (fn: (...args: unknown[]) => void, ...args: unknown[]) =>
      setTimeout(fn, 0, ...args);
  }
  if (typeof g.clearImmediate !== "function") {
    g.clearImmediate = (handle: ReturnType<typeof setTimeout>) => clearTimeout(handle);
  }
} catch {
  // Ignore if polyfill fails
}

// ============================================================================
// Fetch API + Web Streams
// ============================================================================

// Centralized fetch polyfill with FormData, crypto, TransformStream, ReadableStream
import "../setupFetchPolyfill";

// ============================================================================
// Response.json() Static Method
// ============================================================================

// Attach spec-compliant Response.json() if not present
import "../setup-response-json";

// ============================================================================
// React/Next Compatibility
// ============================================================================

// React 19+ ACT environment flag, MessageChannel polyfill, and internal aliases
import "../polyfills/react-compat";

// ============================================================================
// HTMLFormElement.requestSubmit()
// ============================================================================

// JSDOM 20 doesn't implement requestSubmit; provide polyfill for form tests
import "../polyfills/form-request-submit";

// ============================================================================
// Global Confirm Stub
// ============================================================================

// Provide a harmless confirm() stub that tests can spy on or override
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).confirm = (msg?: string) => false;
} catch {
  // Ignore if already defined
}
