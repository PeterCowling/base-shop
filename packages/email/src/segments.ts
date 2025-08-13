import { listEvents } from "@platform-core/repositories/analytics.server";
import { coreEnv } from "@acme/config/env/core";
import { SendgridProvider } from "./providers/sendgrid";
import { ResendProvider } from "./providers/resend";
import type { CampaignProvider } from "./providers/types";

const providers: Record<string, CampaignProvider> = {
  sendgrid: new SendgridProvider(),
  resend: new ResendProvider(),
};

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
  const provider = providers[coreEnv.EMAIL_PROVIDER ?? ""];
  if (provider?.listSegments) {
    return provider.listSegments(id);
  }

  const events = await listEvents(shop);
  const emails = new Set<string>();
  for (const e of events) {
    const type = (e as { type?: string }).type;
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
  return Array.from(emails);
}
