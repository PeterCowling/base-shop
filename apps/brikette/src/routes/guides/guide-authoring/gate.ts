import { ENABLE_GUIDE_AUTHORING } from "@/config/env";

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

export function isGuideAuthoringEnabled(): boolean {
  const value = (ENABLE_GUIDE_AUTHORING ?? "").trim().toLowerCase();
  return TRUE_VALUES.has(value);
}
