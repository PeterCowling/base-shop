type StripeWebhookDeadLetter = {
  id: string;
  environment: string;
  eventId: string;
  eventType: string;
  reason: string;
  shopId?: string | null;
  payload: unknown;
  createdAt?: Date;
};

type WhereUnique = {
  environment_eventId?: {
    environment: string;
    eventId: string;
  };
};

export function createStripeWebhookDeadLetterDelegate() {
  const rows = new Map<string, StripeWebhookDeadLetter>();

  function keyOf(where: WhereUnique): string | null {
    const k = where.environment_eventId;
    if (!k) return null;
    return `${k.environment}:${k.eventId}`;
  }

  return {
    async upsert({
      where,
      create,
      update,
    }: {
      where: WhereUnique;
      create: StripeWebhookDeadLetter;
      update: Partial<StripeWebhookDeadLetter>;
    }) {
      const key = keyOf(where);
      if (!key) throw new Error("Missing unique key"); // i18n-exempt: test-only stub error
      const existing = rows.get(key);
      if (existing) {
        const next: StripeWebhookDeadLetter = { ...existing, ...update };
        rows.set(key, next);
        return { ...next };
      }

      const now = new Date();
      const createdRow: StripeWebhookDeadLetter = {
        ...create,
        createdAt: create.createdAt ?? now,
      };
      rows.set(key, createdRow);
      return { ...createdRow };
    },
  };
}

