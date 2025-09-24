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
export interface ThemePanelProps {
  /**
   * Render style for the panel. "dialog" places content inside shadcn Dialog components.
   * "sidebar" renders inline without any Dialog wrappers so it can be embedded.
   */
  variant?: "dialog" | "sidebar";
}

export default function ThemePanel({ variant = "dialog" }: ThemePanelProps) {
  const pathname = usePathname() ?? "";
  const shop = useMemo(() => getShopFromPath(pathname) ?? "", [pathname]);
  const preview = usePreviewTokens();

  // Keep a local working copy that we pass to Tokens
  const [tokens, setTokens] = useState<TokenMap>(preview as TokenMap);
  const [baseTokens, setBaseTokens] = useState<TokenMap>({} as TokenMap);
  const tokensRef = useRef<TokenMap>(tokens);
  const baseTokensRef = useRef<TokenMap>(baseTokens);

  useEffect(() => {
    tokensRef.current = tokens;
  }, [tokens]);

  useEffect(() => {
    baseTokensRef.current = baseTokens;
  }, [baseTokens]);

  // Debounced patch scheduling similar to useThemeTokenSync
  const pendingRef = useRef<Record<string, string | null>>({});
  const timeoutRef = useRef<number | null>(null);
  const scheduleSave = useCallback((patch: Record<string, string | null>) => {
    if (Object.keys(patch).length === 0) return;
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

  const diffTokens = useCallback(
    (prev: TokenMap, next: TokenMap) => {
      const patch: Record<string, string | null> = {};
      Object.entries(next).forEach(([key, value]) => {
        if (prev[key as keyof TokenMap] !== value) {
          patch[key] = value;
        }
      });
      Object.keys(prev).forEach((key) => {
        if (!(key in next)) {
          patch[key] = null;
        }
      });
      return patch;
    },
    []
  );

  const applyTokens = useCallback(
    (next: TokenMap) => {
      const previous = tokensRef.current;
      const patch = diffTokens(previous, next);
      tokensRef.current = next;
      setTokens(next);
      savePreviewTokens(next as Record<string, string>);
      if (Object.keys(patch).length > 0) {
        scheduleSave(patch);
      }
    },
    [diffTokens, scheduleSave]
  );

  const handleTokensChange = useCallback((next: TokenMap) => {
    applyTokens(next);
  }, [applyTokens]);

  const handleRenameToken = useCallback(
    (oldKey: string, nextKey: string) => {
      const trimmed = nextKey.trim();
      if (!trimmed || trimmed === oldKey) return;

      const conflicts =
        trimmed in tokensRef.current || trimmed in baseTokensRef.current;
      if (conflicts && typeof window !== "undefined") {
        const confirmed = window.confirm(
          `A token named "${trimmed}" already exists. Replace its value?`
        );
        if (!confirmed) return;
      }

      const nextBase = { ...baseTokensRef.current } as Record<string, string>;
      let baseChanged = false;
      if (oldKey in nextBase) {
        const baseValue = nextBase[oldKey];
        delete nextBase[oldKey];
        if (baseValue !== undefined) {
          nextBase[trimmed] = baseValue;
        }
        baseChanged = true;
      }
      if (baseChanged) {
        baseTokensRef.current = nextBase as TokenMap;
        setBaseTokens(nextBase as TokenMap);
      }

      const currentTokens = tokensRef.current;
      const overrideValue = currentTokens[oldKey as keyof TokenMap];
      const fallbackValue =
        overrideValue ?? baseTokensRef.current[oldKey as keyof TokenMap];
      const updated = { ...currentTokens } as Record<string, string>;
      delete updated[oldKey];
      if (fallbackValue !== undefined) {
        updated[trimmed] = fallbackValue;
      }
      applyTokens(updated as TokenMap);
    },
    [applyTokens]
  );

  const handleReplaceColor = useCallback(
    (tokenKey: string, nextValue: string) => {
      const trimmed = nextValue.trim();
      if (!trimmed) return;
      const currentTokens = tokensRef.current;
      const base = baseTokensRef.current;
      const reference =
        currentTokens[tokenKey as keyof TokenMap] ??
        base[tokenKey as keyof TokenMap];
      if (!reference) return;

      const keys = new Set([
        ...Object.keys(base),
        ...Object.keys(currentTokens as Record<string, string>),
      ]);
      const nextTokens = { ...currentTokens } as Record<string, string>;
      keys.forEach((key) => {
        const isColorToken =
          key.startsWith("--color") || key.startsWith("color.");
        if (!isColorToken) return;
        const value =
          currentTokens[key as keyof TokenMap] ??
          base[key as keyof TokenMap];
        if (value === reference) {
          nextTokens[key] = trimmed;
        }
      });
      applyTokens(nextTokens as TokenMap);
    },
    [applyTokens]
  );

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
        const defaults = data.themeDefaults as TokenMap;
        const themeTokens = data.themeTokens as TokenMap;
        baseTokensRef.current = defaults;
        tokensRef.current = themeTokens;
        setBaseTokens(defaults);
        setTokens(themeTokens);
        savePreviewTokens(themeTokens);
      } catch {
        // ignore
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, [shop]);

  if (variant === "sidebar") {
    return (
      <div className="space-y-3 p-3">
        <div className="text-sm font-semibold">Theme</div>
        <p className="text-sm text-muted-foreground">
          Adjust brand colors and typography. Changes preview instantly and save to this shop.
        </p>
        <Tokens
          tokens={tokens}
          baseTokens={baseTokens}
          onChange={handleTokensChange}
          onRenameToken={handleRenameToken}
          onReplaceColor={handleReplaceColor}
        />
      </div>
    );
  }

  // Default: dialog variant
  return (
    <DialogContent className="max-w-4xl">
      <DialogTitle>Theme</DialogTitle>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Adjust brand colors and typography. Changes preview instantly and save to this shop.
        </p>
        <Tokens
          tokens={tokens}
          baseTokens={baseTokens}
          onChange={handleTokensChange}
          onRenameToken={handleRenameToken}
          onReplaceColor={handleReplaceColor}
        />
      </div>
    </DialogContent>
  );
}
