// packages/ui/src/components/cms/style/Tokens.tsx
"use client";

import {
  type ChangeEvent,
  type ReactElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Input } from "@acme/design-system/shadcn";
import { useTranslations } from "@acme/i18n";
import {
  type TokenInfo,
  type TokenMap,
  useTokenEditor,
} from "@acme/ui/hooks/useTokenEditor";

import { ColorToken } from "./ColorToken";
import { FontToken } from "./FontToken";
import { RangeToken } from "./RangeToken";
import { TextToken } from "./TextToken";

type TokenEditorApi = ReturnType<typeof useTokenEditor>;

function notifyTokenChanged(key: string) {
  try {
    window.dispatchEvent(
      new CustomEvent("pb:tokens-changed", { detail: { keys: [key] } })
    );
  } catch {}
}

function capitalizeGroupLabel(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function renderTokenInput({
  info,
  tokens,
  baseTokens,
  setToken,
  onRenameToken,
  onReplaceColor,
  showExtras,
  monoFonts,
  sansFonts,
  googleFonts,
  handleUpload,
  setGoogleFont,
}: {
  info: TokenInfo;
  tokens: TokenMap;
  baseTokens: TokenMap;
  setToken: (key: string, value: string) => void;
  onRenameToken: TokensProps["onRenameToken"];
  onReplaceColor: TokensProps["onReplaceColor"];
  showExtras: boolean;
  monoFonts: TokenEditorApi["monoFonts"];
  sansFonts: TokenEditorApi["sansFonts"];
  googleFonts: TokenEditorApi["googleFonts"];
  handleUpload: TokenEditorApi["handleUpload"];
  setGoogleFont: TokenEditorApi["setGoogleFont"];
}): ReactElement {
  if (info.key.startsWith("--color")) {
    const { key: tokenKey, ...rest } = info;
    return (
      <ColorToken
        key={tokenKey}
        tokenKey={tokenKey}
        {...rest}
        tokens={tokens}
        baseTokens={baseTokens}
        setToken={setToken}
        onRenameToken={onRenameToken}
        onReplaceColor={onReplaceColor}
        showExtras={showExtras}
      />
    );
  }

  if (info.key.startsWith("--font")) {
    const { key: tokenKey, ...rest } = info;
    const options = tokenKey.includes("mono") ? monoFonts : sansFonts;
    const type: "mono" | "sans" = tokenKey.includes("mono") ? "mono" : "sans";
    return (
      <FontToken
        key={tokenKey}
        tokenKey={tokenKey}
        {...rest}
        options={options}
        type={type}
        googleFonts={googleFonts}
        setToken={setToken}
        handleUpload={handleUpload}
        setGoogleFont={setGoogleFont}
      />
    );
  }

  if (/px$/.test(info.value)) {
    const { key: tokenKey, ...rest } = info;
    return <RangeToken key={tokenKey} tokenKey={tokenKey} {...rest} setToken={setToken} />;
  }

  const { key: tokenKey, ...rest } = info;
  return <TextToken key={tokenKey} tokenKey={tokenKey} {...rest} setToken={setToken} />;
}

interface TokensProps {
  tokens: TokenMap;
  baseTokens: TokenMap;
  onChange: (tokens: TokenMap) => void;
  focusToken?: string | null;
  onRenameToken?: (tokenKey: string, nextKey: string) => void;
  onReplaceColor?: (tokenKey: string, nextValue: string) => void;
  /**
   * Controls visibility of the token search input.
  * Default: true (search visible)
  */
  showSearch?: boolean;
  /** Hide eyedropper and advanced actions */
  showExtras?: boolean;
}

export default function Tokens({
  tokens,
  baseTokens,
  onChange,
  focusToken,
  onRenameToken,
  onReplaceColor,
  showSearch = true,
  showExtras = true,
}: TokensProps): ReactElement {
  const t = useTranslations();
  const {
    colors,
    fonts,
    others,
    sansFonts,
    monoFonts,
    googleFonts,
    newFont,
    setNewFont,
    setToken,
    handleUpload,
    addCustomFont,
    setGoogleFont,
  } = useTokenEditor(tokens, baseTokens, onChange);

  // Wrap setToken to broadcast token changes for live preview regeneration
  const setTokenAndNotify = (key: string, value: string) => {
    setToken(key, value);
    notifyTokenChanged(key);
  };

  const containerRef = useRef<HTMLDivElement | null>(null);

  const [search, setSearch] = useState("");

  const groups = useMemo(() => {
    const all = [...colors, ...fonts, ...others];
    const g: Record<string, TokenInfo[]> = {};
    all.forEach((info) => {
      const prefix = info.key.slice(2).split("-")[0];
      (g[prefix] ??= []).push(info);
    });
    return g;
  }, [colors, fonts, others]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("token-group-state");
        if (stored) return JSON.parse(stored);
      } catch {
        // ignore
      }
    }
    const initial: Record<string, boolean> = {};
    Object.keys(groups).forEach((k) => {
      initial[k] = true;
    });
    return initial;
  });

  useEffect(() => {
    setOpenGroups((prev) => {
      const updated = { ...prev };
      let changed = false;
      Object.keys(groups).forEach((k) => {
        if (updated[k] === undefined) {
          updated[k] = true;
          changed = true;
        }
      });
      return changed ? updated : prev;
    });
  }, [groups]);

  useEffect(() => {
    try {
      localStorage.setItem("token-group-state", JSON.stringify(openGroups));
    } catch {
      // ignore
    }
  }, [openGroups]);

  useEffect(() => {
    if (!focusToken) return;
    // i18n-exempt -- DS-1234 [ttl=2026-06-30] CSS selector literal
    const selector = `[data-token-key="${focusToken}"]`;
    const el = containerRef.current?.querySelector(selector) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-info");
      el.dataset.token = "--color-info";
      const input = el.querySelector<HTMLElement>(
        // i18n-exempt -- DS-1234 [ttl=2026-06-30] selector literal
        "input, select, textarea, button"
      );
      input?.focus();
      const t = setTimeout(() => {
        el.classList.remove("ring-2", "ring-info");
        delete el.dataset.token;
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [focusToken]);

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredGroups = useMemo(() => {
    const lower = search.toLowerCase();
    const f: Record<string, TokenInfo[]> = {};
    Object.entries(groups).forEach(([prefix, list]) => {
      const filtered = list.filter((t) =>
        t.key.toLowerCase().includes(lower)
      );
      if (filtered.length > 0) f[prefix] = filtered;
    });
    return f;
  }, [groups, search]);

  return (
    <div
      ref={containerRef}
      // Allow full content to display without vertical scrolling
      className="w-full space-y-4 overflow-x-hidden rounded border p-2"
    >
      {showSearch && (
        <Input
          placeholder={t("cms.style.searchTokens") as string}
          value={search}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setSearch(e.target.value)
          }
          className="mb-2"
        />
      )}
      {Object.entries(filteredGroups).map(([prefix, list]) => (
        <div key={prefix} className="space-y-2">
          <button
            type="button"
            className="flex w-full items-center justify-between font-medium min-h-11 min-w-11"
            onClick={() => toggleGroup(prefix)}
          >
            <span>{capitalizeGroupLabel(prefix)}</span>
            <span>{openGroups[prefix] ? "−" : "+"}</span>
          </button>
          {openGroups[prefix] && (
            <div className="space-y-2">
              {list.map((info) =>
                renderTokenInput({
                  info,
                  tokens,
                  baseTokens,
                  setToken: setTokenAndNotify,
                  onRenameToken,
                  onReplaceColor,
                  showExtras,
                  monoFonts,
                  sansFonts,
                  googleFonts,
                  handleUpload,
                  setGoogleFont,
                })
              )}
              {prefix === "font" && (
                <div className="flex items-center gap-2 pt-2">
                  <Input
                    placeholder={t("cms.style.addFontStack") as string}
                    value={newFont}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setNewFont(e.target.value)
                    }
                  />
                  <button
                    type="button"
                    className="rounded border px-2 py-1 min-h-11 min-w-11"
                    onClick={addCustomFont}
                  >
                    {t("common.add") as string}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
