import type { CampaignProvider } from "./types";

const providerCache: Record<string, CampaignProvider | undefined> = {};

export const availableProviders = ["sendgrid", "resend", "smtp"] as const;
export type ProviderName = (typeof availableProviders)[number];

export async function loadProvider(
  name: ProviderName
): Promise<CampaignProvider | undefined> {
  if (Object.prototype.hasOwnProperty.call(providerCache, name)) {
    return providerCache[name];
  }

  if (name === "sendgrid") {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      providerCache[name] = undefined;
      return undefined;
    }
    const { SendgridProvider } = await import("./sendgrid");
    providerCache[name] = new SendgridProvider();
  } else if (name === "resend") {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      providerCache[name] = undefined;
      return undefined;
    }
    const { ResendProvider } = await import("./resend");
    providerCache[name] = new ResendProvider();
  } else {
    providerCache[name] = undefined;
  }

  return providerCache[name];
}

export function getProviderOrder(): ProviderName[] {
  const primary = process.env.EMAIL_PROVIDER || "smtp";
  if (!availableProviders.includes(primary as ProviderName)) {
    throw new Error(
      `Unsupported EMAIL_PROVIDER "${primary}". Available providers: ${availableProviders.join(", ")}`
    );
  }
  return [primary as ProviderName, ...availableProviders.filter((p) => p !== primary)];
}

