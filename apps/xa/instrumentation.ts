import { captureError } from "@acme/telemetry";

export async function register(): Promise<void> {
  // i18n-exempt: instrumentation logging only
  if (process.env.NODE_ENV === "development") {
    console.log("[instrumentation] XA error tracking enabled");
  }

  // Capture uncaught exceptions
  process.on("uncaughtException", (err: unknown) => {
    const error = err instanceof Error ? err : new Error(String(err));
    void captureError(error, {
      app: "xa",
      env: process.env.NODE_ENV,
      level: "fatal",
    });
    // i18n-exempt: instrumentation logging only
    console.error("[instrumentation] uncaughtException", error);
  });

  // Capture unhandled promise rejections
  process.on("unhandledRejection", (reason: unknown) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    void captureError(error, {
      app: "xa",
      env: process.env.NODE_ENV,
      level: "error",
    });
    // i18n-exempt: instrumentation logging only
    console.error("[instrumentation] unhandledRejection", error);
  });
}
