"use client";

import { useEffect, useState } from "react";

// Keep these in sync with apps/cms wizard previewTokens utilities
const PREVIEW_TOKENS_KEY = "cms-preview-tokens";
const PREVIEW_TOKENS_EVENT = "previewTokens:update";

export type PreviewTokens = Record<string, string>;

export function loadPreviewTokens(): PreviewTokens {
  try {
    const json = typeof window !== "undefined" ? localStorage.getItem(PREVIEW_TOKENS_KEY) : null;
    return json ? (JSON.parse(json) as PreviewTokens) : {};
  } catch {
    return {};
  }
}

export function savePreviewTokens(tokens: PreviewTokens): void {
  try {
    localStorage.setItem(PREVIEW_TOKENS_KEY, JSON.stringify(tokens));
    window.dispatchEvent(new Event(PREVIEW_TOKENS_EVENT));
  } catch {
    /* ignore storage failures */
  }
}

export default function usePreviewTokens() {
  const [tokens, setTokens] = useState<PreviewTokens>(() => loadPreviewTokens());

  useEffect(() => {
    const handle = () => setTokens(loadPreviewTokens());
    // Load immediately and subscribe to updates from other tabs/components
    handle();
    window.addEventListener("storage", handle);
    window.addEventListener(PREVIEW_TOKENS_EVENT, handle as EventListener);
    return () => {
      window.removeEventListener("storage", handle);
      window.removeEventListener(PREVIEW_TOKENS_EVENT, handle as EventListener);
    };
  }, []);

  return tokens;
}

