"use client";

export const PREVIEW_TOKENS_KEY = "cms-preview-tokens";
export const PREVIEW_TOKENS_EVENT = "previewTokens:update";

export function savePreviewTokens(tokens: Record<string, string>): void {
  try {
    localStorage.setItem(PREVIEW_TOKENS_KEY, JSON.stringify(tokens));
    window.dispatchEvent(new Event(PREVIEW_TOKENS_EVENT));
  } catch {
    /* ignore */
  }
}

export function loadPreviewTokens(): Record<string, string> {
  try {
    const json = localStorage.getItem(PREVIEW_TOKENS_KEY);
    return json ? (JSON.parse(json) as Record<string, string>) : {};
  } catch {
    return {};
  }
}
