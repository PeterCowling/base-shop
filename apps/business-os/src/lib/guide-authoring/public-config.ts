const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

export const PREVIEW_TOKEN = process.env.NEXT_PUBLIC_PREVIEW_TOKEN ?? "";

export const ENABLE_GUIDE_AUTHORING =
  process.env.NEXT_PUBLIC_ENABLE_GUIDE_AUTHORING ??
  process.env.ENABLE_GUIDE_AUTHORING ??
  "";

export function isGuideAuthoringEnabled(): boolean {
  const value = ENABLE_GUIDE_AUTHORING.trim().toLowerCase();
  return TRUE_VALUES.has(value);
}
