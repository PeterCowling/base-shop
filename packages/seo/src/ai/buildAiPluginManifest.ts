export interface AiPluginConfig {
  nameForHuman: string;
  nameForModel: string;
  descriptionForHuman: string;
  descriptionForModel: string;
  api: { url: string };
  logoUrl: string;
  contactEmail: string;
  legalInfoUrl: string;
  authType?: "none" | "user_http" | "service_http" | "oauth";
}

export function buildAiPluginManifest(
  _config: AiPluginConfig,
): Record<string, unknown> {
  throw new Error("Not implemented");
}
