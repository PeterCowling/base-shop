import messages from "../../i18n/en.json";

const baseMessages = messages as Record<string, string | undefined>;

// i18n-exempt -- CF-1006 fallback copy if i18n key missing [ttl=2026-12-31]
export const SITE_NAME = baseMessages["site.name"] ?? "CochlearFit Headbands";
export const SITE_URL = "https://cochlearfit.example";
export const SITE_DESCRIPTION =
  baseMessages["site.description"] ??
  // i18n-exempt -- CF-1006 fallback copy if i18n key missing [ttl=2026-12-31]
  "Soft-fit headbands designed to secure cochlear implant processors with breathable comfort.";
export const SUPPORT_EMAIL =
  // i18n-exempt -- CF-1006 fallback copy if i18n key missing [ttl=2026-12-31]
  baseMessages["site.supportEmail"] ?? "hello@cochlearfit.example";
export const SUPPORT_PHONE =
  // i18n-exempt -- CF-1006 fallback copy if i18n key missing [ttl=2026-12-31]
  baseMessages["site.supportPhone"] ?? "+1 (555) 410-2210";
