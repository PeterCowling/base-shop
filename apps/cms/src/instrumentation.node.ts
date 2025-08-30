// apps/cms/src/instrumentation.node.ts
export async function register() {
  // Dev-focused, noisy on purpose
  process.on("uncaughtException", (err: unknown) => {
    const e = err as Error;
    // eslint-disable-next-line no-console
    console.error("[instrumentation] uncaughtException\n", e?.stack ?? e);
  });
  process.on("unhandledRejection", (reason: unknown) => {
    const e = reason as any;
    // eslint-disable-next-line no-console
    console.error("[instrumentation] unhandledRejection\n", e?.stack ?? e);
  });
}
