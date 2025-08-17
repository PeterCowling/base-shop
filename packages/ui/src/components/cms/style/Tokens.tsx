// packages/ui/src/components/cms/style/Tokens.tsx
"use client";

import { Input } from "@ui/components/atoms/shadcn";
import {
  useTokenEditor,
  type TokenMap,
  type TokenInfo,
} from "@ui/hooks/useTokenEditor";
import {
  ColorInput,
  FontSelect,
  RangeInput,
  getContrast,
  suggestContrastColor,
} from "../index";
import {
  useEffect,
  useRef,
  useState,
  useMemo,
  ReactElement,
  type JSX,
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

  const renderInput = ({
    key: k,
    value: v,
    defaultValue,
    isOverridden,
  }: TokenInfo) => {
    if (k.startsWith("--color")) {
      let warning: JSX.Element | null = null;
      let pairKey = "";
      if (k.startsWith("--color-bg")) {
        pairKey = `--color-fg${k.slice("--color-bg".length)}`;
      } else if (k.startsWith("--color-fg")) {
        pairKey = `--color-bg${k.slice("--color-fg".length)}`;
      } else if (k.endsWith("-fg")) {
        pairKey = k.slice(0, -3);
      } else {
        const candidate = `${k}-fg`;
        if (
          tokens[candidate as keyof TokenMap] !== undefined ||
          baseTokens[candidate as keyof TokenMap] !== undefined
        ) {
          pairKey = candidate;
        }
      }
      const pairVal = pairKey
        ? tokens[pairKey as keyof TokenMap] ?? baseTokens[pairKey as keyof TokenMap]
        : undefined;
      if (pairVal) {
        const contrast = getContrast(v, pairVal);
        if (contrast < 4.5) {
          const suggestion = suggestContrastColor(v, pairVal);
          warning = (
            <span className="text-xs text-danger" data-token="--color-danger">
              Low contrast ({contrast.toFixed(2)}:1)
              {suggestion ? ` – try ${suggestion}` : ""}
            </span>
          );
        }
      }
      return (
        <label
          key={k}
          data-token-key={k}
          className={`flex flex-col gap-1 text-sm ${
            isOverridden ? "border-l-2 border-l-info pl-2" : ""
          }`}
          data-token={isOverridden ? "--color-info" : undefined}
        >
          <span className="flex items-center gap-2">
            <span className="w-40 flex-shrink-0">{k}</span>
            <ColorInput value={v} onChange={(val) => setToken(k, val)} />
            {isOverridden && (
              <button
                type="button"
                className="rounded border px-2 py-1 text-xs"
                onClick={() => setToken(k, defaultValue ?? "")}
              >
                Reset
              </button>
            )}
          </span>
          {defaultValue && (
            <span className="text-xs text-muted-foreground">
              Default: {defaultValue}
            </span>
          )}
          {warning}
        </label>
      );
    }

    if (k.startsWith("--font")) {
      const options = k.includes("mono") ? monoFonts : sansFonts;
      const type: "mono" | "sans" = k.includes("mono") ? "mono" : "sans";
      return (
        <label
          key={k}
          data-token-key={k}
          className={`flex flex-col gap-1 text-sm ${
            isOverridden ? "border-l-2 border-l-info pl-2" : ""
          }`}
          data-token={isOverridden ? "--color-info" : undefined}
        >
          <span className="flex items-center gap-2">
            <span className="w-40 flex-shrink-0">{k}</span>
            <FontSelect
              value={v}
              options={options}
              onChange={(val) => setToken(k, val)}
              onUpload={(e) => handleUpload(type, e)}
            />
            {isOverridden && (
              <button
                type="button"
                className="rounded border px-2 py-1 text-xs"
                onClick={() => setToken(k, defaultValue ?? "")}
              >
                Reset
              </button>
            )}
            <select
              className="rounded border p-1"
              onChange={(e) => {
                if (e.target.value) {
                  setGoogleFont(type, e.target.value);
                  e.target.value = "";
                }
              }}
            >
              <option value="">Google Fonts</option>
              {googleFonts.map((f: string) => (
                <option key={f} value={f} style={{ fontFamily: f }}>
                  {f}
                </option>
              ))}
            </select>
          </span>
          {defaultValue && (
            <span className="text-xs text-muted-foreground">
              Default: {defaultValue}
            </span>
          )}
        </label>
      );
    }

    if (/px$/.test(v)) {
      return (
        <label
          key={k}
          data-token-key={k}
          className={`flex items-center gap-2 text-sm ${
            isOverridden ? "border-l-2 border-l-info pl-2" : ""
          }`}
          data-token={isOverridden ? "--color-info" : undefined}
        >
          <span className="w-40 flex-shrink-0">{k}</span>
          <RangeInput value={v} onChange={(val) => setToken(k, val)} />
          {isOverridden && (
            <button
              type="button"
              className="rounded border px-2 py-1 text-xs"
              onClick={() => setToken(k, defaultValue ?? "")}
            >
              Reset
            </button>
          )}
          {defaultValue && (
            <span className="text-xs text-muted-foreground">
              Default: {defaultValue}
            </span>
          )}
        </label>
      );
    }

    return (
      <label
        key={k}
        data-token-key={k}
        className={`flex items-center gap-2 text-sm ${
          isOverridden ? "border-l-2 border-l-info pl-2" : ""
        }`}
        data-token={isOverridden ? "--color-info" : undefined}
      >
        <span className="w-40 flex-shrink-0">{k}</span>
        <Input
          value={v}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setToken(k, e.target.value)
          }
        />
        {isOverridden && (
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs"
            onClick={() => setToken(k, defaultValue ?? "")}
          >
            Reset
          </button>
        )}
        {defaultValue && (
          <span className="text-xs text-muted-foreground">
            Default: {defaultValue}
          </span>
        )}
      </label>
    );
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


