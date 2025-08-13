declare module "@sentry/node" {
  export function captureException(error: unknown, context?: unknown): void;
}
