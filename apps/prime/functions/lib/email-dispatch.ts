export interface PrimeEmailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface EmailDispatchEnv {
  PRIME_EMAIL_WEBHOOK_URL?: string;
  PRIME_EMAIL_WEBHOOK_TOKEN?: string;
}

export interface EmailDispatchResult {
  delivered: boolean;
  deliveryMode: 'webhook' | 'noop';
}

export async function dispatchPrimeEmail(
  message: PrimeEmailMessage,
  env: EmailDispatchEnv,
): Promise<EmailDispatchResult> {
  if (!env.PRIME_EMAIL_WEBHOOK_URL) {
    return {
      delivered: false,
      deliveryMode: 'noop',
    };
  }

  const response = await fetch(env.PRIME_EMAIL_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(env.PRIME_EMAIL_WEBHOOK_TOKEN
        ? { Authorization: `Bearer ${env.PRIME_EMAIL_WEBHOOK_TOKEN}` }
        : {}),
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    throw new Error(`Email webhook failed: ${response.status}`);
  }

  return {
    delivered: true,
    deliveryMode: 'webhook',
  };
}
