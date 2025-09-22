// apps/cms/instrumentation.ts

/**
 * Register instrumentation handlers for the CMS when running in a browser or
 * application environment.  This module emits a simple log when loaded so
 * developers know the instrumentation has been initialized.  It also
 * attaches listeners for uncaught exceptions and unhandled promise
 * rejections.  To satisfy strict lint rules, we avoid using `any` and
 * instead normalise unknown errors into proper `Error` instances before
 * logging them.
 */
export async function register(): Promise<void> {
  // Intentionally avoid using a persistent global guard here so tests can
  // call register() multiple times with fresh spies. In dev, Next may reload
  // modules; if that causes duplicate listeners, the host app can restart.
  // Smoke signal so we know this module has been loaded. We deliberately
  // retain the use of `console.log` here; in a production environment you
  // would likely replace this with a dedicated logger.
  console.log("[instrumentation] register() loaded");

  // Handle uncaught exceptions.  Ensure unknown values are coerced into an
  // `Error` so that stack traces are available and TypeScript does not
  // complain about implicit `any` usage.
  process.on("uncaughtException", (err: unknown) => {
    const e: Error = err instanceof Error ? err : new Error(String(err));
    console.error("[instrumentation] uncaughtException\n", e.stack ?? e);
  });

  // Handle unhandled promise rejections in a similar manner.
  process.on("unhandledRejection", (reason: unknown) => {
    const e: Error =
      reason instanceof Error ? reason : new Error(String(reason));
    console.error("[instrumentation] unhandledRejection\n", e.stack ?? e);
  });
}
