// packages/ui/src/components/cms/style/Tokens.tsx
"use client";

import { Input } from "../../atoms/shadcn";
import {
  useTokenEditor,
  type TokenMap,
  type TokenInfo,
} from "../../../hooks/useTokenEditor";
import { ColorToken } from "./ColorToken";
import { FontToken } from "./FontToken";
import { RangeToken } from "./RangeToken";
import { TextToken } from "./TextToken";
import {
  useEffect,
  useRef,
  useState,
  useMemo,
  ReactElement,
  type ChangeEvent,
} from "react";

interface TokensProps {
  tokens: TokenMap;
  baseTokens: TokenMap;
  onChange: (tokens: TokenMap) => void;
  focusToken?: string | null;
}

export default function Tokens({
  tokens,
  baseTokens,
  onChange,
  focusToken,
}: TokensProps): ReactElement {
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
    const el = containerRef.current?.querySelector(
      `[data-token-key="${focusToken}"]`
    ) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-info");
      el.dataset.token = "--color-info";
      const input = el.querySelector<HTMLElement>(
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

  const renderInput = (info: TokenInfo) => {
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
      return <RangeToken {...info} setToken={setToken} />;
    }

    return <TextToken {...info} setToken={setToken} />;
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

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div
      ref={containerRef}
      className="max-h-64 space-y-4 overflow-y-auto rounded border p-2"
    >
      <Input
        placeholder="Search tokens"
        value={search}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setSearch(e.target.value)
        }
        className="mb-2"
      />
      {Object.entries(filteredGroups).map(([prefix, list]) => (
        <div key={prefix} className="space-y-2">
          <button
            type="button"
            className="flex w-full items-center justify-between font-medium"
            onClick={() => toggleGroup(prefix)}
          >
            <span>{capitalize(prefix)}</span>
            <span>{openGroups[prefix] ? "−" : "+"}</span>
          </button>
          {openGroups[prefix] && (
            <div className="space-y-2">
              {list.map((t) => renderInput(t))}
              {prefix === "font" && (
                <div className="flex items-center gap-2 pt-2">
                  <Input
                    placeholder="Add font stack"
                    value={newFont}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setNewFont(e.target.value)
                    }
                  />
                  <button
                    type="button"
                    className="rounded border px-2 py-1"
                    onClick={addCustomFont}
                  >
                    Add
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


