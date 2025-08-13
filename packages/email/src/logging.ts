export interface EmailErrorMeta {
  campaignId?: string;
  to: string;
  provider: string;
}

export async function logEmailError(
  err: unknown,
  meta: EmailErrorMeta
): Promise<void> {
  console.error("Failed to send campaign email", { ...meta, err });
  const sentry = await import("@sentry/node").catch(() => null);
  if (sentry?.captureException) {
    sentry.captureException(err, { extra: meta });
  }
}
