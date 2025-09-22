// apps/cms/src/instrumentation.node.ts

/**
 * Register instrumentation handlers for the CMS.  These handlers listen for
 * unexpected process events (uncaught exceptions and unhandled promise
 * rejections) and log them to stderr.  Using explicit type checks avoids
 * resorting to `any` casts and therefore satisfies strict linting rules.
 */
export async function register(): Promise<void> {
  // Do not use a persistent global guard so tests can re-register handlers
  // with fresh spies between runs.
  // Dev‑focused handler that logs uncaught exceptions. If the incoming error
  // isn't already an instance of `Error`, create a new one from its string
  // representation so that a stack trace can still be produced.
  process.on("uncaughtException", (err: unknown) => {
    const e: Error = err instanceof Error ? err : new Error(String(err));
    console.error("[instrumentation] uncaughtException\n", e.stack ?? e);
  });

  // Dev‑focused handler that logs unhandled promise rejections. Like above,
  // we convert unknown rejections into an `Error` when necessary to satisfy
  // type safety and to provide a consistent logging experience.
  process.on("unhandledRejection", (reason: unknown) => {
    const e: Error =
      reason instanceof Error ? reason : new Error(String(reason));
    console.error("[instrumentation] unhandledRejection\n", e.stack ?? e);
  });
}
