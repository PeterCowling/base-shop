// apps/cms/src/instrumentation.node.ts
export async function register() {
  // Dev-focused, noisy on purpose
  process.on("uncaughtException", (err: unknown) => {
    const e = err instanceof Error ? err : new Error(String(err));
    console.error("[instrumentation] uncaughtException\n", e.stack ?? e);
  });
  process.on("unhandledRejection", (reason: unknown) => {
    const e =
      reason instanceof Error ? reason : new Error(String(reason));
    console.error("[instrumentation] unhandledRejection\n", e.stack ?? e);
  });
}
