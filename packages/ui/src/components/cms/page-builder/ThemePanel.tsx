"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DialogContent, DialogTitle } from "../../atoms/shadcn";
import Tokens from "../style/Tokens";
import { type TokenMap } from "../../../hooks/useTokenEditor";
import usePreviewTokens, { savePreviewTokens } from "./hooks/usePreviewTokens";
import { usePathname } from "next/navigation";
import { getShopFromPath } from "@acme/shared-utils";

/**
 * Minimal ThemePanel that leverages Tokens + useTokenEditor to adjust color and font tokens.
 * - Live updates via broadcasting preview tokens
 * - Persists changes per shop via /cms/api/shops/[shop]/theme PATCH
 */
export default function ThemePanel() {
  const pathname = usePathname() ?? "";
  const shop = useMemo(() => getShopFromPath(pathname) ?? "", [pathname]);
  const preview = usePreviewTokens();

  // Keep a local working copy that we pass to Tokens
  const [tokens, setTokens] = useState<TokenMap>(preview as TokenMap);
  const [baseTokens, setBaseTokens] = useState<TokenMap>({} as TokenMap);

  // Debounced patch scheduling similar to useThemeTokenSync
  const pendingRef = useRef<Record<string, string>>({});
  const timeoutRef = useRef<number | null>(null);
  const scheduleSave = useCallback((patch: Record<string, string>) => {
    pendingRef.current = { ...pendingRef.current, ...patch };
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(async () => {
      const body = {
        themeOverrides: pendingRef.current,
        // themeDefaults left undefined – backend merges & prunes overrides
      } as Record<string, unknown>;
      pendingRef.current = {};
      try {
        if (shop) {
          await fetch(`/cms/api/shops/${shop}/theme`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        }
      } catch {
        // Non-fatal in-editor; preview already updated locally
      }
    }, 500);
  }, [shop]);

  const handleTokensChange = useCallback((next: TokenMap) => {
    // Merge and broadcast for live preview
    setTokens(next);
    savePreviewTokens(next as Record<string, string>);

    // Send granular patch for updated keys
    const patch: Record<string, string> = {};
    Object.entries(next).forEach(([k, v]) => {
      patch[k] = v;
    });
    scheduleSave(patch);
  }, [scheduleSave]);

  // Load current shop theme on open/mount
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      if (!shop) return;
      try {
        const res = await fetch(`/cms/api/shops/${shop}/theme`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          themeDefaults: Record<string, string>;
          themeTokens: Record<string, string>;
        };
        if (cancelled) return;
        setBaseTokens(data.themeDefaults as TokenMap);
        setTokens(data.themeTokens as TokenMap);
        savePreviewTokens(data.themeTokens);
      } catch {
        // ignore
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, [shop]);

  return (
    <DialogContent className="max-w-4xl">
      <DialogTitle>Theme</DialogTitle>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Adjust brand colors and typography. Changes preview instantly and save to this shop.
        </p>
        <Tokens tokens={tokens} baseTokens={baseTokens} onChange={handleTokensChange} />
      </div>
    </DialogContent>
  );
}
