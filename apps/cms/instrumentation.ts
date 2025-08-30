// apps/cms/instrumentation.ts
export async function register() {
  // Smoke signal so we know this is loaded.
  // eslint-disable-next-line no-console
  console.log("[instrumentation] register() loaded");

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
