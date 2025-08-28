let sentry: typeof import("@sentry/node") | undefined;

export type CaptureContext = Parameters<
  typeof import("@sentry/node")["captureException"]
>[1];

export async function captureException(
  error: unknown,
  context?: CaptureContext,
): Promise<void> {
  if (!sentry) {
    sentry = await import(/* webpackIgnore: true */ "@sentry/node");
  }
  if (context) {
    sentry.captureException(error, context);
  } else {
    sentry.captureException(error);
  }
}
