import { listEvents } from "@platform-core/repositories/analytics.server";

/**
 * Resolve a segment identifier to a list of customer email addresses.
 *
 * Segments are represented in analytics events with either the form:
 *  { type: `segment:${id}`, email: "user@example.com" }
 * or
 *  { type: "segment", segment: id, email: "user@example.com" }
 */
export async function resolveSegment(
  shop: string,
  id: string
): Promise<string[]> {
  const events = await listEvents(shop);
  const emails = new Set<string>();
  const unsubscribed = new Set<string>();
  for (const e of events) {
    const type = (e as { type?: string }).type;
    if (type === "email_unsubscribe") {
      const email = (e as any).email;
      if (typeof email === "string") unsubscribed.add(email);
      continue;
    }
    const seg =
      type === `segment:${id}`
        ? id
        : type === "segment" && (e as any).segment === id
          ? id
          : null;
    if (seg) {
      const email = (e as any).email;
      if (typeof email === "string") emails.add(email);
    }
  }
  return Array.from(emails).filter((e) => !unsubscribed.has(e));
}
