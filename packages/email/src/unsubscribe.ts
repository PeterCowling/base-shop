import { listEvents } from "@platform-core/repositories/analytics.server";

/**
 * Return a set of email addresses that have unsubscribed for the given shop.
 */
export async function listUnsubscribed(shop: string): Promise<Set<string>> {
  const events = await listEvents(shop);
  const unsub = new Set<string>();
  for (const e of events) {
    if ((e as any).type === "email_unsubscribe") {
      const email = (e as any).email;
      if (typeof email === "string") {
        unsub.add(email);
      }
    }
  }
  return unsub;
}

/**
 * Filter out any email addresses that have unsubscribed.
 */
export async function filterUnsubscribed(
  shop: string,
  emails: string[]
): Promise<string[]> {
  const unsub = await listUnsubscribed(shop);
  return emails.filter((e) => !unsub.has(e));
}

