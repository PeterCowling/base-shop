import { ResendProvider } from "../providers/resend";
import { SendgridProvider } from "../providers/sendgrid";
import type { CampaignProvider } from "../providers/types";

const providers: Record<string, CampaignProvider> = {
  sendgrid: new SendgridProvider(),
  resend: new ResendProvider(),
};

function getProvider(): CampaignProvider | undefined {
  const name = process.env.EMAIL_PROVIDER ?? "";
  return providers[name];
}

export async function createContact(email: string): Promise<string> {
  const provider = getProvider();
  if (provider?.createContact) {
    try {
      return await provider.createContact(email);
    } catch {
      return "";
    }
  }
  return "";
}

export async function addToList(
  contactId: string,
  listId: string
): Promise<void> {
  const provider = getProvider();
  if (provider?.addToList)
    try {
      await provider.addToList(contactId, listId);
    } catch {
      /* noop */
    }
}

export async function listSegments(): Promise<{ id: string; name?: string }[]> {
  const provider = getProvider();
  if (provider?.listSegments)
    try {
      return await provider.listSegments();
    } catch {
      return [];
    }
  return [];
}
