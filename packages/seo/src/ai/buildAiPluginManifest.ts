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

/**
 * Build an OpenAI-compatible ai-plugin.json manifest (v1 schema).
 */
export function buildAiPluginManifest(
  config: AiPluginConfig,
): Record<string, unknown> {
  return {
    schema_version: "v1",
    name_for_human: config.nameForHuman,
    name_for_model: config.nameForModel,
    description_for_human: config.descriptionForHuman,
    description_for_model: config.descriptionForModel,
    auth: {
      type: config.authType ?? "none",
    },
    api: {
      type: "openapi",
      url: config.api.url,
      is_user_authenticated: false,
    },
    logo_url: config.logoUrl,
    contact_email: config.contactEmail,
    legal_info_url: config.legalInfoUrl,
  };
}
