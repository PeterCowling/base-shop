"use client";

import { useEffect, useState } from "react";

import { loadPreviewTokens, PREVIEW_TOKENS_EVENT } from "./previewTokens";

export default function usePreviewTokens() {
  const [tokens, setTokens] = useState<Record<string, string>>(() => loadPreviewTokens());

  useEffect(() => {
    const handle = () => {
      setTokens(loadPreviewTokens());
    };
    handle();
    window.addEventListener("storage", handle);
    window.addEventListener(PREVIEW_TOKENS_EVENT, handle);
    return () => {
      window.removeEventListener("storage", handle);
      window.removeEventListener(PREVIEW_TOKENS_EVENT, handle);
    };
  }, []);

  return tokens;
}
