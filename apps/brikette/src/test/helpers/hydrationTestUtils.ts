/**
 * Hydration test utilities for detecting server/client rendering mismatches
 *
 * These utilities help catch hydration errors that `suppressHydrationWarning` masks.
 * They simulate the SSR → client hydration cycle and capture React hydration errors.
 *
 * Usage:
 * ```tsx
 * const result = renderWithHydration({
 *   server: <MyComponent />,
 *   client: <MyComponent />,
 * });
 * expectNoHydrationErrors(result);
 * ```
 */

import type { ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { act } from "react-dom/test-utils";
import { hydrateRoot } from "react-dom/client";

export interface HydrationTestResult {
  /** Server-rendered HTML string */
  serverHTML: string;
  /** Array of hydration errors captured during hydration */
  hydrationErrors: Array<Error>;
  /** DOM container element after hydration (for queries) */
  container: HTMLElement;
}

export interface RenderWithHydrationOptions {
  /** Component to render on server */
  server: ReactElement;
  /** Component to hydrate on client */
  client: ReactElement;
}

/**
 * Renders a component in SSR mode, then hydrates it on the client, capturing hydration errors.
 *
 * This simulates the Next.js SSR → client hydration cycle:
 * 1. Server render runs in a server-like environment (no window/document)
 * 2. Client hydration runs in JSDOM with full browser globals
 * 3. Hydration errors are captured via onRecoverableError
 *
 * @param options - Server and client components to render
 * @returns Result with serverHTML, hydrationErrors, and container
 */
export function renderWithHydration(options: RenderWithHydrationOptions): HydrationTestResult {
  const { server, client } = options;
  const hydrationErrors: Array<Error> = [];

  // Phase 1: Server render (SSR simulation)
  // Temporarily clear window and document to simulate real SSR environment
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;

  try {
    // Clear browser globals to simulate SSR
    // @ts-expect-error - Intentionally setting to undefined to simulate SSR
    globalThis.window = undefined;
    // @ts-expect-error - Intentionally setting to undefined to simulate SSR
    globalThis.document = undefined;

    // Render to string (SSR)
    const serverHTML = renderToString(server);

    // Phase 2: Client hydration
    // Restore browser globals
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;

    // Create container and inject server HTML
    const container = document.createElement("div");
    container.innerHTML = serverHTML;

    // Hydrate with error capture
    // In React 19 with StrictMode in tests, hydration errors throw instead of calling onRecoverableError
    // We catch both thrown errors and onRecoverableError callbacks
    let root;
    try {
      root = hydrateRoot(container, client, {
        onRecoverableError: (error: unknown) => {
          // Capture hydration errors reported via callback
          if (error instanceof Error) {
            hydrationErrors.push(error);
          } else {
            hydrationErrors.push(new Error(String(error)));
          }
        },
      });

      // Flush hydration work
      act(() => {
        // Hydration happens synchronously in act
      });
    } catch (error) {
      // Capture thrown hydration errors
      if (error instanceof Error) {
        hydrationErrors.push(error);
      } else {
        hydrationErrors.push(new Error(String(error)));
      }
    }

    return {
      serverHTML,
      hydrationErrors,
      container,
    };
  } finally {
    // Always restore globals, even if render throws
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
  }
}

/**
 * Assert that a hydration test result has no errors.
 *
 * Throws an error with a clear message if hydration errors were detected.
 *
 * @param result - Result from renderWithHydration
 */
export function expectNoHydrationErrors(result: HydrationTestResult): void {
  if (result.hydrationErrors.length > 0) {
    const errorMessages = result.hydrationErrors.map((err, idx) => `  ${idx + 1}. ${err.message}`).join("\n");
    throw new Error(
      `Expected no hydration errors, but found ${result.hydrationErrors.length}:\n${errorMessages}`
    );
  }
}
